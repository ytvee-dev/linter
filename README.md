# @ytdev/linter

[Русская версия](./README_RU.md) | **English**

A comprehensive ESLint configuration for React and TypeScript projects with integrated Prettier support.

> Release note: `@ytdev/linter` is the target name for the upcoming package release. Until that release is published, verify usage through a local packed tarball.

## Features

- **Type-safe linting** with TypeScript ESLint
- **Prettier integration** for consistent code formatting
- **React support** with hooks and JSX rules
- **Accessibility checks** with jsx-a11y
- **Import sorting** and organization
- **SonarQube metadata coverage** with opt-in executable SonarJS profiles
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

### Configuration

Create `eslint.config.mjs` in your project root:

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

### Add Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

## Available Configurations

- **Base** (`@ytdev/linter`) - JavaScript/TypeScript with Prettier
- **React** (`@ytdev/linter/configs/react`) - Base + React rules
- **Strict** (`@ytdev/linter/configs/strict`) - React + strict naming and no-any rules
- **Sonar** (`@ytdev/linter/configs/sonar`) - Base + generated SonarJS executable rules
- **React Sonar** (`@ytdev/linter/configs/react-sonar`) - React + generated SonarJS executable rules plus React/a11y equivalents already covered by the React profile
- **Sonar catalog** (`@ytdev/linter/configs/sonar-catalog`) - compact metadata coverage for all imported SonarQube frontend rules

## SonarQube Coverage

`configs/sonar-catalog.generated.json` is the canonical runtime metadata catalog in this repository. A raw `sonarqube-frontend-rules.json` export is only an optional refresh artifact when it is present. The generated catalog currently covers all 1095 imported rules: 470 SonarJS-backed records, 79 records already covered by existing ESLint rules, 479 metadata-only records, and 67 deprecated records.

Only rules with a reliable ESLint implementation are executable. CSS and HTML/Web SonarQube rules stay metadata-only until this package has a supported analyzer path for those languages. Profile-level execution is tracked through `coveredByProfiles`: plain `sonar` adds generated SonarJS rules on top of `base`, while `react-sonar` also inherits React and a11y mappings that are already covered by the React profile.

## Requirements

- Node.js >= 18
- ESLint >= 9.0.0
- TypeScript >= 5.2.0 (for TypeScript projects)

## Documentation

**Interactive Documentation:** [ytvee-dev.github.io/linter](https://ytvee-dev.github.io/linter/)

Full documentation is also available in the `/docs` folder:

- [Complete rules reference](https://github.com/ytvee-dev/linter/blob/main/docs/README_RULES.md) ([RU](https://github.com/ytvee-dev/linter/blob/main/docs/README_RULES_RU.md))
- [Style guide overview](https://github.com/ytvee-dev/linter/blob/main/docs/README_STYLEGUIDE.md) ([RU](https://github.com/ytvee-dev/linter/blob/main/docs/README_STYLEGUIDE_RU.md))
- [Profile usage guide](https://github.com/ytvee-dev/linter/blob/main/docs/PROFILES.md) ([RU](https://github.com/ytvee-dev/linter/blob/main/docs/PROFILES_RU.md))

## License

MIT © [YT-Dev](https://github.com/ytvee-dev)

## Links

- [NPM Package](https://www.npmjs.com/package/@ytdev/linter)
- [GitHub Repository](https://github.com/ytvee-dev/linter)
- [Documentation Files](https://github.com/ytvee-dev/linter/tree/main/docs)
- [Report Issues](https://github.com/ytvee-dev/linter/issues)
