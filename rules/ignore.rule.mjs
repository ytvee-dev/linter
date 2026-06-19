export const ignoreRule = {
  name: 'local-eslint/ignore',
  ignores: [
    '**/node_modules',
    '**/dist',
    '**/.eslintrc*',
    '**/tsup*',
    '**/examples',
    '**/.yarn',
    '**/.git*',
    '**/*.md',
    '**/*.json',
    '**/*.yml',
    '**/Dockerfile',
    '**/.pnp.*',
  ],
};
