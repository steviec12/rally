# Building Rally: What I Learned Using Claude Code to Ship a Full-Stack App

## The idea

Rally is a location-based social platform where people post activities and others request to join. Think "pickup basketball Saturday morning" — you post it, nearby people find it, and you approve who comes based on a compatibility score. We built it as a pair project over two 2-week sprints.

The interesting part wasn't the app itself — it was how we built it. We used Claude Code for basically everything: planning, writing code, testing, reviewing, and deploying. This post is about what that workflow actually looked like and what we learned.

## Setting up the Claude Code workflow

Before writing any code, we spent time configuring Claude Code's extensibility features. This ended up being one of the highest-ROI things we did.

### CLAUDE.md as the source of truth

Our CLAUDE.md file evolved across 9 commits throughout the project. It started as basic coding conventions and grew into a comprehensive document with @imports pointing to our PRD, architecture docs, design system, and even a summary of The Mom Test (a product discovery book our course covered).

The key insight: **CLAUDE.md is not documentation for humans — it's instructions for the AI.** We wrote it like a very detailed onboarding doc for a new engineer. Things like "import Prisma from `@/generated/prisma/client` NOT `@prisma/client`" saved us hours of debugging because Claude never got the import wrong after we added that line.

### Hooks that enforce quality automatically

We set up three hooks:

1. **PreToolUse** — Blocks edits to `prisma/schema.prisma`, `.env`, and `src/generated/`. These files should only change intentionally.
2. **PostToolUse** — Auto-runs `eslint --fix` after every file edit. We never had to think about formatting.
3. **Stop** — Runs `lint + typecheck + tests` after every task completes. This was the biggest win. We literally could not commit broken code because Claude would catch it before finishing.

### Custom agents for every stage

We built four agents:

- **tdd-runner** — Takes a feature description and produces red-green-refactor commits. It writes a failing test, implements the minimum code to pass, then refactors. Each step is its own commit. This is where most of our 162 tests came from.
- **code-reviewer** — Runs after implementation, before committing. Checks TypeScript quality, architecture (business logic in `src/lib/` not route handlers), design system compliance, and security.
- **pr-validator** — Runs before opening a PR. Verifies lint, typecheck, tests, branch naming, commit format, and generates a manual testing checklist.
- **security-reviewer** — Checks for OWASP Top 10 issues. Required before merging anything touching auth, API routes, or user input.

Making these agents mandatory (documented in CLAUDE.md) was crucial. It meant the workflow was consistent regardless of which team member was working.

## TDD with an AI — surprisingly natural

The tdd-runner agent was probably our most used tool. Here's how a typical TDD session looked for the ratings feature:

1. We'd describe what we wanted: "createRating should validate score is 1-5, reject self-rating, check both rater and ratee are participants..."
2. The agent would write a failing test for score validation, commit it
3. Then implement the minimum code to pass, commit it
4. Then write the next failing test (self-rating), implement, commit
5. Repeat for all 14 test cases

The git history is really clean — you can see the exact red-green-refactor pattern in the commit log. `test(rating): add failing test for self-rating rejection` followed by `feat(rating): block self-rating`.

One thing we learned: **TDD works way better with an AI for pure logic** (scoring algorithms, validation, data transforms) than for UI or integration code. We skipped TDD for React components and auth flows — those got manual testing and integration tests instead.

## The race condition the code reviewer caught

When building the approve/decline flow (R-016/R-018), the initial implementation had a subtle bug: approving a join request and flipping the activity to "full" were two separate database calls. If two approvals happened simultaneously, both could pass the capacity check and you'd end up with more approved requests than spots.

The code-reviewer agent flagged this as a warning. We fixed it by wrapping the two updates in a Prisma `$transaction`. Would we have caught this in manual review? Maybe. But the agent caught it automatically, every time, without us having to remember to look for it.

## Parallel development with worktrees

In sprint 2, we used git worktrees so both of us could work on different features simultaneously. One person worked on the rating system on the main branch while the other built notifications (R-017) and profile stats (R-025) in separate worktrees.

The setup was simple:

```bash
git worktree add ../rally-r017 -b feature/R-017-notify-requester
git worktree add ../rally-r025 -b feature/R-025-profile-stats
```

Each worktree was an isolated copy of the repo. No branch switching, no stashing, no conflicts. When both features were done, they merged cleanly because they touched different files.

## What surprised us

**The Stop hook is the single most valuable thing.** It runs lint, typecheck, and all tests after every task. This means Claude literally cannot finish a task in a broken state. Every time we sat down to work, the codebase was guaranteed to be clean.

**CLAUDE.md evolution matters.** The first version was generic. By sprint 2, it had specific gotchas ("Prisma 7: use `prisma.config.ts`, not URL in schema"), workflow rules ("never push directly to main"), and security guidelines (OWASP checklist). Each time we hit a problem, we added it to CLAUDE.md so it never happened again.

**The AI is better at TDD than we are.** Not because it writes better code, but because it never skips steps. It always writes the failing test first, always makes the minimum change to pass, always refactors separately. Humans get lazy and combine steps. The tdd-runner agent doesn't.

## By the numbers

- 25 features shipped across 2 sprints
- 52 PRs merged
- 162 tests (80%+ coverage)
- 6-stage CI pipeline (lint, typecheck, tests, E2E, security scan, AI PR review)
- 4 custom agents, 2 skills, 3 hooks, 1 MCP server
- 0 production bugs (so far)

## What we'd do differently

- **Set up worktrees from day one.** We only used them in sprint 2 and wished we'd started earlier.
- **Write more integration tests for API routes.** Our unit tests were solid but we added API route tests late in sprint 2.
- **Use the security-reviewer agent more aggressively.** We ran it before PRs touching auth, but should have run it on every PR.

## Takeaway

Claude Code isn't just "AI writes code for you." The real value is in the infrastructure — hooks, agents, skills, CLAUDE.md — that make the AI a reliable member of the team. Once that infrastructure is set up, the workflow becomes: describe what you want, let the agents enforce quality, review the output, ship. The code quality ends up higher than what we'd produce manually because the enforcement is automatic and consistent.

---

_Built with Next.js, TypeScript, Prisma, Neon, and a lot of Claude Code. Deployed on Vercel._
