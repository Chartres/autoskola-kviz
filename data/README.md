# Question dataset — PLACEHOLDER

[`questions.json`](./questions.json) currently holds **7 hand-written sample
questions** (one per okruh, two with images) so the app flows end-to-end.
They are NOT official exam questions.

## Schema

Mirrors zbrojni-kviz, plus an `image` field:

```json
{ "id": 1, "cat": "Pravidla provozu", "q": "…", "a": "…", "b": "…", "c": "…",
  "correct": "b", "image": null }
```

- `cat` — one of the seven official okruhy (see `meta.json`).
- `image` — filename under `public/img/` (traffic sign / situation picture), or `null`.

## TODO: real bank extraction (separate task)

- Source: **Ministerstvo dopravy ČR — eTesty** (https://etesty2.mdcr.cz/),
  the official question database incl. images and per-question points (1/2/4).
- Add per-question `points` and switch exam scoring from count-based
  (placeholder pass 21/25) to the official **43/50 points**.
- Extend `meta.json` category counts/ranges from the real data.
