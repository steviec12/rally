# Sprint 1 Planning

**Sprint:** 1
**Dates:** Mar 29 - Apr 7, 2026
**Goal:** Get the core loop working — users can sign up, create activities, browse the feed, and request to join.

## Sprint Backlog

| Issue | Title                                   | Points | Assignee |
| ----- | --------------------------------------- | ------ | -------- |
| R-001 | Google OAuth sign-in                    | 5      | Stevi    |
| R-002 | Email/password auth                     | 3      | Stevi    |
| R-003 | Create and edit profile                 | 5      | Stevi    |
| R-004 | Public profile page                     | 3      | Stevi    |
| R-005 | Create activity card                    | 5      | Stevi    |
| R-006 | Edit activity                           | 3      | Stevi    |
| R-007 | Cancel activity                         | 2      | Stevi    |
| R-008 | Activity feed with pagination           | 8      | Stevi    |
| R-009 | Feed filters (tags, date, distance)     | 5      | Stevi    |
| R-014 | Compatibility scoring algorithm         | 8      | Stevi    |
| R-015 | Scoring edge cases                      | 5      | Stevi    |
| Infra | CI/CD, Playwright, coverage, hooks, MCP | —      | Stevi    |

**Total points:** 52

## Capacity

Two people, ~2 weeks. Heavy sprint since we're setting up the entire foundation — auth, DB, CI, and the main user flows.

## Key Risks

- NextAuth v5 beta might have breaking changes (it did — JWT sessions only, no database strategy with credentials provider)
- Prisma 7 has a new config pattern (`prisma.config.ts`) that's different from older tutorials
- Scoring algorithm needs to be pure and testable — no DB dependencies in the logic

## Definition of Done

- Feature works end-to-end (manual test)
- Unit/integration tests pass
- Lint + typecheck clean
- PR reviewed and merged to main
