import { describe, expect, test } from "bun:test";
import { CATALOG, findSkills, groupByCategory, skillUrl } from "../src/mod.ts";

describe("catalog.json", () => {
    test("skill names are unique and safe folder names", () => {
        const names = CATALOG.skills.map((s) => s.name);
        expect(new Set(names).size).toBe(names.length);
        for (const name of names) expect(name).toMatch(/^[a-z0-9][a-z0-9-]*$/);
    });

    test("every skill has a known category, an owner/repo, a path and a description", () => {
        const categories = new Set(CATALOG.categories.map((c) => c.id));
        for (const skill of CATALOG.skills) {
            expect(categories.has(skill.category)).toBe(true);
            expect(skill.repo).toMatch(/^[\w.-]+\/[\w.-]+$/);
            expect(skill.path.length).toBeGreaterThan(0);
            expect(skill.path).not.toContain("..");
            expect(skill.description.length).toBeGreaterThan(0);
        }
    });

    test("book-based skills say so", () => {
        for (const name of ["art-of-game-design", "pixel-logic"]) {
            expect(CATALOG.skills.find((s) => s.name === name)?.note).toContain("summary of the book");
        }
    });
});

describe("helpers", () => {
    test("groupByCategory keeps category order", () => {
        const groups = groupByCategory(CATALOG);
        expect(groups[0]?.category.id).toBe("most-used");
        expect(groups.reduce((n, g) => n + g.skills.length, 0)).toBe(CATALOG.skills.length);
    });

    test("findSkills reports unknown names", () => {
        const { found, missing } = findSkills(CATALOG, ["karpathy-guidelines", "nope"]);
        expect(found.map((s) => s.name)).toEqual(["karpathy-guidelines"]);
        expect(missing).toEqual(["nope"]);
    });

    test("skillUrl points at the tree, file or repository", () => {
        const base = { name: "x", category: "c", description: "d", repo: "o/r" };
        expect(skillUrl({ ...base, path: "skills/x" })).toBe("https://github.com/o/r/tree/HEAD/skills/x");
        expect(skillUrl({ ...base, path: "x/skill.md" })).toBe("https://github.com/o/r/blob/HEAD/x/skill.md");
        expect(skillUrl({ ...base, path: "." })).toBe("https://github.com/o/r");
    });
});
