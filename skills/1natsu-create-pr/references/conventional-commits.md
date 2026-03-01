# Conventional Commits Reference

## Full Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Type Reference

| Type | Purpose | Example |
|------|---------|---------|
| `feat` | New feature | `feat(auth): add OAuth2 login` |
| `fix` | Bug fix | `fix(api): resolve timeout error` |
| `docs` | Documentation | `docs(api): add endpoint examples` |
| `style` | Formatting | `style(components): fix indentation` |
| `refactor` | Code restructuring | `refactor(utils): simplify validation` |
| `perf` | Performance | `perf(queries): optimize database calls` |
| `test` | Testing | `test(auth): add login flow tests` |
| `build` | Build system | `build(webpack): update config` |
| `ci` | CI/CD | `ci(actions): add test workflow` |
| `chore` | Maintenance | `chore(deps): update dependencies` |
| `revert` | Reverting | `revert: feat(auth): add OAuth2` |

## Scope Guidelines

**By module:** `feat(auth):`, `fix(payment):`, `docs(api):`

**By component:** `feat(button):`, `fix(modal):`, `style(navbar):`

**By layer:** `feat(frontend):`, `fix(backend):`, `refactor(database):`

**No scope** (global changes): `chore: update all dependencies`

## Breaking Changes

Indicate with `!` after type/scope:

```
feat(api)!: change endpoint response format

BREAKING CHANGE: API responses now use camelCase instead of snake_case
```

## Examples by Category

### Features
```
feat(search): add fuzzy search capability
feat(export): support CSV export
feat(i18n): add Japanese localization
```

### Bug Fixes
```
fix(validation): prevent empty email submission
fix(cache): resolve race condition in cache updates
fix(auth): handle expired token gracefully
```

### Performance
```
perf(images): implement lazy loading
perf(queries): add database indexes
perf(bundle): reduce JavaScript bundle size
```

### Refactoring
```
refactor(auth): extract validation logic
refactor(components): convert to TypeScript
refactor(api): consolidate duplicate code
```
