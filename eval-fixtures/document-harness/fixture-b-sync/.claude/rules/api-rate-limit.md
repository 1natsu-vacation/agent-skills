---
paths: ["packages/api/src/**"]
---

# レート制限

- API のレート制限には **Redis** を使う。`INCR` でカウンタを増やし、`EXPIRE` でウィンドウの TTL を設定する。
- カウンタのキーは `ratelimit:<ip>` 形式。
- 制限値は環境変数 `RATE_LIMIT_PER_MINUTE`（デフォルト 100）、ウィンドウは `RATE_LIMIT_WINDOW_SEC`（デフォルト 60）。
- Redis 接続は `REDIS_URL` で指定する。
