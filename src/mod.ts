/**
 * Install curated, open source agent skills (folders with a `SKILL.md`) into the skills folder of
 * Claude Code, the open `.agents` standard, Cursor or GitHub Copilot. Skills are always downloaded
 * from the default branch of their official GitHub repository.
 *
 * Most people use the CLI: `bunx @galhardoalex/add-agent-skills`. This module exposes the same
 * building blocks for scripts.
 *
 * @example
 * ```ts
 * import { AGENTS, CATALOG, SkillDownloader, findSkills, planInstall, writeSkill } from "@galhardoalex/add-agent-skills";
 *
 * const { found } = findSkills(CATALOG, ["karpathy-guidelines"]);
 * const downloader = new SkillDownloader();
 * for (const target of planInstall(process.cwd(), found, AGENTS.slice(0, 1))) {
 *     await writeSkill(target.dir, await downloader.download(target.skill));
 * }
 * ```
 *
 * @module
 */

export { AGENTS, type Agent, detectAgents, findAgents } from "./agents.ts";
export { CATALOG, type Catalog, type Category, findSkills, groupByCategory, type Skill, skillUrl } from "./catalog.ts";
export { catalogSummary, formatSkillLabel, releaseSummary, run } from "./cli.ts";
export {
    GitHubError,
    type GitHubOptions,
    latestRelease,
    PACKAGE_REPO,
    SkillDownloader,
    type SkillFile,
} from "./github.ts";
export { findExisting, type InstallTarget, planInstall, writeSkill } from "./install.ts";
export { VERSION } from "./version.ts";
