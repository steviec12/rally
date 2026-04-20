---
name: project_status_apr7
description: Project status as of 2026-04-07 — R-019/R-020 merged, remaining issues tracked
type: context
---

## Completed Issues (as of 2026-04-07)

All P0 features are now complete:

- R-001 through R-009, R-012, R-013, R-016, R-018, R-019, R-020
- R-010, R-011, R-014, R-015 closed (already covered by other work)
- 86 tests passing total (29 scoring + 9 filter + 9 geo + 14 join-request + 7 join-request-update + 4 R-018 + 14 rating)

## Key PRs

| PR  | Issue(s)      | Description                              |
| --- | ------------- | ---------------------------------------- |
| #41 | R-018         | Spots remaining updates on approval      |
| #42 | R-019 + R-020 | Rating system with average recalculation |

## Rating System (R-019/R-020)

- `createRating` in src/lib/rating.ts recalculates ratee's average via `db.rating.aggregate` after each rating
- Dashboard: "Your activities" (upcoming hosted) and "Rate participants" (past hosted + joined)
- Past activities on detail page show only approved participants with star ratings (no approve/decline)
- Seed data uses real Rating records instead of synthetic values

## Remaining Open Issues

- R-017: Notify requester of decision (3 points)
- R-021: Ratings are anonymous (p1, 2 points)
- R-024: Empty states for feed (p2, 2 points)
