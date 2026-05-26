# Правила линтера, используемые в проекте

Документ описывает все правила, которые реально включены в `@ytdev/linter`, в стилистике [Airbnb JavaScript Style Guide](https://leonidlebedev.github.io/javascript-airbnb). Ниже перечислены профили, ограничения и игнорируемые файлы с примерами для каждого правила.

## Содержание

- [Игнорируемые пути](#игнорируемые-пути)
- [Базовый профиль (JavaScript + TypeScript)](#базовый-профиль-javascript--typescript)
  - [Общие правила @eslint/js](#общие-правила-eslintjs-config-recommended)
  - [Best Practices (Airbnb)](#best-practices-airbnb)
  - [Импорты](#импорты)
  - [Форматирование (Prettier)](#форматирование-prettier--eslint-plugin-prettierrecommended)
  - [Правила TypeScript](#правила-typescript-eslint-config-recommendedtypechecked)
  - [Кастомные TypeScript правила](#кастомные-ts-усиления-поверх-рекомендованного-набора)
- [React-профиль](#react-профиль-configsreactmjs)
- [Строгий профиль](#строгий-профиль-configsstrictmjs)
- [SonarQube profiles](#sonarqube-profiles)

## Игнорируемые пути

Линтер не проверяет вспомогательные артефакты и собранные файлы:

- `node_modules`, `dist`, `.yarn`, `.git*`, `examples`
- Конфигурационные файлы линтера и форматтера: `.eslintrc*`, `.prettier*`
- Служебные типы сборки: `tsup*`, `Dockerfile`, любые `*.md`, `*.json`, `*.yml`
- PnP файлы Yarn: `.pnp.*`

---

## SonarQube profiles

The SonarQube import is represented by two generated artifacts:

- `configs/sonar-catalog.generated.json` contains compact metadata for all 1095 imported frontend rules.
- `configs/rules/sonar.generated.mjs` contains the deduplicated executable ESLint rule profile.
- `coveredByProfiles` inside the generated catalog shows which public profiles already execute a mapped ESLint rule.

Coverage summary:

- `sonarjs`: 470 catalog records backed by `eslint-plugin-sonarjs`.
- `external-eslint`: 79 catalog records already covered by existing enabled ESLint rules in one or more public profiles.
- `metadata-only`: 479 catalog records without a reliable ESLint execution path in this package.
- `deprecated`: 67 SonarQube rules retained as metadata but never enabled.

The executable Sonar profile enables 251 unique `sonarjs/*` rules. Rules that require type information are scoped to TypeScript files. CSS and HTML/Web SonarQube rules are metadata-only until a supported analyzer path is added. React-specific mappings such as JSX and a11y equivalents are reflected in `coveredByProfiles` and are available through `react` and `react-sonar`, not plain `sonar`.

```js
import reactSonarConfig from '@ytdev/linter/configs/react-sonar';

export default [...reactSonarConfig];
```

---

## Базовый профиль (JavaScript + TypeScript)

Профиль `eslint.config.mjs` собирает рекомендации `@eslint/js`, набор `typescript-eslint` в режиме type-checked, дополнительные правила для импортов и форматирования. Все правила из этого раздела применяются к `.js/.mjs/.ts/.tsx` файлам, если не указано иное.

### Общие правила @eslint/js (config `recommended`)

Эти правила включены автоматически через `pluginJs.configs.recommended` и защищают от распространённых ошибок.

#### Корректность классов и конструкторов

**`constructor-super` - вызов super() в конструкторах**

Описание: Если класс наследуется от другого (extends), его конструктор обязан вызывать super(...) до любого использования this. Это гарантирует корректную инициализацию родительского класса.

```ts
// Хорошо
class Person {
  constructor(name) {
    this.name = name;
  }
}

class Employee extends Person {
  constructor(name, position) {
    super(name); // сначала super
    this.position = position;
  }
}

// Плохо
class Employee extends Person {
  constructor(name, position) {
    this.position = position; // использование this до super
    super(name);
  }
}
```

**`no-class-assign` - запрет переназначения класса**

Описание: Запрещает переприсваивать идентификатор класса после объявления. Класс — это не просто переменная; его переопределение делает код непредсказуемым и ломает ожидания.

```ts
// Хорошо
class Person {
  constructor(name) {
    this.name = name;
  }
}

const john = new Person('John');

// Плохо
class Person {
  constructor(name) {
    this.name = name;
  }
}

Person = {}; // переопределение класса
```

**`no-dupe-class-members` - запрет дублирования членов класса**

Описание: В одном классе нельзя объявлять два метода или поля с одинаковым именем. Последующее определение тихо перетирает предыдущее и усложняет отладку.

```ts
// Хорошо
class Person {
  getName() {
    return this.name;
  }

  setName(name) {
    this.name = name;
  }
}

// Плохо
class Person {
  getName() {
    return this.name;
  }

  getName() {
    // дубликат метода
    return this.name.toUpperCase();
  }
}
```

**`no-this-before-super` - запрет использования this/super до вызова super()**

Описание: В подклассе (extends) нельзя обращаться к this или вызывать методы через super.\* до явного вызова конструктора родителя super(). До этого момента экземпляр ещё не инициализирован.

```ts
// Хорошо
class Person {
  constructor(name) {
    this.name = name;
  }
}

class Employee extends Person {
  constructor(name, position) {
    super(name); // сначала super
    this.position = position; // затем this
  }
}

// Плохо
class Employee extends Person {
  constructor(name, position) {
    this.position = position; // this до super
    super(name);
  }
}

class Manager extends Person {
  constructor(name) {
    super.log(); // обращение к super.* до super()
    super(name);
  }
}
```

**`no-unused-private-class-members` - неиспользуемые приватные члены класса**

Описание: Приватные поля и методы класса (с префиксом #) должны использоваться внутри класса. Неиспользуемые приватные члены считаются мёртвым кодом и должны удаляться.

```ts
// Хорошо
class Counter {
  #value = 0;

  increment() {
    this.#value += 1; // приватное поле используется
  }

  getValue() {
    return this.#value;
  }
}

// Плохо
class Counter {
  #value = 0; // нигде не используется
  #log() {
    // метод тоже не используется
    console.log(this.#value);
  }

  increment() {
    // логика без использования приватных членов
  }
}
```

**`getter-return` - getter должен возвращать значение**

Описание: Геттер (get prop() { ... }) обязан всегда либо возвращать значение через return, либо явно выбрасывать ошибку. Отсутствие return делает поведение геттера неочевидным.

```ts
// Хорошо
class Person {
  constructor(name) {
    this._name = name;
  }

  get name() {
    return this._name;
  }
}

// Хорошо (геттер всегда бросает ошибку)
class Config {
  get secretKey() {
    throw new Error('Access denied');
  }
}

// Плохо
class Person {
  constructor(name) {
    this._name = name;
  }

  get name() {
    console.log(this._name); // нет return
  }
}
```

#### Безопасность управления потоком

Эти правила помогают ловить ошибки, из-за которых код «доходит не туда» или ведёт себя неочевидно.

**`no-cond-assign` — запрет присваивания в условиях**

Описание: Запрещает использовать оператор присваивания = в if, while, for и других условных выражениях. В большинстве случаев это опечатка вместо ===.

```ts
// Хорошо
if (x === 10) {
  doSomething();
}

while (value !== null) {
  value = getNext();
}

// Плохо
if ((x = 10)) {
  // присваивание вместо сравнения
  doSomething();
}

while ((value = getNext())) {
  // условие всегда результат присваивания
  process(value);
}
```

**`no-constant-binary-expression` — запрет константных бинарных выражений**

Описание: Запрещает бинарные выражения, результат которых всегда один и тот же и не зависит от исполнения программы. Обычно это следствие опечатки или неверной логики.

```ts
// Хорошо
if (a > 0 && b > 0) {
  doSomething();
}

const sum = a + b;

// Плохо
if (true || false) {
  // условие всегда true
  doSomething();
}

if (1 * 2) {
  // результат выражения всегда 2 (truthy)
  doSomethingElse();
}
```

**`no-constant-condition` — запрет константных условий**

Описание: Запрещает условия if, ?:, и т.п., которые всегда истинны или ложны (if (true), if (0)). Такие конструкции обычно означают забытый флаг или временный код, не убранный из продакшена.

```ts
// Хорошо
if (isEnabled) {
  doSomething();
}

while (count > 0) {
  count -= 1;
}

// Плохо
if (true) {
  // условие всегда выполняется
  doSomething();
}

if (0) {
  // блок никогда не выполнится
  doSomethingElse();
}
```

**`no-unexpected-multiline` — защита от неожиданных многострочных выражений**

Описание: Предотвращает ситуации, когда перенос строки меняет смысл из-за автоматической подстановки точек с запятой (ASI). Это помогает избежать скрытых ошибок при форматировании.

```ts
// Хорошо
const foo = bar(1, 2);

const result = foo + bar;

// Явное использование скобок
a = b;
(b || c).doSomething();

// Плохо
return;
42; // фактически возвращается undefined, а не 42

a = b(b || c).doSomething(); // интерпретируется как два выражения: a = b; (b || c).doSomething();
```

**`no-unreachable` — запрет недостижимого кода**

Описание: Запрещает инструкции после return, throw, break или continue. Такой код никогда не выполнится и, как правило, является ошибкой.

```ts
// Хорошо
function getValue() {
  if (!ready) {
    return null;
  }
  return compute();
}

// Плохо
function getValue() {
  return compute();
  console.log('never called'); // недостижимый код
}

for (let i = 0; i < 10; i += 1) {
  break;
  doSomething(); // недостижимо
}
```

**`no-unsafe-finally` — запрет управления потоком в finally**

Описание: Запрещает return, throw, break и continue внутри блока finally. Такие операторы перекрывают результат try/catch и делают поведение кода сложно предсказуемым.

```ts
// Хорошо
function process() {
  try {
    return doWork();
  } catch (error) {
    logError(error);
    throw error;
  } finally {
    cleanup(); // только побочные эффекты, без return/throw
  }
}

// Плохо
function process() {
  try {
    return doWork();
  } finally {
    return 42; // перекрывает возвращаемое значение из try
  }
}

function handle() {
  try {
    throw new Error('fail');
  } finally {
    throw new Error('override'); // перезапишет исходную ошибку
  }
}
```

**`require-yield` — генераторы должны содержать yield**

Описание: Генераторная функция function\* должна содержать хотя бы один yield. Иначе нет смысла объявлять её генератором.

```ts
// Хорошо
function* ids() {
  let id = 0;
  while (true) {
    yield (id += 1);
  }
}

// Плохо
function* doWork() {
  console.log('no yield here'); // генератор не выдаёт значений
}
```

**`for-direction` — корректное направление цикла for**

Описание: Проверяет, что условие и инкремент цикла for не делают его бесконечным из-за ошибки знака. Например, i++ при условии i > 0.

```ts
// Хорошо
for (let i = 0; i < 10; i += 1) {
  doSomething(i);
}

for (let i = 10; i > 0; i -= 1) {
  doSomething(i);
}

// Плохо
for (let i = 0; i < 10; i -= 1) {
  // i уменьшается, но условие требует роста
  doSomething(i);
}

for (let i = 10; i > 0; i += 1) {
  // i растёт, но условие требует уменьшения
  doSomething(i);
}
```

#### Защита от ошибок синтаксиса и RegExp

Эти правила предотвращают тонкие ошибки в регулярных выражениях и синтаксисе, которые сложно заметить при просмотре кода.

**`no-control-regex` — запрет управляющих символов в регулярках**

Описание: Запрещает использование управляющих символов (с кодами \x00–\x1F и \x7F) внутри литералов регулярных выражений. Такие символы почти всегда попадают туда по ошибке или при копировании.

```ts
// Хорошо
const re = /^[\n\r\t]+$/;          // управляющие символы указаны явно через escape-последовательности

const reHex = /^[\x00-\x1F]+$/;    // диапазон описан явно

// Плохо
const re = /^[
]+$/;  // в литерале реально присутствует «сырой» управляющий символ (невидимый в коде)
```

**`no-empty-character-class` — запрет пустых классов в регулярках**

Описание: Запрещает пустые символьные классы [] в регулярных выражениях. Такой класс никогда ни с чем не совпадает и почти всегда означает ошибку в паттерне.

```ts
// Хорошо
const re = /[a-zA-Z0-9]/;
const reOptionalSpace = /[ ]?/;

// Плохо
const re = /foo[]bar/; // [] — пустой класс, регулярка никогда не матчит
```

**`no-fallthrough` — запрет fallthrough в switch**

Описание: Запрещает «протекание» выполнения между case без break, return, throw и т.п. Если fallthrough действительно нужен, его надо явно пометить комментарием.

```ts
// Хорошо
switch (status) {
  case 'pending':
    handlePending();
    break;
  case 'active':
    handleActive();
    break;
  default:
    handleDefault();
}

// Хорошо (явный fallthrough с комментарием)
/* eslint-disable no-fallthrough */
switch (value) {
  case 1:
    doSomething();
  // falls through
  case 2:
    doSomethingElse();
    break;
}
/* eslint-enable no-fallthrough */

// Плохо
switch (status) {
  case 'pending':
    handlePending(); // забыли break — продолжится выполнение блока 'active'
  case 'active':
    handleActive();
    break;
}
```

**`no-invalid-regexp` — запрет невалидных регулярных выражений**

Описание: Запрещает создание регулярных выражений с синтаксическими ошибками (например, нескрытые скобки, некорректные флаги). Ловит ошибки как в литералах, так и в конструкторе RegExp.

```ts
// Хорошо
const re = /^(foo|bar)$/;
const reFlags = new RegExp('^foo$', 'i');

// Плохо
const re = /foo(/; // незакрытая группа
const reFlags = new RegExp('foo', 'invalid-flag'); // некорректный флаг
```

**`no-misleading-character-class` — запрет misleading символов в регулярках**

Описание: Запрещает символьные классы, в которых смешиваются символы из разных Unicode-диапазонов (например, латиница и кириллица, похожие цифры и буквы), что может привести к неожиданным совпадениям. Это особенно важно в многоязычных проектах и при валидации пользовательского ввода.

```ts
// Хорошо
const latin = /[A-Za-z]+/;
const cyrillic = /[А-Яа-яЁё]+/;

// Плохо
const mixed = /[A-Za-zА-Яа-я]/; // латиница и кириллица в одном классе — визуально похожие, но разные символы

const digits = /[0-9０-９]/; // арабские цифры и full-width цифры вперемешку
```

**`no-regex-spaces` — запрет множественных пробелов в регулярках**

Описание: Запрещает несколько обычных пробелов подряд внутри литерала регулярного выражения. Такие пробелы тяжело визуально посчитать и часто возникают по ошибке; лучше использовать квантификаторы или явные escape-последовательности.

```ts
// Хорошо
const re = /foo {2}bar/; // два пробела явно указаны
const reTabs = /foo\t+bar/; // табы указаны через \t

// Плохо
const re = /foo   bar/; // три пробела подряд — на глаз непонятно, сколько их
```

**`no-useless-backreference` — запрет бесполезных обратных ссылок**

Описание: Запрещает обратные ссылки \1, \2 и т.п., которые никогда не сработают: например, ссылаются на несуществующую группу или находятся в ветке, где группа не определена. Такие конструкции усложняют регулярку и вводят в заблуждение.

```ts
// Хорошо
const re = /(foo|bar)\1/; // совпадение 'foofoo' или 'barbar'

// Плохо
const re = /(?:foo)\1/; // \1 ссылается на non-capturing группу (?:...), которая не создаёт номер
const re2 = /(foo)|(bar)\2/; // \2 существует только если вторая группа вообще матчится — бесполезная ссылка
```

**`no-irregular-whitespace` — запрет нестандартных пробелов**

Описание: Запрещает использование «невидимых» и нестандартных символов пробела в коде (например, non-breaking space \u00A0, zero-width space \u200B и др.), кроме строковых/шаблонных литералов и комментариев. Такие символы сложно заметить и они могут ломать парсинг или форматирование.

```ts
// Хорошо
const text = 'Hello, world!';
const spaced = 'Hello, world!'; // обычные пробелы

// Плохо
const text = 'Hello, world!'; // между запятой и world неразрывный пробел \u00A0

const x = 1 + 2; // вокруг + используется нестандартный пробел \u2005
```

#### Чистый код без дубликатов

Эти правила помогают избегать дублирования и «пустых» конструкций, которые усложняют поддержку кода и маскируют реальные ошибки.

**`no-dupe-args` — запрет дублирования аргументов**

Описание: Запрещает использование двух и более параметров с одинаковым именем в объявлении функции. Такие дубликаты ведут к путанице и зависят от порядка параметров, что делает код хрупким.

```ts
// Хорошо
function createUser(name, role) {
  return { name, role };
}

// Плохо
function createUser(name, name) {
  // второй name перекрывает первый
  return { name };
}
```

**`no-dupe-else-if` — запрет дублирования условий else-if**

Описание: Запрещает одинаковые условия в цепочке if / else if. Если одно и то же условие повторяется, нижеследующие ветки никогда не выполнятся и только засоряют код.

```ts
// Хорошо
if (status === 'pending') {
  handlePending();
} else if (status === 'active') {
  handleActive();
} else if (status === 'done') {
  handleDone();
}

// Плохо
if (status === 'pending') {
  handlePending();
} else if (status === 'active') {
  handleActive();
} else if (status === 'active') {
  // дублирующее условие — мёртвый код
  handleActiveAgain();
}
```

**`no-dupe-keys` — запрет дублирования ключей объекта**

Описание: Запрещает объявлять один и тот же ключ несколько раз в одном литерале объекта. Последнее значение перезаписывает предыдущие, что часто является ошибкой.

```ts
// Хорошо
const config = {
  host: 'localhost',
  port: 3000,
};

// Плохо
const config = {
  host: 'localhost',
  port: 3000,
  port: 8000, // дублирующий ключ — первое значение silently теряется
};
```

**`no-duplicate-case` — запрет дублирования case в switch**

Описание: Запрещает одинаковые значения case внутри одного switch. Повторные ветки никогда не будут достигнуты и только запутывают логику.

```ts
// Хорошо
switch (role) {
  case 'admin':
    handleAdmin();
    break;
  case 'user':
    handleUser();
    break;
  default:
    handleGuest();
}

// Плохо
switch (role) {
  case 'admin':
    handleAdmin();
    break;
  case 'user':
    handleUser();
    break;
  case 'admin': // дубликат — мёртвый код
    handleAdminAgain();
    break;
}
```

**`no-empty` — запрет пустых блоков**

Описание: Запрещает полностью пустые блоки {} в if, catch, while, for и т.п. Исключение — блоки, в которых явно указано, что пустота осознанна, через комментарий.

```ts
// Хорошо
try {
  doRiskyWork();
} catch (error) {
  // intentionally ignore: логируем в глобальном обработчике
}

if (isEnabled) {
  enableFeature();
}

// Плохо
if (isEnabled) {
} // пустой блок — непонятно, забыли логику или так задумано

try {
  doRiskyWork();
} catch (error) {} // ошибка игнорируется молча
```

**`no-empty-pattern` — запрет пустых паттернов деструктуризации**

Описание: Запрещает пустые деструктуризации вида {} или [] в параметрах функций и присваиваниях. Если вы ничего не извлекаете из объекта/массива, деструктуризация не нужна.

```ts
// Хорошо
const { id } = user;

function handleResponse({ data, status }) {
  console.log(status, data);
}

// Плохо
function handleResponse({}) {
  // ничего не извлекаем
  // ...
}

const {} = options; // бесполезная деструктуризация
```

**`no-empty-static-block` — запрет пустых статических блоков**

Описание: Запрещает пустые static {} блоки внутри классов. Статический блок должен содержать инициализацию или побочный эффект; пустой блок не несёт смысла.

```ts
// Хорошо
class Config {
  static settings;

  static {
    Config.settings = loadSettings();
  }
}

// Плохо
class Config {
  static {
    // пустой static-блок — никакой логики
  }
}
```

**`no-extra-boolean-cast` — запрет лишнего boolean-приведения**

Описание: Запрещает лишние Boolean(...) и !! там, где JavaScript и так неявно приводит выражение к булеву (условия if, while, тернарный оператор и т.д.). Явное приведение оставляем только там, где действительно нужен тип boolean как значение.

```ts
// Хорошо — приведение не используется в условиях
if (isReady) {
  start();
}

while (items.length) {
  process(items.pop());
}

// Хорошо — явное boolean-значение как часть API/структуры
const isActive = Boolean(config.active);
const options = {
  strict: !!strict,
};

// Плохо — лишнее приведение в условиях
if (!!isReady) {
  // !! не нужен
  start();
}

while (Boolean(items.length)) {
  // Boolean(...) не нужен
  process(items.pop());
}
```

#### Работа с переменными

Эти правила контролируют корректное объявление, использование и изменение переменных, защищая от неочевидных багов и мёртвого кода.

**`no-delete-var` — запрет удаления переменных**

Описание: Запрещает использовать delete для переменных и параметров. delete предназначен только для свойств объектов, а попытка удалить переменную ничего полезного не делает и вводит в заблуждение.

```ts
// Хорошо
const user = { name: 'John' };
delete user.name; // удаляем свойство объекта — ок

// Плохо
let count = 1;
delete count; // переменные так не удаляются
```

**`no-shadow-restricted-names` — запрет затенения зарезервированных имён**

Описание: Запрещает объявлять переменные с именами, совпадающими с глобальными зарезервированными идентификаторами (например, undefined, NaN, Infinity, arguments). Такое затенение ломает ожидания и может привести к очень странным багам.

```ts
// Хорошо
const value = undefined;
function parse(input) {
  let result;
  // ...
}

// Плохо
const undefined = true; // затеняем глобальное undefined

function parse() {
  const arguments = []; // перекрываем встроенный объект arguments
}
```

**`no-undef` — запрет неопределённых переменных**

Описание: Запрещает использовать переменные, которые не были объявлены в области видимости (через const, let, var или импорт). Это помогает ловить опечатки и забытые импорты.

```ts
// Хорошо
const count = 10;

function increment() {
  return count + 1;
}

// Плохо
function increment() {
  return coutn + 1; // опечатка, coutn не объявлена
}

total += 1; // total нигде не объявлена
```

**`no-unused-labels` — запрет неиспользуемых меток**

Описание: Запрещает объявлять метки (label) для операторов, если по ним нигде не выполняется break или continue. Метки используются крайне редко; неиспользуемые метки только засоряют код.

```ts
// Хорошо
outer: for (let i = 0; i < 10; i += 1) {
  for (let j = 0; j < 10; j += 1) {
    if (shouldBreak(i, j)) {
      break outer; // используем метку outer
    }
  }
}

// Плохо
unusedLabel: for (let i = 0; i < 10; i += 1) {
  doWork(i);
  // ни break unusedLabel, ни continue unusedLabel — метка не нужна
}
```

**`no-unused-vars` — запрет неиспользуемых переменных (перекрывается TypeScript-версией)**

Описание: В базовом JS-профиле правило запрещает объявлять переменные, параметры и импортированные имена, которые нигде не используются. В TypeScript-файлах реальную проверку выполняет @typescript-eslint/no-unused-vars, чтобы учитывать типы и особенности TS.

```ts
// Хорошо
const LIMIT = 10;

function paginate(items) {
  const pageSize = LIMIT;
  return items.slice(0, pageSize);
}

// Плохо
const LIMIT = 10; // не используется

function paginate(items, pageSize) {
  // pageSize не используется
  return items;
}
```

Примечание: в .ts/.tsx файлах следи за неиспользуемыми переменными по диагностике @typescript-eslint/no-unused-vars; базовое правило для них отключено.

**`no-self-assign` — запрет самоприсваивания**

Описание: Запрещает присваивать переменной самой себе (a = a), полю объекта самому себе (obj.x = obj.x) и т.п. Такое присваивание либо ошибка, либо бессмысленный код, который можно удалить.

```ts
// Хорошо
let count = 1;
count = count + 1;

const user = { name: 'John', age: 30 };
user.age = user.age + 1;

// Плохо
let count = 1;
count = count; // ничего не делает

const user = { name: 'John' };
user.name = user.name; // бессмысленное присваивание
```

#### Безопасные числа и сравнения

**`no-compare-neg-zero` – запрет сравнения с -0**

Описание: В JavaScript существуют два разных нуля: 0 и -0. В большинстве прикладных сценариев их не различают, и прямое сравнение с -0 почти всегда является ошибкой. Если действительно нужно различать 0 и -0, следует использовать Object.is() или проверять знак через 1 / value.

```ts
// Хорошо
if (value === 0) {
  // обрабатываем ноль (0 и -0 не различаем)
}

if (Object.is(value, -0)) {
  // редкий случай, когда нужно именно -0
}

if (1 / value === -Infinity) {
  // альтернативная проверка -0
}

// Плохо
if (value === -0) {
  // прямое сравнение с -0
}

if (value == -0) {
  // то же самое с нестрогим сравнением
}
```

**`no-loss-of-precision` – запрет потери точности чисел**

Описание: Числа в JavaScript хранятся в формате IEEE 754 (double precision). Некоторые большие или «нестандартные» литералы не могут быть представлены точно и обрезаются до ближайшего представимого значения. Правило запрещает такие литералы, чтобы не было скрытой потери точности прямо в коде.

```ts
// Хорошо
const maxSafe = Number.MAX_SAFE_INTEGER; // 9007199254740991
const big = 9007199254740991; // последнее безопасное целое

const precise = 0.1;
const alsoPrecise = 1e21; // экспоненциальная запись допустима

// нужно больше? используем BigInt или строку
const bigger = 9007199254740993n; // BigInt
const idFromBackend = '9007199254740993'; // храним как строку

// Плохо
// не может быть представлено точно, но выглядит как «магическое» число
const broken = 9007199254740993;

// такие дроби тоже могут быть проблемой
const weird = 0.12345678901234567;
```

**`use-isnan` – использовать isNaN для проверки NaN**

Описание: NaN никогда не равен сам себе (NaN !== NaN), поэтому проверки через === NaN не работают. Правило требует использовать Number.isNaN() (предпочтительно) или isNaN() для проверки значения на NaN.

```ts
// Хорошо
if (Number.isNaN(value)) {
  // обрабатываем NaN
}

function parsePrice(input) {
  const num = Number(input);
  if (Number.isNaN(num)) {
    return null;
  }
  return num;
}

// Допустимо в старых окружениях
if (isNaN(value)) {
  // но лучше явно использовать Number.isNaN, если доступен
}

// Плохо
if (value === NaN) {
  // никогда не выполнится
}

if (value == NaN) {
  // тоже никогда не выполнится
}

if (value !== value) {
  // хитрый трюк через сравнение с самим собой
}
```

**`valid-typeof` – корректные строки для typeof**

Описание: При сравнении результата typeof нужно использовать только валидные строковые литералы:
'undefined', 'object', 'boolean', 'number', 'string', 'function', 'symbol', 'bigint'.
Опечатки или несуществующие типы ('obj', 'array', 'integer') считаются ошибкой.

```ts
// Хорошо
if (typeof value === 'string') {
  // строка
}

if (typeof value === 'number') {
  // число
}

if (typeof value === 'undefined') {
  // нет значения
}

if (typeof value === 'bigint') {
  // BigInt, если окружение поддерживает
}

// Плохо
if (typeof value === 'strng') {
  // опечатка: 'strng' вместо 'string'
}

if (typeof value === 'integer') {
  // такого типа не существует
}

if (typeof value === 'array') {
  // массивы — это 'object'
}

// правильно так
if (Array.isArray(value)) {
  // проверка массива
}
```

#### Корректность промисов и асинхронности

**`no-async-promise-executor` – запрет async в executor промиса**

Описание: Запрещает объявлять executor у new Promise как async-функцию. Исключения в async-executor ведут себя нетривиально, могут превращаться в неотлавливаемые отклонения и усложняют управление потоком. Асинхронный код нужно выносить за пределы конструктора Promise или использовать уже существующие промисы.

```ts
// Хорошо
// без async в executor
const result = new Promise((resolve, reject) => {
  try {
    const value = computeSync();
    resolve(value);
  } catch (error) {
    reject(error);
  }
});

// асинхронная логика снаружи
async function fetchData() {
  const response = await api.get('/data');
  return response.data;
}

fetchData().then(handleData).catch(handleError);

// Плохо
// executor объявлен как async
const result = new Promise(async (resolve, reject) => {
  const response = await api.get('/data');
  resolve(response.data);
  // ошибки могут всплывать неконтролируемо
});
```

**`no-unsafe-optional-chaining` – безопасный optional chaining**

Описание: Запрещает использование ?. в местах, где результат может неожиданно стать undefined и тут же использоваться в контексте, не готовом к этому (арифметика, логические операции, левый операнд in/instanceof, присваивание и т.п.). Правило заставляет явно учитывать undefined после optional chaining и тем самым предотвращает скрытые TypeError и неочевидную логику.

```ts
// Хорошо
// безопасный доступ к глубоко вложенному свойству
const street = user?.address?.street ?? 'Unknown street';

// безопасный вызов метода
const length = user?.getName?.().length ?? 0;

// явная проверка перед использованием
const price = product?.price;
if (price != null) {
  total += price;
}

// Плохо
// арифметика с возможным undefined
total += product?.price; // если product undefined, будет total += undefined

// небезопасный доступ к свойству результата optional chaining
const street = user?.address.street; // address может быть undefined

// использование слева от in
if (key in obj?.config) {
  // obj может быть undefined -> TypeError
}

// присваивание в цепочку
user?.profile.name = 'John'; // если user undefined, будет попытка записи в undefined
```

**`no-unsafe-negation` – безопасное отрицание**

Описание: Запрещает отрицание ! непосредственно перед оператором сравнения (in, instanceof и др.), из-за особенностей парсинга. Конструкция !key in obj интерпретируется как (!key) in obj, а не как !(key in obj). Правило требует ставить скобки, чтобы явно указать, что именно отрицается.

```ts
// Хорошо
// проверяем, что свойства НЕТ в объекте
if (!(key in obj)) {
  // ключ отсутствует
}

// проверяем, что значение НЕ является экземпляром класса
if (!(value instanceof Error)) {
  // не ошибка
}

// Плохо
if ((!key) in obj) {
  // на самом деле интерпретируется как (!key) in obj
  // логика почти наверняка неверная
}

if ((!value) instanceof Error) {
  // интерпретируется как (!value) instanceof Error
}
```

### Best Practices (Airbnb)

Эти правила основаны на Airbnb JavaScript Style Guide и включают лучшие практики разработки.

#### `no-var` - Использовать const/let вместо var

**Описание:** Запрещает использование `var`, требует `const` или `let`.

```js
// Хорошо
const x = 1;
let y = 2;

// Плохо
var x = 1;
```

#### `prefer-const` - Предпочитать const для неизменяемых переменных

**Описание:** Если переменная не переназначается, используй `const`.

```js
// Хорошо
const name = 'John';
let count = 0;
count += 1;

// Плохо
let name = 'John'; // никогда не меняется
```

#### `no-eval` - Запрет использования eval()

**Описание:** `eval()` опасен и может выполнять произвольный код.

```js
// Хорошо
const result = calculate(x, y);

// Плохо
const result = eval('x + y');
```

#### `no-new-func` - Запрет создания функций через new Function

**Описание:** Аналогично eval, создание функций из строк небезопасно.

```js
// Хорошо
const add = (a, b) => a + b;

// Плохо
const add = new Function('a', 'b', 'return a + b');
```

#### `no-return-assign` - Запрет присваивания в return

**Описание:** Присваивание в return может быть запутывающим.

```js
// Хорошо
function getValue(num) {
  const result = num * 2;
  return result;
}

// Плохо
function getValue(num) {
  return (result = num * 2);
}
```

#### `no-param-reassign` - Запрет переназначения параметров

**Описание:** Запрещает изменение параметров функции (но разрешает изменение их свойств).

```js
// Хорошо
function addProperty(obj) {
  obj.newProp = 'value'; // модификация свойств разрешена
  return obj;
}

function increment(num) {
  return num + 1;
}

// Плохо
function increment(num) {
  num += 1; // переназначение параметра запрещено
  return num;
}
```

#### `no-useless-return` - Запрет бесполезного return

**Описание:** Удаляет избыточные return в конце функции.

```js
// Хорошо
function doSomething() {
  console.log('done');
}

// Плохо
function doSomething() {
  console.log('done');
  return;
}
```

#### `no-else-return` - Запрет else после return

**Описание:** Если в if есть return, else не нужен.

```js
// Хорошо
function getValue(condition) {
  if (condition) {
    return 'yes';
  }
  return 'no';
}

// Плохо
function getValue(condition) {
  if (condition) {
    return 'yes';
  } else {
    return 'no';
  }
}
```

#### `eqeqeq` - Строгое сравнение === вместо ==

**Описание:** Всегда используй `===` и `!==` вместо `==` и `!=` (кроме сравнения с null).

```js
// Хорошо
if (x === 10) {
}
if (x == null) {
} // разрешено для null/undefined

// Плохо
if (x == 10) {
}
```

#### `no-iterator` - Запрет использования **iterator**

**Описание:** `__iterator__` устарел, используй итераторы ES6.

```js
// Хорошо
for (const item of array) {
}

// Плохо
obj.__iterator__ = function () {};
```

#### `no-proto` - Запрет использования **proto**

**Описание:** Используй `Object.getPrototypeOf()` вместо `__proto__`.

```js
// Хорошо
const proto = Object.getPrototypeOf(obj);

// Плохо
const proto = obj.__proto__;
```

#### `no-extend-native` - Запрет расширения нативных объектов

**Описание:** Не изменяй прототипы встроенных объектов.

```js
// Хорошо
function getLastElement(arr) {
  return arr[arr.length - 1];
}

// Плохо
Array.prototype.last = function () {
  return this[this.length - 1];
};
```

#### `no-new-object` - Использовать литералы объектов

**Описание:** Используй `{}` вместо `new Object()`.

```js
// Хорошо
const obj = {};

// Плохо
const obj = new Object();
```

#### `object-shorthand` - Сокращённый синтаксис объектов

**Описание:** Используй сокращённую запись методов и свойств.

```js
// Хорошо
const obj = {
  name,
  getValue() {
    return 1;
  },
};

// Плохо
const obj = {
  name: name,
  getValue: function () {
    return 1;
  },
};
```

#### `quote-props` - Кавычки для свойств объекта только когда нужно

**Описание:** Не оборачивай ключи в кавычки, если это не требуется.

```js
// Хорошо
const obj = {
  name: 'John',
  'full-name': 'John Doe',
};

// Плохо
const obj = {
  name: 'John',
};
```

#### `array-callback-return` - Обязательный return в array методах

**Описание:** Колбэки map/filter/reduce должны возвращать значение.

```js
// Хорошо
const doubled = array.map((x) => x * 2);
array.forEach((x) => console.log(x));

// Плохо
const doubled = array.map((x) => {
  x * 2; // нет return
});
```

#### `prefer-destructuring` - Предпочитать деструктуризацию

**Описание:** Используй деструктуризацию для извлечения свойств объектов.

```js
// Хорошо
const { name, age } = user;

// Плохо
const name = user.name;
const age = user.age;
```

#### `prefer-template` - Использовать template strings

**Описание:** Используй template literals вместо конкатенации строк.

```js
// Хорошо
const message = `Hello, ${name}!`;

// Плохо
const message = 'Hello, ' + name + '!';
```

#### `template-curly-spacing` - Нет пробелов в template literals

**Описание:** Не добавляй пробелы внутри `${}`.

```js
// Хорошо
const message = `Hello, ${name}!`;

// Плохо
const message = `Hello, ${name}!`;
```

#### `no-useless-concat` - Запрет бесполезной конкатенации

**Описание:** Не конкатенируй литералы, которые можно объединить.

```js
// Хорошо
const message = 'Hello World';

// Плохо
const message = 'Hello ' + 'World';
```

#### `prefer-arrow-callback` - Предпочитать стрелочные функции в колбэках

**Описание:** Используй стрелочные функции для коротких колбэков.

```js
// Хорошо
array.map((x) => x * 2);

// Плохо (если не нужен this)
array.map(function (x) {
  return x * 2;
});
```

#### `arrow-body-style` - Неявный return в стрелочных функциях

**Описание:** Если тело стрелочной функции — одно выражение, опускай `{}` и `return`.

```js
// Хорошо
const double = (x) => x * 2;

// Плохо
const double = (x) => {
  return x * 2;
};
```

#### `arrow-parens` - Всегда скобки вокруг параметров стрелочных функций

**Описание:** Всегда оборачивай параметры в скобки.

```js
// Хорошо
const double = (x) => x * 2;

// Плохо
const double = (x) => x * 2;
```

#### `no-restricted-exports` - Запрет экспорта определённых имён

**Описание:** Запрещает экспортировать `default` как именованный и `then` (для совместимости с промисами).

```js
// Хорошо
export const value = 42;
export default MyComponent;

// Плохо
export { default } from './module';
export const then = () => {};
```

#### `no-nested-ternary` - Предупреждение о вложенных тернарных операторах

**Описание:** Вложенные тернарники сложно читать.

```js
// Хорошо
let value;
if (condition1) {
  value = 'a';
} else if (condition2) {
  value = 'b';
} else {
  value = 'c';
}

// Предупреждение (плохо)
const value = condition1 ? 'a' : condition2 ? 'b' : 'c';
```

#### `no-unneeded-ternary` - Запрет ненужных тернарных операторов

**Описание:** Не используй тернарник, если можно обойтись без него.

```js
// Хорошо
const isActive = !!value;

// Плохо
const isActive = value ? true : false;
```

#### `no-mixed-operators` - Явная приоритетность операторов

**Описание:** Используй скобки для ясности при смешивании операторов.

```js
// Хорошо
const result = (a + b) * c;
const result = (a && b) || c;

// Плохо
const result = a + b * c; // неочевидно
const result = a && b / c;
```

#### `brace-style` - Стиль фигурных скобок

**Описание:** Открывающая скобка на той же строке (1tbs style).

```js
// Хорошо
if (condition) {
  doSomething();
}

// Плохо
if (condition) {
  doSomething();
}
```

#### `spaced-comment` - Пробел после // или /\*

**Описание:** Всегда добавляй пробел после начала комментария.

```js
// Хорошо
// This is a comment
/* This is a block comment */

// Плохо
//This is a comment
/*This is a block comment*/
```

#### `comma-style` - Запятая в конце строки

**Описание:** Запятые должны быть в конце строки, а не в начале следующей.

```js
// Хорошо
const obj = {
  a: 1,
  b: 2,
};

// Плохо
const obj = {
  a: 1,
  b: 2,
};
```

#### `comma-dangle` - Trailing comma в многострочных структурах

**Описание:** Всегда добавляй запятую после последнего элемента в многострочных структурах.

```js
// Хорошо
const obj = {
  a: 1,
  b: 2,
};

const arr = [1, 2];

// Плохо
const obj = {
  a: 1,
  b: 2,
};
```

#### `radix` - Явное указание системы счисления в parseInt

**Описание:** Всегда указывай второй параметр radix для parseInt.

```js
// Хорошо
const num = parseInt('10', 10);

// Плохо
const num = parseInt('10');
```

#### `no-new` - Запрет вызова new без присваивания

**Описание:** Не вызывай конструктор без сохранения результата.

```js
// Хорошо
const instance = new MyClass();

// Плохо
new MyClass();
```

### Явные точки с запятой (`semi`)

**Описание:** Все инструкции завершаются точкой с запятой.

```js
// Хорошо
const sum = a + b;
doSomething();

// Плохо
const sum = a + b;
doSomething();
```

### Запрет Symbol и BigInt без поддержки среды (`no-restricted-syntax`)

**Описание:** Использование `Symbol` и `BigInt` блокируется, если среда может их не поддерживать.

```js
// Хорошо (если среда поддерживает)
// const sym = Symbol('key');

// Плохо (если среда не поддерживает)
const sym = Symbol('key');
const big = 123n;
```

### Импорты

#### `no-duplicate-imports` - Не дублируйте импорты

**Описание:** Объединяйте импорты из одного модуля в один import.

```js
// Хорошо
import { foo, bar } from 'module';

// Плохо
import { foo } from 'module';
import { bar } from 'module';
```

#### `import/extensions` - Не указывайте расширения для JS/TS файлов

**Описание:** Для `js/jsx/ts/tsx` расширение опускается.

```js
// Хорошо
import Button from './Button';
import utils from '@/utils';

// Плохо
import Button from './Button.tsx';
import utils from '@/utils.ts';
```

#### `simple-import-sort/imports` - Сортировка импортов

**Описание:** Импорты автоматически сортируются в группы:

1. Внешние зависимости (`react`, `express`, etc.)
2. Namespace из `@*` пакетов (`@internal/logger`)
3. Абсолютные `@/...` алиасы (`@/components/Button`)
4. Side-effect импорты (`./styles.css`)
5. Восходящие относительные (`../parent/module`)
6. Одноуровневые относительные (`./helper`)

```js
// Хорошо
import express from 'express';
import { useState } from 'react';

import { logger } from '@internal/logger';

import { Button } from '@/components/Button';

import './styles.css';

import { something } from '../parent/module';

import { helper } from './helper';

// Плохо (неправильный порядок)
import './styles.css';
import { Button } from '@/components/Button';
import express from 'express';
import { helper } from './helper';
```

### Форматирование (Prettier + `eslint-plugin-prettier/recommended`)

**Описание:** Все нарушения Prettier показываются как ошибки ESLint. Настройки:

- Ширина строки: 120 символов
- Кавычки: одинарные
- Точка с запятой: обязательна
- Отступ: 2 пробела
- Trailing comma: всегда в многострочных структурах

```js
// Хорошо
const obj = {
  name: 'John',
  age: 30,
};

const message = `Hello, ${name}!`;

// Плохо
const obj = {
  name: 'John',
  age: 30,
};

const message = `Hello, ${name}!`;
```

### Правила TypeScript-eslint (config `recommendedTypeChecked`)

Эти правила включены автоматически через `tseslint.configs.recommendedTypeChecked` и применяются только к `.ts/.tsx` файлам.

#### Безопасные async-операции

- `@typescript-eslint/await-thenable` - await только для thenable
- `@typescript-eslint/no-floating-promises` - обрабатывай все промисы
- `@typescript-eslint/no-for-in-array` - не используй for-in для массивов
- `@typescript-eslint/no-implied-eval` - запрет неявного eval
- `@typescript-eslint/no-misused-promises` - корректное использование промисов
- `@typescript-eslint/require-await` - async функции должны содержать await
- `@typescript-eslint/unbound-method` - методы должны вызываться с правильным контекстом

#### Строгие типы и отсутствие небезопасных конструкций

- `@typescript-eslint/no-unsafe-argument` - типобезопасные аргументы
- `@typescript-eslint/no-unsafe-assignment` - типобезопасное присваивание
- `@typescript-eslint/no-unsafe-call` - типобезопасные вызовы
- `@typescript-eslint/no-unsafe-declaration-merging` - безопасное слияние деклараций
- `@typescript-eslint/no-unsafe-enum-comparison` - безопасное сравнение enum
- `@typescript-eslint/no-unsafe-function-type` - безопасные типы функций
- `@typescript-eslint/no-unsafe-member-access` - безопасный доступ к членам
- `@typescript-eslint/no-unsafe-return` - типобезопасные return
- `@typescript-eslint/no-base-to-string` - безопасное преобразование в строку

#### Чистота типов

- `@typescript-eslint/no-duplicate-enum-values` - запрет дублей в enum
- `@typescript-eslint/no-duplicate-type-constituents` - запрет дублей в union/intersection
- `@typescript-eslint/no-empty-object-type` - запрет пустых объектных типов
- `@typescript-eslint/no-non-null-asserted-optional-chain` - запрет `!` после optional chain
- `@typescript-eslint/no-extra-non-null-assertion` - запрет лишних `!`
- `@typescript-eslint/no-redundant-type-constituents` - запрет избыточных типов
- `@typescript-eslint/no-unnecessary-type-assertion` - запрет ненужных as
- `@typescript-eslint/no-unnecessary-type-constraint` - запрет ненужных extends
- `@typescript-eslint/prefer-as-const` - предпочитать as const

#### Ограничения по синтаксису

- `@typescript-eslint/no-namespace` - не используй namespace (кроме .d.ts)
- `@typescript-eslint/triple-slash-reference` - запрет /// <reference>
- `@typescript-eslint/prefer-namespace-keyword` - используй namespace вместо module

### Кастомные TS-усиления поверх рекомендованного набора

Эти правила добавлены дополнительно к TypeScript recommended и применяются только к `.ts/.tsx` файлам.

#### `@typescript-eslint/explicit-function-return-type` - Явный тип возврата функций

**Описание:** Все функции должны явно указывать тип возвращаемого значения.

```ts
// Хорошо
function sum(a: number, b: number): number {
  return a + b;
}

const multiply = (a: number, b: number): number => a * b;

// Плохо
function sum(a: number, b: number) {
  return a + b;
}
```

#### `@typescript-eslint/consistent-type-definitions` - Предпочитать interface

**Описание:** Используй `interface` для определения объектных типов вместо `type`.

```ts
// Хорошо
interface User {
  name: string;
  age: number;
}

type ID = string | number; // type для union/intersection

// Плохо
type User = {
  name: string;
  age: number;
};
```

#### `@typescript-eslint/no-floating-promises` - Обязательная обработка промисов

**Описание:** Каждый промис должен быть обработан (await, .then/.catch, void).

```ts
// Хорошо
await fetchData();

fetchData().then(handleData).catch(handleError);

void fetchData(); // явное игнорирование

// Плохо
fetchData(); // промис не обработан
```

#### `@typescript-eslint/no-unused-vars` - Контроль неиспользуемых переменных

**Описание:** Неиспользуемые переменные/параметры запрещены, кроме начинающихся с `_`.

```ts
// Хорошо
const { name, ...rest } = user;
const onClick = (_event: Event) => {};

// Плохо
const unused = 1; // переменная не используется
function handler(event: Event) {} // параметр не используется
```

#### `@typescript-eslint/explicit-member-accessibility` - Явные модификаторы доступа

**Описание:** Всегда указывай `public`, `protected` или `private` для членов класса.

```ts
// Хорошо
class User {
  public name: string;
  private age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  public getName(): string {
    return this.name;
  }
}

// Плохо
class User {
  name: string; // нет модификатора
  age: number;
}
```

#### `@typescript-eslint/member-ordering` - Порядок элементов класса

**Описание:** Члены класса должны быть упорядочены: сигнатуры → статические поля → поля экземпляра → конструкторы → методы.

```ts
// Хорошо
class User {
  // Статические поля
  public static defaultName: string = 'Guest';
  private static instances: number = 0;

  // Поля экземпляра
  public name: string;
  private age: number;

  // Конструктор
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  // Статические методы
  public static getInstanceCount(): number {
    return User.instances;
  }

  // Методы экземпляра
  public getName(): string {
    return this.name;
  }
}

// Плохо (неправильный порядок)
class User {
  constructor() {} // конструктор в начале
  public name: string; // поля после конструктора
  public static instances = 0; // статические поля в конце
}
```

---

## React-профиль (`configs/react.mjs`)

Активируется для файлов `.jsx` и `.tsx` и добавляет плагины `react`, `react-hooks`, `jsx-a11y`.

### `react/jsx-filename-extension` - Расширения файлов с JSX

**Описание:** JSX разрешён только в `.jsx` и `.tsx` файлах.

```tsx
// Хорошо (файл Button.tsx)
export const Button = () => <button>Click</button>;

// Плохо (файл Button.ts с JSX)
export const Button = () => <button>Click</button>;
```

### `react/jsx-boolean-value` - Булевы пропсы без значения

**Описание:** Для `true` значения не указывай явно `={true}`.

```tsx
// Хорошо
<Button disabled />

// Плохо
<Button disabled={true} />
```

### `react/self-closing-comp` - Самозакрывающиеся теги

**Описание:** Если у компонента нет детей, используй самозакрывающийся тег.

```tsx
// Хорошо
<Button />
<div className="empty" />

// Плохо
<Button></Button>
<div className="empty"></div>
```

### `react/jsx-key` - Ключи в списках

**Описание:** Элементы в массивах должны иметь уникальный prop `key`.

```tsx
// Хорошо
{
  items.map((item) => <div key={item.id}>{item.name}</div>);
}

// Плохо
{
  items.map((item) => <div>{item.name}</div>);
}
```

### `react/jsx-no-duplicate-props` - Запрет дублирующих пропсов

**Описание:** Не дублируй пропсы в одном компоненте.

```tsx
// Хорошо
<Button disabled={isDisabled} />

// Плохо
<Button disabled disabled={false} />
```

### `react-hooks/rules-of-hooks` - Правила хуков

**Описание:** Хуки должны вызываться только на верхнем уровне и только в функциональных компонентах/хуках.

```tsx
// Хорошо
function Component() {
  const [state, setState] = useState(0);
  return <div>{state}</div>;
}

// Плохо
function Component() {
  if (condition) {
    const [state, setState] = useState(0); // хук внутри условия
  }
}
```

### `react-hooks/exhaustive-deps` - Полные зависимости эффектов

**Описание:** В массиве зависимостей useEffect/useCallback/useMemo должны быть все используемые переменные.

```tsx
// Хорошо
useEffect(() => {
  fetchData(userId);
}, [userId]);

// Предупреждение (плохо)
useEffect(() => {
  fetchData(userId);
}, []); // userId должен быть в зависимостях
```

### Правила доступности (jsx-a11y)

#### `jsx-a11y/alt-text` - Alt текст для изображений

**Описание:** Все `<img>` должны иметь `alt` атрибут.

```tsx
// Хорошо
<img src="photo.jpg" alt="User photo" />

// Предупреждение (плохо)
<img src="photo.jpg" />
```

#### `jsx-a11y/anchor-is-valid` - Корректные ссылки

**Описание:** `<a>` должен иметь `href` или корректный обработчик.

```tsx
// Хорошо
<a href="/page">Link</a>
<button onClick={handler}>Button</button>

// Предупреждение (плохо)
<a onClick={handler}>Link</a>
```

#### `jsx-a11y/click-events-have-key-events` - Клавиатурные события

**Описание:** Элементы с `onClick` должны иметь клавиатурные обработчики.

```tsx
// Хорошо
<div onClick={handler} onKeyPress={handler} role="button" tabIndex={0} />

// Предупреждение (плохо)
<div onClick={handler} />
```

#### `jsx-a11y/no-autofocus` - Ограничение autofocus

**Описание:** Используй `autoFocus` только когда необходимо для UX.

```tsx
// Хорошо
<input /> // без autofocus

// Предупреждение (плохо)
<input autoFocus />
```

#### `jsx-a11y/no-noninteractive-element-interactions` - События на неинтерактивных элементах

**Описание:** Не вешай события на неинтерактивные элементы без роли.

```tsx
// Хорошо
<button onClick={handler}>Click</button>
<div onClick={handler} role="button" tabIndex={0} />

// Предупреждение (плохо)
<div onClick={handler}>Click</div>
```

#### `jsx-a11y/no-static-element-interactions` - Интерактивность статических элементов

**Описание:** Статические элементы с обработчиками должны иметь роль и клавиатурную поддержку.

```tsx
// Хорошо
<div onClick={handler} onKeyPress={handler} role="button" tabIndex={0} />

// Предупреждение (плохо)
<div onClick={handler} />
```

---

## Строгий профиль (`configs/strict.mjs`)

Дополнительно к базовому профилю применяются следующие правила для `.ts/.tsx` файлов.

### `@typescript-eslint/no-explicit-any` - Запрет any

**Описание:** Запрещает использование типа `any`, требует конкретные типы.

```ts
// Хорошо
function process(data: string): void {}
function process(data: unknown): void {}

// Плохо
function process(data: any): void {}
```

### `@typescript-eslint/naming-convention` - Соглашение об именовании

**Описание:** Переменные должны быть в `camelCase` или `PascalCase`, подчёркивания допустимы спереди/сзади.

```ts
// Хорошо
const userName = 'John';
const UserComponent = () => {};
const _privateVar = 1;
const unused_ = 2;

// Плохо
const user_name = 'John';
const USER_NAME = 'John';
```

### `max-classes-per-file` + `no-restricted-syntax` - Один публичный тип/класс/enum на файл

**Описание:** В одном файле разрешён только один экспортируемый класс/интерфейс/тип/enum.

```ts
// Хорошо (файл User.ts)
interface User {
  name: string;
}

// Хорошо (вспомогательные приватные типы)
interface User {
  name: string;
}
type UserId = string;

// Плохо (два публичных типа)
interface User {
  name: string;
}
interface Post {
  title: string;
}
```

---
