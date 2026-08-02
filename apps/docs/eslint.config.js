import { defineConfig, globalIgnores } from 'eslint/config';

import {
  js,
  nodeGlobals,
  sharedExtends,
  sharedPlugins,
  sharedRules,
  sharedUnicornRules,
  tseslint,
} from '../../eslint.config.base.mjs';

export default defineConfig([
  globalIgnores(['dist', '.astro']),
  {
    files: ['**/*.{ts,mjs}'],
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
    },
    languageOptions: {
      globals: nodeGlobals,
    },
  },
]);
