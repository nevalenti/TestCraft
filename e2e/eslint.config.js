import { defineConfig, globalIgnores } from 'eslint/config';

import {
  js,
  nodeGlobals,
  sharedExtends,
  sharedPlugins,
  sharedRules,
  sharedUnicornRules,
  tseslint,
} from '../eslint.config.base.mjs';

export default defineConfig([
  globalIgnores(['test-results', 'playwright-report']),
  {
    files: ['**/*.ts'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      ...sharedExtends,
    ],
    plugins: {
      ...sharedPlugins,
    },
    rules: {
      ...sharedRules,
      ...sharedUnicornRules,
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
    languageOptions: {
      globals: nodeGlobals,
    },
  },
  {
    files: ['tests/**/*.spec.ts'],
    rules: {
      'sonarjs/assertions-in-tests': 'off',
    },
  },
]);
