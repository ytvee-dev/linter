# How to Apply Profiles

This document explains how to use different configuration profiles from `@ytdev/linter` in your project.

## Default Zero-Config CLI Path

For the standard setup, install the package and run the CLI without creating `eslint.config.mjs`:

```bash
npm install -D @ytdev/linter
npx ytdev-linter lint
npx ytdev-linter fix
npx ytdev-linter format
npx ytdev-linter format --check
```

`ytdev-linter lint` and `ytdev-linter fix` use a project `eslint.config.*` when one exists. If no local ESLint flat config exists, they fall back to the package default non-Sonar config. Direct profile imports are the advanced path for projects that need React, strict, Sonar, React Sonar, or custom overrides through raw ESLint.

## Available Profiles

### Base Profile

The base profile includes fundamental ESLint rules, TypeScript type-checking, import management, and `eslint-config-prettier` conflict suppression. Prettier formatting runs as a separate command, not as an ESLint rule.

**What's included:**

- All `@eslint/js` recommended rules
- TypeScript rules (type-checked)
- Best Practices from Airbnb
- Import sorting
- Prettier conflict suppression
- `@typescript-eslint/no-explicit-any` is disabled (for gradual migration)

**How to use:**

```js
import baseConfig from '@ytdev/linter';

export default [...baseConfig];
```

### Strict Profile

The strict profile extends the base profile with additional constraints for larger teams and enterprise projects.

**What's added:**

- `@typescript-eslint/no-explicit-any` is enabled (error)
- Naming convention enforcement (`camelCase`/`PascalCase`)
- One public type/class/enum per file

**How to use:**

```js
import strictConfig from '@ytdev/linter/configs/strict';

export default [...strictConfig];
```

Note: The strict profile already includes all base rules, so you don't need to import the base config separately.

### React Profile

The React profile adds React-specific linting rules including JSX, hooks, and accessibility checks.

**What's added:**

- React rules (JSX syntax, components)
- React Hooks rules
- Accessibility rules (a11y)

**How to use:**

```js
import reactConfig from '@ytdev/linter/configs/react';

export default [...reactConfig];
```

Note: The React profile already includes all base rules, so you don't need to import the base config separately.

### Sonar Profile

The Sonar profile extends the base profile with generated executable SonarJS rules.

**What's added:**

- 251 deduplicated executable `eslint-plugin-sonarjs` rules
- Severity mapping from the imported SonarQube catalog
- Type-aware SonarJS rules scoped to TypeScript files
- No duplicate execution for rules already covered by the existing base config

**How to use:**

```js
import sonarConfig from '@ytdev/linter/configs/sonar';

export default [...sonarConfig];
```

SonarQube-compatible execution is provided through `eslint-plugin-sonarjs`. Plain `sonar` covers `base` plus generated SonarJS execution; React-only external mappings stay in `react` and `react-sonar`.

Package surface note: repo verification scripts and documentation sources are not included in the npm tarball.

### React Sonar Profile

The React Sonar profile extends the React profile with the same generated executable SonarJS rules.

**How to use:**

```js
import reactSonarConfig from '@ytdev/linter/configs/react-sonar';

export default [...reactSonarConfig];
```

Use this profile for JSX/TSX projects so JSX parser options and React rules are active before SonarJS checks run.
React-specific Sonar equivalents that are already mapped to `react` or `jsx-a11y` rules remain profile-specific and therefore show up in `react-sonar`, not plain `sonar`.

## Common Combinations

### Basic JavaScript/TypeScript Project

For a standard Node.js or TypeScript project without React:

```js
import baseConfig from '@ytdev/linter';

export default [...baseConfig];
```

### React Application

For a React application with standard rules:

```js
import reactConfig from '@ytdev/linter/configs/react';

export default [...reactConfig];
```

### JavaScript/TypeScript Project With SonarJS

```js
import sonarConfig from '@ytdev/linter/configs/sonar';

export default [...sonarConfig];
```

### React Application With SonarJS

```js
import reactSonarConfig from '@ytdev/linter/configs/react-sonar';

export default [...reactSonarConfig];
```

### Strict React Application

For a React application with strict rules enforced:

```js
import strictConfig from '@ytdev/linter/configs/strict';
import reactConfig from '@ytdev/linter/configs/react';

export default [
  ...strictConfig, // includes base rules + strict rules
  ...reactConfig, // adds React-specific rules (without base)
];
```

Note: When combining strict and React profiles, the order matters. The strict profile must come first to ensure base rules are applied correctly.

### React Application Without TypeScript Strict Rules

If you want React rules but not the strict TypeScript rules:

```js
import baseConfig from '@ytdev/linter';
import reactConfig from '@ytdev/linter/configs/react';

export default [...baseConfig, ...reactConfig];
```

## Custom Overrides

You can add your own rules or override existing ones:

```js
import reactConfig from '@ytdev/linter/configs/react';

export default [
  ...reactConfig,
  {
    rules: {
      // Override specific rules
      'no-console': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
];
```

## File-Specific Configuration

You can apply different rules to specific files or directories:

```js
import reactConfig from '@ytdev/linter/configs/react';

export default [
  ...reactConfig,
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      // Relax rules for test files
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['scripts/**/*.js'],
    rules: {
      // Node.js scripts specific rules
      'no-console': 'off',
    },
  },
];
```

## Migration Strategy

### Gradual Migration to Strict Rules

If you're migrating an existing codebase, start with the base profile:

```js
// Step 1: Start with base profile
import baseConfig from '@ytdev/linter';

export default [...baseConfig];
```

Once all issues are fixed, move to strict:

```js
// Step 2: Enable strict rules
import strictConfig from '@ytdev/linter/configs/strict';

export default [...strictConfig];
```

### Temporary Rule Disabling

During migration, you can temporarily disable specific rules:

```js
import strictConfig from '@ytdev/linter/configs/strict';

export default [
  ...strictConfig,
  {
    rules: {
      // Temporarily disable until migration is complete
      '@typescript-eslint/naming-convention': 'warn', // downgrade to warning
    },
  },
];
```

## Troubleshooting

### TypeScript Project Service

If you encounter issues with TypeScript linting, ensure you have a valid `tsconfig.json` in your project root. The config uses `projectService` which automatically detects your TypeScript configuration.

### Performance Issues

For large projects, you may want to exclude certain directories:

```js
import reactConfig from '@ytdev/linter/configs/react';

export default [{ ignores: ['**/build/**', '**/dist/**', '**/.next/**'] }, ...reactConfig];
```

### Conflicting Rules

If you experience conflicts with other ESLint configs or plugins, make sure to:

1. Place `@ytdev/linter` configs first
2. Add your custom rules last
3. Use explicit overrides for conflicting rules

```js
import reactConfig from '@ytdev/linter/configs/react';
import someOtherConfig from 'eslint-config-other';

export default [
  ...reactConfig,
  ...someOtherConfig,
  {
    rules: {
      // Explicit override to resolve conflict
      'some-rule': 'error',
    },
  },
];
```
