# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@PRD.md
@mom_test_summary.md
@docs/project/architecture.md
@docs/project/design-system.md

## Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Product Philosophy

**All features must be grounded in real user problems and observed past behavior — not hypothetical demand.**

Before building any feature, answer: who specifically has this problem, what are they doing today to solve it, and where's the evidence? Follow The Mom Test principles in `mom_test_summary.md`. If we can't answer with observed evidence, we're building on assumption.

## Design System

See `docs/project/design-system.md` for full color tokens, typography, and shape rules.

**Key rules:**
- Cards `20px` · Small elements `12px` · Pills/buttons `100px` border-radius
- Gradient: `linear-gradient(135deg, #FF2D9B, #8B5CF6)` for CTAs and highlights
- Hover shadows: fuchsia-tinted glows, not plain grey

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

**Unit tests** — all pure logic, especially the scoring algorithm. Cover every edge case exhaustively.

**Integration tests** — API route testing to verify endpoints return correct responses and handle errors correctly.

**E2E tests** — full user flows, e.g.: user creates activity → another user requests to join → host sees scored and ranked requests → host approves → spots update.

## Development Workflow

Each issue is implemented on its own branch. **Never push directly to `main`.** All work merges via pull request only, after validation and testing.

### Agents — always use these, no exceptions

Four agents live in `.claude/agents/`. They are **mandatory** at the stages below:

| Agent | When to invoke |
|---|---|
| `tdd-runner` | Any pure logic or business rules (scoring, validation, data transforms) — enforces red→green→refactor with separate commits |
| `code-reviewer` | After implementation is complete, before committing — checks architecture, design system, TS quality |
| `pr-validator` | Before opening every PR — runs automated checks and generates the manual testing checklist |
| `context-manager` | When context is large, before compacting, or when resuming a session |

Never skip these. If a stage is reached without running the required agent, stop and run it before proceeding.

### Per-issue workflow

1. **EXPLORE** — Read the issue. Understand existing code using Glob, Grep, Read.
2. **PLAN** — Design the approach in Plan mode. Get sign-off before writing any code.
3. **BRANCH** — Create a branch named `feature/R-XXX-short-description` (e.g. `feature/R-001-google-oauth`).
4. **IMPLEMENT** — Execute following TDD where applicable. Use `tdd-runner` agent for all pure logic.
5. **REVIEW** — Run `code-reviewer` agent on all changed files. **Do NOT proceed to step 6 until all critical and warning issues are fixed.**
6. **CHECKLIST** — Run automated checks (`npm run lint`, `npx tsc --noEmit`, `npm run test`). Give the user a step-by-step manual testing checklist. **STOP here — do NOT commit or proceed until the user explicitly confirms manual tests passed. No exceptions.**
7. **COMMIT** — Only after user confirmation. Clean commits with conventional commit messages on the feature branch.
8. **VALIDATE** — Run `pr-validator` agent.
9. **PR** — Open a pull request to `main`. The PR body must include `Closes #X` (the GitHub issue number) so the issue is automatically closed on merge.
10. **MERGE** — Merge only after PR review passes. Never squash TDD commit history.

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
