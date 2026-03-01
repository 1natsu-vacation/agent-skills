---
name: 1natsu-commit
description: gitコミットの作成、コミットメッセージの記述、変更のステージング時に使用する。Conventional Commitsやアトミックコミット、明確なコミットメッセージのベストプラクティスを提供する。
license: MIT
metadata:
  author: 1natsu
  version: "1.1.0"
---

# Git コミット ベストプラクティス

クリーンで意味のあるgitコミットを作成するためのガイドライン。

## いつ使うか

- gitコミットを作成するとき
- コミットメッセージを書く・レビューするとき
- 変更のステージングやグルーピングを決めるとき

## コミットメッセージのフォーマット

[Conventional Commits](https://www.conventionalcommits.org/) に従う：

```
<type>(<scope>): <description>

[任意の本文]

[任意のフッター]
```

### タイプ

| タイプ | 用途 |
|--------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみ |
| `style` | フォーマット変更、ロジック変更なし |
| `refactor` | コード再構成、動作変更なし |
| `perf` | パフォーマンス改善 |
| `test` | テストの追加・更新 |
| `build` | ビルドシステムや依存関係 |
| `ci` | CI/CD設定 |
| `chore` | メンテナンスタスク |
| `revert` | 以前のコミットの取り消し |

### スコープ（任意）

影響範囲を示す：

```
feat(auth): add OAuth2 login
fix(api): handle timeout on large payloads
docs(readme): update installation steps
```

### description のルール

- 命令形を使う："add"（"added" や "adds" ではなく）
- 先頭を大文字にしない
- 末尾にピリオドをつけない
- 可能なら50文字以内に収める

## アトミックコミット

各コミットは**1つの論理的な変更**を表すべき：

- リファクタリングと機能追加を分離する
- フォーマット変更とロジック変更を分離する
- 依存関係の更新とコード変更を分離する
- 各コミットはコードベースを動作する状態に保つ

### ステージング戦略

- `git add .` や `git add -A` ではなく `git add <具体的なファイル>` を使う
- コミット前に `git diff --staged` でステージ済みの変更を確認する
- 生成ファイル、シークレット、環境ファイルのコミットを避ける

## コミット本文

descriptionだけでは不十分な場合、本文でコンテキストを補足する：

```
fix(parser): handle nested quotes in CSV fields

パーサーがクォート文字列内のカンマを含むすべてのカンマで分割していた。
クォートの深さを追跡するステートを追加し、フィールド境界を
正しく識別できるようにした。
```

**本文のガイドライン：**
- descriptionとは空行で区切る
- **何を** **なぜ** 変更したかを説明する（**どうやって**は不要）
- 1行72文字で折り返す

## フッター

破壊的変更やissue参照に使う：

```
feat(api): change authentication endpoint

BREAKING CHANGE: /auth/login now requires email instead of username

Refs: #123
```

## よくある間違い

1. **曖昧なメッセージ**: "fix bug", "update code", "WIP"
2. **変更が多すぎる**: 無関係な変更を1コミットにまとめる
3. **シークレットのコミット**: `.env`、APIキー、認証情報
4. **巨大なコミット**: 多数のファイルにまたがる数百行の変更
5. **時制の誤り**: "fix" ではなく "fixed"、"add" ではなく "added"

## 例

**良いコミット：**

```
feat(auth): add two-factor authentication support
fix(cart): prevent duplicate items on rapid click
refactor(db): extract query builder into separate module
test(auth): add integration tests for password reset
docs(api): document rate limiting headers
chore(deps): update typescript to 5.4
```

**悪いコミット：**

```
update stuff
fix
WIP
asdf
Merge branch 'main' into feature（不必要なマージコミット）
```