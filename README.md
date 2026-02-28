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
| [commit](./skills/commit/SKILL.md) | Git commit best practices with conventional commits |

## Structure

```
skills/
└── <skill-name>/
    └── SKILL.md
```

Each skill is a standalone `SKILL.md` with YAML frontmatter (`name`, `description`) and markdown content.

## License

[MIT](./LICENSE)
