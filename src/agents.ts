import { stat } from "node:fs/promises";
import { join } from "node:path";

/** An AI coding agent and the folder it loads skills from. */
export interface Agent {
    /** Id used by the `--agent` flag. */
    id: string;
    /** Label shown in the CLI. */
    label: string;
    /** Skills folder, relative to the project root or to the home directory (`--global`). */
    dir: string;
    /** Folders whose presence in a project suggests the agent is in use. */
    markers: string[];
}

/** Supported agents. Paths follow each vendor's docs and the open Agent Skills convention. */
export const AGENTS: Agent[] = [
    { id: "claude", label: "Claude Code", dir: ".claude/skills", markers: [".claude"] },
    {
        id: "agents",
        label: "Open standard (Codex, Cursor, Copilot, Gemini CLI, OpenCode, Amp, Goose)",
        dir: ".agents/skills",
        markers: [".agents", ".codex"],
    },
    { id: "cursor", label: "Cursor", dir: ".cursor/skills", markers: [".cursor"] },
    {
        id: "copilot",
        label: "GitHub Copilot",
        dir: ".github/skills",
        markers: [".github/skills", ".github/copilot-instructions.md"],
    },
];

async function exists(path: string): Promise<boolean> {
    try {
        await stat(path);
        return true;
    } catch {
        return false;
    }
}

/** Returns the agents whose marker folders exist under `root`. */
export async function detectAgents(root: string): Promise<Agent[]> {
    const detected: Agent[] = [];
    for (const agent of AGENTS) {
        const found = await Promise.all(agent.markers.map((m) => exists(join(root, m))));
        if (found.some(Boolean)) detected.push(agent);
    }
    return detected;
}

/** Finds agents by id. Returns the found agents and the ids that don't exist. */
export function findAgents(ids: string[]): { found: Agent[]; missing: string[] } {
    const found: Agent[] = [];
    const missing: string[] = [];
    for (const id of ids) {
        const agent = AGENTS.find((a) => a.id === id);
        if (agent) found.push(agent);
        else missing.push(id);
    }
    return { found, missing };
}
