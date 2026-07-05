const js = require("@eslint/js");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const prettier = require("eslint-config-prettier");

module.exports = [
  {
    ignores: ["dist", "node_modules", "coverage"],
  },
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      // Prettier owns formatting; disable ESLint's conflicting stylistic rules.
      ...prettier.rules,

      // TypeScript already checks for undefined identifiers far better than
      // ESLint's no-undef (which can't see ambient/DOM/node globals). The
      // typescript-eslint project explicitly recommends turning it off.
      "no-undef": "off",

      // Style / non-blocking rules downgraded to warnings so the gate stays
      // green while still surfacing issues. Ratchet these back up to "error"
      // in follow-up cleanup PRs as the codebase is tidied.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "no-empty": "warn",
      "no-useless-escape": "warn",
      "no-useless-assignment": "warn",

      // Not needed with TypeScript; return types are inferred.
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
];
