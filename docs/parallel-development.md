# Parallel Feature Development with Git Worktrees

## What Are Git Worktrees?

A git worktree lets you check out multiple branches of the same repository into separate directories simultaneously. Each worktree has its own working tree and index, but they all share the same git history, objects, and refs underneath.

Without worktrees, developing two features in parallel means stashing, committing half-finished work, or cloning the repo a second time. Worktrees solve this cleanly: each feature lives in its own directory, on its own branch, with no interference.

## Why We Used Them Here

Two features needed to progress at the same time:

| Feature                                           | Branch                           | Directory                                |
| ------------------------------------------------- | -------------------------------- | ---------------------------------------- |
| R-017 — Notify requester on join request decision | `feature/R-017-notify-requester` | `CS 7180/rally` (main working directory) |
| R-025 — Profile activity statistics               | `feature/R-025-profile-stats`    | `CS 7180/rally-profile-stats` (worktree) |

R-017 is fully implemented and ready to PR. Rather than waiting for it to merge before starting R-025, we used a worktree to spin up R-025 immediately on a clean branch — both directories pointing at the same repo with no conflicts.

## Setup Commands

```bash
# From the main working directory (rally/)
git worktree add ../rally-profile-stats -b feature/R-025-profile-stats
```

This does two things in one command:

1. Creates a new branch `feature/R-025-profile-stats` off the current HEAD
2. Checks it out into a new directory `../rally-profile-stats`

## Active Worktrees

Output of `git worktree list` after setup:

```
C:/Users/Admin/Desktop/CS 7180/rally                6323997 [feature/R-017-notify-requester]
C:/Users/Admin/Desktop/CS 7180/rally-profile-stats  6323997 [feature/R-025-profile-stats]
```

Both worktrees start at the same commit (`6323997`). From here they diverge independently.

## How This Workflow Prevents Conflicts

- Each directory has its own working tree and staged changes — editing a file in one worktree has zero effect on the other
- You cannot check out the same branch in two worktrees simultaneously — git enforces this and will error if you try
- Both worktrees push to the same remote (`origin`) on their respective branches, so CI/CD runs independently for each
- When R-017 merges to `main`, R-025 can rebase onto the updated `main` from its own directory without disrupting in-progress work

## Cleaning Up

When a feature branch is merged and the worktree is no longer needed:

```bash
# Remove the worktree directory and deregister it
git worktree remove ../rally-profile-stats

# Or, if there are untracked files blocking removal
git worktree remove --force ../rally-profile-stats

# Prune stale worktree metadata (if directory was deleted manually)
git worktree prune
```
