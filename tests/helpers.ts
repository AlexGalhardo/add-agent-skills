import type { Skill } from "../src/mod.ts";

/** A fake GitHub: `trees` maps "owner/repo" to file paths, `files` maps "owner/repo/path" to content. */
export function fakeGitHub(trees: Record<string, string[]>, files: Record<string, string>) {
    const calls: string[] = [];
    const fakeFetch = (async (input: string | URL | Request) => {
        const url = String(input);
        calls.push(url);
        const tree = /^https:\/\/api\.github\.com\/repos\/([^/]+\/[^/]+)\/git\/trees\/HEAD\?recursive=1$/.exec(url);
        if (tree?.[1]) {
            const paths = trees[tree[1]];
            if (!paths) return new Response("{}", { status: 404 });
            return Response.json({ tree: paths.map((path) => ({ path, type: "blob" })), truncated: false });
        }
        const raw = /^https:\/\/raw\.githubusercontent\.com\/([^/]+\/[^/]+)\/HEAD\/(.+)$/.exec(url);
        const content = raw ? files[`${raw[1]}/${decodeURIComponent(raw[2] ?? "")}`] : undefined;
        return content === undefined ? new Response("", { status: 404 }) : new Response(content);
    }) as typeof globalThis.fetch;
    return { fetch: fakeFetch, calls };
}

export const skill = (overrides: Partial<Skill> = {}): Skill => ({
    name: "demo",
    category: "most-used",
    repo: "o/r",
    path: "skills/demo",
    description: "Demo skill.",
    ...overrides,
});
