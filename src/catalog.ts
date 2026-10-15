import data from "./catalog.json" with { type: "json" };

/** A skill category shown as a group in the checklist. */
export interface Category {
    /** Stable id used in `catalog.json` (e.g. `"game-development"`). */
    id: string;
    /** Label shown in the CLI (e.g. `"Game Development"`). */
    label: string;
}

/** A skill that can be installed, pointing at its official GitHub repository. */
export interface Skill {
    /** Folder name the skill is installed as (e.g. `karpathy-guidelines`). Unique in the catalog. */
    name: string;
    /** Category id. */
    category: string;
    /** GitHub repository as `owner/name`. Files are always fetched from its default branch. */
    repo: string;
    /**
     * Path of the skill inside the repository: a directory containing `SKILL.md`, `"."` for the
     * repository root, or a single `.md` file that is installed as `SKILL.md`.
     */
    path: string;
    /**
     * Only install these entries (files or folders, relative to `path`). Used when a skill lives at a
     * repository root next to files that aren't part of it (docs, tests...). Default: everything.
     */
    include?: string[];
    /** Short description, taken from the upstream `SKILL.md` frontmatter. */
    description: string;
    /** SPDX license of the upstream repository, when it declares one. */
    license?: string;
    /** Extra note shown next to the skill (e.g. that it summarizes a book). */
    note?: string;
}

/** The full catalog: categories in display order and every installable skill. */
export interface Catalog {
    /** Date (YYYY-MM-DD) the skill list or its upstream data last changed. */
    updatedAt: string;
    categories: Category[];
    skills: Skill[];
}

/** The catalog bundled with this version of the package. */
export const CATALOG: Catalog = data;

/** Returns the URL of the skill on GitHub (directory or file view). */
export function skillUrl(skill: Skill): string {
    if (skill.path === ".") return `https://github.com/${skill.repo}`;
    const kind = skill.path.endsWith(".md") ? "blob" : "tree";
    return `https://github.com/${skill.repo}/${kind}/HEAD/${skill.path}`;
}

/** Groups skills by category, in the catalog's category order. Empty categories are omitted. */
export function groupByCategory(catalog: Catalog): { category: Category; skills: Skill[] }[] {
    return catalog.categories
        .map((category) => ({ category, skills: catalog.skills.filter((s) => s.category === category.id) }))
        .filter((group) => group.skills.length > 0);
}

/** Finds skills by name. Returns the found skills and the names that don't exist in the catalog. */
export function findSkills(catalog: Catalog, names: string[]): { found: Skill[]; missing: string[] } {
    const found: Skill[] = [];
    const missing: string[] = [];
    for (const name of names) {
        const skill = catalog.skills.find((s) => s.name === name);
        if (skill) found.push(skill);
        else missing.push(name);
    }
    return { found, missing };
}
