# Sprint 1 Retrospective

**Sprint:** 1
**Dates:** Mar 29 - Apr 7, 2026
**Velocity:** 52 points completed

## What got done

All 12 items shipped. Auth (Google + email), full profile CRUD, activity CRUD (create/edit/cancel), the feed with filters and pagination, and the scoring algorithm with 29 unit tests. Also set up the CI pipeline, Playwright, hooks, and MCP.

The scoring algorithm was the highlight — did strict TDD with red-green-refactor and ended up with 29 tests across 4 groups (rejection guards, individual factors, composition, regression combos). Having pure functions with no DB dependencies made testing super clean.

## What went well

- **TDD on scoring was worth it.** The algorithm was complex enough that writing tests first actually saved time. Found edge cases (new user with null rating, no tag overlap) before they became bugs.
- **Hooks caught issues early.** The Stop hook running lint + typecheck + tests after every task meant we never committed broken code.
- **Branch-per-issue workflow** kept things organized. Easy to track what was in progress vs done.

## What didn't go well

- **NextAuth v5 beta was painful.** Spent a while figuring out that credentials provider doesn't work with database sessions — had to switch to JWT. The `AUTH_SECRET` env var name change (from `NEXTAUTH_SECRET`) was also confusing.
- **Prisma 7 import path** tripped us up. Had to import from `@/generated/prisma/client` instead of `@prisma/client`. Wasted time debugging "module not found" errors.
- **Feed pagination** was more complex than expected. Cursor-based pagination with distance filtering (JS post-filter since we don't have PostGIS) required over-fetching 3x.

## Action items for Sprint 2

- Document the Prisma 7 and NextAuth v5 gotchas in architecture.md so we don't re-learn them
- Start using the tdd-runner agent instead of doing TDD manually — should enforce the commit pattern better
- Look into worktrees for parallel development since we have two people now
