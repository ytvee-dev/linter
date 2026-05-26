# Как применять профили

Этот документ объясняет, как использовать различные профили конфигурации из `@ytdev/linter` в вашем проекте.

## Доступные профили

### Базовый профиль

Базовый профиль включает фундаментальные правила ESLint, проверку типов TypeScript, управление импортами и отключение конфликтов с Prettier. Форматирование Prettier запускается отдельной командой, а не как ESLint rule.

**Что включено:**

- Все рекомендуемые правила `@eslint/js`
- Правила TypeScript (type-checked)
- Best Practices из Airbnb
- Сортировка импортов
- Отключение конфликтов с Prettier
- `@typescript-eslint/no-explicit-any` отключён (для постепенной миграции)

**Как использовать:**

```js
import baseConfig from '@ytdev/linter';

export default [...baseConfig];
```

### Строгий профиль

Строгий профиль расширяет базовый профиль дополнительными ограничениями для больших команд и enterprise-проектов.

**Что добавлено:**

- `@typescript-eslint/no-explicit-any` включён (ошибка)
- Принудительное соглашение об именовании (`camelCase`/`PascalCase`)
- Один публичный тип/класс/enum на файл

**Как использовать:**

```js
import strictConfig from '@ytdev/linter/configs/strict';

export default [...strictConfig];
```

Примечание: Строгий профиль уже включает все базовые правила, поэтому вам не нужно импортировать базовую конфигурацию отдельно.

### React-профиль

React-профиль добавляет правила специфичные для React, включая JSX, хуки и проверки доступности.

**Что добавлено:**

- Правила React (синтаксис JSX, компоненты)
- Правила React Hooks
- Правила доступности (a11y)

**Как использовать:**

```js
import reactConfig from '@ytdev/linter/configs/react';

export default [...reactConfig];
```

Примечание: React-профиль уже включает все базовые правила, поэтому вам не нужно импортировать базовую конфигурацию отдельно.

### Sonar profiles

Use `@ytdev/linter/configs/sonar` for Base + generated executable SonarJS rules.

```js
import sonarConfig from '@ytdev/linter/configs/sonar';

export default [...sonarConfig];
```

Use `@ytdev/linter/configs/react-sonar` for React + generated executable SonarJS rules.

```js
import reactSonarConfig from '@ytdev/linter/configs/react-sonar';

export default [...reactSonarConfig];
```

The metadata catalog is available as `@ytdev/linter/configs/sonar-catalog`. It is the canonical runtime metadata catalog in this repository, and `coveredByProfiles` shows which public profiles already execute a mapped rule. Plain `sonar` covers `base` plus generated SonarJS execution; React-only external mappings stay in `react` and `react-sonar`. ESLint executes only reliable JS/TS implementations; CSS and HTML/Web rules are metadata-only.

Package surface note: repo docs, roadmaps, scripts, generated docbook pages, `.husky`, and raw refresh artifacts are not included in the npm tarball. The generated catalog stays in the package intentionally because `@ytdev/linter/configs/sonar-catalog` is a public runtime metadata export.

## Распространённые комбинации

### Базовый JavaScript/TypeScript проект

Для стандартного Node.js или TypeScript проекта без React:

```js
import baseConfig from '@ytdev/linter';

export default [...baseConfig];
```

### React-приложение

Для React-приложения со стандартными правилами:

```js
import reactConfig from '@ytdev/linter/configs/react';

export default [...reactConfig];
```

### Строгое React-приложение

Для React-приложения со строгими правилами:

```js
import strictConfig from '@ytdev/linter/configs/strict';
import reactConfig from '@ytdev/linter/configs/react';

export default [
  ...strictConfig, // включает базовые правила + строгие правила
  ...reactConfig, // добавляет React-специфичные правила (без базовых)
];
```

Примечание: При комбинировании строгого и React профилей порядок имеет значение. Строгий профиль должен быть первым, чтобы базовые правила применялись корректно.

### React-приложение без строгих правил TypeScript

Если вы хотите правила React, но не строгие правила TypeScript:

```js
import baseConfig from '@ytdev/linter';
import reactConfig from '@ytdev/linter/configs/react';

export default [...baseConfig, ...reactConfig];
```

## Пользовательские переопределения

Вы можете добавить свои собственные правила или переопределить существующие:

```js
import reactConfig from '@ytdev/linter/configs/react';

export default [
  ...reactConfig,
  {
    rules: {
      // Переопределение конкретных правил
      'no-console': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
];
```

## Конфигурация для конкретных файлов

Вы можете применять разные правила к конкретным файлам или директориям:

```js
import reactConfig from '@ytdev/linter/configs/react';

export default [
  ...reactConfig,
  {
    files: ['**/*.test.{ts,tsx}'],
    rules: {
      // Смягчить правила для тестовых файлов
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['scripts/**/*.js'],
    rules: {
      // Правила специфичные для Node.js скриптов
      'no-console': 'off',
    },
  },
];
```

## Стратегия миграции

### Постепенная миграция к строгим правилам

Если вы мигрируете существующую кодовую базу, начните с базового профиля:

```js
// Шаг 1: Начните с базового профиля
import baseConfig from '@ytdev/linter';

export default [...baseConfig];
```

После исправления всех проблем, переходите к строгому:

```js
// Шаг 2: Включите строгие правила
import strictConfig from '@ytdev/linter/configs/strict';

export default [...strictConfig];
```

### Временное отключение правил

Во время миграции можно временно отключить конкретные правила:

```js
import strictConfig from '@ytdev/linter/configs/strict';

export default [
  ...strictConfig,
  {
    rules: {
      // Временно отключить до завершения миграции
      '@typescript-eslint/naming-convention': 'warn', // понизить до предупреждения
    },
  },
];
```

## Решение проблем

### TypeScript Project Service

Если возникают проблемы с линтингом TypeScript, убедитесь, что у вас есть валидный `tsconfig.json` в корне проекта. Конфигурация использует `projectService`, который автоматически определяет вашу конфигурацию TypeScript.

### Проблемы с производительностью

Для больших проектов вы можете исключить определённые директории:

```js
import reactConfig from '@ytdev/linter/configs/react';

export default [{ ignores: ['**/build/**', '**/dist/**', '**/.next/**'] }, ...reactConfig];
```

### Конфликтующие правила

Если возникают конфликты с другими конфигурациями или плагинами ESLint, убедитесь что:

1. Размещаете конфигурации `@ytdev/linter` первыми
2. Добавляете свои пользовательские правила последними
3. Используете явные переопределения для конфликтующих правил

```js
import reactConfig from '@ytdev/linter/configs/react';
import someOtherConfig from 'eslint-config-other';

export default [
  ...reactConfig,
  ...someOtherConfig,
  {
    rules: {
      // Явное переопределение для разрешения конфликта
      'some-rule': 'error',
    },
  },
];
```
