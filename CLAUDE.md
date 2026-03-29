# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@PRD.md
@mom_test_summary.md

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
- **Prisma + Neon (PostgreSQL)** — ORM/DB, not yet set up
- **NextAuth.js** — auth (Google OAuth + email), not yet set up

### Data models (from PRD)

- **User** — id, name, email, avatar, bio, interests (string[]), location, rating, activityCount
- **Activity** — id, hostId, title, description, tags (string[]), dateTime, location, lat/lng, maxSpots, status (open/full/completed/cancelled)
- **JoinRequest** — id, activityId, userId, status (pending/approved/declined), compatibilityScore
- **Rating** — id, raterId, rateeId, activityId, score (1–5)

### Compatibility scoring algorithm

**Status: implemented and fully tested — 29 passing unit tests (Groups A–D).**

The core differentiator. Produces a 0–100 score per join request:

| Factor | Weight |
|---|---|
| Shared interest tags (requester ↔ activity tags) | 40% |
| Proximity (requester location ↔ activity location) | 30% |
| Requester's average rating | 20% |
| Requester's completed activity count | 10% |

Key edge cases: new users (no rating/history), no matching tags (minimum score, not zero), user requesting own activity (reject), full activity (block request), past-date activity (hide from feed).

## Product Philosophy

**All features must be grounded in real user problems and observed past behavior — not hypothetical demand.**

Before building any feature, we must be able to answer:
- Who specifically has this problem? (a findable, reachable person — not "users in general")
- What are they doing today to solve it, and why does that fail?
- Have we seen evidence of this behavior, or are we guessing?

This means following The Mom Test principles (see `mom_test_summary.md`):

- **Talk about their life, not your idea.** Understand the workarounds people use today before proposing a solution.
- **Ask about specifics in the past.** "Tell me about the last time you couldn't find someone to do X with" is more reliable than "would you use an app like this?"
- **Ideas and feature requests should be understood, not obeyed.** When a user says "I'd want a group chat," dig into the underlying need — they may just want to confirm logistics, which a simpler mechanism could solve.
- **Validate the who and why before building the what.** A good customer segment is a who-where pair: a specific person in a specific, findable context.
- **Commitment over compliments.** A stakeholder saying "great idea" is worthless. A person willing to post their first activity or sign up for a waitlist is signal.

When scoping or prioritizing features, apply this gut-check: *What real behavior does this solve, and how do we know it's a real problem?* If we can't answer that with observed evidence, we're building on assumption.

## Design System

**Brand:** Gen Z, party energy, joyful. Neon fuchsia + violet on soft blush.

**Reference prototype:** `docs/design/landing-prototype.html` — treat this as the visual source of truth.

### Colors

| Role | Token | Hex |
|---|---|---|
| Primary | fuchsia | `#FF2D9B` |
| Primary Dark | fuchsia-dark | `#E01B85` |
| Primary Light | fuchsia-light | `#FF5CB5` |
| Primary Bg | fuchsia-bg | `#FFF0F8` |
| Secondary | violet | `#8B5CF6` |
| Secondary Bg | violet-bg | `#F3EEFF` |
| Accent | sunny | `#FFCA28` |
| Accent | sky | `#38BDF8` |
| Accent | mint | `#2DD4A8` |
| Accent | peach | `#FF8C69` |
| Background | — | `#FFFAFE` |
| Surface | — | `#FFFFFF` |
| Border | — | `#F3E4EE` |
| Text Primary | — | `#1E0A1B` |
| Text Secondary | — | `#5C4558` |
| Text Muted | — | `#A693A2` |

### Typography

- **Headings:** Outfit, weight 800–900
- **Body:** DM Sans, weight 400–700

### Shape & Shadow

- **Cards:** `border-radius: 20px`
- **Small elements:** `border-radius: 12px`
- **Pills/tags:** `border-radius: 100px`
- **Hover shadows:** fuchsia-tinted glows (not plain grey box-shadows)

### Gradient

Highlight text and accent elements use:
```css
linear-gradient(135deg, #FF2D9B, #8B5CF6)
```

## Coding Conventions

- Functional components only — no class components
- Next.js App Router conventions: server components by default, `'use client'` only when interactivity is required
- File naming: kebab-case for files, PascalCase for component names
- Use Prisma for all database access — no raw SQL
- API routes go in `src/app/api/`
- Shared types go in `src/types/`
- Utility functions and business logic go in `src/lib/`

## Testing Strategy

**Vitest** is configured as the test runner. Test files live next to source files with a `.test.ts` extension.

Follow a strict TDD approach: write a failing test first, implement the minimum code to pass it, then refactor.

### Three layers

**Unit tests** — all pure logic, especially the scoring algorithm. Cover every edge case exhaustively: new users with no history, zero matching tags, self-join attempts, full activities, expired activities, tie-breaking, boundary values, null/undefined inputs. Aim for full coverage on the scoring module.

**Integration tests** — API route testing to verify endpoints return correct responses and handle errors correctly.

**E2E tests** — full user flows, e.g.: user creates activity → another user requests to join → host sees scored and ranked requests → host approves → spots update.

### Priority

HW4 focus: unit tests on the scoring algorithm via TDD. Integration and E2E are for later phases.

## Development Workflow

Each issue is implemented on its own branch. **Never push directly to `main`.** All work merges via pull request only, after validation and testing.

### Per-issue workflow

1. **EXPLORE** — Read the issue. Understand existing code using Glob, Grep, Read.
2. **PLAN** — Design the approach in Plan mode. Get sign-off before writing any code.
3. **BRANCH** — Create a branch named `feature/R-XXX-short-description` (e.g. `feature/R-001-google-oauth`).
4. **IMPLEMENT** — Execute following TDD where applicable (see below).
5. **COMMIT** — Clean commits with conventional commit messages on the feature branch.
6. **PR** — Open a pull request to `main`. Validate and test before merging.
7. **MERGE** — Merge only after PR review passes. Never squash TDD commit history.

### TDD — apply when possible, skip when not

Apply the red-green-refactor cycle for all **pure logic and business rules** (scoring, validation, data transforms):

1. **RED** — Write a failing test that defines the expected behavior
2. **GREEN** — Write the minimum code to make the test pass — nothing more
3. **REFACTOR** — Clean up the code while keeping tests green

Each cycle is its own commit set — never combined:
- `test(scope): add failing test for [behavior]`
- `feat(scope): implement [behavior] to pass test`
- `refactor(scope): [what was improved]`

**Skip TDD when it doesn't apply** — e.g. OAuth flows, third-party auth redirects, UI components, and external integrations that can't be meaningfully unit tested. For these, write integration or E2E tests where practical, or test manually and document what was validated in the PR.

### Branch naming

`feature/R-XXX-short-description` — e.g. `feature/R-001-google-oauth`, `feature/R-005-create-activity`

## Git Conventions

Use **conventional commits** format: `type(scope): description`

**Types:** `test`, `feat`, `refactor`, `chore`, `docs`, `fix`

**Scope:** the feature area, e.g. `(scoring)`, `(auth)`, `(activity)`

**TDD commit pattern** — these three commits must never be combined:
1. `test(scoring): add failing test for [behavior]`
2. `feat(scoring): implement [behavior] to pass test`
3. `refactor(scoring): [what was improved]`

**Rules:**
- Keep messages concise but descriptive
- Never combine test + implementation in the same commit
- Push to origin after each complete red-green-refactor cycle
- **Never push directly to `main`** — all changes go through a PR on a feature branch

## Do's and Don'ts

**Do:**
- Keep scoring logic as pure functions with no database dependencies so they are easily testable
- Use TypeScript strict mode — no `any` types
- Write small, focused commits with descriptive messages following the pattern: `test(scope): ...`, `feat(scope): ...`, `refactor(scope): ...`
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
