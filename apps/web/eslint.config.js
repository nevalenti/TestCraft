import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
// @ts-expect-error -- no bundled type definitions
import jsxA11y from "eslint-plugin-jsx-a11y";
import { defineConfig, globalIgnores } from "eslint/config";
import {
  js,
  tseslint,
  sharedPlugins,
  sharedRules,
} from "../../eslint.config.base.mjs";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      ...sharedPlugins,
    },
    rules: {
      ...sharedRules,
      "jsx-a11y/no-autofocus": "off",
      "react-hooks/incompatible-library": "off",
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "19.2" },
    },
  },
  {
    files: ["**/contexts/**"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
]);
