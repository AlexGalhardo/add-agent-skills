import type { Skill } from "./catalog.ts";

/** A file of a skill: its path relative to the skill folder, and its content. */
export interface SkillFile {
    path: string;
    content: Uint8Array;
}

/** Options for talking to GitHub. */
export interface GitHubOptions {
    /** Token for api.github.com; raises the rate limit from 60 to 5000 requests/hour. */
    token?: string;
    /** Injectable fetch, for tests. */
    fetch?: typeof fetch;
}

interface TreeEntry {
    path: string;
    type: string;
}

/** Thrown when GitHub can't provide a skill (missing repo/path, rate limit, network). */
export class GitHubError extends Error {
    override name = "GitHubError";
}

/**
 * Downloads skills from GitHub, always from the repository's default branch (`HEAD`).
 * Each repository tree is fetched once per instance, so several skills of one repo cost one API call.
 */
export class SkillDownloader {
    private readonly trees = new Map<string, Promise<TreeEntry[]>>();
    private readonly fetch: typeof fetch;
    private readonly token: string | undefined;

    constructor(options: GitHubOptions = {}) {
        this.fetch = options.fetch ?? globalThis.fetch;
        this.token = options.token;
    }

    /** Lists the files of a skill, as paths relative to the repository root. */
    async listFiles(skill: Skill): Promise<string[]> {
        if (skill.path.endsWith(".md")) return [skill.path];
        const tree = await this.tree(skill.repo);
        const prefix = skill.path === "." ? "" : `${skill.path}/`;
        const files = tree
            .filter((e) => e.type === "blob" && e.path.startsWith(prefix))
            .map((e) => e.path)
            // Repository metadata (.github/, .gitignore...) is not part of a skill installed from a repo root.
            .filter(
                (p) =>
                    !p
                        .slice(prefix.length)
                        .split("/")
                        .some((part) => part.startsWith(".git")),
            )
            .filter((p) => {
                if (!skill.include) return true;
                const relative = p.slice(prefix.length);
                return skill.include.some((entry) => relative === entry || relative.startsWith(`${entry}/`));
            });
        if (!files.some((p) => p.slice(prefix.length).toLowerCase() === "skill.md")) {
            throw new GitHubError(`${skill.repo}: no SKILL.md found at "${skill.path}"`);
        }
        return files;
    }

    /** Downloads every file of a skill. A single-file skill is returned as `SKILL.md`. */
    async download(skill: Skill): Promise<SkillFile[]> {
        const paths = await this.listFiles(skill);
        const prefix = skill.path === "." || skill.path.endsWith(".md") ? "" : `${skill.path}/`;
        return Promise.all(
            paths.map(async (path) => {
                const relative = skill.path.endsWith(".md") ? "SKILL.md" : path.slice(prefix.length);
                return { path: relative, content: await this.raw(skill.repo, path) };
            }),
        );
    }

    private tree(repo: string): Promise<TreeEntry[]> {
        let tree = this.trees.get(repo);
        if (!tree) {
            tree = this.fetchTree(repo);
            this.trees.set(repo, tree);
        }
        return tree;
    }

    private async fetchTree(repo: string): Promise<TreeEntry[]> {
        const headers: Record<string, string> = {
            Accept: "application/vnd.github+json",
            "User-Agent": "add-agent-skills",
        };
        if (this.token) headers.Authorization = `Bearer ${this.token}`;
        const res = await this.fetch(`https://api.github.com/repos/${repo}/git/trees/HEAD?recursive=1`, { headers });
        if (!res.ok) {
            const limited = res.status === 403 || res.status === 429;
            const hint = limited ? " (GitHub rate limit; set GITHUB_TOKEN or GH_TOKEN and retry)" : "";
            throw new GitHubError(`${repo}: GitHub API returned ${res.status}${hint}`);
        }
        const body = (await res.json()) as { tree?: TreeEntry[]; truncated?: boolean };
        if (body.truncated) throw new GitHubError(`${repo}: repository tree is too large to list`);
        return body.tree ?? [];
    }

    private async raw(repo: string, path: string): Promise<Uint8Array> {
        const url = `https://raw.githubusercontent.com/${repo}/HEAD/${path.split("/").map(encodeURIComponent).join("/")}`;
        const res = await this.fetch(url, { headers: { "User-Agent": "add-agent-skills" } });
        if (!res.ok) throw new GitHubError(`${repo}: failed to download ${path} (${res.status})`);
        return new Uint8Array(await res.arrayBuffer());
    }
}

/** Repository this package is released from. */
export const PACKAGE_REPO = "AlexGalhardo/add-agent-skills";

/**
 * Returns the tag of the latest GitHub Release of this package (e.g. `v1.2.0`), or null if it can't be
 * fetched within `timeoutMs` (offline, rate limited...). Never throws.
 */
export async function latestRelease(options: GitHubOptions = {}, timeoutMs = 3000): Promise<string | null> {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "User-Agent": "add-agent-skills",
    };
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    try {
        const res = await (options.fetch ?? globalThis.fetch)(
            `https://api.github.com/repos/${PACKAGE_REPO}/releases/latest`,
            { headers, signal: AbortSignal.timeout(timeoutMs) },
        );
        if (!res.ok) return null;
        const body = (await res.json()) as { tag_name?: unknown };
        return typeof body.tag_name === "string" ? body.tag_name : null;
    } catch {
        return null;
    }
}
