---
name: 1natsu-create-pr
description: GitHub PRの作成、PRタイトルやdescriptionの記述時に使用する。Conventional Commitsフォーマットのタイトル、構造化されたdescription、多言語対応（en/ja）を提供する。
license: MIT
metadata:
  author: 1natsu
  version: "1.2.0"
---

# Pull Requestの作成

Conventional Commitsフォーマットと構造化されたdescriptionで高品質なGitHub PRを作成する。

## ワークフロー

### ステップ1: ブランチの変更を分析

意味のあるPRを書くために必要な情報をすべて収集する。最新のコミットだけでなく、マージベースからの**すべてのコミット**を分析する。

```bash
# ブランチ情報の取得
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@')
MERGE_BASE=$(git merge-base origin/$DEFAULT_BRANCH HEAD)

# 並列実行
git status &
git diff --cached &
git log --oneline $MERGE_BASE..HEAD &
git diff --stat $MERGE_BASE..HEAD &
wait
```

### ステップ2: 言語の決定

ユーザーが指定した言語を使用する。指定がなければ英語をデフォルトとする。

- `en` — English（Summary, Test plan）
- `ja` — Japanese（概要, テスト計画）

一貫性を保つ — 1つのPR内で言語を混ぜない。

### ステップ3: PRタイトルの作成

[Conventional Commits](https://www.conventionalcommits.org/) フォーマットに従う（タイプやdescriptionの詳細ルールは `1natsu-conventional-commits` スキルを参照）：

```
<type>(<scope>): <description>
```

**例：**
```
feat(auth): add OAuth2 authentication
fix(api): resolve timeout on large requests
docs(readme): update installation instructions
refactor(db): extract query builder into module
```

### ステップ4: PR descriptionの作成

**基本構成：**

```markdown
## Summary
- 変更の簡潔な説明（1-3箇条書き）
- whatとwhyに焦点を当て、howには触れない

## Test plan
- [ ] テストケース1
- [ ] テストケース2
- [ ] リグレッションがないことを確認
```

**複雑なPRでは必要に応じてセクションを追加：**

```markdown
## Summary
- 主な変更点

## Background
コンテキストや動機

## Implementation Details
アプローチの概要

## Test plan
- [ ] テスト
```

**重要な原則：**
- Summary：1-3箇条書き、現在形、何をなぜ変更したか
- Test plan：チェックボックス形式、具体的で実行可能なシナリオ
- Summaryに実装の詳細を入れない（それはコードにある）

### ステップ5: プロジェクトテンプレートの確認

`.github/pull_request_template.md` が存在する場合：
- その構造に正確に従う
- セクションヘッダーを変更したり独自セクションを追加しない
- すべてのセクションを埋める（該当しない場合は "N/A"）

### ステップ6: PRの作成

```bash
gh pr create --draft --title "feat(scope): description" --body "$(cat <<'EOF'
## Summary
- Changes

## Test plan
- [ ] Tests
EOF
)"
```

**重要：**
- デフォルトで `--draft` フラグを使用する
- 複数行のbodyには HEREDOC（`cat <<'EOF'`）を使う
- `gh pr create` は自動的にpushする — 先に `git push` を実行しない
- 完了時にPR URLを返す

## 言語別の例

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

## よくある間違い

| 間違い | 修正 |
|--------|------|
| `gh pr create` の前に `git push` する | `gh pr create` がpushを処理する |
| タイトルに絵文字を使う | 絵文字は使わない |
| `Add new feature`（タイプなし） | `feat: add new feature` |
| 最新のコミットだけを分析 | マージベースからの**すべて**のコミットを分析 |
| 曖昧な説明 | whatとwhyを具体的に書く |
| 言語の混在 | PR内で一貫した言語を使う |

## リファレンス

各種シナリオ（機能追加、バグ修正、リファクタリング、セキュリティ修正、破壊的変更）のPR descriptionテンプレート（英語・日本語）は [references/pr-templates.md](references/pr-templates.md) を参照。