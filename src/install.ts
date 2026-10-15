import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, normalize, sep } from "node:path";
import type { Agent } from "./agents.ts";
import type { Skill } from "./catalog.ts";
import type { SkillFile } from "./github.ts";

/** Where a skill goes for one agent. */
export interface InstallTarget {
    skill: Skill;
    agent: Agent;
    /** Absolute folder of the installed skill. */
    dir: string;
}

/** Builds the install targets for every skill × agent pair under `root`. */
export function planInstall(root: string, skills: Skill[], agents: Agent[]): InstallTarget[] {
    return agents.flatMap((agent) =>
        skills.map((skill) => ({ skill, agent, dir: join(root, ...agent.dir.split("/"), skill.name) })),
    );
}

/** Returns the targets whose folder already exists. */
export async function findExisting(targets: InstallTarget[]): Promise<InstallTarget[]> {
    const checks = await Promise.all(
        targets.map(async (t) => {
            try {
                await stat(t.dir);
                return true;
            } catch {
                return false;
            }
        }),
    );
    return targets.filter((_, i) => checks[i]);
}

/**
 * Writes a skill into `dir`, replacing whatever was there so no stale files from an older version remain.
 * Rejects file paths that would escape `dir`.
 */
export async function writeSkill(dir: string, files: SkillFile[]): Promise<void> {
    for (const file of files) {
        const normalized = normalize(file.path);
        if (isAbsolute(normalized) || normalized.split(sep).includes("..")) {
            throw new Error(`Refusing to write outside the skill folder: ${file.path}`);
        }
    }
    await rm(dir, { recursive: true, force: true });
    for (const file of files) {
        const target = join(dir, normalize(file.path));
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, file.content);
    }
}
