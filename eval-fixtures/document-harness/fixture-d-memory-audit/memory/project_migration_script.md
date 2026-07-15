---
name: project-migration-script
description: scripts/migrate.sh でDBスキーマ移行を実行する手順
metadata:
  type: project
---

DB スキーマの移行は `scripts/migrate.sh` を実行する。引数に環境名（staging / production）を渡す。実行前に必ず `scripts/backup.sh` でバックアップを取ること。
