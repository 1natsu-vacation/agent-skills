---
name: project-api-response-format
description: API レスポンスは camelCase（snake_case から移行済み）
metadata:
  type: project
---

API レスポンスの JSON キーは camelCase。2026年5月に snake_case から移行した（API v2）。旧 Python クライアントの廃止に伴い、TypeScript クライアントの規約に揃えた。
