# Linter Rules Used in the Project

This document describes all rules actually enabled in `@ytvee-dev/eslint-config-react`, following the style of the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript). Below are listed profiles, constraints, and ignored files with examples for each rule.

## Table of Contents

- [Ignored Paths](#ignored-paths)
- [Base Profile (JavaScript + TypeScript)](#base-profile-javascript--typescript)
  - [Common Rules @eslint/js](#common-rules-eslintjs-config-recommended)
  - [Best Practices (Airbnb)](#best-practices-airbnb)
  - [Imports](#imports)
  - [Formatting (Prettier)](#formatting-prettier--eslint-plugin-prettierrecommended)
  - [TypeScript Rules](#typescript-rules-eslint-config-recommendedtypechecked)
  - [Custom TypeScript Rules](#custom-ts-enhancements-on-top-of-recommended)
- [React Profile](#react-profile-configsreactmjs)
- [Strict Profile](#strict-profile-configsstrictmjs)
- [SonarQube Profiles](#sonarqube-profiles)

## Ignored Paths

The linter doesn't check auxiliary artifacts and build files:

- `node_modules`, `dist`, `.yarn`, `.git*`, `examples`
- Linter and formatter configuration files: `.eslintrc*`, `.prettier*`
- Build utility types: `tsup*`, `Dockerfile`, any `*.md`, `*.json`, `*.yml`
- Yarn PnP files: `.pnp.*`

---

## SonarQube Profiles

The SonarQube import is represented by two generated artifacts:

- `configs/sonar-catalog.generated.json` contains compact metadata for all 1095 imported frontend rules.
- `configs/rules/sonar.generated.mjs` contains the deduplicated executable ESLint rule profile.

Coverage summary:

- `sonarjs`: 470 catalog records backed by `eslint-plugin-sonarjs`.
- `external-eslint`: 79 catalog records already covered by existing enabled ESLint rules.
- `metadata-only`: 479 catalog records without a reliable ESLint execution path in this package.
- `deprecated`: 67 SonarQube rules retained as metadata but never enabled.

The executable Sonar profile enables 251 unique `sonarjs/*` rules. Rules that require type information are scoped to TypeScript files. CSS and HTML/Web SonarQube rules are metadata-only until a supported analyzer path is added.

Usage:

```js
import sonarConfig from '@ytvee-dev/eslint-config-react/configs/sonar';
import reactSonarConfig from '@ytvee-dev/eslint-config-react/configs/react-sonar';

export default [...reactSonarConfig];
```

---

## Base Profile (JavaScript + TypeScript)

The `eslint.config.mjs` profile combines recommendations from `@eslint/js`, the `typescript-eslint` set in type-checked mode, and additional rules for imports and formatting. All rules in this section apply to `.js/.mjs/.ts/.tsx` files unless otherwise specified.

### Common Rules @eslint/js (config `recommended`)

These rules are automatically enabled via `pluginJs.configs.recommended` and protect against common errors.

#### Class and Constructor Correctness

- `constructor-super` - calling super() in constructors
- `no-class-assign` - disallow reassigning class declarations
- `no-dupe-class-members` - disallow duplicate class members
- `no-this-before-super` - disallow this/super before calling super()
- `no-unused-private-class-members` - disallow unused private class members
- `getter-return` - enforce return statements in getters

#### Control Flow Safety

- `no-cond-assign` - disallow assignment in conditionals
- `no-constant-binary-expression` - disallow constant binary expressions
- `no-constant-condition` - disallow constant conditions
- `no-unexpected-multiline` - protection against unexpected multiline expressions
- `no-unreachable` - disallow unreachable code
- `no-unsafe-finally` - disallow control flow in finally blocks
- `require-yield` - generators must contain yield
- `for-direction` - correct direction of for loops

#### Protection Against Syntax and RegExp Errors

- `no-control-regex` - disallow control characters in regular expressions
- `no-empty-character-class` - disallow empty character classes in regular expressions
- `no-fallthrough` - disallow fallthrough in switch statements
- `no-invalid-regexp` - disallow invalid regular expressions
- `no-misleading-character-class` - disallow misleading characters in regular expressions
- `no-regex-spaces` - disallow multiple spaces in regular expressions
- `no-useless-backreference` - disallow useless backreferences
- `no-irregular-whitespace` - disallow irregular whitespace

#### Clean Code Without Duplicates

- `no-dupe-args` - disallow duplicate arguments
- `no-dupe-else-if` - disallow duplicate else-if conditions
- `no-dupe-keys` - disallow duplicate object keys
- `no-duplicate-case` - disallow duplicate case in switch
- `no-empty` - disallow empty blocks
- `no-empty-pattern` - disallow empty destructuring patterns
- `no-empty-static-block` - disallow empty static blocks
- `no-extra-boolean-cast` - disallow unnecessary boolean casts

#### Working with Variables

- `no-delete-var` - disallow deleting variables
- `no-shadow-restricted-names` - disallow shadowing restricted names
- `no-undef` - disallow undefined variables
- `no-unused-labels` - disallow unused labels
- `no-unused-vars` - overridden by TypeScript version
- `no-self-assign` - disallow self-assignment

#### Safe Numbers and Comparisons

- `no-compare-neg-zero` - disallow comparing against -0
- `no-loss-of-precision` - disallow loss of precision in numbers
- `use-isnan` - use isNaN for NaN checks
- `valid-typeof` - correct strings for typeof

#### Promise and Async Correctness

- `no-async-promise-executor` - disallow async in promise executor
- `no-unsafe-optional-chaining` - safe optional chaining
- `no-unsafe-negation` - safe negation

### Best Practices (Airbnb)

These rules are based on the Airbnb JavaScript Style Guide and include development best practices.

#### `no-var` - Use const/let Instead of var

**Description:** Disallows using `var`, requires `const` or `let`.

```js
// Good
const x = 1;
let y = 2;

// Bad
var x = 1;
```

#### `prefer-const` - Prefer const for Non-reassigned Variables

**Description:** If a variable is not reassigned, use `const`.

```js
// Good
const name = 'John';
let count = 0;
count += 1;

// Bad
let name = 'John'; // never changed
```

#### `no-eval` - Disallow Using eval()

**Description:** `eval()` is dangerous and can execute arbitrary code.

```js
// Good
const result = calculate(x, y);

// Bad
const result = eval('x + y');
```

#### `no-new-func` - Disallow Creating Functions via new Function

**Description:** Similar to eval, creating functions from strings is unsafe.

```js
// Good
const add = (a, b) => a + b;

// Bad
const add = new Function('a', 'b', 'return a + b');
```

#### `no-return-assign` - Disallow Assignment in return

**Description:** Assignment in return can be confusing.

```js
// Good
function getValue(num) {
  const result = num * 2;
  return result;
}

// Bad
function getValue(num) {
  return (result = num * 2);
}
```

#### `no-param-reassign` - Disallow Reassigning Parameters

**Description:** Disallows modifying function parameters (but allows modifying their properties).

```js
// Good
function addProperty(obj) {
  obj.newProp = 'value'; // modifying properties is allowed
  return obj;
}

function increment(num) {
  return num + 1;
}

// Bad
function increment(num) {
  num += 1; // parameter reassignment is disallowed
  return num;
}
```

#### `no-useless-return` - Disallow Useless return

**Description:** Removes redundant return at the end of a function.

```js
// Good
function doSomething() {
  console.log('done');
}

// Bad
function doSomething() {
  console.log('done');
  return;
}
```

#### `no-else-return` - Disallow else After return

**Description:** If if contains return, else is unnecessary.

```js
// Good
function getValue(condition) {
  if (condition) {
    return 'yes';
  }
  return 'no';
}

// Bad
function getValue(condition) {
  if (condition) {
    return 'yes';
  } else {
    return 'no';
  }
}
```

#### `eqeqeq` - Strict Comparison === Instead of ==

**Description:** Always use `===` and `!==` instead of `==` and `!=` (except when comparing with null).

```js
// Good
if (x === 10) {
}
if (x == null) {
} // allowed for null/undefined

// Bad
if (x == 10) {
}
```

#### `no-iterator` - Disallow Using **iterator**

**Description:** `__iterator__` is deprecated, use ES6 iterators.

```js
// Good
for (const item of array) {
}

// Bad
obj.__iterator__ = function () {};
```

#### `no-proto` - Disallow Using **proto**

**Description:** Use `Object.getPrototypeOf()` instead of `__proto__`.

```js
// Good
const proto = Object.getPrototypeOf(obj);

// Bad
const proto = obj.__proto__;
```

#### `no-extend-native` - Disallow Extending Native Objects

**Description:** Don't modify prototypes of built-in objects.

```js
// Good
function getLastElement(arr) {
  return arr[arr.length - 1];
}

// Bad
Array.prototype.last = function () {
  return this[this.length - 1];
};
```

#### `no-new-object` - Use Object Literals

**Description:** Use `{}` instead of `new Object()`.

```js
// Good
const obj = {};

// Bad
const obj = new Object();
```

#### `object-shorthand` - Shorthand Syntax for Objects

**Description:** Use shorthand notation for methods and properties.

```js
// Good
const obj = {
  name,
  getValue() {
    return 1;
  },
};

// Bad
const obj = {
  name: name,
  getValue: function () {
    return 1;
  },
};
```

#### `quote-props` - Quotes for Object Properties Only When Needed

**Description:** Don't wrap keys in quotes unless required.

```js
// Good
const obj = {
  name: 'John',
  'full-name': 'John Doe',
};

// Bad
const obj = {
  name: 'John',
};
```

#### `array-callback-return` - Mandatory return in Array Methods

**Description:** Callbacks in map/filter/reduce must return a value.

```js
// Good
const doubled = array.map((x) => x * 2);
array.forEach((x) => console.log(x));

// Bad
const doubled = array.map((x) => {
  x * 2; // no return
});
```

#### `prefer-destructuring` - Prefer Destructuring

**Description:** Use destructuring to extract object properties.

```js
// Good
const { name, age } = user;

// Bad
const name = user.name;
const age = user.age;
```

#### `prefer-template` - Use Template Strings

**Description:** Use template literals instead of string concatenation.

```js
// Good
const message = `Hello, ${name}!`;

// Bad
const message = 'Hello, ' + name + '!';
```

#### `template-curly-spacing` - No Spaces in Template Literals

**Description:** Don't add spaces inside `${}`.

```js
// Good
const message = `Hello, ${name}!`;

// Bad
const message = `Hello, ${name}!`;
```

#### `no-useless-concat` - Disallow Useless Concatenation

**Description:** Don't concatenate literals that can be combined.

```js
// Good
const message = 'Hello World';

// Bad
const message = 'Hello ' + 'World';
```

#### `prefer-arrow-callback` - Prefer Arrow Functions in Callbacks

**Description:** Use arrow functions for short callbacks.

```js
// Good
array.map((x) => x * 2);

// Bad (if this is not needed)
array.map(function (x) {
  return x * 2;
});
```

#### `arrow-body-style` - Implicit return in Arrow Functions

**Description:** If the arrow function body is a single expression, omit `{}` and `return`.

```js
// Good
const double = (x) => x * 2;

// Bad
const double = (x) => {
  return x * 2;
};
```

#### `arrow-parens` - Always Parentheses Around Arrow Function Parameters

**Description:** Always wrap parameters in parentheses.

```js
// Good
const double = (x) => x * 2;

// Bad
const double = (x) => x * 2;
```

#### `no-restricted-exports` - Disallow Exporting Certain Names

**Description:** Disallows exporting `default` as a named export and `then` (for promise compatibility).

```js
// Good
export const value = 42;
export default MyComponent;

// Bad
export { default } from './module';
export const then = () => {};
```

#### `no-nested-ternary` - Warning About Nested Ternary Operators

**Description:** Nested ternaries are hard to read.

```js
// Good
let value;
if (condition1) {
  value = 'a';
} else if (condition2) {
  value = 'b';
} else {
  value = 'c';
}

// Warning (bad)
const value = condition1 ? 'a' : condition2 ? 'b' : 'c';
```

#### `no-unneeded-ternary` - Disallow Unnecessary Ternary Operators

**Description:** Don't use ternary if you can do without it.

```js
// Good
const isActive = !!value;

// Bad
const isActive = value ? true : false;
```

#### `no-mixed-operators` - Explicit Operator Priority

**Description:** Use parentheses for clarity when mixing operators.

```js
// Good
const result = (a + b) * c;
const result = (a && b) || c;

// Bad
const result = a + b * c; // not obvious
const result = a && b / c;
```

#### `brace-style` - Brace Style

**Description:** Opening brace on the same line (1tbs style).

```js
// Good
if (condition) {
  doSomething();
}

// Bad
if (condition) {
  doSomething();
}
```

#### `spaced-comment` - Space After // or /\*

**Description:** Always add a space after the comment start.

```js
// Good
// This is a comment
/* This is a block comment */

// Bad
//This is a comment
/*This is a block comment*/
```

#### `comma-style` - Comma at End of Line

**Description:** Commas should be at the end of the line, not at the beginning of the next.

```js
// Good
const obj = {
  a: 1,
  b: 2,
};

// Bad
const obj = {
  a: 1,
  b: 2,
};
```

#### `comma-dangle` - Trailing Comma in Multiline Structures

**Description:** Always add a comma after the last element in multiline structures.

```js
// Good
const obj = {
  a: 1,
  b: 2,
};

const arr = [1, 2];

// Bad
const obj = {
  a: 1,
  b: 2,
};
```

#### `radix` - Explicit Radix in parseInt

**Description:** Always specify the second radix parameter for parseInt.

```js
// Good
const num = parseInt('10', 10);

// Bad
const num = parseInt('10');
```

#### `no-new` - Disallow new Without Assignment

**Description:** Don't call constructor without saving the result.

```js
// Good
const instance = new MyClass();

// Bad
new MyClass();
```

### Explicit Semicolons (`semi`)

**Description:** All statements end with a semicolon.

```js
// Good
const sum = a + b;
doSomething();

// Bad
const sum = a + b;
doSomething();
```

### Disallow Symbol and BigInt Without Environment Support (`no-restricted-syntax`)

**Description:** Using `Symbol` and `BigInt` is blocked if the environment may not support them.

```js
// Good (if environment supports)
// const sym = Symbol('key');

// Bad (if environment doesn't support)
const sym = Symbol('key');
const big = 123n;
```

### Imports

#### `no-duplicate-imports` - Don't Duplicate Imports

**Description:** Combine imports from one module into a single import.

```js
// Good
import { foo, bar } from 'module';

// Bad
import { foo } from 'module';
import { bar } from 'module';
```

#### `import/extensions` - Don't Specify Extensions for JS/TS Files

**Description:** For `js/jsx/ts/tsx` the extension is omitted.

```js
// Good
import Button from './Button';
import utils from '@/utils';

// Bad
import Button from './Button.tsx';
import utils from '@/utils.ts';
```

#### `simple-import-sort/imports` - Import Sorting

**Description:** Imports are automatically sorted into groups:

1. External dependencies (`react`, `express`, etc.)
2. Namespace from `@*` packages (`@internal/logger`)
3. Absolute `@/...` aliases (`@/components/Button`)
4. Side-effect imports (`./styles.css`)
5. Ascending relative (`../parent/module`)
6. Same-level relative (`./helper`)

```js
// Good
import express from 'express';
import { useState } from 'react';

import { logger } from '@internal/logger';

import { Button } from '@/components/Button';

import './styles.css';

import { something } from '../parent/module';

import { helper } from './helper';

// Bad (wrong order)
import './styles.css';
import { Button } from '@/components/Button';
import express from 'express';
import { helper } from './helper';
```

### Formatting (Prettier + `eslint-plugin-prettier/recommended`)

**Description:** All Prettier violations are shown as ESLint errors. Settings:

- Line width: 120 characters
- Quotes: single
- Semicolon: required
- Indentation: 2 spaces
- Trailing comma: always in multiline structures

```js
// Good
const obj = {
  name: 'John',
  age: 30,
};

const message = `Hello, ${name}!`;

// Bad
const obj = {
  name: 'John',
  age: 30,
};

const message = `Hello, ${name}!`;
```

### TypeScript-eslint Rules (config `recommendedTypeChecked`)

These rules are automatically enabled via `tseslint.configs.recommendedTypeChecked` and apply only to `.ts/.tsx` files.

#### Safe Async Operations

- `@typescript-eslint/await-thenable` - await only for thenable
- `@typescript-eslint/no-floating-promises` - handle all promises
- `@typescript-eslint/no-for-in-array` - don't use for-in for arrays
- `@typescript-eslint/no-implied-eval` - disallow implicit eval
- `@typescript-eslint/no-misused-promises` - correct promise usage
- `@typescript-eslint/require-await` - async functions must contain await
- `@typescript-eslint/unbound-method` - methods must be called with correct context

#### Strict Types and No Unsafe Constructs

- `@typescript-eslint/no-unsafe-argument` - type-safe arguments
- `@typescript-eslint/no-unsafe-assignment` - type-safe assignment
- `@typescript-eslint/no-unsafe-call` - type-safe calls
- `@typescript-eslint/no-unsafe-declaration-merging` - safe declaration merging
- `@typescript-eslint/no-unsafe-enum-comparison` - safe enum comparison
- `@typescript-eslint/no-unsafe-function-type` - safe function types
- `@typescript-eslint/no-unsafe-member-access` - safe member access
- `@typescript-eslint/no-unsafe-return` - type-safe return
- `@typescript-eslint/no-base-to-string` - safe string conversion

#### Type Purity

- `@typescript-eslint/no-duplicate-enum-values` - disallow duplicates in enum
- `@typescript-eslint/no-duplicate-type-constituents` - disallow duplicates in union/intersection
- `@typescript-eslint/no-empty-object-type` - disallow empty object types
- `@typescript-eslint/no-non-null-asserted-optional-chain` - disallow `!` after optional chain
- `@typescript-eslint/no-extra-non-null-assertion` - disallow extra `!`
- `@typescript-eslint/no-redundant-type-constituents` - disallow redundant types
- `@typescript-eslint/no-unnecessary-type-assertion` - disallow unnecessary as
- `@typescript-eslint/no-unnecessary-type-constraint` - disallow unnecessary extends
- `@typescript-eslint/prefer-as-const` - prefer as const

#### Syntax Restrictions

- `@typescript-eslint/no-namespace` - don't use namespace (except .d.ts)
- `@typescript-eslint/triple-slash-reference` - disallow /// <reference>
- `@typescript-eslint/prefer-namespace-keyword` - use namespace instead of module

### Custom TS Enhancements on Top of Recommended

These rules are added in addition to TypeScript recommended and apply only to `.ts/.tsx` files.

#### `@typescript-eslint/explicit-function-return-type` - Explicit Function Return Type

**Description:** All functions must explicitly specify the return type.

```ts
// Good
function sum(a: number, b: number): number {
  return a + b;
}

const multiply = (a: number, b: number): number => a * b;

// Bad
function sum(a: number, b: number) {
  return a + b;
}
```

#### `@typescript-eslint/consistent-type-definitions` - Prefer interface

**Description:** Use `interface` for object types instead of `type`.

```ts
// Good
interface User {
  name: string;
  age: number;
}

type ID = string | number; // type for union/intersection

// Bad
type User = {
  name: string;
  age: number;
};
```

#### `@typescript-eslint/no-floating-promises` - Mandatory Promise Handling

**Description:** Every promise must be handled (await, .then/.catch, void).

```ts
// Good
await fetchData();

fetchData().then(handleData).catch(handleError);

void fetchData(); // explicit ignoring

// Bad
fetchData(); // promise not handled
```

#### `@typescript-eslint/no-unused-vars` - Control Unused Variables

**Description:** Unused variables/parameters are disallowed, except those starting with `_`.

```ts
// Good
const { name, ...rest } = user;
const onClick = (_event: Event) => {};

// Bad
const unused = 1; // variable not used
function handler(event: Event) {} // parameter not used
```

#### `@typescript-eslint/explicit-member-accessibility` - Explicit Access Modifiers

**Description:** Always specify `public`, `protected`, or `private` for class members.

```ts
// Good
class User {
  public name: string;
  private age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  public getName(): string {
    return this.name;
  }
}

// Bad
class User {
  name: string; // no modifier
  age: number;
}
```

#### `@typescript-eslint/member-ordering` - Class Member Order

**Description:** Class members must be ordered: signatures → static fields → instance fields → constructors → methods.

```ts
// Good
class User {
  // Static fields
  public static defaultName: string = 'Guest';
  private static instances: number = 0;

  // Instance fields
  public name: string;
  private age: number;

  // Constructor
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  // Static methods
  public static getInstanceCount(): number {
    return User.instances;
  }

  // Instance methods
  public getName(): string {
    return this.name;
  }
}

// Bad (wrong order)
class User {
  constructor() {} // constructor at the beginning
  public name: string; // fields after constructor
  public static instances = 0; // static fields at the end
}
```

---

## React Profile (`configs/react.mjs`)

Activated for `.jsx` and `.tsx` files and adds `react`, `react-hooks`, `jsx-a11y` plugins.

### `react/jsx-filename-extension` - File Extensions with JSX

**Description:** JSX is only allowed in `.jsx` and `.tsx` files.

```tsx
// Good (Button.tsx file)
export const Button = () => <button>Click</button>;

// Bad (Button.ts file with JSX)
export const Button = () => <button>Click</button>;
```

### `react/jsx-boolean-value` - Boolean Props Without Value

**Description:** For `true` value, don't explicitly specify `={true}`.

```tsx
// Good
<Button disabled />

// Bad
<Button disabled={true} />
```

### `react/self-closing-comp` - Self-closing Tags

**Description:** If a component has no children, use a self-closing tag.

```tsx
// Good
<Button />
<div className="empty" />

// Bad
<Button></Button>
<div className="empty"></div>
```

### `react/jsx-key` - Keys in Lists

**Description:** Elements in arrays must have a unique `key` prop.

```tsx
// Good
{
  items.map((item) => <div key={item.id}>{item.name}</div>);
}

// Bad
{
  items.map((item) => <div>{item.name}</div>);
}
```

### `react/jsx-no-duplicate-props` - Disallow Duplicate Props

**Description:** Don't duplicate props in one component.

```tsx
// Good
<Button disabled={isDisabled} />

// Bad
<Button disabled disabled={false} />
```

### `react-hooks/rules-of-hooks` - Rules of Hooks

**Description:** Hooks must only be called at the top level and only in functional components/hooks.

```tsx
// Good
function Component() {
  const [state, setState] = useState(0);
  return <div>{state}</div>;
}

// Bad
function Component() {
  if (condition) {
    const [state, setState] = useState(0); // hook inside condition
  }
}
```

### `react-hooks/exhaustive-deps` - Complete Effect Dependencies

**Description:** In the dependency array of useEffect/useCallback/useMemo, all used variables must be included.

```tsx
// Good
useEffect(() => {
  fetchData(userId);
}, [userId]);

// Warning (bad)
useEffect(() => {
  fetchData(userId);
}, []); // userId must be in dependencies
```

### Accessibility Rules (jsx-a11y)

#### `jsx-a11y/alt-text` - Alt Text for Images

**Description:** All `<img>` must have an `alt` attribute.

```tsx
// Good
<img src="photo.jpg" alt="User photo" />

// Warning (bad)
<img src="photo.jpg" />
```

#### `jsx-a11y/anchor-is-valid` - Correct Links

**Description:** `<a>` must have `href` or a correct handler.

```tsx
// Good
<a href="/page">Link</a>
<button onClick={handler}>Button</button>

// Warning (bad)
<a onClick={handler}>Link</a>
```

#### `jsx-a11y/click-events-have-key-events` - Keyboard Events

**Description:** Elements with `onClick` must have keyboard handlers.

```tsx
// Good
<div onClick={handler} onKeyPress={handler} role="button" tabIndex={0} />

// Warning (bad)
<div onClick={handler} />
```

#### `jsx-a11y/no-autofocus` - Autofocus Limitation

**Description:** Use `autoFocus` only when necessary for UX.

```tsx
// Good
<input /> // without autofocus

// Warning (bad)
<input autoFocus />
```

#### `jsx-a11y/no-noninteractive-element-interactions` - Events on Non-interactive Elements

**Description:** Don't attach events to non-interactive elements without role.

```tsx
// Good
<button onClick={handler}>Click</button>
<div onClick={handler} role="button" tabIndex={0} />

// Warning (bad)
<div onClick={handler}>Click</div>
```

#### `jsx-a11y/no-static-element-interactions` - Static Element Interactivity

**Description:** Static elements with handlers must have role and keyboard support.

```tsx
// Good
<div onClick={handler} onKeyPress={handler} role="button" tabIndex={0} />

// Warning (bad)
<div onClick={handler} />
```

---

## Strict Profile (`configs/strict.mjs`)

In addition to the base profile, the following rules are applied to `.ts/.tsx` files.

### `@typescript-eslint/no-explicit-any` - Disallow any

**Description:** Disallows using the `any` type, requires specific types.

```ts
// Good
function process(data: string): void {}
function process(data: unknown): void {}

// Bad
function process(data: any): void {}
```

### `@typescript-eslint/naming-convention` - Naming Convention

**Description:** Variables must be in `camelCase` or `PascalCase`, underscores are allowed at the beginning/end.

```ts
// Good
const userName = 'John';
const UserComponent = () => {};
const _privateVar = 1;
const unused_ = 2;

// Bad
const user_name = 'John';
const USER_NAME = 'John';
```

### `max-classes-per-file` + `no-restricted-syntax` - One Public Type/Class/Enum Per File

**Description:** Only one exported class/interface/type/enum is allowed per file.

```ts
// Good (User.ts file)
interface User {
  name: string;
}

// Good (auxiliary private types)
interface User {
  name: string;
}
type UserId = string;

// Bad (two public types)
interface User {
  name: string;
}
interface Post {
  title: string;
}
```

---

For detailed information on how to apply these profiles to your project, see [PROFILES.md](PROFILES.md).
