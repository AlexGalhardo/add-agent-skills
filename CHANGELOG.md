# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-10-25

### Added

- Add 262 skills from the skills.sh top 500 plus caveman and clean architecture ([3929252](https://github.com/AlexGalhardo/add-agent-skills/commit/392925256b7d2ce2eef17cb51f2672f113474590))

## [1.0.0] - 2026-10-15

### Added

- Interactive CLI (`add-agent-skills`) with a checklist grouped by category, showing each skill's repository and description.
- Catalog of 201 established open source skills in 7 categories: Most Used, Software Development, WebDesign / UI / UX, Game Development, Mobile, Go and Integrations.
- Skills are downloaded from the default branch of their official GitHub repository at install time, so they are always up to date.
- Install targets for Claude Code (`.claude/skills`), the open Agent Skills standard (`.agents/skills`), Cursor (`.cursor/skills`) and GitHub Copilot (`.github/skills`), with detection of the agents already used in the project.
- `--global` to install into the home directory, and per-skill overwrite/skip when a skill already exists.
- CLI header with the running version compared to the latest GitHub Release, and the number of skills and date the catalog was last updated (`updatedAt` in `catalog.json`, also shown by `--list`).
- Non-interactive mode: `--skills`, `--agent`, `--yes`, `--force`, `--list`, `--dir`.
- `art-of-game-design` and `pixel-logic` skills, based on summaries of the books *The Art of Game Design* (Jesse Schell) and *Pixel Logic* (Michael Azzi).
- `catalog:refresh` script and weekly workflow that keep descriptions and licenses in sync with upstream.
- Library API (`SkillDownloader`, `planInstall`, `writeSkill`, `CATALOG`, `AGENTS`) for scripts.

[Unreleased]: https://github.com/AlexGalhardo/add-agent-skills/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/AlexGalhardo/add-agent-skills/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/AlexGalhardo/add-agent-skills/releases/tag/v1.0.0
