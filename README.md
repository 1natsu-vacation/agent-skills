# agent-skills

Personal collection of agent skills for coding agents.

Compatible with any agent that supports the [skills](https://github.com/vercel-labs/skills) ecosystem (Claude Code, Cursor, Cline, OpenAI Codex, etc.).

## Installation

Choose any installer you prefer. All three reference the same repository; the difference is the **default source** they fetch from.

### gh CLI (`gh skill install`)

Fetches from the latest GitHub Release tag published via `gh skill publish` (requires gh CLI v2.90.0+):

```bash
gh skill install 1natsu-vacation/agent-skills
```

### Vercel `skills`

Fetches from the default branch (`main`):

```bash
npx skills add 1natsu-vacation/agent-skills -g
# or
bunx skills add 1natsu-vacation/agent-skills -g
```

### apm

Fetches from the default branch (`main`) by default; tag pinning supported via `#vX.Y.Z`.

Install everything (mirrors `npx skills add`):

```bash
apm install 1natsu-vacation/agent-skills
```

Install a single skill:

```bash
apm install 1natsu-vacation/agent-skills --skill 1natsu-<skill-name>
```

Pin to a tag:

```bash
apm install 1natsu-vacation/agent-skills#v0.1.0 --skill 1natsu-<skill-name>
```

Add `-g` for global / user scope.

### Claude Code plugin

Fetches from the default branch (`main`). Skills are grouped into plugins, so you install only the groups you want:

```bash
/plugin marketplace add 1natsu-vacation/agent-skills
/plugin install 1natsu-commit@1natsu
```

Plugin skills are namespaced by the plugin, so `1natsu-commit` is invoked as `/1natsu-commit:1natsu-commit`. Installing through any other channel keeps the plain `/1natsu-commit` form.

| Plugin | Skills |
|--------|--------|
| `1natsu-commit` | 1natsu-commit, 1natsu-conventional-commits |
| `1natsu-pr` | 1natsu-create-pr, 1natsu-pr-review-handler |
| `1natsu-conflicts` | 1natsu-auto-resolve-conflicts, 1natsu-pair-resolve-conflicts |
| `1natsu-document-harness` | 1natsu-document-harness, 1natsu-document-harness-audit, 1natsu-document-harness-model |
| `1natsu-debug` | 1natsu-pair-debug, 1natsu-git-analysis |
| `1natsu-error-handling` | 1natsu-error-handling |
| `1natsu-hunk` | 1natsu-hunk (experimental) |

## Skills

| Skill | Description |
|-------|-------------|
| [1natsu-auto-resolve-conflicts](./skills/1natsu-auto-resolve-conflicts/SKILL.md) | Fully-autonomous git conflict resolution — resolves, validates, commits, with safe bail-out to pair mode |
| [1natsu-commit](./skills/1natsu-commit/SKILL.md) | Git commit best practices with conventional commits |
| [1natsu-document-harness](./skills/1natsu-document-harness/SKILL.md) | Harness documentation generation with consistent placement and granularity |
| [1natsu-document-harness-audit](./skills/1natsu-document-harness-audit/SKILL.md) | Harness documentation audit — detects duplicates, inconsistencies, and stale content |
| [1natsu-document-harness-model](./skills/1natsu-document-harness-model/SKILL.md) | Harness documentation model reference (internal, auto-loaded) |
| [1natsu-conventional-commits](./skills/1natsu-conventional-commits/SKILL.md) | Conventional Commits reference (internal, auto-loaded) |
| [1natsu-create-pr](./skills/1natsu-create-pr/SKILL.md) | GitHub PR creation with conventional commits and multi-language support |
| [1natsu-error-handling](./skills/1natsu-error-handling/SKILL.md) | Structured error handling guidelines |
| [1natsu-git-analysis](./skills/1natsu-git-analysis/SKILL.md) | Git repository analysis — branches, diffs, commit history |
| [1natsu-hunk](./skills/1natsu-hunk/SKILL.md) | Connects the agent to a live Hunk review session for human-in-the-loop local diff review |
| [1natsu-pair-debug](./skills/1natsu-pair-debug/SKILL.md) | Collaborative debugging with human-in-the-loop observation |
| [1natsu-pair-resolve-conflicts](./skills/1natsu-pair-resolve-conflicts/SKILL.md) | Collaborative git conflict resolution with commit history analysis |
| [1natsu-pr-review-handler](./skills/1natsu-pr-review-handler/SKILL.md) | Autonomous PR review comment handling and code fixes |

## Structure

```
skills/
└── 1natsu-<skill-name>/
    └── SKILL.md
```

All skill names are prefixed with `1natsu-` to avoid naming conflicts with other skill packages.

## License

[MIT](./LICENSE)
