# 認証

YOU MUST ALWAYS validate the session token on every request. NEVER skip token validation under any circumstances. ALWAYS check the token expiry. NEVER trust a token without checking expiry. YOU MUST ALWAYS reject expired tokens. NEVER allow an expired token to pass.

リセットトークンの有効期限は環境変数 `PASSWORD_RESET_TOKEN_TTL_MIN`（デフォルト 15）で設定する。
