# ROADMAP: @ytdev/linter release readiness

Этот документ - рабочий план для будущих агентов перед переизданием пакета как `@ytdev/linter`.
Текущая итерация меняет только `ROADMAP.md`: исходники, конфиги, lockfile, документация и package metadata должны оставаться без изменений, пока отдельная фаза явно не будет взята в работу.

## Current Audit Snapshot

Дата аудита: 2026-05-26.

Роль для выполнения roadmap: `senior JavaScript tooling engineer` по ESLint flat config, npm package surface, dependency security, consumer setup, SonarJS/SonarQube coverage и release verification.

Текущий проект: frontend tooling npm package с ESLint profiles, Prettier config, Sonar catalog и локальной contributor-инфраструктурой.

Текущее package name: `@ytvee-dev/eslint-config-react`.

Целевое package name для будущей публикации: `@ytdev/linter`.

Package manager policy: временно сохраняются оба lockfile, `package-lock.json` и `yarn.lock`. Любые будущие dependency changes обязаны синхронно обновлять оба lockfile или отдельной задачей менять эту политику.

Публикация: реальный `npm publish` запрещён до завершения всех фаз и отдельного явного разрешения пользователя. Разрешены только dry-run и tarball smoke checks.

Текущий package surface: `package.json` использует whitelist `files`, поэтому `docs/`, `ROADMAP.md`, `SONAR_ROADMAP.md`, `index.html`, scripts и `.husky` не должны попадать в published tarball.

Главный размер tarball: не документация, а `configs/sonar-catalog.generated.json`, примерно 828.5 kB. Если размер пакета станет проблемой, оптимизировать нужно public export/generated catalog policy, а не repo docs.

Husky: `.husky/pre-commit` сейчас является repo-local hook для разработки текущего пакета. Consumer-project Husky setup в published package не реализован и не должен включаться через lifecycle scripts.

TypeScript consumer risk: `configs/base.mjs` вычисляет `tsconfigRootDir` от директории пакета. В установленном consumer project это может указывать внутрь `node_modules`, а не в корень consumer repo.

Rule duplication audit: в профилях обнаружены повторные объявления `for-direction`, `no-var`, `prefer-const`, `@typescript-eslint/no-floating-promises`, `@typescript-eslint/no-unused-vars`. В `strict` дополнительно повторяются `no-restricted-syntax` и `@typescript-eslint/no-explicit-any`. Часть повторов может быть intentional override, но это нужно доказать и зафиксировать.

Dependency audit snapshot: `npm audit --omit=dev` ранее показывал 5 vulnerabilities через transitive deps: `ajv`, `brace-expansion`, `flatted`, `minimatch`, `picomatch`. Нельзя слепо применять `npm audit fix`; нужна controlled upgrade/removal strategy.

Formatter risk: `eslint-plugin-prettier` и `eslint-config-prettier` нужно пересмотреть после разделения linting и formatting. `eslint-plugin-prettier` особенно подозрителен как runtime dependency, если Prettier будет отдельным CLI step.

Dependency ownership rule: React, a11y, hooks, TypeScript ESLint и SonarJS плагины не переписывать внутрь проекта без отдельного технического обоснования. Переносить в локальный код только маленькие и контролируемые функции, где поддержка локальной реализации безопаснее зависимости.

## Execution Rules For Future Agents

1. Перед любыми изменениями выполнить `git status --short` и отдельно отметить чужие или unrelated dirty changes.
2. Не откатывать и не перезаписывать существующие изменения пользователя.
3. Работать по одной фазе за раз, если пользователь не просит объединить фазы.
4. Не менять unrelated files. Если фаза касается только roadmap/docs, не трогать source/package files.
5. Не выполнять реальный `npm publish`.
6. Не добавлять lifecycle scripts, которые автоматически меняют consumer project при install.
7. Не устанавливать Husky в consumer project без явной команды пользователя или CLI command.
8. Не добавлять новые зависимости без объяснения, почему нельзя обойтись существующим кодом, peer dependency или локальной малой реализацией.
9. При dependency changes обновлять и проверять оба lockfile: `package-lock.json` и `yarn.lock`.
10. При изменении public API проверять `exports`, `files`, tarball contents и smoke install packed package.
11. При изменении rule configs запускать duplicate-rule audit по всем public profiles.
12. При изменении Sonar generator/validator запускать `npm run generate:sonar` и `npm run validate:sonar`.
13. При изменении docs/package metadata проверять, что docs остаются в repo, но не попадают в tarball, кроме whitelisted README/LICENSE.
14. В конце каждой фазы фиксировать выполненные команды и результат в финальном ответе или release notes.

## Phase 0: Worktree And Baseline Audit

### Goal

Получить воспроизводимую baseline-картину перед любыми изменениями, чтобы будущий агент не смешал roadmap work с уже существующими Sonar/package edits.

### Prompt

```
Ты senior JavaScript tooling engineer. Проведи baseline audit текущего repo перед изменениями для будущей публикации `@ytdev/linter`.
Не меняй файлы. Проверь worktree, package tarball, package metadata, dependency state, duplicate ESLint rules и Sonar-related dirty changes.
Составь краткий список фактов и рисков, которые нужно учитывать перед следующей фазой.
```

### Files Likely Affected

На этой фазе файлы не менять.

### Required Checks

1. Выполнить `git status --short`.
2. Если есть dirty changes в `scripts/generate-sonar-catalog.mjs`, `scripts/validate-sonar-catalog.mjs`, `scripts/sonar-profile-coverage.mjs`, `configs/sonar-catalog.generated.json`, `SONAR_ROADMAP.md` или Sonar docs, описать их как отдельный риск.
3. Выполнить `npm pack --dry-run` и сохранить список файлов tarball.
4. Выполнить duplicate-rule audit по `base`, `react`, `strict`, `sonar`, `react-sonar`.
5. Выполнить `npm audit --omit=dev`.
6. Выполнить `npm outdated --long`.
7. Выполнить `npm ls --depth=0`.
8. Проверить `package.json` fields: `name`, `version`, `exports`, `files`, `dependencies`, `peerDependencies`, `peerDependenciesMeta`, `devDependencies`, `scripts`, `packageManager`.

### Verification Commands

```powershell
git status --short
npm pack --dry-run
npm audit --omit=dev
npm outdated --long
npm ls --depth=0
```

Duplicate-rule audit можно выполнить одноразовым Node script, который импортирует public profile modules, проходит по config array, собирает `rules` и выводит rule ids, встречающиеся больше одного раза в одном profile.

### Acceptance Criteria

Baseline documented.

Ни один tracked file не изменён.

Tarball contents понятны.

Dependency risks перечислены без автоматического `npm audit fix`.

Rule duplicates перечислены по профилям.

## Phase 1: Rename Package Surface To @ytdev/linter

### Goal

Подготовить package identity для будущего rebrand на `@ytdev/linter`, не публикуя пакет.

### Prompt

```
Подготовь package identity к будущей публикации как `@ytdev/linter`.
Не выполняй `npm publish`.
Обнови только package metadata, lockfiles и human-facing references, которые необходимы для консистентного dry-run.
Сохрани backward compatibility exports, если нет явного решения о breaking change.
Проверь, что `@ytdev/linter` является корректным npm scoped package name, а `ytdev/linter` без scope не является npm package name.
```

### Files Likely Affected

`package.json`, `package-lock.json`, `yarn.lock`, `README.md`, `README_RU.md`, docs with install snippets, future release notes.

### Implementation Notes

`package.json.name` должен стать `@ytdev/linter`.

`repository.url` должен указывать на будущий repo, если пользователь подтверждает GitHub location `ytdev/linter`.

Package exports не переименовывать без необходимости.

Если меняется CLI name, выбрать стабильное имя вроде `ytdev-linter`.

Если старое package name нужно сохранить как migration path, описать это отдельно: deprecation package, README notice или major release notes.

### Verification Commands

```powershell
node -e "const p=require('./package.json'); console.log(p.name, p.repository)"
npm pack --dry-run
npm view @ytdev/linter name version --json
git diff -- package.json package-lock.json yarn.lock
```

### Acceptance Criteria

Package metadata консистентна.

Оба lockfile синхронно обновлены.

Документация не обещает публикацию, которая ещё не выполнена.

`npm publish` не запускался.

## Phase 2: Keep Docs In Repo, Not Package

### Goal

Документация должна оставаться в репозитории, но не утяжелять installed npm package.

### Prompt

```
Проверь и зафиксируй package surface policy: repo docs остаются в git, но не входят в npm tarball.
Не удаляй документацию из репозитория.
Проверь `files` whitelist и `npm pack --dry-run`.
Отдельно оцени, нужен ли public export `./configs/sonar-catalog`, потому что именно generated JSON является главным источником веса tarball.
```

### Files Likely Affected

`package.json`, possibly docs explaining package contents.

### Implementation Notes

Оставить `README.md`, `README_RU.md`, `LICENSE` в package.

Не включать `docs/`, `ROADMAP.md`, `SONAR_ROADMAP.md`, `index.html`, `build-docbook.js`, scripts и raw audit artifacts в package.

Если `configs/sonar-catalog.generated.json` не нужен runtime consumers, рассмотреть один из вариантов: убрать public export, оставить только summary, split catalog на отдельный optional package, compress/minify generated JSON, или оставить как intentional public API.

Не принимать решение об удалении `./configs/sonar-catalog` без проверки users/API expectations.

### Verification Commands

```powershell
npm pack --dry-run
node -e "const p=require('./package.json'); console.log(p.files, p.exports['./configs/sonar-catalog'])"
```

### Acceptance Criteria

Repo docs остаются в repo.

Tarball не содержит roadmap/docs/build artifacts.

Если generated Sonar catalog остаётся в package, причина явно задокументирована.

## Phase 3: Consumer Setup And Husky

### Goal

Husky должен работать для проекта, в который устанавливается линтер, а не как неявный lifecycle side effect текущего пакета.

### Prompt

```
Спроектируй и реализуй consumer-controlled Husky setup для `@ytdev/linter`.
Не используй install/prepare/postinstall lifecycle для автоматической модификации consumer repo.
Добавь явный CLI flow `ytdev-linter init --husky` или `ytdev-linter husky enable/disable`.
Hook должен создаваться только в `process.cwd()` consumer project, быть идемпотентным и не удалять пользовательский hook content.
```

### Files Likely Affected

`package.json`, future `bin/*`, future CLI modules, `.husky/pre-commit` only if changing local contributor hook policy.

### Implementation Notes

Root `.husky/pre-commit` текущего repo считать contributor tooling.

Published package не должен включать root `.husky`.

Consumer hook должен иметь managed markers:

```sh
# @ytdev/linter begin
# @ytdev/linter end
```

`enable` добавляет или обновляет только managed block.

`disable` удаляет только managed block.

Если `.husky/pre-commit` содержит пользовательские команды, они должны сохраниться.

Если `.git` отсутствует, CLI должен дать понятную ошибку.

Если Husky не установлен в consumer repo, CLI должен либо установить минимальную структуру через безопасные file operations, либо вывести explicit instruction. Не добавлять dependency install без разрешения.

### Verification Commands

```powershell
node ./bin/ytdev-linter.mjs --help
node ./bin/ytdev-linter.mjs husky enable
node ./bin/ytdev-linter.mjs husky enable
node ./bin/ytdev-linter.mjs husky disable
git diff -- .husky/pre-commit
```

Выполнять команды в fixture/temp consumer repo, не в корне пакета, если цель - проверить consumer behavior.

### Acceptance Criteria

Consumer hook default off.

Enable/disable идемпотентны.

User hook content сохраняется.

Package install сам не меняет consumer filesystem.

## Phase 4: Dependency Security And Ownership

### Goal

Снизить dependency risk, убрать лишние runtime зависимости и не переносить крупные внешние плагины внутрь проекта без реального основания.

### Prompt

```
Проведи dependency security и ownership audit.
Не выполняй слепой `npm audit fix`.
Для каждой dependency определи: runtime нужна, dev-only, peer-only, optional peer или кандидат на удаление.
Обнови vulnerable transitive dependencies через controlled upgrades.
Переноси функциональность внутрь проекта только если она мала, понятна, покрыта тестами и безопаснее зависимости.
Синхронно обнови `package-lock.json` и `yarn.lock`.
```

### Files Likely Affected

`package.json`, `package-lock.json`, `yarn.lock`, source configs if dependencies removed or moved.

### Dependency Decisions To Evaluate

`eslint-plugin-prettier`: вероятный кандидат на удаление после formatter separation.

`eslint-config-prettier`: оставить только если нужен как audited conflict suppressor; иначе заменить локальным минимальным набором отключений после проверки.

`husky`: не должен быть runtime dependency для consumers, если CLI пишет hook самостоятельно или даёт instructions.

`eslint-plugin-import`: проверить, какие правила реально используются; часть может быть заменена core `no-duplicate-imports`, но resolver/import semantics не переписывать без тестов.

`eslint-plugin-simple-import-sort`: не переписывать наивно. Локальный import-sort rule возможен только отдельной фазой с fixtures.

`eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`: держать как peer/optional peer для React profiles, не vendoring.

`eslint-plugin-sonarjs`: держать opt-in peer/optional peer или dependency только после проверки license/security implications.

`typescript-eslint`: не vendoring, держать совместимым с ESLint major policy.

`eslint`, `@eslint/js`, `typescript`, `prettier`: обновлять controlled, с учетом breaking majors.

### Verification Commands

```powershell
npm audit --omit=dev
npm outdated --long
npm ls --depth=0
npm run validate:sonar
npm pack --dry-run
```

Если обновлялись Yarn dependencies:

```powershell
yarn install --immutable
```

Если обновлялись npm dependencies:

```powershell
npm install --package-lock-only
```

### Acceptance Criteria

Known vulnerabilities устранены или документированы с причиной.

Runtime dependency surface минимален.

Peer/optional peer policy понятна.

Оба lockfile синхронизированы.

Ни одна крупная dependency не переписана локально без tests и rationale.

## Phase 5: Formatter Separation

### Goal

ESLint проверяет semantic/code-quality rules, Prettier форматирует код отдельно, Sonar не участвует в default fix flow.

### Prompt

```
Раздели linting и formatting.
Убери запуск Prettier как ESLint rule из base profile, если он там есть.
Сохрани отдельный Prettier config export.
Сделай так, чтобы `fix` запускал ESLint autofix для non-Sonar profile и затем Prettier, а `format` запускал только Prettier.
Не включай Sonar profile в default autofix.
```

### Files Likely Affected

`configs/base.mjs`, `prettier.js`, local Prettier config, future CLI files, `package.json`.

### Implementation Notes

`eslint-plugin-prettier/recommended` в base делает formatting частью lint errors. Это нужно удалить или изолировать в отдельный opt-in profile.

Если `eslint-config-prettier` остаётся, он должен использоваться только для отключения formatting-conflicting lint rules.

ESLint stylistic rules, конфликтующие с Prettier, должны быть удалены или явно отключены.

`fix` не должен использовать `sonar` или `react-sonar` по умолчанию.

### Verification Commands

```powershell
npx eslint . --ext .js,.mjs,.ts,.tsx --report-unused-disable-directives
npx prettier --check .
node -e "import('./configs/base.mjs')"
npm pack --dry-run
```

In fixture:

```powershell
npx ytdev-linter format --check
npx ytdev-linter format
npx ytdev-linter fix
```

### Acceptance Criteria

Formatting violations are Prettier responsibility.

Semantic lint can pass/fail independently from Prettier.

Sonar autofix is not part of default fix.

`eslint-plugin-prettier` removed or explicitly justified.

## Phase 6: Rule Deduplication

### Goal

Итоговые public profiles не должны повторно объявлять один и тот же executable ESLint rule id без intentional override.

### Prompt

```
Добавь или выполни duplicate-rule audit для profiles `base`, `react`, `strict`, `sonar`, `react-sonar`.
Удали идентичные дубли.
Оставь intentional overrides только если rule value действительно меняется и есть понятное обоснование.
Добавь validation, которая будет падать на новых unintended duplicates.
```

### Files Likely Affected

`configs/rules/*.mjs`, future validation script, `package.json` scripts if adding validation.

### Known Duplicates To Investigate

`for-direction` appears more than once through recommended/base composition.

`no-var` appears more than once.

`prefer-const` appears more than once.

`@typescript-eslint/no-floating-promises` appears more than once.

`@typescript-eslint/no-unused-vars` appears more than once.

`no-restricted-syntax` appears more than once in `strict`.

`@typescript-eslint/no-explicit-any` appears more than once in `strict`.

### Implementation Notes

Do not remove an override only because it is duplicated. First compare actual rule values.

If duplicate has same value as upstream recommended config, remove local copy unless local explicitness is required.

If duplicate changes severity/options intentionally, keep it and record why in validation allowlist.

Avoid adding comments unless they prevent future accidental removal.

### Verification Commands

```powershell
node scripts/audit-rule-duplicates.mjs
npx eslint . --ext .js,.mjs,.ts,.tsx --report-unused-disable-directives
npm run validate:sonar
```

If no committed script exists yet, use a one-off Node import audit and then decide whether to commit it.

### Acceptance Criteria

No unintended duplicate rule ids in any public profile.

Intentional overrides have allowlist/rationale.

Validation can be rerun by future agents.

## Phase 7: Consumer TypeScript Correctness

### Goal

Type-aware linting must work from consumer project root and not depend on package install path.

### Prompt

```
Fix TypeScript parser/projectService behavior for installed consumer projects.
`tsconfigRootDir` must refer to consumer cwd or be configurable, not to the package directory in `node_modules`.
Verify JS-only, TS, React TS and missing-tsconfig fixtures.
Keep failure messages actionable.
```

### Files Likely Affected

`configs/base.mjs`, TypeScript rule config, future CLI init config, fixture files.

### Implementation Notes

Current `new URL('..', import.meta.url).pathname` points to package location.

Prefer consumer-controlled config shape if ESLint flat config can import factory function.

Consider exporting both static configs and config factory only if backward compatibility remains clear.

Do not require type-aware linting for JS-only consumers.

If `projectService` requires a `tsconfig.json`, missing-tsconfig error should explain how to choose non-type-aware profile or create tsconfig.

### Verification Commands

```powershell
node -e "import('./configs/base.mjs')"
node -e "import('./configs/react.mjs')"
npx eslint . --ext .js,.mjs,.ts,.tsx --report-unused-disable-directives
```

Fixture checks:

```powershell
npx eslint src/index.js
npx eslint src/index.ts
npx eslint src/App.tsx
```

### Acceptance Criteria

Installed package works from consumer cwd.

TS lint does not search for tsconfig inside installed package.

JS-only consumers have a documented path.

React TS fixture passes import/config smoke.

## Phase 8: Profile Semantics And Sonar Validation

### Goal

Public profiles must make true promises: `sonar` is not the same as `react-sonar`, and React-only external Sonar mappings must not be claimed by plain `sonar`.

### Prompt

```
Validate profile semantics and Sonar catalog correctness.
Keep generated catalog as canonical runtime/source-of-truth inside the repo.
Treat raw Sonar export as optional refresh artifact.
Ensure `external-eslint` records have profile-aware coverage metadata.
Verify plain `sonar` does not claim React-only external mappings.
```

### Files Likely Affected

`scripts/generate-sonar-catalog.mjs`, `scripts/validate-sonar-catalog.mjs`, `scripts/sonar-profile-coverage.mjs`, `configs/sonar-catalog.generated.json`, Sonar docs only if docs phase is allowed.

### Implementation Notes

`sonar` should mean `base + sonarjs executable rules`.

`react-sonar` should mean `react + sonarjs executable rules`.

Some Sonar equivalents are already covered by React/a11y rules and therefore only available in React profiles.

Every `external-eslint` record should have non-empty `coveredByProfiles`.

`coveredByProfiles` must be derived from actual imported public profiles, not manually guessed.

Deprecated and metadata-only records should stay non-executable.

### Verification Commands

```powershell
npm run generate:sonar
npm run validate:sonar
node -e "import('./configs/sonar.mjs')"
node -e "import('./configs/react-sonar.mjs')"
node -e "const c=require('./configs/sonar-catalog.generated.json'); console.log(c.summary)"
node -e "const c=require('./configs/sonar-catalog.generated.json'); const bad=c.rules.filter(r=>r.integrationStatus==='external-eslint' && (!Array.isArray(r.coveredByProfiles) || r.coveredByProfiles.length===0)); console.log(bad.length)"
```

### Acceptance Criteria

Generated catalog is valid.

Every external mapping has profile-aware coverage.

React-only mappings do not list plain `sonar`.

Docs and README do not overpromise plain `sonar` coverage when docs updates are in scope.

## Phase 9: Fixture-Based Verification

### Goal

Доказать, что package работает в реальных consumer scenarios после pack/install, а не только при local import.

### Prompt

```
Создай temporary или committed fixtures для consumer verification.
Pack текущий package, установи tarball в чистые consumer projects и проверь JS-only, TypeScript, React TypeScript, Sonar opt-in и Husky init scenarios.
Не публикуй package.
```

### Files Likely Affected

Temporary fixture directories outside package surface, optionally `fixtures/**`, optionally validation scripts.

### Required Scenarios

JS-only project imports base/default config.

TypeScript project imports base or strict config.

React TypeScript project imports react config.

Sonar project imports sonar config.

React Sonar project imports react-sonar config.

Consumer without `tsconfig.json` gets actionable behavior.

Consumer with existing `.husky/pre-commit` can run `husky enable` and `husky disable` without losing user commands.

Consumer can run format and lint separately.

### Verification Commands

```powershell
npm pack --dry-run
npm pack
npm install ..\path\to\packed.tgz
npx eslint .
npx ytdev-linter --help
npx ytdev-linter init
npx ytdev-linter husky enable
npx ytdev-linter husky disable
```

### Acceptance Criteria

Packed tarball installs in clean consumer project.

All public exports import from installed package.

CLI executes from consumer cwd.

No package script modifies consumer project without explicit CLI command.

Fixture failures are documented and fixed before release readiness.

## Phase 10: Release Dry Run Only

### Goal

Подготовить release candidate без реальной публикации.

### Prompt

```
Проведи release readiness dry-run для `@ytdev/linter`.
Не выполняй реальный `npm publish`.
Проверь package contents, installability, exports, CLI, dependency audit, Sonar validation and formatting/linting.
Сформируй финальный список blockers и команд, которые прошли.
```

### Files Likely Affected

No source files expected unless dry-run exposes blockers.

### Verification Commands

```powershell
git status --short
npm run generate:sonar
npm run validate:sonar
node -e "import('./configs/sonar.mjs')"
node -e "import('./configs/react-sonar.mjs')"
npx eslint . --ext .js,.mjs,.ts,.tsx --report-unused-disable-directives
npx prettier --check .
npm audit --omit=dev
npm pack --dry-run
npm publish --dry-run
```

### Acceptance Criteria

All checks pass or blockers are explicitly listed.

Tarball contains only intended package files.

Package size is accepted or Sonar catalog export decision is revisited.

`npm publish --dry-run` passes.

Real `npm publish` is still not executed.

## Roadmap-Only Verification For This Edit

После изменения только `ROADMAP.md` выполнить:

```powershell
npx prettier --check ROADMAP.md
git diff -- ROADMAP.md
git status --short
```

Если `npx prettier --check ROADMAP.md` недоступен из-за отсутствующих dependencies, network, sandbox или package-manager mismatch, сообщить точную причину и показать, что `ROADMAP.md` изменён только как documentation file.

## Future Acceptance Summary

Checklist перед настоящей публикацией:

1. Package identity changed to `@ytdev/linter`.
2. Real publish not run before explicit approval.
3. Docs remain in repo but not in package tarball.
4. Generated Sonar catalog package-size decision is explicit.
5. Husky works only through explicit consumer CLI command.
6. Runtime dependency surface is minimal and audited.
7. Known transitive vulnerabilities are fixed or documented with rationale.
8. Prettier is separated from semantic linting.
9. Default fix flow does not run Sonar autofix.
10. Duplicate ESLint rules are removed or allowlisted as intentional overrides.
11. TypeScript config works from consumer project root.
12. `sonar` and `react-sonar` semantics are profile-aware and documented.
13. Packed tarball installs and runs in clean consumer fixtures.
14. Both `package-lock.json` and `yarn.lock` are synchronized after dependency changes.
