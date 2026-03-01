# Conventional Commits リファレンス

## 完全なフォーマット

```
<type>(<scope>): <description>

[任意の本文]

[任意のフッター]
```

## タイプリファレンス

| タイプ | 用途 | 例 |
|--------|------|-----|
| `feat` | 新機能 | `feat(auth): add OAuth2 login` |
| `fix` | バグ修正 | `fix(api): resolve timeout error` |
| `docs` | ドキュメント | `docs(api): add endpoint examples` |
| `style` | フォーマット | `style(components): fix indentation` |
| `refactor` | コード再構成 | `refactor(utils): simplify validation` |
| `perf` | パフォーマンス | `perf(queries): optimize database calls` |
| `test` | テスト | `test(auth): add login flow tests` |
| `build` | ビルドシステム | `build(webpack): update config` |
| `ci` | CI/CD | `ci(actions): add test workflow` |
| `chore` | メンテナンス | `chore(deps): update dependencies` |
| `revert` | 取り消し | `revert: feat(auth): add OAuth2` |

## スコープのガイドライン

**モジュール別：** `feat(auth):`, `fix(payment):`, `docs(api):`

**コンポーネント別：** `feat(button):`, `fix(modal):`, `style(navbar):`

**レイヤー別：** `feat(frontend):`, `fix(backend):`, `refactor(database):`

**スコープなし**（グローバルな変更）：`chore: update all dependencies`

## 破壊的変更

タイプ/スコープの後に `!` を付けて示す：

```
feat(api)!: change endpoint response format

BREAKING CHANGE: API responses now use camelCase instead of snake_case
```

## カテゴリ別の例

### 機能追加
```
feat(search): add fuzzy search capability
feat(export): support CSV export
feat(i18n): add Japanese localization
```

### バグ修正
```
fix(validation): prevent empty email submission
fix(cache): resolve race condition in cache updates
fix(auth): handle expired token gracefully
```

### パフォーマンス
```
perf(images): implement lazy loading
perf(queries): add database indexes
perf(bundle): reduce JavaScript bundle size
```

### リファクタリング
```
refactor(auth): extract validation logic
refactor(components): convert to TypeScript
refactor(api): consolidate duplicate code
```