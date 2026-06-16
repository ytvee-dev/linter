# @ytvee/linter

Готовый набор конфигураций ESLint, Prettier и командной утилиты для проектов на JavaScript, TypeScript и React.

Пакет в npm: [https://www.npmjs.com/package/@ytvee/linter](https://www.npmjs.com/package/@ytvee/linter)

## Документация

- [Справочник профилей](https://github.com/ytvee-dev/linter/blob/main/docs/PROFILES_RU.md) — выбор профиля и примеры `eslint.config.mjs`.
- [Обзор правил](https://github.com/ytvee-dev/linter/blob/main/docs/README_RULES_RU.md) — группы правил, которые включают публичные профили.

## Требования

- Node.js `>=18.17.0`.
- ESLint `>=9`.
- Для проверки TypeScript-файлов без собственного `eslint.config.*` нужен `tsconfig.json` в корне проекта.
- Установка поддержана через npm и Yarn. Команды для проверки перед коммитом также учитывают pnpm, если проект использует `pnpm-lock.yaml` или `packageManager`.

## Установка

```bash
npm install -D @ytvee/linter
```

```bash
yarn add -D @ytvee/linter
```

Установка не создает `eslint.config.*`, не меняет файлы проекта и не включает проверку перед коммитом. Все изменения в проекте выполняются только явными командами.

## Быстрый старт

Проверка кода и форматирования:

```bash
npx --no-install ytvee-linter lint
npx --no-install ytvee-linter format --check
```

Автоисправление:

```bash
npx --no-install ytvee-linter fix
```

Форматирование:

```bash
npx --no-install ytvee-linter format
```

Для Yarn:

```bash
yarn exec ytvee-linter lint
yarn exec ytvee-linter fix
yarn exec ytvee-linter format --check
```

Удобные скрипты для `package.json`:

```json
{
  "scripts": {
    "lint": "ytvee-linter lint",
    "lint:fix": "ytvee-linter fix",
    "format": "ytvee-linter format",
    "format:check": "ytvee-linter format --check",
    "prepare-linter": "ytvee-linter init"
  }
}
```

## Команды

### `ytvee-linter lint [paths...]`

Запускает ESLint для `.js`, `.mjs`, `.ts` и `.tsx`.

Если в проекте есть локальный `eslint.config.*`, команда использует его. Если локального конфига нет, используется профиль `@ytvee/linter`, который равен `react-sonar`.

Если пути не переданы, проверяется текущий каталог:

```bash
npx --no-install ytvee-linter lint
npx --no-install ytvee-linter lint src
npx --no-install ytvee-linter lint src/index.ts
```

### `ytvee-linter fix [paths...]`

Запускает ESLint с `--fix`, а после успешного ESLint запускает Prettier в режиме записи.

Если в проекте есть локальный `eslint.config.*`, команда использует его. Если локального конфига нет, используется профиль `@ytvee/linter/configs/fix`, который равен React-профилю без SonarJS. Это сохраняет автоисправление прикладным: диагностические правила SonarJS не участвуют в команде `fix`.

Если пути не переданы, ESLint проверяет текущий каталог, а Prettier форматирует безопасный набор исходных и конфигурационных файлов.

```bash
npx --no-install ytvee-linter fix
npx --no-install ytvee-linter fix src
npx --no-install ytvee-linter fix src/App.tsx
```

### `ytvee-linter format [paths...]`

Запускает только Prettier в режиме записи. Команда использует конфигурацию `@ytvee/linter/prettier` и передает `--ignore-unknown`, чтобы неподдерживаемые форматы файлов пропускались без ошибки.

Если пути не переданы, форматируются файлы с расширениями:

```text
js, cjs, mjs, jsx, ts, tsx, json, jsonc, css, scss, html, yml, yaml
```

Примеры:

```bash
npx --no-install ytvee-linter format
npx --no-install ytvee-linter format src
npx --no-install ytvee-linter format package.json
```

### `ytvee-linter format --check [paths...]`

Проверяет форматирование через Prettier без записи файлов. Использует ту же конфигурацию и тот же безопасный набор расширений, что и `format`.

```bash
npx --no-install ytvee-linter format --check
npx --no-install ytvee-linter format --check src
```

### `ytvee-linter init`

Включает управляемую проверку перед коммитом в текущем Git-проекте.

Команда:

- настраивает `core.hooksPath=.husky`;
- создает или обновляет `.husky/pre-commit`;
- добавляет управляемый блок между `# @ytvee/linter begin` и `# @ytvee/linter end`;
- сохраняет остальное содержимое `.husky/pre-commit`;
- при повторном запуске обновляет существующий блок без дублей.

```bash
npx --no-install ytvee-linter init
```

`ytvee-linter init --husky` делает то же самое.

### `ytvee-linter husky enable`

Повторно добавляет или обновляет управляемый блок проверки перед коммитом.

```bash
npx --no-install ytvee-linter husky enable
```

Команда внутри `.husky/pre-commit` выбирается по менеджеру пакетов проекта:

| Проект       | Команда                              |
| ------------ | ------------------------------------ |
| npm          | `npx --no-install ytvee-linter lint` |
| Yarn Berry   | `yarn exec ytvee-linter lint`        |
| Yarn classic | `yarn run -s ytvee-linter lint`      |
| pnpm         | `pnpm exec ytvee-linter lint`        |

### `ytvee-linter husky disable`

Удаляет только управляемый блок `@ytvee/linter` из `.husky/pre-commit` и сохраняет пользовательские команды.

```bash
npx --no-install ytvee-linter husky disable
```

## Конфигурация ESLint

Создавать `eslint.config.mjs` не обязательно. Без локального `eslint.config.*` команда `lint` использует профиль React + SonarJS.

Если нужно явно выбрать профиль или добавить переопределения, создайте `eslint.config.mjs`.

Корневой профиль, он же React + SonarJS:

```js
import config from '@ytvee/linter';

export default config;
```

React без SonarJS:

```js
import config from '@ytvee/linter/configs/react';

export default config;
```

React с SonarJS:

```js
import config from '@ytvee/linter/configs/react-sonar';

export default config;
```

Строгий React:

```js
import config from '@ytvee/linter/configs/strict-react';

export default config;
```

Переопределение правил добавляйте после профиля:

```js
import config from '@ytvee/linter/configs/react';

export default [
  ...config,
  {
    rules: {
      'no-console': 'warn',
    },
  },
];
```

Подробный выбор профилей описан в [справочнике профилей](https://github.com/ytvee-dev/linter/blob/main/docs/PROFILES_RU.md).

## Публичные импорты

```text
@ytvee/linter
@ytvee/linter/eslint.config
@ytvee/linter/configs/default
@ytvee/linter/configs/fix
@ytvee/linter/configs/react
@ytvee/linter/configs/react-sonar
@ytvee/linter/configs/sonar
@ytvee/linter/configs/strict
@ytvee/linter/configs/strict-react
@ytvee/linter/prettier
```

Назначение профилей:

| Импорт                               | Что включает                                                           |
| ------------------------------------ | ---------------------------------------------------------------------- |
| `@ytvee/linter`                      | То же, что `@ytvee/linter/configs/default`: React + SonarJS.           |
| `@ytvee/linter/eslint.config`        | Алиас корневого профиля.                                               |
| `@ytvee/linter/configs/default`      | React + SonarJS.                                                       |
| `@ytvee/linter/configs/fix`          | React без SonarJS; используется командой `fix` без локального конфига. |
| `@ytvee/linter/configs/react`        | Базовые правила, TypeScript, импорты, React, хуки и доступность.       |
| `@ytvee/linter/configs/react-sonar`  | React-профиль плюс SonarJS.                                            |
| `@ytvee/linter/configs/sonar`        | Базовые правила плюс SonarJS без React-слоя.                           |
| `@ytvee/linter/configs/strict`       | Базовые правила плюс строгие TypeScript-ограничения.                   |
| `@ytvee/linter/configs/strict-react` | React-профиль плюс строгие TypeScript-ограничения.                     |
| `@ytvee/linter/prettier`             | Конфигурация Prettier.                                                 |

## Конфигурация Prettier

Если нужна отдельная конфигурация Prettier:

```js
module.exports = require('@ytvee/linter/prettier');
```

Параметры:

```json
{
  "printWidth": 120,
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all"
}
```

## Что проверяется

Краткий обзор правил:

- рекомендуемые правила ESLint;
- TypeScript-правила с проверкой типов для `.ts` и `.tsx`;
- явные типы возврата функций;
- запрет неиспользуемых переменных, кроме имен с `_`;
- порядок членов класса и явные модификаторы доступа;
- сортировка импортов и запрет дублей импортов;
- React, JSX, хуки и базовая доступность;
- SonarJS в профилях `sonar`, `react-sonar` и в обычном `lint`;
- строгие TypeScript-ограничения в профилях `strict` и `strict-react`.

Подробнее группы правил описаны в [обзоре правил](https://github.com/ytvee-dev/linter/blob/main/docs/README_RULES_RU.md).

## Частые проблемы

### Нет `tsconfig.json`

Если команда без локального `eslint.config.*` проверяет `.ts` или `.tsx`, в корне проекта должен быть `tsconfig.json`. Это нужно для правил TypeScript, которым требуются сведения о типах.

Решения:

- добавьте `tsconfig.json`;
- проверяйте только JavaScript-файлы;
- создайте локальный `eslint.config.*` и настройте `parserOptions` самостоятельно.

### Команда использует не тот ESLint-профиль

Если в проекте есть `eslint.config.js`, `eslint.config.mjs`, `eslint.config.cjs`, `eslint.config.ts`, `eslint.config.mts` или `eslint.config.cts`, команды `lint` и `fix` используют его. Резервные профили пакета применяются только когда локального конфига нет.

### SonarJS мешает автоисправлению

Команда `fix` без локального `eslint.config.*` использует профиль `react` без SonarJS. Если вы добавили локальный `eslint.config.*`, поведение `fix` определяется вашим конфигом.

## Лицензия

MIT. Профиль автора: [https://github.com/ytvee](https://github.com/ytvee).

## Ссылки

- [Пакет в npm](https://www.npmjs.com/package/@ytvee/linter)
- [Профиль автора](https://github.com/ytvee)
