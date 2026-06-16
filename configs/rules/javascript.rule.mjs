export const restrictedSyntaxRules = [
  {
    selector: 'Identifier[name="Symbol"]',
    message:
      'Symbol should not be used in environments without native support (Airbnb JavaScript Style Guide, Types 1.1).',
  },
  {
    selector: 'CallExpression[callee.name="Symbol"]',
    message:
      'Symbol should not be used in environments without native support (Airbnb JavaScript Style Guide, Types 1.1).',
  },
  {
    selector: 'NewExpression[callee.name="Symbol"]',
    message:
      'Symbol should not be used in environments without native support (Airbnb JavaScript Style Guide, Types 1.1).',
  },
  {
    selector: 'Identifier[name="BigInt"]',
    message:
      'BigInt should not be used in environments without native support (Airbnb JavaScript Style Guide, Types 1.1).',
  },
  {
    selector: 'CallExpression[callee.name="BigInt"]',
    message:
      'BigInt should not be used in environments without native support (Airbnb JavaScript Style Guide, Types 1.1).',
  },
  {
    selector: 'BigIntLiteral',
    message:
      'BigInt should not be used in environments without native support (Airbnb JavaScript Style Guide, Types 1.1).',
  },
];

export const modernJavaScriptRule = {
  name: '@ytvee/linter/modern-javascript',
  files: ['**/*.{js,jsx,mjs,cjs}'],
  rules: {
    'no-var': 'error',
    'prefer-const': 'error',
  },
};

export const javascriptRule = {
  name: '@ytvee/linter/javascript',
  rules: {
    'no-restricted-syntax': ['error', ...restrictedSyntaxRules],
  },
};
