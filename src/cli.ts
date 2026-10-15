import { homedir } from "node:os";
import { resolve } from "node:path";
import { parseArgs, styleText } from "node:util";
import * as p from "@clack/prompts";
import { AGENTS, type Agent, detectAgents, findAgents } from "./agents.ts";
import { CATALOG, type Catalog, findSkills, groupByCategory, type Skill } from "./catalog.ts";
import { latestRelease, SkillDownloader } from "./github.ts";
import { findExisting, type InstallTarget, planInstall, writeSkill } from "./install.ts";
import { VERSION } from "./version.ts";

const HELP = `add-agent-skills ${VERSION}

Install curated open source agent skills into your project, fetched from each skill's official GitHub repository.

Usage:
  add-agent-skills                     interactive checklist
  add-agent-skills --skills a,b --yes  non-interactive install

Options:
  -s, --skills <names>   comma-separated skill names (see --list)
  -a, --agent <ids>      comma-separated agents: ${AGENTS.map((a) => a.id).join(", ")}
  -g, --global           install into your home directory instead of the project
  -d, --dir <path>       project directory (default: current directory)
  -y, --yes              don't ask; skip existing skills unless --force
  -f, --force            overwrite skills that already exist
  -l, --list             list available skills and exit
  -h, --help             show this help
  -v, --version          show the version

Set GITHUB_TOKEN or GH_TOKEN to raise the GitHub API rate limit.`;

/** Builds the one-line checklist label: name, repository URL and description, cut to `width`. */
export function formatSkillLabel(skill: Skill, width: number): string {
    const url = `(https://github.com/${skill.repo})`;
    const text = skill.note ? `[${skill.note}] ${skill.description}` : skill.description;
    const head = `${skill.name} ${url} -> `;
    const room = Math.max(width - head.length, 10);
    const body = text.length > room ? `${text.slice(0, room - 1)}…` : text;
    return `${skill.name} ${styleText("dim", url)} -> ${styleText("gray", body)}`;
}

/** One line describing the catalog: number of skills and when the list was last updated. */
export function catalogSummary(catalog: Catalog): string {
    return `Skills catalog: ${catalog.skills.length} skills, last updated ${catalog.updatedAt}`;
}

/** One line comparing the running version with the latest GitHub Release (null when unknown). */
export function releaseSummary(current: string, latest: string | null): string {
    if (!latest) return `Version: v${current} (latest release: unavailable)`;
    const newest = latest.replace(/^v/, "");
    if (newest === current) return `Version: v${current} (latest release)`;
    return `Version: v${current} (latest release: v${newest}; run with @latest to update)`;
}

function listCatalog(catalog: Catalog): string {
    const groups = groupByCategory(catalog).map(({ category, skills }) => {
        const lines = skills.map((s) => `  ${s.name.padEnd(36)} https://github.com/${s.repo}`);
        return `${category.label}\n${lines.join("\n")}`;
    });
    return [catalogSummary(catalog), ...groups].join("\n\n");
}

function splitList(value: string | undefined): string[] {
    return (value ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
}

function cancelled(value: unknown): value is symbol {
    if (!p.isCancel(value)) return false;
    p.cancel("Cancelled.");
    return true;
}

async function chooseAgents(root: string, ids: string[], interactive: boolean): Promise<Agent[] | null> {
    if (ids.length) {
        const { found, missing } = findAgents(ids);
        if (missing.length) throw new Error(`Unknown agent(s): ${missing.join(", ")}`);
        return found;
    }
    const detected = await detectAgents(root);
    const fallback = AGENTS.filter((a) => a.id === "claude");
    if (!interactive) return detected.length ? detected : fallback;
    const choice = await p.multiselect({
        message: "Install for which agents? (pre-selected: detected in this folder)",
        options: AGENTS.map((a) => ({ value: a.id, label: `${a.label} ${styleText("dim", a.dir)}` })),
        initialValues: (detected.length ? detected : fallback).map((a) => a.id),
        required: true,
    });
    if (cancelled(choice)) return null;
    return findAgents(choice).found;
}

async function chooseSkills(names: string[], interactive: boolean): Promise<Skill[] | null> {
    if (names.length) {
        const { found, missing } = findSkills(CATALOG, names);
        if (missing.length) throw new Error(`Unknown skill(s): ${missing.join(", ")}. Run with --list to see them.`);
        return found;
    }
    if (!interactive) throw new Error("Pass --skills in non-interactive mode. Run with --list to see them.");
    // Room for the guide bar, group indent, checkbox and clack's own right margin, so labels never wrap.
    const width = (process.stdout.columns || 120) - 24;
    const options: Record<string, { value: string; label: string }[]> = {};
    for (const { category, skills } of groupByCategory(CATALOG)) {
        options[category.label] = skills.map((s) => ({ value: s.name, label: formatSkillLabel(s, width) }));
    }
    const choice = await p.groupMultiselect({
        message: "Select the skills to install (space: toggle, enter: confirm)",
        options,
        required: true,
        maxItems: Math.max((process.stdout.rows || 30) - 8, 10),
    });
    if (cancelled(choice)) return null;
    return findSkills(CATALOG, choice).found;
}

async function resolveConflicts(
    existing: InstallTarget[],
    interactive: boolean,
    force: boolean,
): Promise<Set<InstallTarget> | null> {
    const skip = new Set<InstallTarget>();
    if (force) return skip;
    if (!interactive) {
        for (const t of existing) skip.add(t);
        return skip;
    }
    let all: "overwrite" | "skip" | undefined;
    for (const target of existing) {
        if (all) {
            if (all === "skip") skip.add(target);
            continue;
        }
        const action = await p.select({
            message: `${target.agent.dir}/${target.skill.name} already exists`,
            options: [
                { value: "overwrite", label: "Overwrite with the latest version" },
                { value: "skip", label: "Skip" },
                { value: "overwrite-all", label: "Overwrite all remaining" },
                { value: "skip-all", label: "Skip all remaining" },
            ],
        });
        if (cancelled(action)) return null;
        if (action === "overwrite-all") all = "overwrite";
        if (action === "skip-all") all = "skip";
        if (action === "skip" || action === "skip-all") skip.add(target);
    }
    return skip;
}

/** Runs the CLI with the given arguments. Resolves to the process exit code. */
export async function run(argv: string[]): Promise<number> {
    const { values } = parseArgs({
        args: argv,
        options: {
            skills: { type: "string", short: "s" },
            agent: { type: "string", short: "a" },
            global: { type: "boolean", short: "g" },
            dir: { type: "string", short: "d" },
            yes: { type: "boolean", short: "y" },
            force: { type: "boolean", short: "f" },
            list: { type: "boolean", short: "l" },
            help: { type: "boolean", short: "h" },
            version: { type: "boolean", short: "v" },
        },
    });

    const info = values.help ? HELP : values.version ? VERSION : values.list ? listCatalog(CATALOG) : null;
    if (info !== null) {
        console.log(info);
        return 0;
    }

    const interactive = !values.yes && Boolean(process.stdin.isTTY);
    const root = values.global ? homedir() : resolve(values.dir ?? ".");

    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    p.intro(`add-agent-skills v${VERSION}`);
    p.log.message([releaseSummary(VERSION, await latestRelease({ token })), catalogSummary(CATALOG)].join("\n"));
    try {
        const agents = await chooseAgents(root, splitList(values.agent), interactive);
        if (!agents) return 1;
        const skills = await chooseSkills(splitList(values.skills), interactive);
        if (!skills) return 1;

        const targets = planInstall(root, skills, agents);
        const skip = await resolveConflicts(await findExisting(targets), interactive, Boolean(values.force));
        if (!skip) return 1;
        const todo = targets.filter((t) => !skip.has(t));
        if (skip.size) p.log.info(`Skipped ${skip.size} existing: ${[...skip].map((t) => t.skill.name).join(", ")}`);
        if (!todo.length) {
            p.outro("Nothing to install.");
            return 0;
        }

        const downloader = new SkillDownloader({ token });
        const unique = [...new Set(todo.map((t) => t.skill))];
        const spin = p.spinner();
        const failed: string[] = [];
        let done = 0;
        spin.start(`Downloading ${unique.length} skill(s) from GitHub`);
        for (const skill of unique) {
            try {
                const files = await downloader.download(skill);
                for (const target of todo.filter((t) => t.skill === skill)) await writeSkill(target.dir, files);
                done++;
                spin.message(`Installed ${done}/${unique.length}: ${skill.name}`);
            } catch (error) {
                failed.push(`${skill.name}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        spin.stop(`Installed ${done}/${unique.length} skill(s) into ${agents.map((a) => a.dir).join(", ")}`);
        for (const message of failed) p.log.error(message);
        p.outro(failed.length ? "Finished with errors." : "Done. Restart your agent to load the new skills.");
        return failed.length ? 1 : 0;
    } catch (error) {
        p.cancel(error instanceof Error ? error.message : String(error));
        return 1;
    }
}
