# @ytdev/linter

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

Команда установки не изменяет файлы вашего проекта, не добавляет lifecycle hooks и не создаёт ESLint config автоматически. После установки функции пакета доступны через локальный binary `ytdev-linter`:

```bash
npx ytdev-linter lint
npx ytdev-linter fix
npx ytdev-linter format
npx ytdev-linter format --check
```

`lint` и `fix` используют локальный `eslint.config.*`, если он есть. Если в проекте нет ESLint flat config, `lint` использует default React + SonarJS профиль пакета, а `fix` использует non-Sonar React профиль перед запуском Prettier. Для TypeScript проектов всё равно нужен валидный project `tsconfig.json`, чтобы type-aware rules работали корректно.

### Добавьте скрипты

Добавьте в ваш `package.json`, если хотите короткие project scripts:

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

`fix` запускает ESLint autofix через non-Sonar flow, затем Prettier. `format` запускает только Prettier. SonarJS проверки входят в default lint flow, но не входят в default fix flow.

### Опциональная конфигурация ESLint

Для default CLI path файл `eslint.config.mjs` не нужен. Создавайте его только если хотите выбрать конкретный публичный профиль или добавить локальные overrides.

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

CLI может запускать Prettier без project config. Добавляйте Prettier config только для editor integration или прямого использования `prettier`:

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

### Настройка Husky в consumer project

Pre-commit hooks включаются только явно и никогда не устанавливаются во время package installation. Чтобы добавить managed hook block в текущий Git project:

```bash
npx ytdev-linter husky enable
```

Чтобы удалить только managed block и сохранить пользовательское содержимое hook:

```bash
npx ytdev-linter husky disable
```

Generated block помечен строками `# @ytdev/linter begin` и `# @ytdev/linter end`. Команда выбирается по package manager проекта-потребителя: npm проекты используют `npx --no-install`, Yarn проекты используют `yarn`, pnpm проекты используют `pnpm exec`.

## Доступные конфигурации

- **Base** (`@ytdev/linter`) - JavaScript/TypeScript semantic linting с отключением конфликтов Prettier
- **React** (`@ytdev/linter/configs/react`) - Base + правила React
- **Strict** (`@ytdev/linter/configs/strict`) - React + строгие правила именования и запрет any

## Содержимое пакета

npm-пакет намеренно содержит только runtime/public surface: `README.md`, `README_RU.md`, `LICENSE`, `configs`, `eslint.config.mjs` и `prettier.js`.

Verification scripts и исходная документация остаются в репозитории, но не входят в npm tarball.

## Требования

- Node.js >= 18
- ESLint >= 9.0.0
- TypeScript >= 5.2.0 (для TypeScript проектов)

## Документация

Полная документация также доступна в папке `/docs`:

- [Полный справочник правил](https://github.com/ytdev/linter/blob/main/docs/README_RULES_RU.md) ([EN](https://github.com/ytdev/linter/blob/main/docs/README_RULES.md))
- [Обзор стайлгайда](https://github.com/ytdev/linter/blob/main/docs/README_STYLEGUIDE_RU.md) ([EN](https://github.com/ytdev/linter/blob/main/docs/README_STYLEGUIDE.md))
- [Руководство по профилям](https://github.com/ytdev/linter/blob/main/docs/PROFILES_RU.md) ([EN](https://github.com/ytdev/linter/blob/main/docs/PROFILES.md))

## Лицензия

MIT © [YT-Dev](https://github.com/ytdev)

## Ссылки

- [NPM пакет](https://www.npmjs.com/package/@ytdev/linter)
- [GitHub репозиторий](https://github.com/ytdev/linter)
- [Файлы документации](https://github.com/ytdev/linter/tree/main/docs)
- [Сообщить о проблеме](https://github.com/ytdev/linter/issues)

## SonarQube profiles

Added opt-in SonarQube integration:

- `@ytdev/linter/configs/sonar` - base profile plus generated executable SonarJS rules.
- `@ytdev/linter/configs/react-sonar` - React profile plus generated executable SonarJS rules and React/a11y equivalents already covered by the React profile.

SonarQube-compatible execution is provided through `eslint-plugin-sonarjs`. The runtime source of truth is `configs/rules/sonar.generated.mjs`, which contains the executable SonarJS rule configuration used by `sonar`, `react-sonar`, and the default CLI lint profile.
