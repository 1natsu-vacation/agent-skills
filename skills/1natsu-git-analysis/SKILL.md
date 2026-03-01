---
name: 1natsu-git-analysis
description: Analyze git repository changes, branch differences, and commit history. Use when analyzing branches, comparing changes, examining commit history, preparing for PR creation, or reviewing code changes. Activate whenever the user mentions branch analysis, merge base, commit history, or wants to understand what changed in a branch.
license: MIT
metadata:
  author: 1natsu
  version: "1.0.0"
---

# Git Analysis

Analyze git repository state — branches, commits, diffs, and working directory changes.

## When to Use

- Analyze what changed in a branch
- Prepare information for PR creation or code review
- Compare branches or examine commit history
- Understand code changes before committing

## Quick Start

Run the bundled helper scripts for common operations:

```bash
# Get branch diff summary (default branch, merge base, commit count, file stats)
bash scripts/get_branch_diff.sh

# Get structured commit history from merge base
bash scripts/get_commit_history.sh
```

## Core Workflow

### 1. Identify Default Branch and Merge Base

```bash
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
MERGE_BASE=$(git merge-base origin/$DEFAULT_BRANCH HEAD)
```

The merge base is where the current branch diverged — always compare from here, not from the current state of the base branch.

### 2. Analyze Changes

Run these in parallel for efficiency:

```bash
# Commits since divergence
git log --oneline $MERGE_BASE..HEAD

# File change statistics
git diff --stat $MERGE_BASE..HEAD

# Structured commit data
git log --format="%H|%s|%an|%ae|%ad" --date=iso $MERGE_BASE..HEAD
```

### 3. Check Working Directory

```bash
git status                # Overall status
git diff --cached         # Staged changes
git diff                  # Unstaged changes
```

## Output Format

Present analysis results with summary first, then details:

```
Branch: feature/new-feature (from main)
Diverged at: abc123d (2025-01-15)

5 commits | 12 files changed | +234 -89

Recent commits:
1. feat(api): add new endpoint
2. test(api): add endpoint tests
3. docs(api): update documentation
```

## Helper Scripts

### get_branch_diff.sh

Outputs structured key-value pairs:

```
DEFAULT_BRANCH: main
MERGE_BASE: abc123def456
COMMITS: 5
CHANGED_FILES: 12
INSERTIONS: 234
DELETIONS: 89
```

### get_commit_history.sh

Outputs pipe-separated commit data (one per line):

```
hash|subject|author_name|author_email|date
```

Accepts an optional merge base argument. Auto-detects if omitted.

## Error Handling

Check prerequisites before analysis:

```bash
# Verify git repository
git rev-parse --git-dir > /dev/null 2>&1 || echo "Not in a git repository"

# Verify remote exists
git ls-remote origin > /dev/null 2>&1 || echo "Remote 'origin' not found"
```

## References

See [references/git-commands.md](references/git-commands.md) for advanced git command patterns, plumbing commands, and performance optimization tips.
