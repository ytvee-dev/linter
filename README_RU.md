# eslint-config-react

**Русская версия** | [English](./README.md)

Комплексная конфигурация ESLint для React и TypeScript проектов с интегрированной поддержкой Prettier.

## Возможности

- **Типобезопасный линтинг** с TypeScript ESLint
- **Интеграция Prettier** для единообразного форматирования кода
- **Поддержка React** с правилами для хуков и JSX
- **Проверки доступности** с jsx-a11y
- **Сортировка импортов** и их организация
- **Best practices** из Airbnb style guide
- **Без настройки** - работает из коробки

## Быстрый старт

### Установка

```bash
# npm
npm install -D @ytvee-dev/eslint-config-react

# yarn
yarn add -D @ytvee-dev/eslint-config-react

# pnpm
pnpm add -D @ytvee-dev/eslint-config-react
```

### Настройка

Создайте файл `eslint.config.mjs` в корне проекта:

**Для React-проектов:**

```js
import reactConfig from '@ytvee-dev/eslint-config-react/configs/react';

export default [...reactConfig];
```

**Для не-React проектов (TypeScript/JavaScript):**

```js
import baseConfig from '@ytvee-dev/eslint-config-react';

export default [...baseConfig];
```

**Для проектов со строгими правилами:**

```js
import strictConfig from '@ytvee-dev/eslint-config-react/configs/strict';

export default [...strictConfig];
```

### Настройка Prettier

Создайте файл `.prettierrc.js`:

```js
module.exports = require('@ytvee-dev/eslint-config-react/prettier');
```

Или `.prettierrc.json`:

```json
{
  "extends": "@ytvee-dev/eslint-config-react/prettier"
}
```

### Добавьте скрипты

Добавьте в ваш `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

## Доступные конфигурации

- **Base** (`@ytvee-dev/eslint-config-react`) - JavaScript/TypeScript с Prettier
- **React** (`@ytvee-dev/eslint-config-react/configs/react`) - Base + правила React
- **Strict** (`@ytvee-dev/eslint-config-react/configs/strict`) - React + строгие правила именования и запрет any

## Требования

- Node.js >= 18
- ESLint >= 9.0.0
- TypeScript >= 5.2.0 (для TypeScript проектов)

## Документация

Полная документация также доступна в папке `/docs`:

- [Полный справочник правил](https://github.com/ytvee-dev/eslint-config-react/blob/main/docs/README_RULES_RU.md) ([EN](https://github.com/ytvee-dev/eslint-config-react/blob/main/docs/README_RULES.md))
- [Обзор стайлгайда](https://github.com/ytvee-dev/eslint-config-react/blob/main/docs/README_STYLEGUIDE_RU.md) ([EN](https://github.com/ytvee-dev/eslint-config-react/blob/main/docs/README_STYLEGUIDE.md))
- [Руководство по профилям](https://github.com/ytvee-dev/eslint-config-react/blob/main/docs/PROFILES_RU.md) ([EN](https://github.com/ytvee-dev/eslint-config-react/blob/main/docs/PROFILES.md))

## Лицензия

MIT © [YT-Dev](https://github.com/ytvee-dev)

## Ссылки

- [NPM пакет](https://www.npmjs.com/package/@ytvee-dev/eslint-config-react)
- [GitHub репозиторий](https://github.com/ytvee-dev/eslint-config-react)
- [Файлы документации](https://github.com/ytvee-dev/eslint-config-react/tree/main/docs)
- [Сообщить о проблеме](https://github.com/ytvee-dev/eslint-config-react/issues)

## SonarQube profiles

Added opt-in SonarQube integration:

- `@ytvee-dev/eslint-config-react/configs/sonar` - base profile plus generated executable SonarJS rules.
- `@ytvee-dev/eslint-config-react/configs/react-sonar` - React profile plus generated executable SonarJS rules and React/a11y equivalents already covered by the React profile.
- `@ytvee-dev/eslint-config-react/configs/sonar-catalog` - compact metadata catalog for all imported SonarQube frontend rules.

`configs/sonar-catalog.generated.json` is the canonical runtime metadata catalog in this repository. A raw `sonarqube-frontend-rules.json` export is only an optional refresh artifact when it is present. ESLint executes only rules that have a reliable ESLint/SonarJS implementation. CSS and HTML/Web SonarQube rules are kept as metadata-only records, and `coveredByProfiles` shows which public profiles already execute each mapped rule.
