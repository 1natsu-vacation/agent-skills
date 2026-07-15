# notify-hub

社内向け通知配信サービス。API 経由で各チャネル（メール / チャット）へ通知を送る。

## 重要な前提

- API 設計の詳細は `docs/api-design.md` を参照

## 構成

- `src/api/` — HTTP ハンドラ
