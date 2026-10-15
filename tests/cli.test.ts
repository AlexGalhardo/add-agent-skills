import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stripVTControlCharacters } from "node:util";
import { CATALOG, catalogSummary, formatSkillLabel, latestRelease, releaseSummary, run } from "../src/mod.ts";
import { fakeGitHub, skill } from "./helpers.ts";

let root = "";
const realFetch = globalThis.fetch;
const karpathy = CATALOG.skills.find((s) => s.name === "karpathy-guidelines");
if (!karpathy) throw new Error("karpathy-guidelines missing from catalog");

beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "add-agent-skills-cli-"));
    const gh = fakeGitHub(
        { [karpathy.repo]: [`${karpathy.path}/SKILL.md`] },
        { [`${karpathy.repo}/${karpathy.path}/SKILL.md`]: "# fresh" },
    );
    globalThis.fetch = gh.fetch;
});
afterEach(async () => {
    globalThis.fetch = realFetch;
    await rm(root, { recursive: true, force: true });
});

describe("formatSkillLabel", () => {
    test("shows name, repository URL and description, cut to the width", () => {
        const label = stripVTControlCharacters(formatSkillLabel(skill({ description: "x".repeat(200) }), 80));
        expect(label.startsWith("demo (https://github.com/o/r) -> ")).toBe(true);
        expect(label).toHaveLength(80);
        expect(label.endsWith("…")).toBe(true);
    });

    test("prefixes the note", () => {
        const label = stripVTControlCharacters(formatSkillLabel(skill({ note: "Book summary" }), 200));
        expect(label).toContain("-> [Book summary] Demo skill.");
    });
});

describe("run", () => {
    test("--list prints every category", async () => {
        const log = spyOn(console, "log").mockImplementation(() => {});
        expect(await run(["--list"])).toBe(0);
        const out = String(log.mock.calls[0]?.[0]);
        log.mockRestore();
        for (const c of CATALOG.categories) expect(out).toContain(c.label);
    });

    test("installs a skill non-interactively for the chosen agents", async () => {
        const code = await run(["--skills", "karpathy-guidelines", "--agent", "claude,agents", "--dir", root, "--yes"]);
        expect(code).toBe(0);
        for (const dir of [".claude", ".agents"]) {
            expect(await readFile(join(root, dir, "skills", "karpathy-guidelines", "SKILL.md"), "utf8")).toBe(
                "# fresh",
            );
        }
    });

    test("skips existing skills unless --force", async () => {
        const dir = join(root, ".claude", "skills", "karpathy-guidelines");
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, "SKILL.md"), "# mine");
        const args = ["--skills", "karpathy-guidelines", "--agent", "claude", "--dir", root, "--yes"];
        expect(await run(args)).toBe(0);
        expect(await readFile(join(dir, "SKILL.md"), "utf8")).toBe("# mine");
        expect(await run([...args, "--force"])).toBe(0);
        expect(await readFile(join(dir, "SKILL.md"), "utf8")).toBe("# fresh");
    });

    test("fails on unknown skills, unknown agents and missing --skills", async () => {
        expect(await run(["--skills", "nope", "--dir", root, "--yes"])).toBe(1);
        expect(await run(["--skills", "karpathy-guidelines", "--agent", "vim", "--dir", root, "--yes"])).toBe(1);
        expect(await run(["--dir", root, "--yes"])).toBe(1);
    });
});

describe("header", () => {
    test("releaseSummary compares versions and tolerates an unknown release", () => {
        expect(releaseSummary("1.0.0", "v1.0.0")).toBe("Version: v1.0.0 (latest release)");
        expect(releaseSummary("1.0.0", "v1.2.0")).toContain("latest release: v1.2.0");
        expect(releaseSummary("1.0.0", null)).toContain("unavailable");
    });

    test("catalogSummary shows the skill count and update date", () => {
        expect(catalogSummary(CATALOG)).toBe(
            `Skills catalog: ${CATALOG.skills.length} skills, last updated ${CATALOG.updatedAt}`,
        );
        expect(CATALOG.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test("latestRelease returns the tag, or null on errors and timeouts", async () => {
        const ok = (async () => Response.json({ tag_name: "v1.3.0" })) as unknown as typeof fetch;
        const down = (async () => new Response("", { status: 403 })) as unknown as typeof fetch;
        const hang = ((_u: string, init?: RequestInit) =>
            new Promise((_, reject) =>
                init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))),
            )) as unknown as typeof fetch;
        expect(await latestRelease({ fetch: ok })).toBe("v1.3.0");
        expect(await latestRelease({ fetch: down })).toBeNull();
        expect(await latestRelease({ fetch: hang }, 20)).toBeNull();
    });
});
