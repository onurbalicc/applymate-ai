// Minimal esbuild bundler for the extension's two entry points.
// No framework — just bundles content script + popup script into dist/.
import { build, context } from "esbuild";
import { mkdirSync, copyFileSync } from "node:fs";

const watch = process.argv.includes("--watch");

mkdirSync("dist", { recursive: true });
copyFileSync("src/panel/panel.html", "dist/panel.html");
copyFileSync("src/panel/panel.css", "dist/panel.css");

const options = {
  entryPoints: {
    content: "src/content/index.ts",
    panel: "src/panel/panel.ts",
  },
  outdir: "dist",
  bundle: true,
  format: "iife",
  target: "chrome110",
  sourcemap: true,
  logLevel: "info",
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("watching for changes...");
} else {
  await build(options);
}
