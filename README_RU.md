# @ytdev/linter

> Release note: `@ytdev/linter` is the target name for the upcoming package release. Until that release is published, verify usage through a local packed tarball.

**Русская версия** | [English](./README.md)

Комплексная конфигурация ESLint для React и TypeScript проектов с отдельной поддержкой форматирования Prettier.

## Возможности

- **Типобезопасный линтинг** с TypeScript ESLint
- **Отдельное форматирование Prettier** без ошибок `prettier/prettier` внутри ESLint
- **Поддержка React** с правилами для хуков и JSX
- **Проверки доступности** с jsx-a11y
- **Сортировка импортов** и их организация
- **Best practices** из Airbnb style guide
- **Без настройки** - работает из коробки

## Быстрый старт

### Установка

```bash
# npm
npm install -D @ytdev/linter

# yarn
yarn add -D @ytdev/linter

# pnpm
pnpm add -D @ytdev/linter
```

### Настройка

Создайте файл `eslint.config.mjs` в корне проекта:

**Для React-проектов:**

```js
import reactConfig from '@ytdev/linter/configs/react';

export default [...reactConfig];
```

**Для не-React проектов (TypeScript/JavaScript):**

```js
import baseConfig from '@ytdev/linter';

export default [...baseConfig];
```

**Для проектов со строгими правилами:**

```js
import strictConfig from '@ytdev/linter/configs/strict';

export default [...strictConfig];
```

### Настройка Prettier

Создайте файл `.prettierrc.js`:

```js
module.exports = require('@ytdev/linter/prettier');
```

Или `.prettierrc.json`:

```json
{
  "extends": "@ytdev/linter/prettier"
}
```

### Добавьте скрипты

Добавьте в ваш `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "fix": "ytdev-linter fix",
    "format": "ytdev-linter format",
    "format:check": "ytdev-linter format --check"
  }
}
```

`fix` запускает ESLint autofix с default non-Sonar config, затем Prettier. `format` запускает только Prettier. Sonar profiles остаются opt-in и не входят в default fix flow.

### Consumer Husky setup

Pre-commit hooks are opt-in and are never installed during package installation. To add the managed hook block to the current Git project:

```bash
npx ytdev-linter husky enable
```

To remove only the managed block and keep any custom hook content:

```bash
npx ytdev-linter husky disable
```

The generated block is marked with `# @ytdev/linter begin` and `# @ytdev/linter end`. It runs the local ESLint binary with `npx --no-install`, so it does not download packages during commit.

## Доступные конфигурации

- **Base** (`@ytdev/linter`) - JavaScript/TypeScript semantic linting с отключением конфликтов Prettier
- **React** (`@ytdev/linter/configs/react`) - Base + правила React
- **Strict** (`@ytdev/linter/configs/strict`) - React + строгие правила именования и запрет any

## Содержимое пакета

npm-пакет намеренно содержит только runtime/public surface: `README.md`, `README_RU.md`, `LICENSE`, `configs`, `eslint.config.mjs` и `prettier.js`.

Документация репозитория, roadmaps, scripts, generated docbook pages, `.husky` и raw refresh artifacts остаются в репозитории, но не входят в npm tarball. `configs/sonar-catalog.generated.json` остаётся в пакете намеренно, потому что экспортируется как `@ytdev/linter/configs/sonar-catalog`.

## Требования

- Node.js >= 18
- ESLint >= 9.0.0
- TypeScript >= 5.2.0 (для TypeScript проектов)

## Документация

Полная документация также доступна в папке `/docs`:

- [Полный справочник правил](https://github.com/ytvee-dev/linter/blob/main/docs/README_RULES_RU.md) ([EN](https://github.com/ytvee-dev/linter/blob/main/docs/README_RULES.md))
- [Обзор стайлгайда](https://github.com/ytvee-dev/linter/blob/main/docs/README_STYLEGUIDE_RU.md) ([EN](https://github.com/ytvee-dev/linter/blob/main/docs/README_STYLEGUIDE.md))
- [Руководство по профилям](https://github.com/ytvee-dev/linter/blob/main/docs/PROFILES_RU.md) ([EN](https://github.com/ytvee-dev/linter/blob/main/docs/PROFILES.md))

## Лицензия

MIT © [YT-Dev](https://github.com/ytvee-dev)

## Ссылки

- [NPM пакет](https://www.npmjs.com/package/@ytdev/linter)
- [GitHub репозиторий](https://github.com/ytvee-dev/linter)
- [Файлы документации](https://github.com/ytvee-dev/linter/tree/main/docs)
- [Сообщить о проблеме](https://github.com/ytvee-dev/linter/issues)

## SonarQube profiles

Added opt-in SonarQube integration:

- `@ytdev/linter/configs/sonar` - base profile plus generated executable SonarJS rules.
- `@ytdev/linter/configs/react-sonar` - React profile plus generated executable SonarJS rules and React/a11y equivalents already covered by the React profile.
- `@ytdev/linter/configs/sonar-catalog` - compact metadata catalog for all imported SonarQube frontend rules.

`configs/sonar-catalog.generated.json` is the canonical runtime metadata catalog in this repository. A raw `sonarqube-frontend-rules.json` export is only an optional refresh artifact when it is present. ESLint executes only rules that have a reliable ESLint/SonarJS implementation. CSS and HTML/Web SonarQube rules are kept as metadata-only records, and `coveredByProfiles` shows which public profiles already execute each mapped rule.
