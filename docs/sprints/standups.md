# Async Standups

## Sprint 1

### Stevi — Mar 31

- **Yesterday:** Set up the repo, Next.js, Prisma, Neon DB. Got Google OAuth working with NextAuth v5. Took a while to figure out JWT sessions.
- **Today:** Email/password auth (R-002) and profile CRUD (R-003).
- **Blockers:** None, but NextAuth v5 docs are sparse.

### Stevi — Apr 2

- **Yesterday:** Finished profile with avatar upload (Vercel Blob), public profile page. Started activity CRUD.
- **Today:** Activity feed with cursor pagination (R-008) and filters (R-009).
- **Blockers:** Distance filtering without PostGIS is going to be hacky — planning to over-fetch and filter in JS.

### Stevi — Apr 4

- **Yesterday:** Feed is done with tag/date/distance filters. Started the scoring algorithm with TDD.
- **Today:** Finishing scoring edge cases (R-015), then moving to join requests.
- **Blockers:** None. TDD is actually making the scoring stuff go faster since the logic is complex.

### Teammate — Apr 2

- **Yesterday:** Reviewed Stevi's auth PRs, set up local dev environment.
- **Today:** Working on CI pipeline — ESLint, Prettier, Playwright setup.
- **Blockers:** Need to figure out how to run Playwright in CI without a running server.

### Teammate — Apr 4

- **Yesterday:** CI pipeline is live with lint, typecheck, tests, E2E, and security scanning. Added gitleaks.
- **Today:** Reviewing scoring PRs, helping with join request design.
- **Blockers:** None.

### Teammate — Apr 6

- **Yesterday:** Reviewed and merged R-016 (approve/decline). Added public profile links to the requests page (R-023).
- **Today:** Planning sprint 2 features.
- **Blockers:** None.

---

## Sprint 2

### Stevi — Apr 7

- **Yesterday:** Started sprint 2. Implemented R-018 (spots update on approval) with TDD. Code reviewer caught a race condition — fixed with $transaction.
- **Today:** R-019 (rating system) — this is the big one. Planning the data flow and TDD cycles.
- **Blockers:** None.

### Stevi — Apr 8

- **Yesterday:** Finished R-019 + R-020 (ratings + average recalculation). 14 new tests, full UI integration. Had to rework the dashboard to separate past/future activities.
- **Today:** Fixing seed data to use real Rating records instead of synthetic values. Then moving to testing and cleanup.
- **Blockers:** Seed data mismatch caused confusing test results — fixing now.

### Stevi — Apr 12

- **Yesterday:** Seed data fixed, all manual tests passing. PR #42 merged for R-019/R-020.
- **Today:** Reviewing teammate's PRs for R-021, R-024.
- **Blockers:** None.

### Teammate — Apr 9

- **Yesterday:** Started R-017 (notifications) and R-025 (profile stats) in parallel using worktrees.
- **Today:** Finishing notification model + integration with join request flow.
- **Blockers:** Need to add Notification model to Prisma schema — coordinating with Stevi to avoid conflicts.

### Teammate — Apr 12

- **Yesterday:** Merged R-021 (anonymous ratings) and R-024 (empty states). Both were small PRs.
- **Today:** R-017 notification flow is done, opening PR. Starting R-025 profile stats.
- **Blockers:** None.

### Teammate — Apr 18

- **Yesterday:** Merged R-025 (profile stats), R-017 (notifications). Added integration tests for all API routes — coverage is now 80%+.
- **Today:** Adding Prettier to CI, AI PR review action. Final cleanup.
- **Blockers:** None — we're in good shape for the deadline.
