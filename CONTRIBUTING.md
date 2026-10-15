# Contributing

Thanks for your interest! Bug reports, skill suggestions and pull requests are welcome.

## Before you start

- **Suggest a skill:** open an [issue](https://github.com/AlexGalhardo/add-agent-skills/issues) with the repository URL. The catalog only lists established open source skills: an official vendor repository, or a widely used community one (roughly 500+ stars). Skills made for one specific project are out of scope.
- **Security problems:** do **not** open an issue. Follow [SECURITY.md](SECURITY.md).

## Development setup

Requirements: [Bun](https://bun.sh) 1.2+.

```bash
git clone https://github.com/AlexGalhardo/add-agent-skills.git
cd add-agent-skills
bun install
```

`bun install` also installs the git hooks (Husky):

| Hook         | Runs                                                       |
| ------------ | ---------------------------------------------------------- |
| `pre-commit` | `bun run lint` and `bun run typecheck`                     |
| `commit-msg` | commitlint (Conventional Commits)                          |
| `pre-push`   | `bun test`, `bun run build` and `bun run check:package`    |

Indentation is 4 spaces (2 for YAML), defined in `.editorconfig` and enforced by Biome.

| Command                   | What it does                                                    |
| ------------------------- | --------------------------------------------------------------- |
| `bun run src/bin.ts`      | Run the CLI from source                                         |
| `bun test`                | Unit tests (GitHub is always mocked)                            |
| `bun run lint` / `format` | Biome check / auto-fix                                          |
| `bun run typecheck`       | TypeScript type check                                           |
| `bun run build`           | Build `dist/` for npm                                           |
| `bun run check`           | All of the above, plus package validation (publint, attw)       |
| `bun run catalog:refresh` | Re-read every upstream SKILL.md into `src/catalog.json`         |

## Adding a skill to the catalog

1. Add an entry to `src/catalog.json` with `name` (folder it installs as), `category`, `repo` (`owner/name`), `path` (folder with `SKILL.md` inside the repo) and an empty `description`.
2. Run `GH_TOKEN=$(gh auth token) bun run catalog:refresh`. It fills the description and license, and fails if the path is wrong.
3. Try it: `bun run src/bin.ts --skills <name> --dir /tmp/x --yes`.

## Commit messages

This repo uses [Conventional Commits](https://www.conventionalcommits.org). Versions follow [Semantic Versioning](https://semver.org) and are calculated from them. The `commit-msg` hook rejects messages that don't follow the format:

```
fix: handle repositories with a non-main default branch   → patch release
feat: add --remove flag                                    → minor release
feat!: rename --agent ids                                  → breaking change
docs: / test: / chore: / refactor: / ci:                   → no release
```

`CHANGELOG.md` ([Keep a Changelog](https://keepachangelog.com)) is generated from these messages when a release is prepared, so write the subject as a user-facing sentence.

Releases are automated, so do not bump versions yourself. See [docs/en/how-to-deploy-and-update-this-package.md](docs/en/how-to-deploy-and-update-this-package.md).

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
