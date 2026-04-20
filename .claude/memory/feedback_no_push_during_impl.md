---
name: no_push_during_implementation
description: Never push to origin during implementation — only after user confirms manual tests
type: feedback
---

Do NOT push to origin (git push) during the implementation phase. Pushing should only happen at workflow step 7 (COMMIT), after:

1. Code-reviewer agent has been run
2. Automated checks passed (lint, tsc, test)
3. User has been given a manual testing checklist
4. User has explicitly confirmed manual tests passed

**Why:** During R-009, the tdd-runner agent incorrectly pushed commits to origin during the implementation phase. The user called this out as wrong — pushing should only happen after manual test confirmation.

**How to apply:** During TDD cycles (red/green/refactor), only commit locally. Do not run `git push` until the user says "tests passed" or equivalent confirmation at the CHECKLIST/STOP gate.
