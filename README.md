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
| [1natsu-commit](./skills/1natsu-commit/SKILL.md) | Git commit best practices with conventional commits |
| [1natsu-git-analysis](./skills/1natsu-git-analysis/SKILL.md) | Git repository analysis — branches, diffs, commit history |
| [1natsu-create-pr](./skills/1natsu-create-pr/SKILL.md) | GitHub PR creation with conventional commits and multi-language support |

## Structure

```
skills/
└── 1natsu-<skill-name>/
    └── SKILL.md
```

All skill names are prefixed with `1natsu-` to avoid naming conflicts with other skill packages.

## License

[MIT](./LICENSE)
