# Agent Skills Repository

## Structure

```
skills/
└── <skill-name>/
    └── SKILL.md       # YAML frontmatter (name, description) + markdown content
```

## Rules

- `skills/` 配下の**配布対象**スキル名には必ず `1natsu-` プレフィックスをつける（名前衝突の回避）。`.claude/skills/` 配下の Internal skill は対象外（配布されないため衝突回避不要）
- ディレクトリ名と SKILL.md の `name` フィールドは一致させる（例: `skills/1natsu-commit/SKILL.md` → `name: 1natsu-commit`）
- `description` はスキルの発動条件を具体的に書く（エージェントがいつ使うか判断する材料になる）
- 内容はエージェント非依存・汎用的に保つ（Claude Code, Cursor, Cline, Codex 等で横断的に使える）
- 1スキル = 1トピック、スコープを絞る
- frontmatter には `license: MIT` と `metadata`（`author`, `version`）を必ず含める。バージョンは更新時にインクリメントする
- Internal skill（`.claude/skills/` 配下）は `metadata.internal: true` を付け、配布チャネルから自動的に隠す

## SKILL.md Template

```markdown
---
name: 1natsu-skill-name
description: When this skill should be activated and what it does.
license: MIT
metadata:
  author: 1natsu
  version: "1.0.0"
---

# Skill Title

## When to Use
- Activation criteria

## Content
- Guidelines, rules, examples
```

## Validation

```bash
bunx skills add . --list      # スキルが認識されるか確認（Internal skill は隠れる）
bunx skills add . -g -y       # グローバルインストール
gh skill publish --dry-run .  # Agent Skills 仕様に沿っているかリポジトリ全体で検証（gh CLI v2.90.0+）
```

## Distribution

**git push はリポジトリ更新であって公開ではない。** 公開は `gh skill publish` が唯一の正規チャネル。

- 公式公開チャネル: `gh skill publish`（手動・対話モード、要 gh CLI v2.90.0+）— GitHub Release＋semver タグを作成
- 互換チャネル（main 追従、リリースタグではない）:
  - Vercel `skills` 互換（`bunx skills` / `npx skills add`）
  - apm Primitive Form（`apm install --skill` で個別スキル取得、`apm.yml` 不要）

公開手順は `.claude/skills/publish-this-repo` (Internal skill) に集約。エージェントに「公開して」と伝えれば自動でガイドする。
