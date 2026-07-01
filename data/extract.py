#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["requests"]
# ///
"""Official question-bank extractor for autoskola-kviz.

Source: Ministerstvo dopravy ČR — eTesty (https://etesty.md.gov.cz).
Fetches the 9 okruh pages (question-id lists), every question JSON, and all
media; then transforms into data/questions.json + data/meta.json and copies
image assets to public/media/.

Re-runnable and resumable: question JSONs and media are cached under
data/cache/ keyed by eTesty question id; cached entries are skipped.

Usage: uv run data/extract.py            (fetch + transform)
       uv run data/extract.py --no-fetch (transform from cache only)
"""

from __future__ import annotations

import json
import re
import shutil
import sys
import time
import unicodedata
from pathlib import Path

import requests

BASE = "https://etesty.md.gov.cz"
DATA = Path(__file__).resolve().parent
REPO = DATA.parent
CACHE_Q = DATA / "cache" / "questions"
CACHE_M = DATA / "cache" / "media"
PUBLIC_MEDIA = REPO / "public" / "media"

RATE_DELAY = 0.2  # ~5 req/s
RETRIES = 5

# okruh page id -> (category name, exam group, licence groups for zásady)
OKRUHY: dict[int, tuple[str, str, str | None]] = {
    1: ("Pravidla provozu", "pravidla", None),
    2: ("Zásady bezpečné jízdy", "zasady", "A"),
    3: ("Zásady bezpečné jízdy", "zasady", "B"),
    4: ("Zásady bezpečné jízdy", "zasady", "CD"),
    5: ("Dopravní značky", "znacky", None),
    6: ("Dopravní situace", "situace", None),
    7: ("Podmínky provozu vozidel", "podminky", None),
    8: ("Související předpisy", "predpisy", None),
    9: ("Zdravotnická příprava", "zdravoveda", None),
}

# Output category order (stable ids per category block).
CAT_ORDER = [
    ("pravidla", "Pravidla provozu"),
    ("znacky", "Dopravní značky"),
    ("situace", "Dopravní situace"),
    ("zasady", "Zásady bezpečné jízdy"),
    ("podminky", "Podmínky provozu vozidel"),
    ("predpisy", "Související předpisy"),
    ("zdravoveda", "Zdravotnická příprava"),
]

# Official exam composition: (group, count, points per question).
EXAM_COMPOSITION = [
    ("pravidla", 10, 2),
    ("znacky", 3, 1),
    ("situace", 3, 4),
    ("zasady", 4, 2),
    ("podminky", 2, 1),
    ("predpisy", 2, 2),
    ("zdravoveda", 1, 1),
]

session = requests.Session()
session.headers["User-Agent"] = "autoskola-kviz-extractor (personal study app)"
_last_request = 0.0


def get(url: str) -> requests.Response:
    """Rate-limited GET with retry + exponential backoff."""
    global _last_request
    for attempt in range(RETRIES):
        wait = _last_request + RATE_DELAY - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        _last_request = time.monotonic()
        try:
            r = session.get(url, timeout=30)
            if r.status_code == 200:
                return r
            if r.status_code == 404:
                r.raise_for_status()
        except requests.RequestException:
            if attempt == RETRIES - 1:
                raise
        time.sleep(2**attempt)
    raise RuntimeError(f"unreachable: {url}")


def fetch_okruh_lists() -> dict[int, list[int]]:
    """okruh page id -> list of eTesty question ids."""
    lists: dict[int, list[int]] = {}
    for n in OKRUHY:
        html = get(f"{BASE}/ro/DLArea/Index?id={n}").text
        m = re.search(r"questionList\s*=\s*(\[[\d,\s]*\])", html)
        if not m:
            sys.exit(f"okruh {n}: questionList not found")
        lists[n] = json.loads(m.group(1))
        print(f"okruh {n}: {len(lists[n])} questions")
    return lists


def fetch_question(qid: int) -> dict:
    path = CACHE_Q / f"{qid}.json"
    if path.exists():
        return json.loads(path.read_text())
    data = get(f"{BASE}/api/v1/PublicWeb/Question/{qid}").json()
    if not data or data.get("id") != qid:
        sys.exit(f"question {qid}: bad payload {data!r}")
    path.write_text(json.dumps(data, ensure_ascii=False))
    return data


def fetch_media(url_path: str) -> Path:
    """Download /binary_content_storage/... into the media cache (skip if cached)."""
    name = url_path.rsplit("/", 1)[-1]
    path = CACHE_M / name
    if not path.exists() or path.stat().st_size == 0:
        r = get(f"{BASE}/binary_content_storage/{name}")
        path.write_bytes(r.content)
    return path


def norm_text(q: dict) -> str:
    """Dedupe key: question text + sorted answer texts, whitespace-normalized."""
    parts = [q["questionText"]] + sorted(
        a["answerText"] or "" for a in q["questionAnswers"]
    )
    s = " ".join(" ".join(p.split()) for p in parts)
    return unicodedata.normalize("NFC", s).lower()


def transform(lists: dict[int, list[int]], questions: dict[int, dict]) -> None:
    # qid -> licence groups (zásady variants overlap across okruhy 2/3/4)
    groups_by_qid: dict[int, list[str]] = {}
    cat_by_qid: dict[int, tuple[str, str]] = {}  # qid -> (group, cat name)
    for n, qids in lists.items():
        cat, group, licence = OKRUHY[n]
        for qid in qids:
            cat_by_qid.setdefault(qid, (group, cat))
            if licence:
                groups_by_qid.setdefault(qid, []).append(licence)

    # Content-level dedupe within zásady: identical text+answers under
    # different ids -> keep one (B variant wins), union the licence groups.
    seen: dict[str, int] = {}
    drop: set[int] = set()
    zasady_ids = sorted(qid for qid, (g, _) in cat_by_qid.items() if g == "zasady")
    # visit B's questions first so the B id is the one kept
    zasady_ids.sort(key=lambda q: (0 if "B" in groups_by_qid.get(q, []) else 1, q))
    for qid in zasady_ids:
        key = norm_text(questions[qid])
        if key in seen:
            keep = seen[key]
            merged = sorted(set(groups_by_qid[keep]) | set(groups_by_qid[qid]))
            groups_by_qid[keep] = merged
            drop.add(qid)
        else:
            seen[key] = qid

    # Order: category block order, then source id. Renumber 1..N.
    order = {g: i for i, (g, _) in enumerate(CAT_ORDER)}
    final_ids = [q for q in cat_by_qid if q not in drop]
    final_ids.sort(key=lambda q: (order[cat_by_qid[q][0]], q))

    PUBLIC_MEDIA.mkdir(parents=True, exist_ok=True)
    out = []
    video_bytes = 0
    videos: list[Path] = []
    stats = {"two_answer": 0, "video": 0, "image": 0, "answer_media": 0}
    for new_id, qid in enumerate(final_ids, start=1):
        q = questions[qid]
        group, cat = cat_by_qid[qid]
        answers = sorted(q["questionAnswers"], key=lambda a: a["sortOrderNumber"])
        if not 2 <= len(answers) <= 3:
            sys.exit(f"question {qid}: {len(answers)} answers")
        correct = [i for i, a in enumerate(answers) if a["isCorrect"]]
        if len(correct) != 1:
            sys.exit(f"question {qid}: {len(correct)} correct answers")
        if any(a.get("mediaContent") for a in answers):
            stats["answer_media"] += 1
        if len(answers) == 2:
            stats["two_answer"] += 1

        image: str | None = None
        video_url: str | None = None
        mc = q.get("mediaContent")
        if mc:
            fmt = mc["mediaFormatCode"]
            main = CACHE_M / mc["mediaUrl"].rsplit("/", 1)[-1]
            if fmt == "video_mp4":
                stats["video"] += 1
                videos.append(main)
                video_bytes += main.stat().st_size
                video_url = f"{BASE}{mc['mediaUrl']}"
                still = mc.get("printMediaName")
                if still and (CACHE_M / still).exists():
                    image = still
            elif fmt in ("image_png", "image_jpg"):
                stats["image"] += 1
                image = main.name
            else:
                sys.exit(f"question {qid}: unknown media format {fmt}")
            if image:
                shutil.copy2(CACHE_M / image, PUBLIC_MEDIA / image)

        rec: dict = {
            "id": new_id,
            "cat": cat,
            "q": q["questionText"].strip(),
            "a": answers[0]["answerText"].strip(),
            "b": answers[1]["answerText"].strip(),
            "c": answers[2]["answerText"].strip() if len(answers) == 3 else None,
            "correct": "abc"[correct[0]],
            "image": image,
            "points": q["pointsCount"],
            "sourceId": qid,
        }
        if video_url:
            rec["videoUrl"] = video_url
        if qid in groups_by_qid:
            rec["groups"] = groups_by_qid[qid]
        out.append(rec)

    (DATA / "questions.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=1) + "\n"
    )

    # meta.json
    categories = []
    for group, cat in CAT_ORDER:
        ids = [r["id"] for r in out if r["cat"] == cat]
        categories.append(
            {
                "id": group,
                "name": cat,
                "group": group,
                "range": [min(ids), max(ids)],
                "count": len(ids),
            }
        )
    cat_name = {g: c for g, c in CAT_ORDER}
    meta = {
        "source": "Ministerstvo dopravy ČR — eTesty (oficiální zkušební otázky)",
        "sourceUrl": "https://etesty.md.gov.cz/",
        "totalQuestions": len(out),
        "categories": categories,
        "exam": {
            "totalQuestions": sum(c for _, c, _ in EXAM_COMPOSITION),
            "composition": [
                {
                    "group": g,
                    "categories": [cat_name[g]],
                    "count": c,
                    "pointsPerQuestion": p,
                }
                for g, c, p in EXAM_COMPOSITION
            ],
            "maxPoints": sum(c * p for _, c, p in EXAM_COMPOSITION),
            "passThreshold": 43,
            "timeLimitMinutes": 30,
        },
        "duplicatePairs": [],
    }
    (DATA / "meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=1) + "\n"
    )

    # Points sanity: every question in a group carries that group's points.
    pts = {g: p for g, _, p in EXAM_COMPOSITION}
    odd = [
        (r["sourceId"], r["cat"], r["points"])
        for r in out
        if r["points"] != pts[next(g for g, c in CAT_ORDER if c == r["cat"])]
    ]

    img_bytes = sum((PUBLIC_MEDIA / r["image"]).stat().st_size for r in out if r["image"])
    print(f"\nquestions: {len(out)} (dropped {len(drop)} zásady content-duplicates)")
    for c in categories:
        print(f"  {c['name']}: {c['count']}")
    print(f"two-answer questions: {stats['two_answer']}")
    print(f"questions with answer media: {stats['answer_media']}")
    print(f"images: {stats['image']} + video stills; committed {img_bytes/1e6:.1f} MB in public/media/")
    print(f"videos: {stats['video']} mp4, total {video_bytes/1e6:.1f} MB (cached in data/cache/media, NOT committed)")
    if odd:
        print(f"WARNING: {len(odd)} questions with off-composition points: {odd[:10]}")


def main() -> None:
    CACHE_Q.mkdir(parents=True, exist_ok=True)
    CACHE_M.mkdir(parents=True, exist_ok=True)
    fetch = "--no-fetch" not in sys.argv

    lists = fetch_okruh_lists() if fetch else json.loads((DATA / "cache" / "okruhy.json").read_text())
    lists = {int(k): v for k, v in (lists.items() if isinstance(lists, dict) else lists)}
    if fetch:
        (DATA / "cache" / "okruhy.json").write_text(json.dumps(lists))

    all_ids = sorted({qid for qids in lists.values() for qid in qids})
    print(f"unique question ids: {len(all_ids)}")

    questions: dict[int, dict] = {}
    for i, qid in enumerate(all_ids):
        questions[qid] = fetch_question(qid) if fetch else json.loads((CACHE_Q / f"{qid}.json").read_text())
        if fetch and (i + 1) % 100 == 0:
            print(f"  fetched {i + 1}/{len(all_ids)}")

    if fetch:
        for q in questions.values():
            mc = q.get("mediaContent")
            if not mc:
                continue
            fetch_media(mc["mediaUrl"])
            if mc["mediaFormatCode"] == "video_mp4" and mc.get("printMediaName"):
                try:
                    fetch_media(mc["printMediaName"])
                except requests.RequestException:
                    print(f"  still missing for {q['id']}: {mc['printMediaName']}")
            for a in q["questionAnswers"]:
                if a.get("mediaContent"):
                    fetch_media(a["mediaContent"]["mediaUrl"])

    transform(lists, questions)


if __name__ == "__main__":
    main()
