# Sprint 2 Retrospective

**Sprint:** 2
**Dates:** Apr 7 - Apr 19, 2026
**Velocity:** 37 points completed

## What got done

Everything shipped. The full join request lifecycle (request → approve/decline → spots update → notification), the entire ratings system (rate participants, recalculate averages, anonymous), plus polish features (empty states, profile stats, public profile links). Also bumped test coverage to 80%+ with new integration tests for all API routes.

The ratings feature (R-019 + R-020) was the biggest piece — touched 8 files, added 14 unit tests, and required rethinking the dashboard layout to separate upcoming vs past activities. The seed data also had to be rewritten to use real Rating records instead of fake numbers.

## What went well

- **Worktrees worked great for parallel dev.** Teammate built R-017 and R-025 in separate worktrees while I worked on the rating system. Zero merge conflicts.
- **Agents saved real time.** The tdd-runner produced clean red-green-refactor commits automatically. The code-reviewer caught a race condition in the approve flow that we fixed with `$transaction` before it became a production bug.
- **The pr-validator caught things we would've missed.** Like the feed not showing full activities (we were filtering `status: "open"` only, needed `{ in: ["open", "full"] }`).
- **CI pipeline is solid.** The AI PR review step gives useful feedback on every PR. Prettier formatting check prevents style debates.

## What didn't go well

- **Seed data was a mess.** We had synthetic ratings on User records (hardcoded `rating: 4.5`) that didn't correspond to actual Rating table entries. When the recalculation logic went live, it overwrote the synthetic values with real averages. Caused confusion during testing. Fixed by rewriting the seed to create proper Rating records.
- **Dashboard needed more iteration than expected.** Had to add "Rate participants" section, separate past/future activities, add View links for past activities. The original dashboard design didn't account for the post-activity rating flow.
- **Session cookies broke after DB reset.** Wiping the database during testing invalidated all auth tokens, causing infinite redirect loops. Had to clear cookies manually each time.

## Final stats

- 25 features completed across 2 sprints
- 52 PRs merged
- 162 tests passing
- 80.11% code coverage
- 6-stage CI pipeline
- 4 custom agents, 2 skills, 3 hooks, 1 MCP server

## If we had more time

- Real-time notifications (WebSocket or SSE instead of page-load fetch)
- PostGIS for proper distance queries instead of JS post-filtering
- Image uploads for activities
- Push notifications
