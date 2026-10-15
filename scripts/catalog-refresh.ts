// Refreshes src/catalog.json from upstream: checks that every skill still exists at its path on the
// repository's default branch, and updates its description (SKILL.md frontmatter) and license.
// Exits with code 1 if any skill is missing, so a moved skill is noticed and its path fixed.
//
// Usage: bun run catalog:refresh   (set GITHUB_TOKEN or GH_TOKEN to avoid the 60 requests/hour limit)

import type { Catalog, Skill } from "../src/catalog.ts";

const MAX_DESCRIPTION = 300;

/** Extracts the `description` field from SKILL.md YAML frontmatter, as a single line. */
export function parseDescription(markdown: string): string | null {
    const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
    if (!match?.[1]) return null;
    const lines = match[1].split(/\r?\n/);
    const start = lines.findIndex((l) => /^description:/.test(l));
    if (start === -1) return null;

    const first = (lines[start] ?? "").replace(/^description:\s*/, "");
    // Indented lines that follow belong to the value (block scalars and multi-line plain scalars).
    const continuation: string[] = [];
    for (const line of lines.slice(start + 1)) {
        if (line.trim() && !/^\s/.test(line)) break;
        continuation.push(line.trim());
    }
    let value: string;
    if (/^[>|][+-]?\s*$/.test(first)) {
        value = continuation.join(" ");
    } else if (first.startsWith('"')) {
        value = JSON.parse(first.replace(/\s+$/, "")) as string;
    } else if (first.startsWith("'")) {
        value = first.slice(1, first.lastIndexOf("'")).replaceAll("''", "'");
    } else {
        value = [first, ...continuation].join(" ");
    }
    value = value.replace(/\s+/g, " ").trim();
    return value.length > MAX_DESCRIPTION ? `${value.slice(0, MAX_DESCRIPTION - 1)}…` : value;
}

function skillFile(skill: Skill): string {
    if (skill.path.endsWith(".md")) return skill.path;
    return skill.path === "." ? "SKILL.md" : `${skill.path}/SKILL.md`;
}

async function main(): Promise<void> {
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    const headers: Record<string, string> = { "User-Agent": "add-agent-skills" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const file = Bun.file("src/catalog.json");
    const catalog = (await file.json()) as Catalog;
    const before = JSON.stringify(catalog.skills);

    const licenses = new Map<string, string | undefined>();
    for (const repo of new Set(catalog.skills.map((s) => s.repo))) {
        const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
        if (!res.ok) throw new Error(`${repo}: GitHub API returned ${res.status}`);
        const body = (await res.json()) as { license?: { spdx_id?: string } | null };
        const spdx = body.license?.spdx_id;
        licenses.set(repo, spdx && spdx !== "NOASSERTION" ? spdx : undefined);
    }

    const missing: string[] = [];
    await Promise.all(
        catalog.skills.map(async (skill) => {
            const url = `https://raw.githubusercontent.com/${skill.repo}/HEAD/${skillFile(skill)}`;
            const res = await fetch(url, { headers: { "User-Agent": "add-agent-skills" } });
            if (!res.ok) {
                missing.push(`${skill.name}: ${url} (${res.status})`);
                return;
            }
            const description = parseDescription(await res.text());
            if (description) skill.description = description;
            const license = licenses.get(skill.repo);
            if (license) skill.license = license;
            else delete skill.license;
        }),
    );

    // Only bump the date when something actually changed, so the weekly job stays a no-op otherwise.
    if (JSON.stringify(catalog.skills) !== before) catalog.updatedAt = new Date().toISOString().slice(0, 10);
    await Bun.write(file, `${JSON.stringify(catalog, null, 4)}\n`);
    console.log(`catalog.json: refreshed ${catalog.skills.length - missing.length}/${catalog.skills.length} skills`);
    for (const line of missing) console.error(`missing: ${line}`);
    if (missing.length) process.exit(1);
}

if (import.meta.main) await main();
