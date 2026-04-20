# Individual Reflection — Stevi

## How I used Claude Code

Going into this project, I'd used Claude for one-off coding questions but never as an integrated development tool. The difference is massive. Setting up CLAUDE.md, hooks, and agents turned it from "chatbot that writes code" into something closer to having a really disciplined pair programmer who never forgets the rules.

The biggest shift for me was learning to invest time upfront in the configuration. Writing CLAUDE.md felt like busywork at first — why am I documenting import paths and commit formats? But every hour spent on that config saved multiple hours later. When we added the note about Prisma 7 imports (`@/generated/prisma/client` not `@prisma/client`), Claude never got it wrong again. When we documented the TDD commit pattern, the tdd-runner agent produced perfectly formatted commits every time.

## What I built

I was responsible for most of the core features: auth (R-001, R-002), profiles (R-003, R-004), all activity CRUD (R-005 through R-009), the scoring algorithm (R-014, R-015), the full join request lifecycle (R-012, R-013, R-016, R-018), and the ratings system (R-019, R-020). My teammate handled notifications, anonymous ratings, empty states, profile stats, and CI improvements.

The scoring algorithm was my favorite piece. Doing strict TDD with the tdd-runner agent produced 29 tests across four groups — rejection guards, individual factor calculations, total score composition, and regression combos. The algorithm is completely pure (no DB dependencies), which made it trivial to test. I wouldn't have been as disciplined about test coverage without the agent enforcing it.

The ratings feature was the most complex. It touched 8 files, required rethinking the dashboard layout, and exposed a problem with our seed data (synthetic ratings vs real Rating records). The code-reviewer agent caught a race condition in the approve flow that could've caused over-approval. We fixed it with a `$transaction` — something I might not have thought about in manual code review.

## What surprised me

The Stop hook changed how I think about development. Knowing that lint, typecheck, and tests run after every task means the codebase is always clean. I never once sat down to work and found it in a broken state. That confidence compounds — you stop being afraid to make changes because you know the safety net is there.

I was also surprised by how well TDD works with an AI agent. The tdd-runner never cheats — it always writes the failing test first, always makes the minimum change, always separates commits. Humans (me included) tend to skip ahead and implement before testing. The agent doesn't have that temptation.

## What I'd do differently

I'd set up the full agent and hook infrastructure from the very first commit instead of adding it gradually. We added the tdd-runner agent in sprint 2, but the scoring algorithm in sprint 1 was also done with TDD — just manually. Having the agent from the start would've been more consistent.

I'd also be more aggressive about integration tests early on. We had strong unit tests from the beginning but only added API route integration tests late in sprint 2. Those tests caught real issues (like the profile GET route accepting an argument it shouldn't).

## Key takeaway

The most valuable thing I learned isn't a specific technique — it's that AI-assisted development is only as good as the constraints you give it. Unconstrained Claude writes decent code. Claude with a well-configured CLAUDE.md, quality-enforcing hooks, and specialized agents writes production-grade code consistently. The infrastructure IS the product.
