---
name: publish-this-repo
description: agent-skills リポジトリの公開・デプロイ・リリース時に自動発動。`gh skill publish` を用いた GitHub Release 作成手順をエージェントが対話的にガイドする。「公開して」「デプロイして」「リリースして」「publish」「release」等の発話で起動する。git push はリポジトリ更新であって公開ではないため、本 skill 経由でのみ Release を作成する。
license: MIT
metadata:
  author: 1natsu
  version: "1.0.0"
  internal: true
---

# Publish this repo via `gh skill publish`

## When to Use

- ユーザーが「公開して」「デプロイして」「リリースして」「publish」「release」等を発話したとき
- リポジトリ `1natsu-vacation/agent-skills` を Consumer に届ける Release を新規作成するとき
- `git push` だけでは公開にならないことを思い出す必要があるとき

## Why this skill exists

このリポジトリは過去 `npx skills add 1natsu-vacation/agent-skills -g` が main ブランチを直接取得する仕組みだったため、main への push が事実上の公開になっていた。版管理ができず、意図しないコミットが即座に Consumer に届くリスクがあった。

`gh skill publish` (gh CLI v2.90.0+) によって GitHub Release＋semver タグが正式な公開ゲートとなったため、本 skill は **Release 作成プロセス全体をガイド**する。

## Runbook

### Step 1. 前提条件チェック

以下を順に実行し、不備があれば中断してユーザーに修正を促す。

```bash
gh --version       # 2.90.0 以上であること
gh auth status     # 認証済みであること
git status         # working tree がクリーンであること
git rev-parse --abbrev-ref HEAD   # 現在ブランチが main であること
git fetch origin && git status -uno   # origin/main と同期していること
```

### Step 2. dry-run 検証

リポジトリルートで以下を実行し、配布対象の全スキル（`skills/1natsu-*/SKILL.md`）が Agent Skills 仕様に合格することを確認する。

```bash
gh skill publish --dry-run .
```

検証項目:
- スキル名が agentskills.io の命名規則に準拠（小文字英数字+ハイフン、3文字以上）
- スキル名がディレクトリ名と一致
- 必須 frontmatter フィールド（`name`, `description`）が存在
- `allowed-tools` が文字列（配列ではない）

失敗があれば本フローを中断し、該当スキルの修正をユーザーに依頼する。`gh skill publish --fix .` で自動修正可能なケースもある。

注意: `.claude/skills/publish-this-repo/SKILL.md` は `metadata.internal: true` かつ `gh skill publish` のスキャン対象外（`.claude/` 配下）なので検証対象に含まれない（含まれるべきでもない）。

### Step 3. semver 決定

直近のリリースタグを確認し、main までの差分から semver を決定する。

```bash
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
  git log --oneline   # 初回リリース
else
  git log "$LAST_TAG"..HEAD --oneline   # 前回タグ以降
fi
```

分類基準:
- **major** (`vX.0.0`): 既存スキルの破壊的変更（削除、name 変更、互換性のない description 変更）
- **minor** (`vX.Y.0`): 新規スキル追加、既存スキルの後方互換な機能追加
- **patch** (`vX.Y.Z`): バグ修正、ドキュメント・タイポ修正、内部リファクタ

候補バージョンをユーザーに提示して確認を取る。

### Step 4. 本番公開

`gh skill publish .` を**対話モード**で実行し、プロンプトに以下のように応答する。

```bash
gh skill publish .
```

| プロンプト | 推奨応答 |
|------------|----------|
| Add `agent-skills` topic to the repository? | Yes |
| Tag strategy | Semver |
| Version tag | Step 3 で決めた値（例: `v0.2.0`） |
| Enable Immutable Release? | Yes（改ざん防止） |
| Generate release notes automatically? | Yes |

非対話で済ませたい場合は `gh skill publish --tag vX.Y.Z .` も可。

### Step 5. 公開後確認

```bash
gh release view vX.Y.Z                                    # Release が作成されたか
gh skill install 1natsu-vacation/agent-skills --dry-run   # Consumer 視点で install できるか
```

### Step 6. 緊急ロールバック

公開後に不具合が判明した場合:

```bash
gh release delete vX.Y.Z --cleanup-tag --yes
```

タグも一緒に削除されるため、修正後に同バージョンで再公開できる（ただし Immutable Release が既に effective な場合は別バージョンを切ること）。

### Step 7. トラブルシュート

| エラー | 対処 |
|--------|------|
| `skill name does not match directory name` | `skills/<dir>/SKILL.md` の `name:` フィールドと `<dir>` を一致させる |
| `description is required` | frontmatter に `description:` を追加（発動条件を具体的に書く） |
| `allowed-tools must be a string` | 配列で書いていたら `"Read, Write, Bash"` 等の文字列に変換 |
| `gh: command not found` または old version | `brew upgrade gh` で 2.90.0 以上に更新 |
| `not authenticated` | `gh auth login` を実行 |

## References

- `gh skill publish` reference: https://cli.github.com/manual/gh_skill_publish
- Vercel skills README (Internal flag spec): https://github.com/vercel-labs/skills/blob/main/README.md
