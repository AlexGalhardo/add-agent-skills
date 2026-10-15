import { describe, expect, test } from "bun:test";
import { GitHubError, SkillDownloader } from "../src/mod.ts";
import { fakeGitHub, skill } from "./helpers.ts";

const text = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

describe("SkillDownloader", () => {
    test("downloads every file of a skill directory, relative to it", async () => {
        const gh = fakeGitHub(
            { "o/r": ["skills/demo/SKILL.md", "skills/demo/ref/a.md", "skills/other/SKILL.md", "README.md"] },
            { "o/r/skills/demo/SKILL.md": "# demo", "o/r/skills/demo/ref/a.md": "a" },
        );
        const files = await new SkillDownloader({ fetch: gh.fetch }).download(skill());
        expect(files.map((f) => f.path).sort()).toEqual(["SKILL.md", "ref/a.md"]);
        expect(text(files.find((f) => f.path === "SKILL.md")?.content ?? new Uint8Array())).toBe("# demo");
    });

    test("fetches each repository tree only once", async () => {
        const gh = fakeGitHub(
            { "o/r": ["skills/a/SKILL.md", "skills/b/SKILL.md"] },
            { "o/r/skills/a/SKILL.md": "a", "o/r/skills/b/SKILL.md": "b" },
        );
        const downloader = new SkillDownloader({ fetch: gh.fetch });
        await downloader.download(skill({ path: "skills/a" }));
        await downloader.download(skill({ path: "skills/b" }));
        expect(gh.calls.filter((u) => u.includes("api.github.com"))).toHaveLength(1);
    });

    test("installs a single-file skill as SKILL.md without listing the tree", async () => {
        const gh = fakeGitHub({}, { "o/r/pkg/skill.md": "# single" });
        const files = await new SkillDownloader({ fetch: gh.fetch }).download(skill({ path: "pkg/skill.md" }));
        expect(files.map((f) => f.path)).toEqual(["SKILL.md"]);
        expect(gh.calls.some((u) => u.includes("api.github.com"))).toBe(false);
    });

    test("a repository-root skill leaves out .git* metadata", async () => {
        const gh = fakeGitHub(
            { "o/r": ["SKILL.md", "scripts/x.py", ".github/workflows/ci.yml", ".gitignore"] },
            { "o/r/SKILL.md": "s", "o/r/scripts/x.py": "x" },
        );
        const files = await new SkillDownloader({ fetch: gh.fetch }).download(skill({ path: "." }));
        expect(files.map((f) => f.path).sort()).toEqual(["SKILL.md", "scripts/x.py"]);
    });

    test("include limits the installed files", async () => {
        const gh = fakeGitHub(
            { "o/r": ["SKILL.md", "scripts/x.py", "scriptsX/y.py", "docs/a.md", "tests/t.py"] },
            { "o/r/SKILL.md": "s", "o/r/scripts/x.py": "x" },
        );
        const files = await new SkillDownloader({ fetch: gh.fetch }).download(
            skill({ path: ".", include: ["SKILL.md", "scripts"] }),
        );
        expect(files.map((f) => f.path).sort()).toEqual(["SKILL.md", "scripts/x.py"]);
    });

    test("fails clearly when SKILL.md is missing or the API errors", async () => {
        const gh = fakeGitHub({ "o/r": ["skills/demo/README.md"] }, {});
        const downloader = new SkillDownloader({ fetch: gh.fetch });
        await expect(downloader.download(skill())).rejects.toThrow("no SKILL.md");
        await expect(downloader.download(skill({ repo: "o/missing" }))).rejects.toBeInstanceOf(GitHubError);
    });

    test("mentions the token on rate limits", async () => {
        const fetch = (async () => new Response("", { status: 403 })) as unknown as typeof globalThis.fetch;
        await expect(new SkillDownloader({ fetch }).download(skill())).rejects.toThrow("GITHUB_TOKEN");
    });

    test("sends the token to the API", async () => {
        const seen: { auth: string | null } = { auth: null };
        const fetch = (async (_url: string, init?: RequestInit) => {
            seen.auth = new Headers(init?.headers).get("Authorization");
            return Response.json({ tree: [] });
        }) as unknown as typeof globalThis.fetch;
        await new SkillDownloader({ fetch, token: "t0k" }).listFiles(skill()).catch(() => {});
        expect(seen.auth).toBe("Bearer t0k");
    });
});
