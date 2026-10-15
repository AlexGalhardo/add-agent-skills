import { describe, expect, test } from "bun:test";
import { parseDescription } from "../scripts/catalog-refresh.ts";

const fm = (body: string): string => `---\nname: x\n${body}\n---\n\n# Title\n`;

describe("parseDescription", () => {
    test("plain value", () => {
        expect(parseDescription(fm("description: Does things."))).toBe("Does things.");
    });

    test("double-quoted value with escapes", () => {
        expect(parseDescription(fm('description: "Uses \\"lenses\\" well."'))).toBe('Uses "lenses" well.');
    });

    test("single-quoted value", () => {
        expect(parseDescription(fm("description: 'It''s fine.'"))).toBe("It's fine.");
    });

    test("folded block scalar", () => {
        expect(parseDescription(fm("description: >-\n  Line one\n  line two.\nlicense: MIT"))).toBe(
            "Line one line two.",
        );
    });

    test("multi-line plain scalar starting on the next line", () => {
        expect(parseDescription(fm("description:\n  React Native and Expo\n  best practices.\nlicense: MIT"))).toBe(
            "React Native and Expo best practices.",
        );
    });

    test("caps long descriptions", () => {
        const out = parseDescription(fm(`description: ${"a".repeat(400)}`));
        expect(out).toHaveLength(300);
        expect(out?.endsWith("…")).toBe(true);
    });

    test("returns null without frontmatter or description", () => {
        expect(parseDescription("# No frontmatter")).toBeNull();
        expect(parseDescription(fm("license: MIT"))).toBeNull();
    });
});
