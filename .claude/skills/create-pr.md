---
name: create-pr
description: "Use when ready to open a pull request. Runs all automated checks, generates a standardized PR title/body, and opens the PR to main via GitHub MCP."
user_invocable: true
---

# Create PR Workflow

When invoked with `/create-pr`, follow this exact sequence:

## Step 1 — Identify the GitHub Issue Number

1. Read the current branch name (e.g. `feature/R-017-notify-requester`)
2. Note: the `R-NNN` number is an internal tracking ID, **not** the GitHub issue number
3. Search recent commits for a `Closes #X` reference:
   ```
   git log --oneline -20
   ```
4. If no `Closes #X` is found in commits, check the branch description or ask the user for the GitHub issue number before proceeding

## Step 2 — Run the pr-validator Agent

Run the `pr-validator` agent on the current branch.
If it surfaces any blocking issues, **stop here** and report them to the user. Do not proceed until resolved.

## Step 3 — Run Automated Checks

Run all three checks in sequence:
```bash
npm run lint
npx tsc --noEmit
npm run test -- --run
```

If **any check fails**, stop immediately and report the exact error output. Do not open the PR.

## Step 4 — Generate PR Title

Produce a title following conventional commit format:
- Pattern: `type(scope): short description` (under 70 characters)
- Derive type and scope from the branch name and commit history
- Example: `feat(notifications): notify requester on join request decision`

## Step 5 — Generate PR Body

Compose the full PR body using this template:

```
## Summary
- <bullet: what changed>
- <bullet: why it was needed>
- <bullet: key implementation decisions, if any>

## Test plan
- [ ] <manual test step 1>
- [ ] <manual test step 2>
- [ ] <add steps covering the golden path and edge cases>

Closes #<github_issue_number>

## AI Disclosure
- AI-generated code: ~70%
- Tool used: Claude Code (claude.ai/code)
- Human review applied: Yes

## C.L.E.A.R. Review
- [ ] Context: Does the PR description clearly explain the problem?
- [ ] Logic: Is the implementation correct and complete?
- [ ] Edge cases: Are error states and edge cases handled?
- [ ] Architecture: Does business logic live in src/lib/ not route handlers?
- [ ] Risk: Any security, performance, or regression concerns?
```

Fill in every placeholder with real content derived from the diff and commit history. Do not leave template text in the final output.

## Step 6 — Open the PR

Use the GitHub MCP tool to open the PR:
- Tool: `mcp__github__create_pull_request`
- Base branch: `main`
- Head branch: current branch
- Title: generated in Step 4
- Body: generated in Step 5

Return the PR URL to the user when done.

## Rules
- Never open a PR if any automated check fails
- Never open a PR without running the pr-validator agent first
- Always include `Closes #X` in the PR body — confirm the issue number before opening
- The PR body must be fully filled in — no placeholder text
