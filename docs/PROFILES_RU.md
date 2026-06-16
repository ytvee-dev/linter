# Справочник профилей

Этот документ помогает выбрать публичный профиль `@ytvee/linter` для локального `eslint.config.mjs`.

Если локального `eslint.config.*` нет, команда `ytvee-linter lint` использует корневой профиль `@ytvee/linter`, то есть React + SonarJS. Команда `ytvee-linter fix` в такой же ситуации использует `@ytvee/linter/configs/fix`, то есть React без SonarJS.

## Общие требования

- Профили рассчитаны на плоскую конфигурацию ESLint.
- Для `.ts` и `.tsx` используется проверка типов через `typescript-eslint`.
- В корне проекта нужен `tsconfig.json`, если проверяются TypeScript-файлы и вы не задаете собственные `parserOptions`.
- Форматирование выполняется Prettier отдельно, а не через ESLint-правило.

## Как выбрать профиль

| Задача                                        | Импорт                               |
| --------------------------------------------- | ------------------------------------ |
| Обычный проект с React, TypeScript и SonarJS  | `@ytvee/linter`                      |
| То же самое через явный профиль               | `@ytvee/linter/configs/default`      |
| React без SonarJS                             | `@ytvee/linter/configs/react`        |
| React с SonarJS                               | `@ytvee/linter/configs/react-sonar`  |
| JavaScript/TypeScript без React, но с SonarJS | `@ytvee/linter/configs/sonar`        |
| Строгий JavaScript/TypeScript без React       | `@ytvee/linter/configs/strict`       |
| Строгий React                                 | `@ytvee/linter/configs/strict-react` |
| Профиль автоисправления без SonarJS           | `@ytvee/linter/configs/fix`          |

## Корневой профиль

Корневой импорт равен `@ytvee/linter/configs/default`, а `default` равен `react-sonar`.

```js
import config from '@ytvee/linter';

export default config;
```

Используйте этот вариант, если проекту нужны React-правила, хуки, базовая доступность и SonarJS-диагностика.

## React без SonarJS

```js
import config from '@ytvee/linter/configs/react';

export default config;
```

Профиль включает базовые правила, TypeScript, импорты, JSX, React Hooks и правила доступности. SonarJS не включается.

Этот профиль также используется командой `ytvee-linter fix`, если в проекте нет локального `eslint.config.*`.

## React с SonarJS

```js
import config from '@ytvee/linter/configs/react-sonar';

export default config;
```

Профиль включает все из `react` и добавляет правила `sonarjs/*`.

## SonarJS без React

```js
import config from '@ytvee/linter/configs/sonar';

export default config;
```

Профиль подходит для JavaScript и TypeScript-проектов без JSX. Он включает базовые правила и SonarJS, но не добавляет React, React Hooks и `jsx-a11y`.

## Строгий профиль

```js
import config from '@ytvee/linter/configs/strict';

export default config;
```

Профиль добавляет к базовым правилам строгие TypeScript-ограничения:

- `@typescript-eslint/no-explicit-any`;
- соглашение именования для переменных;
- один крупный TypeScript-тип, класс или перечисление на файл.

## Строгий React

```js
import config from '@ytvee/linter/configs/strict-react';

export default config;
```

Профиль включает React-слой и строгие TypeScript-ограничения. Используйте его, если проекту нужны React-правила без SonarJS, но с запретом `any` и ограничением крупных объявлений на файл.

## Переопределения

Добавляйте свои правила последним элементом массива:

```js
import config from '@ytvee/linter/configs/react';

export default [
  ...config,
  {
    rules: {
      'no-console': 'warn',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
];
```

Для отдельных файлов используйте `files`:

```js
import config from '@ytvee/linter/configs/strict-react';

export default [
  ...config,
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
```

## Проверка локального конфига

После выбора профиля запустите ESLint напрямую или через команду пакета:

```bash
npx --no-install eslint .
npx --no-install ytvee-linter lint
```

Если локальный `eslint.config.*` существует, `ytvee-linter lint` и `ytvee-linter fix` используют именно его.

## Связанные документы

- [README.md](../README.md) — установка, команды и публичные импорты.
- [README_RULES_RU.md](README_RULES_RU.md) — обзор групп правил.
