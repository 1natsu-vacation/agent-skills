---
name: feedback-commit-convention
description: コミットメッセージはConventional Commits＋パッケージ名スコープがチーム規約
metadata:
  type: feedback
---

コミットメッセージは Conventional Commits 形式で書き、スコープには対象パッケージ名を入れる（例: `feat(api): ...`）。

**Why:** チームの規約。changelog を自動生成しており、形式が崩れるとリリースノートから漏れるため。

**How to apply:** コミット作成時は必ず `type(scope): summary` 形式にする。
