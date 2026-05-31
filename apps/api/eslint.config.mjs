import globals from "globals";
import n from "eslint-plugin-n";
import security from "eslint-plugin-security";
import { defineConfig, globalIgnores } from "eslint/config";
import {
  js,
  tseslint,
  sharedPlugins,
  sharedRules,
} from "../../eslint.config.base.mjs";

export default defineConfig([
  globalIgnores(["dist", "node_modules"]),
  {
    files: ["**/*.ts"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      n.configs["flat/recommended"],
      security.configs.recommended,
    ],
    plugins: { ...sharedPlugins },
    rules: {
      ...sharedRules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "n/no-missing-import": "off",
      "n/no-unpublished-import": "off",
      "n/no-process-exit": "off",
      "n/prefer-node-protocol": "error",
    },
    languageOptions: {
      globals: globals.node,
    },
    settings: {
      node: { version: ">=24.0.0" },
    },
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);
