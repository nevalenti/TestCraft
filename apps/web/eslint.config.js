import { fileURLToPath } from 'node:url';
import path from 'node:path';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
// @ts-expect-error -- no bundled type definitions
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tailwind from 'eslint-plugin-tailwindcss';
import { defineConfig, globalIgnores } from 'eslint/config';
import {
  js,
  tseslint,
  sharedPlugins,
  sharedRules,
  sharedExtends,
  sharedUnicornRules,
} from '../../eslint.config.base.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
      reactRefresh.configs.vite,
      tailwind.configs.recommended,
      ...sharedExtends,
    ],
    plugins: {
      ...sharedPlugins,
    },
    rules: {
      ...sharedRules,
      ...sharedUnicornRules,
      'jsx-a11y/no-autofocus': 'off',
      'react-hooks/incompatible-library': 'off',
      'tailwindcss/no-custom-classname': [
        'warn',
        {
          whitelist: [
            'btn',
            'btn-.*',
            'input-bordered',
            'select-bordered',
            'textarea-bordered',
            'drawer-overlay',
            'dropdown.*',
            'header-stripes',
            'page-header',
            'page-content',
            'page-title',
            'card-bg-.+',
            'app-shadow',
            'font-display',
          ],
        },
      ],
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: '19.2' },
      tailwindcss: {
        cssConfigPath: path.resolve(__dirname, 'src/styles.css'),
      },
    },
  },
  {
    files: ['**/contexts/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'unicorn/no-document-cookie': 'off',
      'unicorn/no-top-level-assignment-in-function': 'off',
      'unicorn/no-this-outside-of-class': 'off',
    },
  },
  {
    files: ['testcraft-reporter.ts'],
    rules: {
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
]);
