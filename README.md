# @ytdev/linter

[Русская версия](./README_RU.md) | **English**

A comprehensive ESLint configuration for React and TypeScript projects with separate Prettier formatting support.

## Features

- **Type-safe linting** with TypeScript ESLint
- **Separate Prettier formatting** for consistent code style without formatting-as-lint errors
- **React support** with hooks and JSX rules
- **Accessibility checks** with jsx-a11y
- **Import sorting** and organization
- **SonarJS checks by default** in the zero-config CLI lint flow
- **Best practices** from Airbnb style guide
- **Zero config** - works out of the box

## Quick Start

### Installation

```bash
# npm
npm install -D @ytdev/linter

# yarn
yarn add -D @ytdev/linter

# pnpm
pnpm add -D @ytdev/linter
```

The install command does not modify your project files, does not add lifecycle hooks, and does not create an ESLint config automatically. After installation, the package functions are available through the local `ytdev-linter` binary:

```bash
npx ytdev-linter lint
npx ytdev-linter fix
npx ytdev-linter format
npx ytdev-linter format --check
```

`lint` and `fix` use your local `eslint.config.*` when it exists. If your project has no ESLint flat config, `lint` falls back to the package default React + SonarJS profile, while `fix` uses the non-Sonar React profile before running Prettier. TypeScript projects should still have a valid project `tsconfig.json` for type-aware rules.

### Add Scripts

Add to your `package.json` if you want short project scripts:

```json
{
  "scripts": {
    "lint": "ytdev-linter lint",
    "fix": "ytdev-linter fix",
    "format": "ytdev-linter format",
    "format:check": "ytdev-linter format --check"
  }
}
```

`fix` runs ESLint autofix with the non-Sonar flow and then Prettier. `format` runs only Prettier. SonarJS checks are part of the default lint flow, but they are not part of the default fix flow.

### Optional ESLint Configuration

You do not need `eslint.config.mjs` for the default CLI path. Create it only when you want to choose a specific public profile or add local overrides.

**For React projects:**

```js
import reactConfig from '@ytdev/linter/configs/react';

export default [...reactConfig];
```

**For non-React projects (TypeScript/JavaScript):**

```js
import baseConfig from '@ytdev/linter';

export default [...baseConfig];
```

**For projects with strict rules:**

```js
import strictConfig from '@ytdev/linter/configs/strict';

export default [...strictConfig];
```

**For projects with SonarJS checks:**

```js
import sonarConfig from '@ytdev/linter/configs/sonar';

export default [...sonarConfig];
```

**For React projects with SonarJS checks:**

```js
import reactSonarConfig from '@ytdev/linter/configs/react-sonar';

export default [...reactSonarConfig];
```

### Prettier Configuration

The CLI can run Prettier without a project config. Add a Prettier config only when you want editor integration or direct `prettier` usage:

Create `.prettierrc.js`:

```js
module.exports = require('@ytdev/linter/prettier');
```

Or `.prettierrc.json`:

```json
{
  "extends": "@ytdev/linter/prettier"
}
```

### Consumer Husky Setup

Pre-commit hooks are opt-in and are never installed during package installation. To add the managed hook block to the current Git project:

```bash
npx ytdev-linter husky enable
```

To remove only the managed block and keep any custom hook content:

```bash
npx ytdev-linter husky disable
```

The generated block is marked with `# @ytdev/linter begin` and `# @ytdev/linter end`. The command is selected from the consumer project package manager: npm projects use `npx --no-install`, Yarn projects use `yarn`, and pnpm projects use `pnpm exec`.

## Available Configurations

- **Base** (`@ytdev/linter`) - JavaScript/TypeScript semantic linting with Prettier conflict suppression
- **React** (`@ytdev/linter/configs/react`) - Base + React rules
- **Strict** (`@ytdev/linter/configs/strict`) - React + strict naming and no-any rules
- **Sonar** (`@ytdev/linter/configs/sonar`) - Base + generated SonarJS executable rules
- **React Sonar** (`@ytdev/linter/configs/react-sonar`) - React + generated SonarJS executable rules plus React/a11y equivalents already covered by the React profile

## SonarQube Coverage

SonarQube-compatible execution is provided through `eslint-plugin-sonarjs`. The runtime source of truth is `configs/rules/sonar.generated.mjs`, which contains the executable SonarJS rule configuration used by `sonar`, `react-sonar`, and the default CLI lint profile.

Only rules with a reliable ESLint implementation are executable. CSS and HTML/Web SonarQube catalog entries are not executed by this package until there is a supported analyzer path for those languages.

## Package Contents

The npm package intentionally ships only the runtime/public surface: `README.md`, `README_RU.md`, `LICENSE`, `bin`, `configs`, `eslint.config.mjs`, and `prettier.js`.

Repository verification scripts and documentation sources stay in the repository but are not included in the npm tarball.

## Requirements

- Node.js >= 18
- ESLint >= 9.0.0
- TypeScript >= 5.2.0 (for TypeScript projects)

## Documentation

Full documentation is also available in the `/docs` folder:

- [Complete rules reference](https://github.com/ytdev/linter/blob/main/docs/README_RULES.md) ([RU](https://github.com/ytdev/linter/blob/main/docs/README_RULES_RU.md))
- [Style guide overview](https://github.com/ytdev/linter/blob/main/docs/README_STYLEGUIDE.md) ([RU](https://github.com/ytdev/linter/blob/main/docs/README_STYLEGUIDE_RU.md))
- [Profile usage guide](https://github.com/ytdev/linter/blob/main/docs/PROFILES.md) ([RU](https://github.com/ytdev/linter/blob/main/docs/PROFILES_RU.md))

## License

MIT © [YT-Dev](https://github.com/ytdev)

## Links

- [NPM Package](https://www.npmjs.com/package/@ytdev/linter)
- [GitHub Repository](https://github.com/ytdev/linter)
- [Documentation Files](https://github.com/ytdev/linter/tree/main/docs)
- [Report Issues](https://github.com/ytdev/linter/issues)
