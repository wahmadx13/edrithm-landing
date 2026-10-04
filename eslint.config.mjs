import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
// eslint-config-prettier disables all ESLint rules that conflict with Prettier
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Disable formatting rules that would conflict with Prettier
  eslintConfigPrettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "node_modules/**", "design-system/tangerine/**"]),
]);

export default eslintConfig;

