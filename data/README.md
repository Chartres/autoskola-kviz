# Question dataset — official bank

[`questions.json`](./questions.json) holds the complete official question bank
of the Czech driving-licence theory exam, extracted from
**Ministerstvo dopravy ČR — eTesty** (https://etesty.md.gov.cz/) by
[`extract.py`](./extract.py).

## Refresh

```sh
uv run data/extract.py            # fetch (resumable, cached in data/cache/) + transform
uv run data/extract.py --no-fetch # re-transform from cache only
```

## Schema

```json
{ "id": 1, "cat": "Pravidla provozu", "q": "…", "a": "…", "b": "…", "c": "…",
  "correct": "b", "image": null, "points": 2, "sourceId": 3172 }
```

- `cat` — one of the seven official okruhy (see `meta.json`).
- `c` — third option, or `null` (some official questions have only two answers).
- `image` — filename under `public/media/` (sign / situation picture, or the
  still frame of a video question), or `null`.
- `points` — official point value (1, 2 or 4, by okruh).
- `sourceId` — eTesty question id (traceability; media files are named by it).
- `videoUrl` — (video questions only) source mp4 on etesty.md.gov.cz. Videos
  are not committed (see below); the app shows the still image.
- `groups` — (zásady bezpečné jízdy only) licence groups the question applies
  to: `A`, `B`, `CD`. The three okruh variants (2/3/4) overlap heavily; the
  bank is deduped with the B variant winning.

## Exam model (`meta.json`)

Official composition: 10×2 pravidla + 3×1 značky + 3×4 situace + 4×2 zásady +
2×1 podmínky + 2×2 předpisy + 1×1 zdravověda = 25 questions, **50 points,
pass ≥ 43, 30 minutes**.

## Videos

The mp4s for animated questions exceed the repo budget, so they are cached
locally (`data/cache/media/`, gitignored) but not committed. Questions fall
back to the committed still image; `videoUrl` records the source for a future
self-hosted video story.
