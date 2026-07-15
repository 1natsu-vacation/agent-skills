# アーキテクチャ

acme-platform は API（`packages/api`）と管理画面（`packages/web`）の2層構成。web は API を REST で叩く。

## 認証

API は社内 SSO（OIDC）で認証する。独自のセッション管理は持たない。理由: 全社のアカウント基盤に統一する方針のため。
