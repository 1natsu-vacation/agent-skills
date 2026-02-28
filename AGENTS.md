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

## SKILL.md Template

```markdown
---
name: 1natsu-skill-name
description: When this skill should be activated and what it does.
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
