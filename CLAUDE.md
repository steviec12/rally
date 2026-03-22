# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@PRD.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

**Rally** is a location-based, activity-first social platform. Users post activity cards (e.g., "Pickup basketball, Saturday 10am, 4 spots"), others request to join, and the host approves based on compatibility scores.

### Stack

- **Next.js 16.2.1** — App Router (in `src/app/`). See AGENTS.md warning about breaking changes.
- **TypeScript** — strict mode; path alias `@/*` → `./src/*`
- **Tailwind CSS v4** — configured via `@tailwindcss/postcss` (no `tailwind.config.js`)
- **Prisma + Neon (PostgreSQL)** — planned ORM/DB, not yet set up
- **NextAuth.js** — planned auth (Google OAuth + email), not yet set up

### Data models (from PRD)

- **User** — id, name, email, avatar, bio, interests (string[]), location, rating, activityCount
- **Activity** — id, hostId, title, description, tags (string[]), dateTime, location, lat/lng, maxSpots, status (open/full/completed/cancelled)
- **JoinRequest** — id, activityId, userId, status (pending/approved/declined), compatibilityScore
- **Rating** — id, raterId, rateeId, activityId, score (1–5)

### Compatibility scoring algorithm

The core differentiator. Produces a 0–100 score per join request:

| Factor | Weight |
|---|---|
| Shared interest tags (requester ↔ activity tags) | 40% |
| Proximity (requester location ↔ activity location) | 30% |
| Requester's average rating | 20% |
| Requester's completed activity count | 10% |

Key edge cases: new users (no rating/history), no matching tags (minimum score, not zero), user requesting own activity (reject), full activity (block request), past-date activity (hide from feed).

## Coding Conventions

- Functional components only — no class components
- Next.js App Router conventions: server components by default, `'use client'` only when interactivity is required
- File naming: kebab-case for files, PascalCase for component names
- Use Prisma for all database access — no raw SQL
- API routes go in `src/app/api/`
- Shared types go in `src/types/`
- Utility functions and business logic go in `src/lib/`

## Testing Strategy

Use **Vitest** as the test runner. Test files live next to source files with a `.test.ts` extension.

Follow a strict TDD approach: write a failing test first, implement the minimum code to pass it, then refactor.

### Three layers

**Unit tests** — all pure logic, especially the scoring algorithm. Cover every edge case exhaustively: new users with no history, zero matching tags, self-join attempts, full activities, expired activities, tie-breaking, boundary values, null/undefined inputs. Aim for full coverage on the scoring module.

**Integration tests** — API route testing to verify endpoints return correct responses and handle errors correctly.

**E2E tests** — full user flows, e.g.: user creates activity → another user requests to join → host sees scored and ranked requests → host approves → spots update.

### Priority

HW4 focus: unit tests on the scoring algorithm via TDD. Integration and E2E are for later phases.

## Development Workflow

This project follows strict TDD through Claude Code. Every feature must follow the red-green-refactor cycle:

1. **RED** — Write a failing test that defines the expected behavior
2. **GREEN** — Write the minimum code to make the test pass — nothing more
3. **REFACTOR** — Clean up the code while keeping tests green
4. Repeat for the next piece of behavior

Never write implementation code without a failing test first.

Each red-green-refactor cycle is its own set of commits:
- `test: add failing test for [behavior]`
- `feat: implement [behavior] to pass test`
- `refactor: clean up [what was improved]`

For new features, follow the **Explore → Plan → Implement → Commit** workflow:
1. **EXPLORE** — Understand existing code using Glob, Grep, Read
2. **PLAN** — Use Claude Code Plan mode to design the approach before writing any code
3. **IMPLEMENT** — Execute following TDD
4. **COMMIT** — Create clean commits with meaningful messages

Do not combine multiple steps into a single commit. The git history must clearly show the TDD process.

## Do's and Don'ts

**Do:**
- Keep scoring logic as pure functions with no database dependencies so they are easily testable
- Use TypeScript strict mode — no `any` types
- Write small, focused commits with descriptive messages following the pattern: `test: ...`, `feat: ...`, `refactor: ...`
- Validate all input on the server side
- Ask for permission before implementing anything — always confirm the plan first
- Encourage back-and-forth discussion; push back if something is a bad idea
- Be honest — if you don't know something, say "I don't know" or "my best guess is..." — do not make things up; all answers should be based on known facts or resources

**Don't:**
- Don't put business logic in API route handlers directly — extract to `src/lib/`
- Don't use client components unless interactivity is required
- Don't skip writing tests before implementation during TDD phases
- Don't commit code that fails linting
- Don't implement anything without confirming first — no jumping ahead
- Don't try to please — honest and direct feedback is more valuable than agreement
- Don't make assumptions about requirements; if something is ambiguous, ask
