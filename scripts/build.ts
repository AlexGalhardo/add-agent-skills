// Builds the npm package: ESM bundles for the library and the CLI, plus .d.ts declarations.
// JSR does not use this; it publishes the TypeScript sources in src/ directly.

import { readdir, rm } from "node:fs/promises";
import { $ } from "bun";

await rm("dist", { recursive: true, force: true });

const result = await Bun.build({
    entrypoints: ["src/mod.ts", "src/bin.ts"],
    outdir: "dist",
    format: "esm",
    target: "node",
    external: ["@clack/prompts"],
    naming: { entry: "[name].js", chunk: "[name]-[hash].js" },
});
if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
}

await $`mv dist/bin.js dist/cli.js`;
await $`tsc -p tsconfig.build.json`;

console.log("Built:", (await readdir("dist")).sort().join(", "));
