import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AGENTS, detectAgents, findExisting, planInstall, writeSkill } from "../src/mod.ts";
import { skill } from "./helpers.ts";

let root = "";
const bytes = (s: string): Uint8Array => new TextEncoder().encode(s);

beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "add-agent-skills-"));
});
afterEach(async () => {
    await rm(root, { recursive: true, force: true });
});

describe("install", () => {
    test("planInstall maps every skill to every agent folder", () => {
        const targets = planInstall(root, [skill({ name: "a" }), skill({ name: "b" })], AGENTS.slice(0, 2));
        expect(targets.map((t) => t.dir)).toEqual([
            join(root, ".claude", "skills", "a"),
            join(root, ".claude", "skills", "b"),
            join(root, ".agents", "skills", "a"),
            join(root, ".agents", "skills", "b"),
        ]);
    });

    test("writeSkill replaces the folder, so stale files disappear", async () => {
        const dir = join(root, ".claude", "skills", "demo");
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, "old.md"), "old");
        await writeSkill(dir, [
            { path: "SKILL.md", content: bytes("# new") },
            { path: "ref/a.md", content: bytes("a") },
        ]);
        expect((await readdir(dir)).sort()).toEqual(["SKILL.md", "ref"]);
        expect(await readFile(join(dir, "ref", "a.md"), "utf8")).toBe("a");
    });

    test("writeSkill refuses paths that escape the folder and writes nothing", async () => {
        const dir = join(root, "skill");
        await mkdir(dir);
        await writeFile(join(dir, "keep.md"), "keep");
        await expect(writeSkill(dir, [{ path: "../evil.md", content: bytes("x") }])).rejects.toThrow("outside");
        expect(await readFile(join(dir, "keep.md"), "utf8")).toBe("keep");
    });

    test("findExisting and detectAgents look at the file system", async () => {
        await mkdir(join(root, ".claude", "skills", "a"), { recursive: true });
        await mkdir(join(root, ".cursor"));
        const targets = planInstall(root, [skill({ name: "a" }), skill({ name: "b" })], AGENTS.slice(0, 1));
        expect((await findExisting(targets)).map((t) => t.skill.name)).toEqual(["a"]);
        expect((await detectAgents(root)).map((a) => a.id)).toEqual(["claude", "cursor"]);
    });
});
