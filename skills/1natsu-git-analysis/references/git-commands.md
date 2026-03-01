# Git Commands Reference

## Branch Information

```bash
# Get default branch
git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@'

# Alternative: query remote
git remote show origin | grep 'HEAD branch' | awk '{print $NF}'

# Get current branch
git branch --show-current
```

## Merge Base Operations

```bash
# Between current branch and remote default
git merge-base origin/main HEAD

# Between two branches
git merge-base branch1 branch2

# Show merge base details
MERGE_BASE=$(git merge-base origin/main HEAD)
git show --no-patch --format="%H %s (%an, %ar)" $MERGE_BASE
```

## Commit History Formats

```bash
# One-line
git log --oneline <merge-base>..HEAD

# Structured (pipe-separated)
git log --format="%H|%s|%an|%ae|%ad" --date=iso <merge-base>..HEAD

# With changed files
git log --name-status <merge-base>..HEAD

# Filter by author
git log --author="Name" <merge-base>..HEAD

# Filter by date
git log --since="2 weeks ago" <merge-base>..HEAD

# Filter by file
git log <merge-base>..HEAD -- path/to/file
```

## Diff Operations

```bash
# Summary stats
git diff --stat <merge-base>..HEAD
git diff --shortstat <merge-base>..HEAD

# File names only
git diff --name-only <merge-base>..HEAD

# File names with status (A/M/D)
git diff --name-status <merge-base>..HEAD

# Line count per file
git diff --numstat <merge-base>..HEAD

# Ignore whitespace
git diff -w <merge-base>..HEAD
```

## Working Directory

```bash
# Short status
git status -s

# Untracked files
git ls-files --others --exclude-standard

# Staged files
git diff --cached --name-only

# Check ahead/behind remote
git rev-list --left-right --count origin/main...HEAD
```

## Performance Tips

- Use plumbing commands for scripting (`git rev-parse`, `git diff-index`)
- Limit output depth: `git log --max-count=10`
- Run independent commands in parallel with `&` and `wait`
- Limit diff context: `git diff --unified=1`

## Robust Script Template

```bash
#!/usr/bin/env bash
set -euo pipefail

git rev-parse --git-dir > /dev/null 2>&1 || { echo "Not in a git repo" >&2; exit 1; }
git ls-remote origin > /dev/null 2>&1 || { echo "Remote 'origin' not found" >&2; exit 1; }

DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@') || { echo "Cannot determine default branch" >&2; exit 1; }
MERGE_BASE=$(git merge-base origin/"$DEFAULT_BRANCH" HEAD 2>/dev/null) || { echo "Cannot determine merge base" >&2; exit 1; }
```
