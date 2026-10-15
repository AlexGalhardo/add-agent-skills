# AGENTS.md

Context for AI coding agents working on this repository. Human contributors: see [CONTRIBUTING.md](CONTRIBUTING.md).

## What this is

`@galhardoalex/add-agent-skills`: an interactive CLI (built with `@clack/prompts`) that installs curated open source agent
skills (folders with a `SKILL.md`) into `.claude/skills`, `.agents/skills`, `.cursor/skills` or `.github/skills`.
Skills are **never vendored**: the catalog stores each skill's official repo and path, and the CLI downloads it from the
repo's default branch (`HEAD`) at install time. Published to **npm** (`dist/`, ESM, bin `add-agent-skills`) and **JSR**
(raw TypeScript; `jsr:@galhardoalex/add-agent-skills/cli` runs the CLI).

## Layout

```
src/catalog.json   the catalog: categories + skills (name, category, repo, path, include?, description, license?, note?)
src/catalog.ts     types and helpers (groupByCategory, findSkills, skillUrl)
src/agents.ts      supported agents, their skills folders and detection markers
src/github.ts      SkillDownloader: one tree API call per repo, files from raw.githubusercontent.com
src/install.ts     planInstall / findExisting / writeSkill (replaces the folder, blocks path traversal)
src/cli.ts         argument parsing, interactive flow, non-interactive flags
src/bin.ts         CLI entry (npm bin and JSR ./cli export)
src/mod.ts         library entry; every public export goes through here
scripts/catalog-refresh.ts   refreshes descriptions/licenses from upstream; exits 1 if a skill path is gone
scripts/changelog.ts         Keep a Changelog generation (release PR) and release notes
skills/            skills hosted here (book summaries: art-of-game-design, pixel-logic)
tests/             bun:test; GitHub is always mocked (tests/helpers.ts fakeGitHub)
docs/en, docs/pt-br   guides; keep both languages in sync
```

## Commands (Bun only; do not use npm/yarn/pnpm)

| Command                           | Purpose                                              |
| --------------------------------- | ---------------------------------------------------- |
| `bun install`                     | Install deps and git hooks (Husky, via `prepare`)    |
| `bun run src/bin.ts [flags]`      | Run the CLI from source                              |
| `bun test` / `bun test <file>`    | Unit tests                                           |
| `bun run lint` / `bun run format` | Biome check / auto-fix                               |
| `bun run typecheck`               | `tsc` (strict, `noUncheckedIndexedAccess`)           |
| `bun run build`                   | Build `dist/` (mod.js, cli.js, .d.ts)                |
| `bun run check`                   | lint + typecheck + test + build + publint/attw       |
| `bun run check:jsr`               | JSR publish dry-run                                  |
| `bun run catalog:refresh`         | Refresh `src/catalog.json` from upstream (set `GH_TOKEN=$(gh auth token)`) |

## Hard rules

- **Catalog = established open source skills only** (official vendor repo, or community repo with roughly 500+ stars).
  No project-specific skills. Never copy third-party skill files into this repo.
- **Always latest:** never pin a commit or tag for a skill; the CLI uses `HEAD`. Fix moved skills by editing `path`.
- `name` is the installed folder name and must be unique. Local prefixes (`ccgs-`, `gd-`, `superpowers-test-driven-development`) avoid collisions between packs.
- `src/catalog.json` is generated in part (`description`, `license`) and is excluded from Biome. Edit by hand only `name`, `category`, `repo`, `path`, `include`, `note`; then run `catalog:refresh`.
- Book-summary skills must say so in `note` and must not reproduce the book's text verbatim.
- Only `api.github.com` and `raw.githubusercontent.com` may be contacted. Never log tokens.
- One runtime dependency (`@clack/prompts`, exact version). Ask before adding another.
- Node 20.12+ (`util.styleText`), Bun and Deno must keep working: use `node:` built-ins and `fetch` only.
- JSDoc on every export and explicit return types on exported functions (JSR "slow types").
- Formatting: 4 spaces (2 for YAML), LF, double quotes, line width 120 (`.editorconfig`, `biome.json`).

## Git and commits

- Conventional Commits are enforced by commitlint (`commit-msg` hook). Hooks: `pre-commit` = lint + typecheck;
  `pre-push` = test + build + `check:package`. Don't bypass them with `--no-verify`.
- The commit subject becomes a changelog line, so write it as a user-facing sentence for `feat`/`fix`.

## Releases (automated; don't do these by hand)

- Semantic Versioning. Never bump versions manually; force one with a `Release-As: x.y.z` commit footer.
- push to `main` → release-please opens a release PR (bumps `package.json`, `jsr.json`, `src/version.ts`) →
  `scripts/changelog.ts` writes the `CHANGELOG.md` section into it → merge → tag + GitHub Release (notes = that
  section) → `publish-npm` and `publish-jsr` (OIDC; no tokens).
- `.github/workflows/catalog.yml` runs weekly: refreshes the catalog and opens a `fix(catalog)` PR when upstream
  descriptions change (merging it ships a patch release); fails if a skill disappeared upstream.

## Validation before finishing a task

`bun run lint`, `bun run typecheck`, `bun test <affected file>`. For catalog changes also `bun run catalog:refresh`
and a real install into a temp dir (`bun run src/bin.ts -s <name> -d <tmp> -y`). For packaging changes
`bun run build && bun run check:package` and `bun run check:jsr`.
