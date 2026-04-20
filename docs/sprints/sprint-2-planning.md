# Sprint 2 Planning

**Sprint:** 2
**Dates:** Apr 7 - Apr 19, 2026
**Goal:** Complete the join request flow, ratings system, notifications, and polish. Ship the MVP.

## Sprint Backlog

| Issue | Title                               | Points | Assignee |
| ----- | ----------------------------------- | ------ | -------- |
| R-012 | Request to join an activity         | 5      | Stevi    |
| R-013 | Host views join requests            | 3      | Stevi    |
| R-016 | Approve/decline join requests       | 5      | Stevi    |
| R-018 | Spots remaining updates on approval | 3      | Stevi    |
| R-019 | Rate participants after activity    | 5      | Stevi    |
| R-020 | Ratings update average              | 3      | Stevi    |
| R-017 | Notify requester of decision        | 3      | Teammate |
| R-021 | Ratings are anonymous               | 2      | Teammate |
| R-023 | Public profile links                | 3      | Stevi    |
| R-024 | Empty states for feed               | 2      | Teammate |
| R-025 | Profile activity stats              | 3      | Teammate |
| R-026 | Coverage improvements               | —      | Teammate |

**Total points:** 37

## Capacity

Two people, ~2 weeks. Splitting work — Stevi handles the core join/rating flow, teammate handles notifications, polish, and coverage.

## Parallel Development Plan

Using git worktrees so both partners can work simultaneously without blocking each other:

- **Worktree 1:** R-017 (notifications) — teammate
- **Worktree 2:** R-025 (profile stats) — teammate
- **Main branch:** Stevi works on R-018 → R-019 → R-020 sequentially

## Key Risks

- Rating system touches multiple pages (activity detail, dashboard, public profile) — could be a big diff
- Notifications need a new DB model (Notification) — schema migration required
- Parallel development might cause merge conflicts on shared files

## Definition of Done

- Feature works end-to-end (manual test confirmed by partner)
- Unit/integration tests pass
- Code reviewer agent run, all critical/warning issues resolved
- PR validated by pr-validator agent
- Lint + typecheck + tests clean
