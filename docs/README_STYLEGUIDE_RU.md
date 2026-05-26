# Стайлгайд линтера

Документ суммирует профиль `@ytvee-dev/eslint-config-react` и поясняет, какие правила вы получите из коробки. Полный список с деталями и примерами — в [README_RULES_RU.md](README_RULES_RU.md).

## Содержание

- [Базовые принципы](#базовые-принципы)
- [Дополнения для TypeScript](#дополнения-для-typescript)
- [Best Practices из Airbnb](#best-practices-из-airbnb)
- [Профили](#профили)
- [Автофикс](#автофикс)
- [Лицензия](#лицензия)

## Базовые принципы

### Рекомендуемые правила ESLint

Конфигурация включает полный набор `@eslint/js` recommended правил:

- **Корректность кода**: защита от дубликатов, ошибок в классах, некорректных конструкций
- **Безопасность**: запрет eval, опасных операций с прототипами, небезопасных операций
- **Качество кода**: контроль неиспользуемых переменных, корректность async/await, работа с промисами

### TypeScript в режиме type-checked

Используется `typescript-eslint` с набором `recommendedTypeChecked`:

- **Типобезопасность**: защита от операций `no-unsafe-*` (assignment, call, return, member-access)
- **Async операции**: `await-thenable`, `no-floating-promises`, `require-await`
- **Чистота типов**: запрет дублей, лишних assertions, небезопасных enum сравнений
- **Синтаксис**: ограничения на namespace, triple-slash references

### Форматирование с Prettier

`eslint-plugin-prettier/recommended` применяет настройки из `prettier.js`:

- Ширина строки: **120 символов**
- Кавычки: **одинарные** (`'`)
- Точка с запятой: **обязательна** (`;`)
- Отступ: **2 пробела**
- Trailing comma: **always** в многострочных структурах

Нарушения форматирования показываются как **ошибки** линтера и автоматически исправляются.

### Управление импортами

#### eslint-plugin-import

- Запрет дубликатов импортов (`no-duplicate-imports`)
- Запрет расширений для JS/TS файлов (`import/extensions`)

#### eslint-plugin-simple-import-sort

Автоматическая сортировка импортов по группам:

1. **Внешние зависимости** — npm пакеты (`react`, `express`)
2. **Namespace пакеты** — пакеты с `@` (`@internal/logger`)
3. **Абсолютные алиасы** — пути с `@/` (`@/components/Button`)
4. **Side-effect импорты** — CSS, полифиллы (`./styles.css`)
5. **Восходящие относительные** — родительские директории (`../parent/module`)
6. **Одноуровневые относительные** — текущая директория (`./helper`)

### Безопасные примитивы

`no-restricted-syntax` блокирует `Symbol` и `BigInt` в средах без нативной поддержки, обеспечивая совместимость с целевыми окружениями.

## Дополнения для TypeScript

Кастомные правила поверх рекомендованного набора:

### `@typescript-eslint/explicit-function-return-type`

Все функции должны явно указывать тип возвращаемого значения.

```ts
// Хорошо
function sum(a: number, b: number): number {
  return a + b;
}

// Плохо
function sum(a: number, b: number) {
  return a + b;
}
```

### `@typescript-eslint/consistent-type-definitions`

Предпочитай `interface` для объектных типов вместо `type`.

```ts
// Хорошо
interface User {
  name: string;
}

// Плохо
type User = {
  name: string;
};
```

### `@typescript-eslint/no-floating-promises`

Каждый промис должен быть обработан: `await`, `.then()/.catch()` или явное `void`.

```ts
// Хорошо
await fetchData();
void fetchData();

// Плохо
fetchData();
```

### `@typescript-eslint/no-unused-vars`

Неиспользуемые переменные/параметры запрещены, кроме начинающихся с `_`.

```ts
// Хорошо
const { name, ...rest } = user;
const onClick = (_event: Event) => {};

// Плохо
const unused = 1;
```

### `@typescript-eslint/explicit-member-accessibility`

Всегда указывай модификаторы доступа (`public`, `protected`, `private`) для членов класса (кроме конструкторов).

```ts
// Хорошо
class User {
  public name: string;
  private age: number;
}

// Плохо
class User {
  name: string;
  age: number;
}
```

### `@typescript-eslint/member-ordering`

Фиксированный порядок элементов класса:

1. Сигнатуры
2. Статические поля (public → protected → private)
3. Поля экземпляра (public → protected → private)
4. Конструкторы (public → protected → private)
5. Статические методы (public → protected → private)
6. Методы экземпляра (public → protected → private)

## Best Practices из Airbnb

Конфигурация включает ключевые правила из Airbnb JavaScript Style Guide:

### Переменные

- `no-var` — используй `const`/`let`
- `prefer-const` — `const` для неизменяемых переменных

### Функции и стрелочные функции

- `prefer-arrow-callback` — стрелочные функции для колбэков
- `arrow-body-style` — неявный return в стрелочных функциях
- `arrow-parens` — всегда скобки вокруг параметров

### Объекты и массивы

- `no-new-object` — литералы объектов `{}`
- `object-shorthand` — сокращённый синтаксис
- `quote-props` — кавычки только когда нужно
- `prefer-destructuring` — деструктуризация
- `array-callback-return` — обязательный return в array методах

### Строки

- `prefer-template` — template strings вместо конкатенации
- `template-curly-spacing` — без пробелов в `${}`
- `no-useless-concat` — запрет бесполезной конкатенации

### Сравнения и операторы

- `eqeqeq` — строгое сравнение `===`
- `no-nested-ternary` — предупреждение о вложенных тернарниках
- `no-unneeded-ternary` — запрет ненужных тернарников
- `no-mixed-operators` — явная приоритетность операторов

### Безопасность

- `no-eval` — запрет eval()
- `no-new-func` — запрет new Function
- `no-implied-eval` — запрет неявного eval
- `no-extend-native` — запрет расширения нативных объектов
- `no-iterator`, `no-proto` — запрет устаревших API

### Стиль кода

- `semi` — обязательные точки с запятой
- `brace-style` — 1tbs стиль фигурных скобок
- `comma-style` — запятая в конце строки
- `comma-dangle` — trailing comma в многострочных структурах
- `spaced-comment` — пробел после `//` или `/*`

### Модули

- `no-duplicate-imports` — объединяй импорты из одного модуля
- `no-restricted-exports` — запрет экспорта `default` как именованного и `then`

## Профили

### Базовый (`eslint.config.mjs`)

Включает все перечисленные выше правила:

- ESLint recommended
- TypeScript type-checked
- Best Practices (Airbnb)
- Сортировка импортов
- Prettier форматирование
- `@typescript-eslint/no-explicit-any` отключён (для постепенной миграции)

```js
import baseConfig from '@ytvee-dev/eslint-config-react';

export default [...baseConfig];
```

### Строгий (`configs/strict.mjs`)

Базовый профиль + дополнительные ограничения:

- Запрет `any` (`@typescript-eslint/no-explicit-any`)
- Соглашение об именовании `camelCase`/`PascalCase`
- Один публичный тип/класс/enum на файл

```js
import strictConfig from '@ytvee-dev/eslint-config-react/configs/strict';

export default [...strictConfig];
```

### React (`configs/react.mjs`)

Базовый профиль + React/JSX/a11y правила:

#### React правила

- `react/jsx-filename-extension` — JSX только в `.jsx`/`.tsx`
- `react/jsx-boolean-value` — булевы пропсы без значения
- `react/self-closing-comp` — самозакрывающиеся теги
- `react/jsx-key` — ключи в списках
- `react/jsx-no-duplicate-props` — запрет дублей пропсов

#### React Hooks

- `react-hooks/rules-of-hooks` — правила хуков (error)
- `react-hooks/exhaustive-deps` — полные зависимости (warning)

#### Accessibility (a11y)

- `jsx-a11y/alt-text` — alt для изображений
- `jsx-a11y/anchor-is-valid` — корректные ссылки
- `jsx-a11y/click-events-have-key-events` — клавиатурные события
- `jsx-a11y/no-autofocus` — ограничение autofocus
- `jsx-a11y/no-noninteractive-element-interactions` — события на интерактивных элементах
- `jsx-a11y/no-static-element-interactions` — роли для статических элементов

```js
import reactConfig from '@ytvee-dev/eslint-config-react/configs/react';

export default [...reactConfig];
```

### Комбинирование

Можно комбинировать профили:

```js
import baseConfig from '@ytvee-dev/eslint-config-react';
import strictConfig from '@ytvee-dev/eslint-config-react/configs/strict';
import reactConfig from '@ytvee-dev/eslint-config-react/configs/react';

// Только базовые правила
export default [...baseConfig];

// React приложение с базовыми правилами
export default [...baseConfig, ...reactConfig];

// Строгие правила (включают базовые)
export default [...strictConfig];

// Строгие React правила
// Внимание: strictConfig уже включает baseConfig
export default [...strictConfig, ...reactConfig];
```

Для получения подробной информации о применении профилей смотрите [PROFILES_RU.md](PROFILES_RU.md).

## Автофикс

Большинство правил поддерживают автоматическое исправление:

### Что исправляется автоматически

- **Форматирование** — Prettier исправляет отступы, кавычки, точки с запятой
- **Импорты** — автоматическая сортировка по группам
- **var → const/let** — замена устаревшего var
- **Стрелочные функции** — упрощение тела функции
- **Trailing comma** — добавление запятой в многострочных структурах
- **object-shorthand** — сокращение синтаксиса объектов
- **template literals** — замена конкатенации на template strings
- **Кавычки свойств** — удаление ненужных кавычек
- **React** — самозакрывающиеся теги, булевы пропсы

### Запуск автофикса

```bash
# Исправить все автоисправимые ошибки
npm run lint:fix
# или
yarn lint:fix

# Исправить конкретный файл
npx eslint src/file.ts --fix
```

### Что требует ручного исправления

- `no-unused-vars` — удаление неиспользуемых переменных
- `@typescript-eslint/no-floating-promises` — добавление await/void
- `react-hooks/exhaustive-deps` — добавление зависимостей в useEffect
- `@typescript-eslint/explicit-function-return-type` — указание типов возврата
- Правила accessibility — добавление alt, role, aria атрибутов

## Отличия от Airbnb

### Что включено из Airbnb

- Best Practices правила (variables, functions, objects, arrays, strings)
- Стиль кода (semicolons, braces, commas, spacing)
- Безопасность (no-eval, no-new-func, no-extend-native)
- Сравнения и операторы (eqeqeq, no-nested-ternary)

### Что изменено

#### Форматирование через Prettier

Вместо набора форматирующих правил Airbnb используется Prettier:

- Единый стиль для JS/TS/JSX/TSX
- Автоматическое исправление
- Нет конфликтов между правилами

#### TypeScript вместо Flow

- Полная типобезопасность через `typescript-eslint`
- Type-checked правила для защиты от runtime ошибок
- Нет необходимости в Babel или runtime shims

#### Другая сортировка импортов

Вместо `import/order` используется `eslint-plugin-simple-import-sort`:

- Более гибкая группировка
- Поддержка алиасов `@/`
- Автоматическое исправление

#### Модульная структура

- Базовый профиль без React
- Отдельный React-профиль
- Строгий профиль для больших команд

#### Опциональный запрет any

В базовом профиле `any` разрешён для постепенной миграции. Включается в строгом профиле.

## Лицензия

Пакет распространяется по лицензии MIT. Полный текст доступен в файле [LICENSE](../LICENSE).
