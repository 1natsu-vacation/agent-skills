---
name: project-error-response-format
description: エラーレスポンスは code と message の2フィールドで返す
metadata:
  type: project
---

エラーレスポンスは `code`（機械可読）と `message`（人間可読）の2フィールドで返す。HTTP ステータスだけでは区別できない業務エラー（送信先チャネル凍結など）があるため、ステータスと `code` を二重に持つ設計。
