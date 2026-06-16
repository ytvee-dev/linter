import simpleImportSort from 'eslint-plugin-simple-import-sort';

export const importsRule = {
  name: '@ytvee/linter/import-sort',
  plugins: {
    'simple-import-sort': simpleImportSort,
  },
  rules: {
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          ['^(?!@|\\.)'],
          ['^@\\w'],
          ['^@'],
          ['^\\u0000'],
          ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
          ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
        ],
      },
    ],
  },
};
