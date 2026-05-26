import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import pluginJs from '@eslint/js';

import { bestPracticesRule } from './rules/best-practices.rule.mjs';
import { ignoreRule } from './rules/ignore.rule.mjs';
import { importRule } from './rules/import.rule.mjs';
import { importsRule } from './rules/import-sort.rule.mjs';
import { javascriptRule } from './rules/javascript.rule.mjs';
import { typescriptRule } from './rules/typescript.rule.mjs';

const tsconfigRootDir = new URL('..', import.meta.url).pathname;

export default [
  ignoreRule,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  bestPracticesRule,
  importRule,
  importsRule,
  javascriptRule,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
  },
  typescriptRule,
  eslintPluginPrettierRecommended,
];
