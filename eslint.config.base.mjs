import js from "@eslint/js";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export { js, tseslint };

export const sharedPlugins = {
  "simple-import-sort": simpleImportSort,
};

export const sharedRules = {
  "simple-import-sort/imports": "error",
  "simple-import-sort/exports": "error",
};
