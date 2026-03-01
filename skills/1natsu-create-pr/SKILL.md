---
name: 1natsu-create-pr
description: Create GitHub pull requests with conventional commit titles, structured descriptions, and multi-language support (en/ja). Use when creating PRs, writing PR descriptions, formatting PR titles, or when the user says "create PR", "make a PR", "open a pull request", or similar. Also activate when reviewing or improving existing PR descriptions.
license: MIT
metadata:
  author: 1natsu
  version: "1.0.0"
---

# Create Pull Request

Create high-quality GitHub pull requests with conventional commit format and structured descriptions.

## Workflow

### Step 1: Analyze Branch Changes

Gather all information needed to write a meaningful PR. Analyze ALL commits from the merge base, not just the latest.

```bash
# Get branch info
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
MERGE_BASE=$(git merge-base origin/$DEFAULT_BRANCH HEAD)

# Run in parallel
git status &
git diff --cached &
git log --oneline $MERGE_BASE..HEAD &
git diff --stat $MERGE_BASE..HEAD &
wait
```

### Step 2: Determine Language

Use the language specified by the user. Default to English if not specified.

- `en` — English (Summary, Test plan)
- `ja` — Japanese (概要, テスト計画)

Be consistent throughout — never mix languages within a single PR.

### Step 3: Write PR Title

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>
```

**Rules:**
- No emojis
- Imperative mood: "add" not "added"
- No capitalized first letter
- No period at the end
- Under 50 characters when possible

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Examples:**
```
feat(auth): add OAuth2 authentication
fix(api): resolve timeout on large requests
docs(readme): update installation instructions
refactor(db): extract query builder into module
```

### Step 4: Write PR Description

**Standard structure:**

```markdown
## Summary
- Brief description of changes (1-3 bullet points)
- Focus on what and why, not how

## Test plan
- [ ] Test case 1
- [ ] Test case 2
- [ ] Verify no regressions
```

**For complex PRs, add sections as needed:**

```markdown
## Summary
- Main changes

## Background
Context or motivation

## Implementation Details
High-level overview of approach

## Test plan
- [ ] Tests
```

**Key principles:**
- Summary: 1-3 bullet points, present tense, what changed and why
- Test plan: checkbox format, specific and actionable scenarios
- No implementation details in summary (those are in the code)

### Step 5: Check for Project Template

If `.github/pull_request_template.md` exists:
- Follow its structure exactly
- Don't modify section headers or add custom sections
- Fill in all sections (use "N/A" if not applicable)

### Step 6: Create the PR

```bash
gh pr create --draft --title "feat(scope): description" --body "$(cat <<'EOF'
## Summary
- Changes

## Test plan
- [ ] Tests
EOF
)"
```

**Important:**
- Use `--draft` flag by default
- Use HEREDOC (`cat <<'EOF'`) for multi-line body
- `gh pr create` pushes automatically — do NOT run `git push` first
- Return the PR URL when done

## Language Examples

### English

```markdown
## Summary
- Add user authentication with OAuth2
- Implement token refresh mechanism

## Test plan
- [ ] Test OAuth2 login flow
- [ ] Test token refresh
- [ ] Verify error handling
```

### Japanese

```markdown
## 概要
- OAuth2によるユーザー認証を追加
- トークンリフレッシュ機能を実装

## テスト計画
- [ ] OAuth2ログインフローのテスト
- [ ] トークンリフレッシュのテスト
- [ ] エラーハンドリングの確認
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `git push` before `gh pr create` | `gh pr create` handles push |
| Emojis in title | No emojis allowed |
| `Add new feature` (no type) | `feat: add new feature` |
| Only analyzing latest commit | Analyze ALL commits from merge base |
| Vague descriptions | Be specific about what and why |
| Mixing languages | Stay consistent within the PR |

## References

See [references/pr-templates.md](references/pr-templates.md) for detailed PR description templates for various scenarios (features, bug fixes, refactoring, security fixes, breaking changes) in both English and Japanese.

See [references/conventional-commits.md](references/conventional-commits.md) for the full conventional commits type reference with examples.
