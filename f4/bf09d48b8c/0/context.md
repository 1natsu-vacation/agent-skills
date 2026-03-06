# Session Context

## User Prompts

### Prompt 1

Base directory for this skill: /Users/1natsu/.claude/plugins/cache/claude-plugins-official/skill-creator/205b6e0b3036/skills/skill-creator

# Skill Creator

A skill for creating new skills and iteratively improving them.

At a high level, the process of creating a skill goes like this:

- Decide what you want the skill to do and roughly how it should do it
- Write a draft of the skill
- Create a few test prompts and run claude-with-access-to-the-skill on them
- Help the user evaluate the resu...

### Prompt 2

Tool loaded.

### Prompt 3

Tool loaded.

### Prompt 4

Base directory for this skill: /Users/1natsu/.claude/skills/1natsu-commit

# Git コミット ベストプラクティス

クリーンで意味のあるgitコミットを作成するためのガイドライン。

## いつ使うか

- gitコミットを作成するとき
- コミットメッセージを書く・レビューするとき
- 変更のステージングやグルーピングを決めるとき

## コミットメッセージのフォーマット

[Conventional Commits](https://www.conventionalcommits.org/) に従う。タイプ、description、スコープ、本文、フッターの詳細ルールは `1natsu-conventional-commits` スキルを参照。

```
<type>(<scope>): <description>

[任意の本文]

[任意のフッター]
```

## アトミックコミット

各コミットは**1つの論理的な変更**を表すべき：

- リファクタリングと機能追加を分離する
- フォーマ...

### Prompt 5

Tool loaded.

### Prompt 6

サンドボックス解除したらどう？

