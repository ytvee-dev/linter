import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import pluginJs from '@eslint/js';

import { bestPracticesRule } from './rules/best-practices.rule.mjs';
import { ignoreRule } from './rules/ignore.rule.mjs';
import { importRule } from './rules/import.rule.mjs';
import { importsRule } from './rules/import-sort.rule.mjs';
import { javascriptRule, modernJavaScriptRule } from './rules/javascript.rule.mjs';
import { typescriptRule } from './rules/typescript.rule.mjs';

const tsconfigRootDir = process.cwd();
const eslintRecommended = { ...pluginJs.configs.recommended, name: '@eslint/js/recommended' };
const prettierConflictSuppressions = { ...eslintConfigPrettier, name: 'eslint-config-prettier' };

export default [
  ignoreRule,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  eslintRecommended,
  bestPracticesRule,
  modernJavaScriptRule,
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
  prettierConflictSuppressions,
];
