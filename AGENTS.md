# Agent Skills Repository

## Structure

```
skills/
└── <skill-name>/
    └── SKILL.md       # YAML frontmatter (name, description) + markdown content
```

## Rules

- スキル名には必ず `1natsu-` プレフィックスをつける（名前衝突の回避）
- ディレクトリ名と SKILL.md の `name` フィールドは一致させる（例: `skills/1natsu-commit/SKILL.md` → `name: 1natsu-commit`）
- `description` はスキルの発動条件を具体的に書く（エージェントがいつ使うか判断する材料になる）
- 内容はエージェント非依存・汎用的に保つ（Claude Code, Cursor, Cline, Codex 等で横断的に使える）
- 1スキル = 1トピック、スコープを絞る
- frontmatter には `license: MIT` と `metadata`（`author`, `version`）を必ず含める。バージョンは更新時にインクリメントする

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
bunx skills add . --list    # スキルが認識されるか確認
bunx skills add . -g -y     # グローバルインストール
```

## Distribution

- Vercel `skills` 互換（`bunx skills` / `npx skills` / `apm install` でインストール）
- apm Primitive Form 対応（`apm install --skill` で個別スキルを取得、`apm.yml` 不要）
