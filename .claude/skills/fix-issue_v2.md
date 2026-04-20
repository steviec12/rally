---
name: fix-issue
description: 'Use when given a GitHub issue number to implement. Reads the issue, plans the approach, creates a branch, and follows the full Rally development workflow.'
user_invocable: true
---

# Fix Issue Workflow

When given a GitHub issue (e.g., `/fix-issue 42`), follow this exact workflow:

## Step 1 — Read the Issue

Use the GitHub MCP tools to read the issue: `mcp__github__issue_read`
Extract: title, description, acceptance criteria, labels.

## Step 2 — Explore

Read all files related to the issue. Use Glob, Grep, Read to understand the current state.
Identify which files need to change and what tests exist.

## Step 3 — Plan

Enter Plan mode. Design the approach. List files to create/modify.
Get user sign-off before writing any code.

## Step 4 — Branch

Create branch off `main`: `feature/R-{number}-{short-description}`

## Step 5 — Implement

Follow TDD for pure logic (use `tdd-runner` agent).
Follow coding conventions from CLAUDE.md.
Use `/ui-style` skill for any frontend work.

## Step 6 — Review

Run `code-reviewer` agent on all changed files.
Fix all critical and warning issues before proceeding.

## Step 7 — Validate

Run automated checks: `npm run lint`, `npx tsc --noEmit`, `npm run test`.
Present a step-by-step manual testing checklist to the user.
**STOP and wait for user confirmation before committing.**

## Step 8 — Commit & PR

Only after user confirms: commit with conventional messages, push, open PR with `Closes #{issue_number}`.
Run `pr-validator` agent before opening the PR.

## Rules

- Never skip the plan step
- Never skip the review step
- Never commit without user confirmation
- Always reference the issue number in commits and PR
