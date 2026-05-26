# Roadmap: доведение eslint/prettier/husky npm-пакета до ТЗ

Этот roadmap предназначен для поэтапной работы разными агентами. Код менять только в рамках конкретного этапа. Документацию, кроме этого `ROADMAP.md`, пока не трогать.

## Роль и текущий аудит

Роль для проекта: senior JavaScript tooling engineer, специализация ESLint flat config, Prettier, npm packages, Husky, React/TypeScript tooling.

Проект: npm-пакет для frontend/React проектов. Он должен поставлять ESLint profiles, Prettier formatter config, CLI-команды, управляемый Husky pre-commit и SonarQube/SonarJS rule coverage.

Текущее состояние по аудиту:

- `SONAR_ROADMAP.md` корректно описывает уже выполненную Sonar-интеграцию, но не покрывает полное исходное ТЗ.
- Sonar catalog валидируется: 1095 raw rules, 1095 generated records, 251 executable unique `sonarjs/*` rules, duplicate executable rule ids отсутствуют.
- `package.json` не содержит `bin`, поэтому нет CLI-команд для consumer-проектов.
- Команды `lint`, `lint:fix`, `format`, `format --check`, `fix`, `profile`, `husky enable`, `husky disable` как CLI пакета отсутствуют.
- `.husky/pre-commit` сейчас локальный для этого репозитория (`yarn lint`), а не управляемый hook в проекте-потребителе.
- Prettier сейчас включен в base lint через `eslint-plugin-prettier/recommended`; по ТЗ formatter должен быть отдельным, а fix должен чинить простые style/fixable ошибки без Sonar.
- `configs/base.mjs` задает `tsconfigRootDir` от директории пакета. В установленном пакете это риск для TypeScript linting в consumer project.
- Public exports есть для base/default, react, strict, sonar, react-sonar, prettier, но нет `strict-react` и CLI entrypoint.
- Default profile сейчас `eslint.config.mjs` -> base. Нужно явно подтвердить или изменить на React default, так как основной target - React проекты.
- Зависимости не все latest stable по `npm outdated --long`: `eslint`, `@eslint/js`, `prettier`, `typescript-eslint`, `eslint-config-prettier`, `eslint-plugin-react-hooks`, `globals`, `typescript`, `@types/node` и др. требуют отдельного решения.
- Есть смешение package managers: `packageManager` указывает Yarn 4, есть `yarn.lock`, но активно обновлен `package-lock.json`. Нужно выбрать политику.

## Глобальные правила для агентов

- Не удалять существующие профили: base/default, react, strict, sonar, react-sonar.
- Не добавлять новые зависимости без отдельной проверки необходимости.
- Не трогать human-facing docs, кроме `ROADMAP.md`, пока не будет отдельной задачи.
- Не включать Sonar rules в formatter или non-Sonar fix command.
- Не дублировать ESLint rules: один executable ESLint rule id должен включаться один раз в конкретном итоговом профиле.
- Любой этап завершать проверкой конкретных файлов, указанных в этом roadmap.
- Если `sonarqube-frontend-rules.json` позже удаляется, generator/validator должны работать от нового source artifact или generated catalog должен стать source of truth.

## Phase 1: Package surface, package manager, publish reliability

Цель: пакет должен устанавливаться как легкий npm-пакет без lifecycle-сбоев и с понятной lock/package-manager политикой.

Файлы для проверки:

- `package.json`
  - Проверить `name`, `main`, `exports`, `files`, `engines`, `packageManager`, `dependencies`, `peerDependencies`, `peerDependenciesMeta`, `devDependencies`, `scripts`.
  - Проверить, что publish surface содержит только runtime/public files: `configs/**`, `eslint.config.mjs`, `prettier.js`, CLI files, generated Sonar catalog/profile при необходимости.
  - Проверить, что `prepare` не запускает Husky при `npm pack` и install consumer-проекта.
  - Проверить, что `bin` появится только после реализации CLI.
- `package-lock.json` и `yarn.lock`
  - Выбрать один основной lock flow или явно описать mixed policy.
  - Если основной пакетный менеджер Yarn 4, не обновлять `package-lock.json` как source of truth.
  - Если основной npm, убрать/пересогласовать Yarn metadata.
- `.npmignore` или `files` в `package.json`
  - Проверить, что raw `sonarqube-frontend-rules.json` не попадает в npm tarball, если он остается только source artifact.
  - Проверить, что `SONAR_ROADMAP.md`, `ROADMAP.md`, docs, generated docbook и local artifacts не попадают в runtime package.
- `.gitattributes`, `.prettierignore`
  - Проверить LF для `.mjs`.
  - Проверить, что generated/raw-heavy artifacts не ломают formatter checks.

Команды проверки:

- `npm pack --dry-run`
- `node -e "const pkg=require('./package.json'); for (const [k,v] of Object.entries(pkg.exports)) { const p=typeof v==='string'?v:v.import||v.default; console.log(k,p,require('fs').existsSync(p)); }"`
- `git status --short`

Acceptance:

- `npm pack --dry-run` проходит на Windows без escalation/lifecycle failure.
- Tarball содержит только ожидаемые runtime/public files.
- Lock/package-manager политика однозначна.

## Phase 2: CLI для consumer-проектов

Цель: после установки пакета пользователь запускает команды через `npx`, `npm exec`, `yarn` или `pnpm`.

Файлы для проверки:

- `package.json`
  - Добавить `bin`, например `eslint-config-react` или scoped-friendly CLI name.
  - Добавить package scripts только для разработки самого пакета, не путать их с public CLI.
- Новый CLI entrypoint, например `bin/eslint-config-react.mjs`
  - Проверить shebang `#!/usr/bin/env node`.
  - Проверить Windows-compatible execution.
  - Проверить help output и exit codes.
  - Проверить, что команды выполняются из `process.cwd()` consumer-проекта, а не из директории пакета.
- CLI command modules, если будут выделены
  - `lint`: запускает ESLint с выбранным профилем.
  - `lint --fix`: запускает ESLint fix без Sonar profile по умолчанию.
  - `format`: запускает Prettier `--write`.
  - `format --check`: запускает Prettier `--check`.
  - `fix`: запускает ESLint `--fix` для non-Sonar fixable rules, затем Prettier `--write`.
  - `profile get/set/list`: переключение профиля в consumer config.
  - `init`: создает минимальные config-файлы без перезаписи пользовательских изменений.
  - `husky enable/disable`: управляет pre-commit в consumer-проекте.

Команды проверки:

- `node <cli-entry> --help`
- `node <cli-entry> lint --help`
- `node <cli-entry> profile list`
- В sandbox project: `npx <cli-name> lint`, `npx <cli-name> fix`, `npx <cli-name> format --check`

Acceptance:

- CLI имеет стабильные exit codes.
- CLI не требует глобального ESLint.
- CLI умеет выбрать профиль командой.
- CLI работает из корня consumer-проекта.

## Phase 3: Profiles and public API

Цель: все профили сохраняются, понятны и не конфликтуют.

Файлы для проверки:

- `eslint.config.mjs`
  - Проверить default profile. Сейчас default -> base. Нужно принять решение: оставить base или сделать React default.
  - Если default меняется, это breaking change и требует semver major или отдельного export.
- `configs/base.mjs`
  - Проверить browser/node globals. Для frontend package вероятно нужен frontend/browser default и отдельный node override для scripts.
  - Проверить `tsconfigRootDir`; в consumer-проекте он не должен указывать на `node_modules/@ytvee-dev/eslint-config-react`.
  - Проверить, что Prettier не встроен в semantic lint, если Phase 4 будет отделять formatter.
  - Проверить, что base не содержит React-only rules.
- `configs/react.mjs`
  - Проверить, что React profile = base + React/JSX/hooks/a11y.
  - Проверить JSX parser options.
  - Проверить React version detect.
- `configs/strict.mjs`
  - Проверить, что strict не заявлен как React strict, если он не включает React.
  - Проверить `no-explicit-any`, naming convention, one-module rule.
- Новый `configs/strict-react.mjs`
  - Добавить только если нужен public strict React profile.
  - Должен быть composition: strict + React без дублирования base.
- `configs/sonar.mjs`
  - Проверить base + Sonar executable rules.
  - Проверить, что Sonar rules не дублируют existing external-eslint rules.
- `configs/react-sonar.mjs`
  - Проверить React + Sonar executable rules.
  - Проверить отсутствие `Cannot redefine plugin`.
- `package.json`
  - Проверить exports для всех физических профилей.
  - Проверить backward compatibility существующих exports.

Команды проверки:

- `node -e "import('./eslint.config.mjs')"`
- `node -e "import('./configs/react.mjs')"`
- `node -e "import('./configs/strict.mjs')"`
- `node -e "import('./configs/sonar.mjs')"`
- `node -e "import('./configs/react-sonar.mjs')"`
- После добавления: `node -e "import('./configs/strict-react.mjs')"`

Acceptance:

- Все профили импортируются.
- Default profile явно выбран и описан в `ROADMAP.md` или release plan.
- Профили не дублируют один и тот же plugin/rule конфликтующим способом.

## Phase 4: Formatter separation and safe fix flow

Цель: Prettier форматирует, ESLint проверяет код, fix чинит простые fixable ошибки без Sonar.

Файлы для проверки:

- `prettier.js`
  - Проверить, что это отдельный public formatter config.
  - Проверить `endOfLine: 'lf'`, `singleQuote`, `semi`, `printWidth`, `trailingComma`.
- `.prettierrc.js`
  - Проверить, что локальный config соответствует public `prettier.js` или импортирует его.
- `configs/base.mjs`
  - Убрать или изолировать `eslint-plugin-prettier/recommended`, если formatter должен быть отдельным.
  - Проверить, что semantic lint не падает только из-за formatting.
- `package.json`
  - Проверить необходимость `eslint-plugin-prettier` и `eslint-config-prettier`.
  - Если Prettier отделен полностью, `eslint-plugin-prettier` может стать лишней зависимостью.
- CLI files
  - `format` должен запускать только Prettier.
  - `fix` должен запускать ESLint `--fix` на non-Sonar profile, затем Prettier.
  - `fix` не должен включать `configs/sonar` или `configs/react-sonar` по умолчанию.

Команды проверки:

- В fixture: создать файл с простыми style нарушениями.
- `npx <cli-name> format --check` должен падать только на formatting.
- `npx <cli-name> format` должен исправлять formatting.
- `npx <cli-name> fix` должен исправлять ESLint fixable + Prettier.
- `npx <cli-name> fix --profile react-sonar` должен либо запрещать Sonar autofix, либо документированно запускать Sonar только как check без `--fix`.

Acceptance:

- Formatter не запускает Sonar.
- Fix не выполняет Sonar autofix.
- Lint и format можно запускать отдельно.

## Phase 5: Husky enable/disable for consumer projects

Цель: pre-commit hook по умолчанию выключен, consumer включает/выключает его командой.

Файлы для проверки:

- `.husky/pre-commit`
  - Оставить только как local repo hook или исключить из publish/runtime.
  - Не считать его consumer-механизмом.
- `package.json`
  - Не использовать `prepare` для автоустановки Husky в consumer-проекте.
  - Проверить, что `husky` нужен как dependency/devDependency только если CLI реально управляет hook.
- CLI Husky module
  - `husky enable` создает/обновляет `.husky/pre-commit` в consumer project.
  - `husky disable` удаляет только managed block.
  - Hook содержит marker comments:
    - `# @ytvee-dev/eslint-config-react begin`
    - `# @ytvee-dev/eslint-config-react end`
  - Повторный `enable` идемпотентен.
  - `disable` не удаляет пользовательские команды.
- Fixture `.husky/pre-commit`
  - Проверить пустой hook.
  - Проверить hook с пользовательским содержимым.
  - Проверить hook уже с managed block.

Команды проверки:

- `npx <cli-name> husky enable`
- `npx <cli-name> husky enable` повторно
- `npx <cli-name> husky disable`
- Проверить diff `.husky/pre-commit` после каждой команды.

Acceptance:

- Pre-hook default off.
- Enable/disable безопасны и идемпотентны.
- Consumer не получает hook без явной команды.

## Phase 6: SonarQube rules verification and deduplication

Цель: правила из SonarQube присутствуют, но не дублируются и не конфликтуют.

Файлы для проверки:

- `SONAR_ROADMAP.md`
  - Обновить checkbox verification после фактических проверок.
  - Не превращать его в основной roadmap проекта.
- `sonarqube-frontend-rules.json`
  - Пока файл существует, проверить counts: TS 495, JS 478, CSS 29, HTML/Web 93, total 1095.
  - Перед удалением определить новый source of truth.
- `scripts/generate-sonar-catalog.mjs`
  - Проверить mapping по RSPEC key.
  - Проверить `external-eslint` mapping на уже включенные правила.
  - Проверить, что deprecated -> `integrationStatus: deprecated`, `enabledByDefault: false`.
  - Проверить, что CSS/HTML/Web -> `metadata-only` или `deprecated`.
  - Проверить severity policy:
    - `BLOCKER`/`CRITICAL` -> `error`
    - `MAJOR` -> `error`
    - `MINOR`/`INFO` -> `warn`
    - `SECURITY_HOTSPOT` -> `warn`
- `scripts/validate-sonar-catalog.mjs`
  - Проверить source count = generated count.
  - Проверить duplicate source keys.
  - Проверить duplicate executable ESLint ids.
  - Проверить deprecated rules не enabled.
  - Проверить CSS/HTML/Web не executable.
- `configs/sonar-catalog.generated.json`
  - Проверить summary counts.
  - Проверить отсутствие `descriptionSections` и HTML-heavy content.
  - Проверить поля: `key`, `repo`, `name`, `severity`, `type`, `status`, `scope`, `lang`, `bucket`, `params`, `impacts`, `eslintRuleId`, `eslintSource`, `enabledByDefault`, `fixable`, `hasSuggestions`, `requiresTypeChecking`, `integrationStatus`.
- `configs/rules/sonar.generated.mjs`
  - Проверить 251 unique executable `sonarjs/*` rules.
  - Проверить разделение common/type-checked rules.
  - Проверить, что Sonar plugin объявлен один раз.
- `configs/sonar.mjs`, `configs/react-sonar.mjs`
  - Проверить composition без plugin redefine.
  - Проверить, что Sonar profile opt-in, а не default.

Команды проверки:

- `npm run generate:sonar`
- `npm run validate:sonar`
- `node -e "const c=require('./configs/sonar-catalog.generated.json'); console.log(c.summary)"`
- `node -e "const c=require('./configs/sonar-catalog.generated.json'); const ids=c.rules.filter(r=>r.integrationStatus==='sonarjs').map(r=>r.eslintRuleId); console.log(ids.length, new Set(ids).size)"`
- `node -e "import('./configs/sonar.mjs')"`
- `node -e "import('./configs/react-sonar.mjs')"`
- ESLint smoke на JS, JSX, TS файлах через API или fixture.

Acceptance:

- Все 1095 SonarQube records учтены.
- Executable Sonar rules deduped.
- Deprecated и CSS/HTML/Web не исполняются ESLint.
- Sonar rules не участвуют в formatter/fix flow.

## Phase 7: Dependencies, lightweight policy, latest stable

Цель: минимальные зависимости, последние стабильные версии, без лишнего runtime веса.

Файлы для проверки:

- `package.json`
  - Проверить каждую dependency: нужна ли runtime consumer-пакету или только dev/build.
  - Разнести `dependencies`, `peerDependencies`, `peerDependenciesMeta`, `devDependencies`.
  - Проверить, нужно ли bundle all plugins или лучше peer-only с понятным install/init.
  - Проверить optional peer для React-only plugins и Sonar.
  - Проверить `eslint-plugin-prettier`: возможно удалить после разделения formatter.
  - Проверить `husky`: должен быть devDependency или CLI-managed dependency только при необходимости.
- `package-lock.json` / `yarn.lock`
  - Перегенерировать выбранным package manager.
  - Не держать два lock источника без причины.

Актуальные расхождения по `npm outdated --long` на момент аудита:

- `@eslint/js`: current 9.39.1, wanted 9.39.4, latest 10.0.1.
- `eslint`: current 9.39.1, wanted 9.39.4, latest 10.4.0.
- `eslint-config-prettier`: current 9.1.2, latest 10.1.8.
- `eslint-plugin-prettier`: current 5.5.4, latest 5.5.5.
- `eslint-plugin-react-hooks`: current 5.2.0, latest 7.1.1.
- `eslint-plugin-simple-import-sort`: current 12.1.1, latest 13.0.0.
- `globals`: current 15.15.0, latest 17.6.0.
- `prettier`: current 3.7.4, latest 3.8.3.
- `typescript-eslint`: current 8.48.1, wanted/latest 8.60.0.
- `typescript`: current 5.9.3, latest 6.0.3.
- `@types/node`: current 22.19.1, latest 25.9.1.

Команды проверки:

- `npm outdated --long`
- `npm audit --omit=dev`
- `npm ls --depth=0`
- После обновлений: `npm run lint`, `npm run validate:sonar`, `npm pack --dry-run`.

Acceptance:

- Зависимости обновлены до последних стабильных в выбранной major policy.
- Breaking major upgrades отдельно проверены в fixture.
- Лишние runtime dependencies удалены.

## Phase 8: Rule harmony and conflict audit

Цель: существующие правила гармоничны, не конфликтуют и не дублируются.

Файлы для проверки:

- `configs/rules/best-practices.rule.mjs`
  - Проверить overlap с `@eslint/js recommended`.
  - Проверить конфликт с Prettier, если formatter отделяется.
  - Проверить security-sensitive defaults: `no-implied-eval` сейчас `off`, нужно обоснование или включение.
- `configs/rules/javascript.rule.mjs`
  - Проверить запреты `Symbol`/`BigInt`; для modern frontend это может быть устаревшим ограничением.
  - Проверить, не конфликтуют ли AST selectors с TypeScript parser.
- `configs/rules/typescript.rule.mjs`
  - Проверить `explicit-function-return-type` как default для React projects; может быть слишком шумным.
  - Проверить `explicit-member-accessibility`, `member-ordering` для frontend codebase.
- `configs/rules/react.rule.mjs`
  - Проверить JSX/a11y rules against Sonar catalog mappings.
  - Проверить отсутствие дублирования с SonarJS React rules.
- `configs/rules/import.rule.mjs` и `configs/rules/import-sort.rule.mjs`
  - Проверить совместимость import/extensions и simple-import-sort.
  - Проверить TypeScript resolver необходимость.
- `configs/rules/one-module.rule.mjs`
  - Проверить, что strict-only rule не ломает common React patterns.
- `configs/rules/sonar.generated.mjs`
  - Проверить overlap с base/react/strict rules.
  - Проверить, что `external-eslint` Sonar records не включены повторно.

Команды проверки:

- Script/one-liner собрать итоговые `rules` по каждому профилю и найти duplicate rule ids.
- ESLint smoke на fixture с base/react/strict/sonar/react-sonar.
- Проверить Prettier конфликт: `npx eslint-config-prettier` после выбора модели formatter.

Acceptance:

- Нет конфликтующих правил форматирования.
- Нет повторного включения одного executable rule id в одном профиле.
- Strict rules действительно opt-in.

## Phase 9: Consumer fixture verification

Цель: доказать, что пакет работает в чистом frontend/React проекте.

Файлы/папки для проверки:

- Новый `fixtures/react-ts` или временный sandbox вне publish surface.
  - Минимальный `package.json`.
  - `tsconfig.json`.
  - `src/App.tsx`.
  - `eslint.config.mjs`, создаваемый CLI `init`.
  - `.prettierrc`, создаваемый CLI `init`.
  - `.husky/pre-commit`, создаваемый `husky enable`.
- `package.json` root
  - Добавить scripts для smoke test только после решения fixture policy.

Сценарии проверки:

- Install package tarball в fixture.
- Import default profile.
- Switch profile to `react`.
- Switch profile to `sonar`.
- Switch profile to `react-sonar`.
- Run `lint`.
- Run `lint --fix`.
- Run `format --check`.
- Run `format`.
- Run `fix` and verify Sonar is not autofixed.
- Run `husky enable`, commit hook file changes are scoped.
- Run `husky disable`, user content remains.

Acceptance:

- Все команды работают из fixture root.
- Ошибки понятны при отсутствии `package.json`, `tsconfig.json`, `eslint.config.mjs`.
- Пакет не требует ручной сборки после install.

## Phase 10: Release readiness

Цель: подготовить стабильный npm release.

Проверки:

- `npm pack --dry-run`
- Install tarball в npm/yarn/pnpm fixtures.
- `npm audit --omit=dev`
- `npm run lint`
- `npm run validate:sonar`
- Full CLI smoke.
- Проверить package size.
- Проверить license implications `eslint-plugin-sonarjs` (`LGPL-3.0-only`) для dependency model.

Acceptance:

- Public API стабилен.
- Default profile выбран осознанно.
- CLI documented через `--help`.
- Husky default off.
- Sonar rules покрыты catalog и executable subset без дублей.
- Formatter separated from Sonar and semantic lint.
