# API 契約

## エンドポイント

| パス | メソッド | 認証 | 備考 |
|---|---|---|---|
| `/v1/jobs` | POST | 必須 | 投入。ペイロードは 64KB まで |
| `/v1/jobs/{id}` | GET | 必須 | — |
| `/v1/health` | GET | 不要 | — |

## 制約

- 一覧のページサイズは 18–21 件の範囲で調整できる
- レスポンスのフィールドは snake_case
- 破壊的変更は feature flag の後ろに置き、pull request に dry run の結果を添える
- リトライ回数はヘッダ `x-retry-count` で返す
