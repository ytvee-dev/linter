# @ytvee/linter

Единый набор конфигураций ESLint, Prettier и командной утилиты для проектов на JavaScript, TypeScript и React.

Пакет опубликован в npm: [страница пакета](https://www.npmjs.com/package/@ytvee/linter).

## Что Внутри

- Готовые плоские конфигурации ESLint для JavaScript, TypeScript и React.
- Базовая проверка Sonar включена в обычный запуск `lint`.
- Команда `fix` использует профиль без Sonar, чтобы автоисправление не меняло смысл кода из-за диагностических правил.
- Prettier запускается отдельно и получает `--ignore-unknown`, поэтому неизвестные форматы файлов пропускаются.
- Поддержана явная настройка проверки перед коммитом через `ytvee-linter init`; установка пакета не меняет файлы проекта.
- Пакет устанавливает свои рабочие зависимости сам, поэтому в обычном проекте достаточно одной команды установки.

## Требования

- Node.js `>=18.17.0`.
- ESLint `>=9`.
- Для TypeScript-файлов без собственного `eslint.config.*` нужен `tsconfig.json` в корне проекта.
- Установка и запуск поддержаны для npm и Yarn. Для команды проверки перед коммитом также учитывается pnpm, если проект использует `pnpm-lock.yaml` или `packageManager`.

## Установка

```bash
npm install -D @ytvee/linter
```

```bash
yarn add -D @ytvee/linter
```

Установка не создает `eslint.config.*`, не добавляет проверку перед коммитом и не запускает скрипты жизненного цикла, которые меняют проект-потребитель.

## Быстрая Проверка

```bash
npx --no-install ytvee-linter lint
npx --no-install ytvee-linter format --check
npx --no-install ytvee-linter fix
```

Для Yarn:

```bash
yarn exec ytvee-linter lint
yarn exec ytvee-linter format --check
yarn exec ytvee-linter fix
```

## Команды

| Команда                                  | Что Делает                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `ytvee-linter lint [paths...]`           | Запускает ESLint. Если в проекте нет локального `eslint.config.*`, используется профиль React + Sonar. |
| `ytvee-linter fix [paths...]`            | Запускает ESLint с автоисправлением через профиль React без Sonar, затем запускает Prettier.           |
| `ytvee-linter format [paths...]`         | Запускает только Prettier в режиме записи.                                                             |
| `ytvee-linter format --check [paths...]` | Проверяет форматирование через Prettier без записи файлов.                                             |
| `ytvee-linter init`                      | Включает управляемую проверку перед коммитом в текущем Git-проекте.                                    |
| `ytvee-linter init --husky`              | Совместимый псевдоним для `ytvee-linter init`.                                                         |
| `ytvee-linter husky enable`              | Добавляет или обновляет управляемый блок проверки.                                                     |
| `ytvee-linter husky disable`             | Удаляет только управляемый блок проверки и сохраняет пользовательское содержимое.                      |

Если пути не переданы, `lint` и `fix` проверяют текущий проект, а `format` работает только по безопасным исходным и конфигурационным расширениям:

```text
js, cjs, mjs, jsx, ts, tsx, json, jsonc, css, scss, html, yml, yaml
```

## Нюансы Поведения

`lint` и `fix` сначала ищут локальный `eslint.config.*` в проекте-потребителе. Если локальная конфигурация найдена, пакет не подменяет ее своей.

Если локальной конфигурации нет, `lint` берет корневой профиль пакета. Этот профиль равен `react-sonar`, поэтому обычная проверка включает React-правила и Sonar-правила.

`fix` при отсутствии локальной конфигурации берет профиль `fix`, который равен `react`. Это сделано намеренно: автоисправление остается прикладным и не включает Sonar-проверки.

`format` не запускает ESLint. Команда использует Prettier из пакета и конфигурацию `@ytvee/linter/prettier`.

Для TypeScript-файлов включены правила, которым нужны сведения о типах. Поэтому при резервной конфигурации пакет требует `tsconfig.json` в корне проекта. Если его нет, команда завершится понятной ошибкой до запуска ESLint.

## Проверка Перед Коммитом

Проверка перед коммитом включается только явно:

```bash
npx --no-install ytvee-linter init
```

Для Yarn:

```bash
yarn exec ytvee-linter init
```

Команда настраивает `core.hooksPath=.husky`, создает или обновляет `.husky/pre-commit` и добавляет управляемый блок:

```text
# @ytvee/linter begin
npx --no-install ytvee-linter lint
# @ytvee/linter end
```

Существующее пользовательское содержимое файла проверки сохраняется. Повторный запуск не создает дубликаты управляемого блока.

Команда внутри файла проверки выбирается по проекту-потребителю:

| Проект       | Команда В Файле Проверки             |
| ------------ | ------------------------------------ |
| npm          | `npx --no-install ytvee-linter lint` |
| Yarn Berry   | `yarn exec ytvee-linter lint`        |
| Yarn classic | `yarn run -s ytvee-linter lint`      |
| pnpm         | `pnpm exec ytvee-linter lint`        |

Отключение управляемого блока:

```bash
npx --no-install ytvee-linter husky disable
```

## Публичные Импорты

Пакет экспортирует такие точки входа:

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

Пример локальной конфигурации ESLint:

```js
import конфигурация from '@ytvee/linter';

export default конфигурация;
```

React-профиль без Sonar:

```js
import конфигурация from '@ytvee/linter/configs/react';

export default конфигурация;
```

React-профиль с Sonar:

```js
import конфигурация from '@ytvee/linter/configs/react-sonar';

export default конфигурация;
```

Строгий React-профиль:

```js
import конфигурация from '@ytvee/linter/configs/strict-react';

export default конфигурация;
```

## Конфигурация Prettier

Пакет поставляет такую конфигурацию:

```js
module.exports = require('@ytvee/linter/prettier');
```

Параметры:

| Параметр        | Значение |
| --------------- | -------- |
| `printWidth`    | `120`    |
| `semi`          | `true`   |
| `singleQuote`   | `true`   |
| `tabWidth`      | `2`      |
| `trailingComma` | `all`    |

## Профили

| Импорт                               | Назначение                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `@ytvee/linter`                      | Корневой профиль, равен `react-sonar`.                                      |
| `@ytvee/linter/configs/default`      | То же, что корневой профиль.                                                |
| `@ytvee/linter/configs/fix`          | React-профиль без Sonar, используется командой `fix` как резервный профиль. |
| `@ytvee/linter/configs/react`        | Базовые правила, TypeScript, импорты, React, хуки и доступность.            |
| `@ytvee/linter/configs/react-sonar`  | React-профиль плюс Sonar-правила.                                           |
| `@ytvee/linter/configs/sonar`        | Базовый профиль плюс Sonar-правила без React-слоя.                          |
| `@ytvee/linter/configs/strict`       | Базовый профиль плюс более строгие TypeScript-правила.                      |
| `@ytvee/linter/configs/strict-react` | React-профиль плюс строгие TypeScript-правила.                              |

## Что Проверяется

- Ошибки из рекомендуемого набора ESLint.
- Современный JavaScript: запрет `var`, предпочтение `const`.
- Опасные конструкции: `eval`, `Function`, расширение встроенных объектов, `__proto__`.
- Импорты и их сортировка.
- TypeScript: явные возвращаемые типы, порядок членов класса, явная область доступа, неиспользуемые значения.
- React: JSX-расширения, ключи, дублирующиеся свойства, самозакрывающиеся компоненты.
- Хуки React: правила вызова хуков и зависимости.
- Доступность JSX: альтернативный текст, корректные ссылки и интерактивность.
- Sonar-правила в профилях `sonar`, `react-sonar` и в обычном `lint`.

Строгие профили дополнительно запрещают `any`, усиливают соглашения именования и ограничивают один крупный TypeScript-тип на файл.

## Содержимое Публикуемого Пакета

В публикуемый архив npm намеренно попадает только рабочая поверхность:

```text
LICENSE
README.md
bin
configs
eslint.config.mjs
package.json
prettier.js
```

Проверочные скрипты, временные каталоги, `.github`, `.husky`, `docs` и внутренние рабочие файлы не являются частью устанавливаемого пакета.

## Проверка После Установки

В проекте-потребителе можно проверить установку так:

```bash
npm install -D @ytvee/linter
npx --no-install ytvee-linter --help
npx --no-install ytvee-linter lint
npx --no-install ytvee-linter format --check
```

Для Yarn:

```bash
yarn add -D @ytvee/linter
yarn exec ytvee-linter --help
yarn exec ytvee-linter lint
yarn exec ytvee-linter format --check
```

## Разработка Пакета

Основные проверки репозитория:

```bash
npm run audit:rules
npm run verify:consumer:exports
npm pack --dry-run --json --cache tmp/npm-cache-audit
```

`audit:rules` проверяет пересекающиеся определения правил в публичных профилях и разрешает только явно ожидаемые переопределения.

`verify:consumer:exports` собирает пакет во временный архив и проверяет публичные импорты из проекта-потребителя.

## Публикация

Пакет настроен как публичный:

```json
{
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org"
  }
}
```

В репозитории есть рабочий процесс публикации при попадании изменений в `main`. Он запускает проверки, поднимает версию, создает тег и публикует пакет в реестр npm. Для публикации через этот процесс нужен секрет `NPM_TOKEN` с правом публикации.

## Лицензия

MIT. Профиль автора и лицензии: [https://github.com/ytvee](https://github.com/ytvee).

## Ссылки

- [Пакет в npm](https://www.npmjs.com/package/@ytvee/linter)
- [Профиль автора](https://github.com/ytvee)
