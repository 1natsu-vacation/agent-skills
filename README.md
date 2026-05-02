# agent-skills

Personal collection of agent skills for coding agents.

Compatible with any agent that supports the [skills](https://github.com/vercel-labs/skills) ecosystem (Claude Code, Cursor, Cline, OpenAI Codex, etc.).

## Installation

```bash
# Install all skills globally
npx skills add 1natsu-vacation/agent-skills -g

# Or with bun
bunx skills add 1natsu-vacation/agent-skills -g

# Install from local directory
npx skills add ./agent-skills -g
```

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
| [1natsu-entire-context](./skills/1natsu-entire-context/SKILL.md) | entire CLI reference for accessing session history and checkpoints |
| [1natsu-error-handling](./skills/1natsu-error-handling/SKILL.md) | Structured error handling guidelines |
| [1natsu-git-analysis](./skills/1natsu-git-analysis/SKILL.md) | Git repository analysis — branches, diffs, commit history |
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
