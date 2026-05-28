export const bestPracticesRule = {
  name: '@ytdev/linter/best-practices',
  rules: {
    'no-shadow': 'off',
    'no-eval': 'error',
    'no-new-func': 'error',
    'no-return-assign': ['error', 'always'],
    'no-return-await': 'off',
    'no-param-reassign': ['error', { props: false }],
    'no-useless-return': 'error',
    'no-else-return': ['error', { allowElseIf: false }],
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'no-iterator': 'error',
    'no-new-wrappers': 'error',
    'no-proto': 'error',
    'no-extend-native': 'error',
    'no-new-object': 'error',
    'object-shorthand': ['error', 'always', { ignoreConstructors: false, avoidQuotes: true }],
    'dot-notation': 'off',
    'array-callback-return': ['error', { allowImplicit: true, checkForEach: false }],
    'prefer-destructuring': [
      'error',
      {
        VariableDeclarator: {
          array: false,
          object: true,
        },
        AssignmentExpression: {
          array: false,
          object: false,
        },
      },
      {
        enforceForRenamedProperties: false,
      },
    ],
    'prefer-template': 'error',
    'no-useless-concat': 'error',
    'prefer-arrow-callback': ['error', { allowNamedFunctions: false, allowUnboundThis: true }],
    'arrow-body-style': ['error', 'as-needed', { requireReturnForObjectLiteral: false }],
    'no-useless-constructor': 'off',
    'no-dupe-class-members': 'off',
    'no-restricted-exports': [
      'error',
      {
        restrictedNamedExports: ['default', 'then'],
      },
    ],
    'no-restricted-imports': [
      'error',
      {
        paths: [],
        patterns: [],
      },
    ],
    'no-nested-ternary': 'warn',
    'no-unneeded-ternary': ['error', { defaultAssignment: false }],
    'spaced-comment': [
      'error',
      'always',
      {
        line: {
          exceptions: ['-', '+'],
          markers: ['=', '!', '/'],
        },
        block: {
          exceptions: ['-', '+'],
          markers: ['=', '!', ':', '::'],
          balanced: true,
        },
      },
    ],
    radix: 'error',
    'no-new': 'error',
  },
};
