import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The browser extension is its own package with its own build/lint
    // pipeline (browser-extension/tsconfig.json, `npm run build`); only its
    // generated output needs excluding here, not the source.
    "browser-extension/dist/**",
    "browser-extension/node_modules/**",
  ]),
]);

export default eslintConfig;
