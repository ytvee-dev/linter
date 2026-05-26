# Linter Style Guide

This document summarizes the `@ytvee-dev/eslint-config-react` profile and explains which rules you get out of the box. For the complete list with details and examples, see [README_RULES.md](README_RULES.md).

## Table of Contents

- [Basic Principles](#basic-principles)
- [TypeScript Additions](#typescript-additions)
- [Best Practices from Airbnb](#best-practices-from-airbnb)
- [Profiles](#profiles)
- [Autofix](#autofix)
- [License](#license)

## Basic Principles

### Recommended ESLint Rules

The configuration includes the complete set of `@eslint/js` recommended rules:

- **Code Correctness**: Protection against duplicates, class errors, incorrect constructs
- **Security**: Disallow eval, dangerous prototype operations, unsafe operations
- **Code Quality**: Control of unused variables, correct async/await, working with promises

### TypeScript in Type-Checked Mode

Uses `typescript-eslint` with the `recommendedTypeChecked` set:

- **Type Safety**: Protection against `no-unsafe-*` operations (assignment, call, return, member-access)
- **Async Operations**: `await-thenable`, `no-floating-promises`, `require-await`
- **Type Purity**: Disallow duplicates, unnecessary assertions, unsafe enum comparisons
- **Syntax**: Restrictions on namespace, triple-slash references

### Formatting with Prettier

`eslint-plugin-prettier/recommended` applies settings from `prettier.js`:

- Line width: **120 characters**
- Quotes: **single** (`'`)
- Semicolons: **required** (`;`)
- Indentation: **2 spaces**
- Trailing comma: **always** in multiline structures

Formatting violations are shown as linter **errors** and automatically fixed.

### Import Management

#### eslint-plugin-import

- Disallow duplicate imports (`no-duplicate-imports`)
- Disallow extensions for JS/TS files (`import/extensions`)

#### eslint-plugin-simple-import-sort

Automatic import sorting by groups:

1. **External dependencies** - npm packages (`react`, `express`)
2. **Namespace packages** - packages with `@` (`@internal/logger`)
3. **Absolute aliases** - paths with `@/` (`@/components/Button`)
4. **Side-effect imports** - CSS, polyfills (`./styles.css`)
5. **Ascending relative** - parent directories (`../parent/module`)
6. **Same-level relative** - current directory (`./helper`)

### Safe Primitives

`no-restricted-syntax` blocks `Symbol` and `BigInt` in environments without native support, ensuring compatibility with target environments.

## TypeScript Additions

Custom rules on top of the recommended set:

### `@typescript-eslint/explicit-function-return-type`

All functions must explicitly specify the return type.

```ts
// Good
function sum(a: number, b: number): number {
  return a + b;
}

// Bad
function sum(a: number, b: number) {
  return a + b;
}
```

### `@typescript-eslint/consistent-type-definitions`

Prefer `interface` for object types instead of `type`.

```ts
// Good
interface User {
  name: string;
}

// Bad
type User = {
  name: string;
};
```

### `@typescript-eslint/no-floating-promises`

Every promise must be handled: `await`, `.then()/.catch()` or explicit `void`.

```ts
// Good
await fetchData();
void fetchData();

// Bad
fetchData();
```

### `@typescript-eslint/no-unused-vars`

Unused variables/parameters are disallowed, except those starting with `_`.

```ts
// Good
const { name, ...rest } = user;
const onClick = (_event: Event) => {};

// Bad
const unused = 1;
```

### `@typescript-eslint/explicit-member-accessibility`

Always specify access modifiers (`public`, `protected`, `private`) for class members (except constructors).

```ts
// Good
class User {
  public name: string;
  private age: number;
}

// Bad
class User {
  name: string;
  age: number;
}
```

### `@typescript-eslint/member-ordering`

Fixed order of class elements:

1. Signatures
2. Static fields (public → protected → private)
3. Instance fields (public → protected → private)
4. Constructors (public → protected → private)
5. Static methods (public → protected → private)
6. Instance methods (public → protected → private)

## Best Practices from Airbnb

The configuration includes key rules from the Airbnb JavaScript Style Guide:

### Variables

- `no-var` - use `const`/`let`
- `prefer-const` - `const` for immutable variables

### Functions and Arrow Functions

- `prefer-arrow-callback` - arrow functions for callbacks
- `arrow-body-style` - implicit return in arrow functions
- `arrow-parens` - always parentheses around parameters

### Objects and Arrays

- `no-new-object` - object literals `{}`
- `object-shorthand` - shorthand syntax
- `quote-props` - quotes only when needed
- `prefer-destructuring` - destructuring
- `array-callback-return` - mandatory return in array methods

### Strings

- `prefer-template` - template strings instead of concatenation
- `template-curly-spacing` - no spaces in `${}`
- `no-useless-concat` - disallow useless concatenation

### Comparisons and Operators

- `eqeqeq` - strict comparison `===`
- `no-nested-ternary` - warning about nested ternaries
- `no-unneeded-ternary` - disallow unnecessary ternaries
- `no-mixed-operators` - explicit operator priority

### Security

- `no-eval` - disallow eval()
- `no-new-func` - disallow new Function
- `no-implied-eval` - disallow implicit eval
- `no-extend-native` - disallow extending native objects
- `no-iterator`, `no-proto` - disallow deprecated APIs

### Code Style

- `semi` - mandatory semicolons
- `brace-style` - 1tbs brace style
- `comma-style` - comma at end of line
- `comma-dangle` - trailing comma in multiline structures
- `spaced-comment` - space after `//` or `/*`

### Modules

- `no-duplicate-imports` - combine imports from one module
- `no-restricted-exports` - disallow exporting `default` as named and `then`

## Profiles

### Base (`eslint.config.mjs`)

Includes all rules listed above:

- ESLint recommended
- TypeScript type-checked
- Best Practices (Airbnb)
- Import sorting
- Prettier formatting
- `@typescript-eslint/no-explicit-any` disabled (for gradual migration)

```js
import baseConfig from '@ytvee-dev/eslint-config-react';

export default [...baseConfig];
```

### Strict (`configs/strict.mjs`)

Base profile plus additional constraints:

- Disallow `any` (`@typescript-eslint/no-explicit-any`)
- Naming convention `camelCase`/`PascalCase`
- One public type/class/enum per file

```js
import strictConfig from '@ytvee-dev/eslint-config-react/configs/strict';

export default [...strictConfig];
```

### React (`configs/react.mjs`)

Base profile plus React/JSX/a11y rules:

#### React Rules

- `react/jsx-filename-extension` - JSX only in `.jsx`/`.tsx`
- `react/jsx-boolean-value` - boolean props without value
- `react/self-closing-comp` - self-closing tags
- `react/jsx-key` - keys in lists
- `react/jsx-no-duplicate-props` - disallow duplicate props

#### React Hooks

- `react-hooks/rules-of-hooks` - rules of hooks (error)
- `react-hooks/exhaustive-deps` - complete dependencies (warning)

#### Accessibility (a11y)

- `jsx-a11y/alt-text` - alt for images
- `jsx-a11y/anchor-is-valid` - correct links
- `jsx-a11y/click-events-have-key-events` - keyboard events
- `jsx-a11y/no-autofocus` - autofocus limitation
- `jsx-a11y/no-noninteractive-element-interactions` - events on interactive elements
- `jsx-a11y/no-static-element-interactions` - roles for static elements

```js
import reactConfig from '@ytvee-dev/eslint-config-react/configs/react';

export default [...reactConfig];
```

### Combining Profiles

You can combine profiles:

```js
import baseConfig from '@ytvee-dev/eslint-config-react';
import strictConfig from '@ytvee-dev/eslint-config-react/configs/strict';
import reactConfig from '@ytvee-dev/eslint-config-react/configs/react';

// Base rules only
export default [...baseConfig];

// React application with base rules
export default [...baseConfig, ...reactConfig];

// Strict rules (includes base)
export default [...strictConfig];

// Strict React rules
// Note: strictConfig already includes baseConfig
export default [...strictConfig, ...reactConfig];
```

For detailed information on applying profiles, see [PROFILES.md](PROFILES.md).

## Autofix

Most rules support automatic fixing:

### What is Automatically Fixed

- **Formatting** - Prettier fixes indentation, quotes, semicolons
- **Imports** - automatic sorting by groups
- **var → const/let** - replacing deprecated var
- **Arrow functions** - simplifying function body
- **Trailing comma** - adding comma in multiline structures
- **object-shorthand** - shortening object syntax
- **template literals** - replacing concatenation with template strings
- **Property quotes** - removing unnecessary quotes
- **React** - self-closing tags, boolean props

### Running Autofix

```bash
# Fix all auto-fixable errors
npm run lint:fix
# or
yarn lint:fix

# Fix a specific file
npx eslint src/file.ts --fix
```

### What Requires Manual Fixing

- `no-unused-vars` - removing unused variables
- `@typescript-eslint/no-floating-promises` - adding await/void
- `react-hooks/exhaustive-deps` - adding dependencies to useEffect
- `@typescript-eslint/explicit-function-return-type` - specifying return types
- Accessibility rules - adding alt, role, aria attributes

## Differences from Airbnb

### What's Included from Airbnb

- Best Practices rules (variables, functions, objects, arrays, strings)
- Code style (semicolons, braces, commas, spacing)
- Security (no-eval, no-new-func, no-extend-native)
- Comparisons and operators (eqeqeq, no-nested-ternary)

### What's Changed

#### Formatting via Prettier

Instead of Airbnb's formatting rules, Prettier is used:

- Unified style for JS/TS/JSX/TSX
- Automatic fixing
- No conflicts between rules

#### TypeScript Instead of Flow

- Full type safety via `typescript-eslint`
- Type-checked rules to protect against runtime errors
- No need for Babel or runtime shims

#### Different Import Sorting

Instead of `import/order`, `eslint-plugin-simple-import-sort` is used:

- More flexible grouping
- Support for `@/` aliases
- Automatic fixing

#### Modular Structure

- Base profile without React
- Separate React profile
- Strict profile for large teams

#### Optional any Disallow

In the base profile, `any` is allowed for gradual migration. Enabled in strict profile.

## License

The package is distributed under the MIT license. Full text is available in the [LICENSE](../LICENSE) file.
