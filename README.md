<div align="center">

<h1>add-agent-skills</h1>

[![npm](https://img.shields.io/npm/v/@galhardoalex/add-agent-skills)](https://www.npmjs.com/package/@galhardoalex/add-agent-skills)
[![JSR](https://jsr.io/badges/@galhardoalex/add-agent-skills)](https://jsr.io/@galhardoalex/add-agent-skills)
[![CI](https://github.com/AlexGalhardo/add-agent-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/AlexGalhardo/add-agent-skills/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

<h3>Stop copying or manually adding one <code>agent skills</code> at time between projects. Run one command, tick the skills you want in a checklist, and they are downloaded <b>straight from their official GitHub repositories, always at the latest version</b>.</h3>

</div>

![add-agent-skills demo](docs/demo.gif)


## Usage

Run it at the root of your project:

```bash
bunx @galhardoalex/add-agent-skills
```

```bash
npx @galhardoalex/add-agent-skills
```

```bash
deno run -A jsr:@galhardoalex/add-agent-skills/cli
```

The header shows your version against the latest release and when the skills catalog was last updated.

1. Pick the agents. Agents whose folders already exist in the project are pre-selected.
2. Tick the skills, grouped by category, each with its repository and description.
3. If a skill is already installed, choose to overwrite it with the latest version or skip it.

Requires Node.js 20.12+ (or Bun / Deno). Restart your agent afterwards so it loads the new skills.

## Agents

| Id        | Folder           | Read by                                                                        |
| --------- | ---------------- | ------------------------------------------------------------------------------ |
| `claude`  | `.claude/skills` | Claude Code (also Copilot, OpenCode, Amp, Cline)                               |
| `agents`  | `.agents/skills` | The open [Agent Skills](https://agentskills.io) standard: Codex, Cursor, GitHub Copilot, Gemini CLI, OpenCode, Amp, Goose, Roo Code |
| `cursor`  | `.cursor/skills` | Cursor                                                                         |
| `copilot` | `.github/skills` | GitHub Copilot                                                                 |

Tip: some agents read more than one of these folders (Cursor reads `.cursor/skills` and `.agents/skills`), so installing the same skill in both shows it twice.

## Categories

| Category                      | Skills from                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Most Used                     | karpathy-guidelines, Matt Pocock's grilling, Vercel agent-browser and find-skills, ponytail, graphify        |
| Software Development          | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills), [obra/superpowers](https://github.com/obra/superpowers), [mattpocock/skills](https://github.com/mattpocock/skills), book-to-skill |
| WebDesign / UI / UX           | Anthropic frontend-design, impeccable, ui-ux-pro-max, interface-design, taste-skill, Vercel guidelines         |
| Game Development              | Official Phaser 4 skills, Claude Code Game Studios, awesome-gamedev-agent-skills, two book-summary skills      |
| Mobile (Expo / React Native)  | [expo/skills](https://github.com/expo/skills), Vercel React Native                                            |
| Go                            | [samber/cc-skills-golang](https://github.com/samber/cc-skills-golang)                                         |
| Integrations                  | Neon, Stripe, Upstash, Nuxt UI, Loco                                                                          |

See them all with `bunx @galhardoalex/add-agent-skills --list`. 

Only well-known open source skills are included. Each one keeps its upstream license.
    - `art-of-game-design` and `pixel-logic` are original summaries of books, hosted in this repository under [`skills/`](skills).

## Non-interactive mode

```bash
bunx @galhardoalex/add-agent-skills --skills karpathy-guidelines,grilling --agent claude,agents --yes
```

| Option                 | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `-s, --skills <names>` | Comma-separated skill names (see `--list`)                     |
| `-a, --agent <ids>`    | Comma-separated agents: `claude`, `agents`, `cursor`, `copilot` |
| `-g, --global`         | Install into your home directory (`~/.claude/skills`...)       |
| `-d, --dir <path>`     | Project directory (default: current directory)                 |
| `-y, --yes`            | Don't ask; existing skills are skipped unless `--force`        |
| `-f, --force`          | Overwrite skills that already exist                            |
| `-l, --list`           | List available skills                                          |

Downloads use the GitHub API (one request per repository). Without a token GitHub allows 60 requests per hour; set
`GITHUB_TOKEN` or `GH_TOKEN` to raise it.

## How it works

1. `src/catalog.json` stores, for each skill, its official repository and the path of the skill inside it. 
2. At install time the CLI lists the repository tree at `HEAD` (the default branch) and downloads the skill's files from
`raw.githubusercontent.com`, so you always get the latest version without waiting for a new release of this package.
3. A weekly workflow refreshes the descriptions and flags skills that moved upstream.

## Contributing

Want a skill added? Open an issue with its repository. It needs to be an established open source skill (official vendor
repository or a widely used community one). See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE). Installed skills are distributed under their own licenses.
