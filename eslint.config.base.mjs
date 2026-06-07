import js from "@eslint/js";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import tseslint from "typescript-eslint";

export { js, tseslint };

export const sharedPlugins = {
  "simple-import-sort": simpleImportSort,
};

export const sharedRules = {
  "simple-import-sort/imports": "error",
  "simple-import-sort/exports": "error",
};

export const sharedExtends = [
  unicorn.configs["flat/recommended"],
  sonarjs.configs.recommended,
];

export const sharedUnicornRules = {
  "unicorn/prevent-abbreviations": "off",
  "unicorn/no-null": "off",
  "unicorn/filename-case": "off",
  // sonarjs/no-nested-conditional already covers this with a clearer message
  "unicorn/no-nested-ternary": "off",
  // TypeScript's type system prevents the real risk (unexpected extra arguments)
  "unicorn/no-array-callback-reference": "off",
};
