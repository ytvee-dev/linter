import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ytdev-linter-consumer-fixtures-'));
const PACK_DIR = path.join(WORK_DIR, 'pack');
const NPM_CACHE_DIR = path.join(WORK_DIR, 'npm-cache');
const YARN_VERSION = '4.9.1';
const MANAGED_BEGIN_MARKER = '# @ytdev/linter begin';
const MANAGED_END_MARKER = '# @ytdev/linter end';
const nodeBinDir = path.dirname(process.execPath);
const corepackBin = process.platform === 'win32' ? path.join(nodeBinDir, 'corepack.cmd') : 'corepack';
const npmBin = process.platform === 'win32' ? path.join(nodeBinDir, 'npm.cmd') : 'npm';
const npxBin = process.platform === 'win32' ? path.join(nodeBinDir, 'npx.cmd') : 'npx';

function quoteCmdArg(value) {
  return `"${value.replace(/%/g, '%%').replace(/([()!^"<>&|])/g, '^$1')}"`;
}

function run(command, args, options = {}) {
  const isWindowsCmd = process.platform === 'win32' && command.endsWith('.cmd');
  const commandLine = [command, ...args].map(quoteCmdArg).join(' ');
  const commandFile = isWindowsCmd ? commandLine : command;
  const commandArgs = isWindowsCmd ? [] : args;
  const result = spawnSync(commandFile, commandArgs, {
    cwd: options.cwd || ROOT_DIR,
    encoding: 'utf8',
    env: { ...process.env, npm_config_cache: NPM_CACHE_DIR, ...options.env },
    shell: isWindowsCmd,
    stdio: options.capture ? 'pipe' : 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertSuccess(result, label) {
  if ((result.status ?? 1) !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
    const details = output ? `\n${output}` : '';

    throw new Error(`${label} failed with exit code ${result.status ?? 1}.${details}`);
  }
}

function assertFailure(result, label) {
  if ((result.status ?? 0) === 0) {
    throw new Error(`${label} unexpectedly passed.`);
  }
}

function runYarn(args, options = {}) {
  return run(corepackBin, ['yarn', ...args], options);
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function writeJson(filePath, value) {
  writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function createFixture(name, packageJson = {}) {
  const fixtureDir = path.join(WORK_DIR, name);

  fs.mkdirSync(fixtureDir, { recursive: true });
  writeJson(path.join(fixtureDir, 'package.json'), {
    name: `phase9-${name}`,
    private: true,
    type: 'module',
    ...packageJson,
  });

  return fixtureDir;
}

function installPackedPackage(fixtureDir, tarballPath) {
  assertSuccess(
    run(npmBin, ['install', '--no-audit', '--ignore-scripts', '--save-dev', tarballPath], { cwd: fixtureDir }),
    `npm install in ${path.basename(fixtureDir)}`,
  );
}

function installPackedPackageWithYarn(fixtureDir, tarballPath) {
  assertSuccess(run(corepackBin, ['--version'], { capture: true }), 'Corepack availability check');
  const packageJsonPath = path.join(fixtureDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  if (typeof packageJson.packageManager !== 'string') {
    writeJson(packageJsonPath, {
      ...packageJson,
      packageManager: `yarn@${YARN_VERSION}`,
    });
  }

  writeFile(
    path.join(fixtureDir, '.yarnrc.yml'),
    'cacheFolder: .yarn/cache\nenableGlobalCache: false\nglobalFolder: .yarn/global\nnodeLinker: node-modules\n',
  );
  const tarballRelativePath = path.relative(fixtureDir, tarballPath).replaceAll('\\', '/');
  const tarballSpec = `@ytdev/linter@file:${tarballRelativePath}`;
  assertSuccess(
    runYarn(['add', '--dev', tarballSpec], { cwd: fixtureDir }),
    `yarn add in ${path.basename(fixtureDir)}`,
  );
}

function packCurrentPackage() {
  fs.mkdirSync(PACK_DIR, { recursive: true });

  const dryRunResult = run(npmBin, ['pack', '--dry-run', '--json'], {
    capture: true,
  });

  assertSuccess(dryRunResult, 'npm pack --dry-run');
  assertExpectedTarballSurface(JSON.parse(dryRunResult.stdout)[0]?.files ?? []);

  const result = run(npmBin, ['pack', '--pack-destination', PACK_DIR, '--json'], {
    capture: true,
  });

  assertSuccess(result, 'npm pack');

  const [packResult] = JSON.parse(result.stdout);

  if (!packResult?.filename) {
    throw new Error('npm pack did not return a tarball filename.');
  }

  return path.join(PACK_DIR, packResult.filename);
}

function assertExpectedTarballSurface(files) {
  const filePaths = files.map((file) => file.path);
  const forbiddenPrefixes = ['scripts/', 'tmp/', 'docs/', '.husky/'];
  const forbiddenFiles = new Set([
    'ROADMAP.md',
    'SONAR_ROADMAP.md',
    'index.html',
    'build-docbook.js',
    'configs/sonar-catalog.generated.json',
  ]);
  const requiredFiles = [
    'LICENSE',
    'README.md',
    'bin/ytdev-linter.mjs',
    'configs/base.mjs',
    'configs/default.mjs',
    'configs/fix.mjs',
    'configs/react.mjs',
    'configs/strict.mjs',
    'configs/strict-react.mjs',
    'configs/sonar.mjs',
    'configs/react-sonar.mjs',
    'eslint.config.mjs',
    'package.json',
    'prettier.js',
  ];

  for (const filePath of filePaths) {
    assert(!forbiddenFiles.has(filePath), `Tarball unexpectedly includes ${filePath}.`);
    assert(
      !forbiddenPrefixes.some((prefix) => filePath.startsWith(prefix)),
      `Tarball unexpectedly includes ${filePath}.`,
    );
  }

  for (const filePath of requiredFiles) {
    assert(filePaths.includes(filePath), `Tarball is missing ${filePath}.`);
  }
}

function writeTsconfig(fixtureDir, compilerOptions = {}) {
  writeJson(path.join(fixtureDir, 'tsconfig.json'), {
    compilerOptions: {
      module: 'ESNext',
      moduleResolution: 'Bundler',
      target: 'ES2022',
      strict: true,
      ...compilerOptions,
    },
    include: ['src/**/*'],
  });
}

function writeJsxTypes(fixtureDir) {
  writeFile(
    path.join(fixtureDir, 'src', 'jsx.d.ts'),
    [
      "declare module 'react/jsx-runtime' {",
      '  export const jsx: unknown;',
      '  export const jsxs: unknown;',
      '  export const Fragment: unknown;',
      '}',
      '',
      'declare namespace JSX {',
      '  type Element = unknown;',
      '  interface IntrinsicElements {',
      '    div: { children?: unknown };',
      '  }',
      '}',
      '',
    ].join('\n'),
  );
}

function writeReactApp(fixtureDir) {
  writeFile(path.join(fixtureDir, 'src', 'App.tsx'), '\nexport function App(): JSX.Element {\n  return <div />;\n}\n');
}

function verifyJsOnly(tarballPath) {
  const fixtureDir = createFixture('js-only');
  const indexPath = path.join(fixtureDir, 'src', 'index.js');

  writeFile(indexPath, 'export function greet(name) {return `Hello ${name}`;}\n');
  installPackedPackage(fixtureDir, tarballPath);
  assertSuccess(run(npxBin, ['--no-install', 'ytdev-linter', '--help'], { cwd: fixtureDir }), 'CLI help');
  assertSuccess(
    run(npxBin, ['--no-install', 'ytdev-linter', 'lint', 'src/index.js'], { cwd: fixtureDir }),
    'JS-only fixture lint',
  );
  assertSuccess(
    run(npxBin, ['--no-install', 'ytdev-linter', 'format', '--check', 'package.json'], { cwd: fixtureDir }),
    'JS-only fixture format check',
  );
  assertSuccess(
    run(npxBin, ['--no-install', 'ytdev-linter', 'fix', 'src/index.js'], { cwd: fixtureDir }),
    'JS-only fixture fix',
  );

  const fixedSource = fs.readFileSync(indexPath, 'utf8');

  assert(
    fixedSource === 'export function greet(name) {\n  return `Hello ${name}`;\n}\n',
    'JS-only fixture fix did not run Prettier as expected.',
  );
  assertSuccess(
    run(npxBin, ['--no-install', 'ytdev-linter', 'lint', 'src/index.js'], { cwd: fixtureDir }),
    'JS-only fixture lint after fix',
  );
}

function verifyTypeScript(tarballPath) {
  const fixtureDir = createFixture('typescript');

  writeTsconfig(fixtureDir);
  writeFile(
    path.join(fixtureDir, 'src', 'index.ts'),
    'export function add(left: number, right: number): number {\n  return left + right;\n}\n',
  );
  installPackedPackage(fixtureDir, tarballPath);
  assertSuccess(
    run(npxBin, ['--no-install', 'ytdev-linter', 'lint', 'src/index.ts'], { cwd: fixtureDir }),
    'TypeScript fixture lint',
  );

  writeFile(
    path.join(fixtureDir, 'eslint.config.mjs'),
    "import config from '@ytdev/linter';\n\nexport default config;\n",
  );
  assertSuccess(
    run(npxBin, ['--no-install', 'eslint', 'src/index.ts'], { cwd: fixtureDir }),
    'raw ESLint import fixture lint',
  );
}

function verifyDefaultSonarFailure(tarballPath) {
  const fixtureDir = createFixture('default-sonar-failure');

  writeFile(
    path.join(fixtureDir, 'src', 'index.js'),
    [
      "export const first = 'duplicate-literal';",
      "export const second = 'duplicate-literal';",
      "export const third = 'duplicate-literal';",
      "export const fourth = 'duplicate-literal';",
      '',
    ].join('\n'),
  );
  installPackedPackage(fixtureDir, tarballPath);

  const result = run(npxBin, ['--no-install', 'ytdev-linter', 'lint', 'src/index.js'], {
    capture: true,
    cwd: fixtureDir,
  });
  const output = `${result.stdout}\n${result.stderr}`;

  assertFailure(result, 'default SonarJS fixture lint');
  assert(
    output.includes('sonarjs/no-duplicate-string'),
    'Default lint did not report the expected SonarJS no-duplicate-string rule.',
  );
}

function verifyYarnJsOnly(tarballPath) {
  const fixtureDir = createFixture('yarn-js-only');
  const indexPath = path.join(fixtureDir, 'src', 'index.js');

  writeFile(indexPath, 'export function greet(name) {return `Hello ${name}`;}\n');
  installPackedPackageWithYarn(fixtureDir, tarballPath);
  assertSuccess(runYarn(['exec', 'ytdev-linter', '--help'], { cwd: fixtureDir }), 'Yarn CLI help');
  assertSuccess(
    runYarn(['exec', 'ytdev-linter', 'lint', 'src/index.js'], { cwd: fixtureDir }),
    'Yarn JS-only fixture lint',
  );
  assertSuccess(
    runYarn(['exec', 'ytdev-linter', 'format', '--check', 'package.json'], { cwd: fixtureDir }),
    'Yarn JS-only fixture format check',
  );
  assertSuccess(
    runYarn(['exec', 'ytdev-linter', 'fix', 'src/index.js'], { cwd: fixtureDir }),
    'Yarn JS-only fixture fix',
  );

  const fixedSource = fs.readFileSync(indexPath, 'utf8');

  assert(
    fixedSource === 'export function greet(name) {\n  return `Hello ${name}`;\n}\n',
    'Yarn JS-only fixture fix did not run Prettier as expected.',
  );
}

function verifyPackagePrettierConfig(tarballPath) {
  const fixtureDir = createFixture('package-prettier-config');

  writeFile(path.join(fixtureDir, 'src', 'index.js'), 'export const value = "double-quoted";\n');
  installPackedPackage(fixtureDir, tarballPath);

  const result = run(npxBin, ['--no-install', 'ytdev-linter', 'format', '--check', 'src/index.js'], {
    capture: true,
    cwd: fixtureDir,
  });

  assertFailure(result, 'package Prettier config fixture format check');
  assert(
    `${result.stdout}\n${result.stderr}`.includes('src/index.js'),
    'Package Prettier config fixture did not check the expected source file.',
  );
}

function verifyReactTypeScript(tarballPath) {
  const fixtureDir = createFixture('react-typescript');

  writeTsconfig(fixtureDir, { jsx: 'react-jsx' });
  writeJsxTypes(fixtureDir);
  writeReactApp(fixtureDir);
  writeFile(
    path.join(fixtureDir, 'eslint.config.mjs'),
    "import reactConfig from '@ytdev/linter/configs/react';\n\nexport default reactConfig;\n",
  );
  installPackedPackage(fixtureDir, tarballPath);
  assertSuccess(
    run(npxBin, ['--no-install', 'eslint', 'src/App.tsx'], { cwd: fixtureDir }),
    'React TypeScript fixture lint',
  );
}

function verifySonar(tarballPath) {
  const fixtureDir = createFixture('sonar');

  writeTsconfig(fixtureDir);
  writeFile(path.join(fixtureDir, 'src', 'index.ts'), '\nexport const answer: number = 42;\n');
  writeFile(
    path.join(fixtureDir, 'eslint.config.mjs'),
    "import sonarConfig from '@ytdev/linter/configs/sonar';\n\nexport default sonarConfig;\n",
  );
  installPackedPackage(fixtureDir, tarballPath);
  assertSuccess(run(npxBin, ['--no-install', 'eslint', 'src/index.ts'], { cwd: fixtureDir }), 'Sonar fixture lint');
}

function verifyReactSonar(tarballPath) {
  const fixtureDir = createFixture('react-sonar');

  writeTsconfig(fixtureDir, { jsx: 'react-jsx' });
  writeFile(path.join(fixtureDir, 'src', 'App.tsx'), '\nexport const answer: number = 42;\n');
  writeFile(
    path.join(fixtureDir, 'eslint.config.mjs'),
    "import reactSonarConfig from '@ytdev/linter/configs/react-sonar';\n\nexport default reactSonarConfig;\n",
  );
  installPackedPackage(fixtureDir, tarballPath);
  assertSuccess(
    run(npxBin, ['--no-install', 'eslint', 'src/App.tsx'], { cwd: fixtureDir }),
    'React Sonar fixture lint',
  );
}

function verifyStrictReact(tarballPath) {
  const fixtureDir = createFixture('strict-react');

  writeTsconfig(fixtureDir, { jsx: 'react-jsx' });
  writeJsxTypes(fixtureDir);
  writeFile(
    path.join(fixtureDir, 'src', 'App.tsx'),
    [
      'export function App(props: any): JSX.Element {',
      '  return <div id="first" id="second">{props.label}</div>;',
      '}',
      '',
    ].join('\n'),
  );
  writeFile(
    path.join(fixtureDir, 'eslint.config.mjs'),
    "import strictReactConfig from '@ytdev/linter/configs/strict-react';\n\nexport default strictReactConfig;\n",
  );
  installPackedPackage(fixtureDir, tarballPath);

  const result = run(npxBin, ['--no-install', 'eslint', 'src/App.tsx'], {
    capture: true,
    cwd: fixtureDir,
  });
  const output = `${result.stdout}\n${result.stderr}`;

  assertFailure(result, 'Strict React fixture lint');
  assert(output.includes('@typescript-eslint/no-explicit-any'), 'Strict React fixture did not report no-explicit-any.');
  assert(output.includes('react/jsx-no-duplicate-props'), 'Strict React fixture did not report a React rule.');
}

function verifyExports(tarballPath) {
  const fixtureDir = createFixture('exports');

  installPackedPackage(fixtureDir, tarballPath);

  const importScript = [
    "await import('@ytdev/linter');",
    "await import('@ytdev/linter/eslint.config');",
    "await import('@ytdev/linter/configs/react');",
    "await import('@ytdev/linter/configs/strict');",
    "await import('@ytdev/linter/configs/strict-react');",
    "await import('@ytdev/linter/configs/sonar');",
    "await import('@ytdev/linter/configs/react-sonar');",
    "await import('@ytdev/linter/prettier');",
    "console.log('exports ok');",
  ].join('\n');

  assertSuccess(
    run(process.execPath, ['--input-type=module', '--eval', importScript], { cwd: fixtureDir }),
    'exports import',
  );
}

function verifyMissingTsconfig(tarballPath) {
  const fixtureDir = createFixture('missing-tsconfig');

  writeFile(
    path.join(fixtureDir, 'src', 'index.ts'),
    'export function add(left: number, right: number): number {\n  return left + right;\n}\n',
  );
  installPackedPackage(fixtureDir, tarballPath);

  const result = run(npxBin, ['--no-install', 'ytdev-linter', 'lint', 'src/index.ts'], {
    capture: true,
    cwd: fixtureDir,
  });
  const output = `${result.stdout}\n${result.stderr}`;

  assertFailure(result, 'missing tsconfig fixture lint');
  assert(
    output.includes('type-aware TypeScript linting requires a tsconfig.json'),
    'Missing tsconfig fixture did not print the expected actionable message.',
  );
  assert(
    !(output.includes('node_modules') && output.includes('@ytdev/linter') && output.includes('tsconfig.json')),
    'Missing tsconfig fixture referenced a package-local tsconfig path.',
  );
}

function verifyHuskyExistingHook(tarballPath) {
  const fixtureDir = createFixture('husky-existing-hook');
  const hookPath = path.join(fixtureDir, '.husky', 'pre-commit');
  const userHookContent = '#!/usr/bin/env sh\necho user-hook\n';

  installPackedPackage(fixtureDir, tarballPath);
  assertSuccess(run('git', ['init'], { cwd: fixtureDir }), 'git init in Husky fixture');
  writeFile(hookPath, userHookContent);

  assertSuccess(run(npxBin, ['--no-install', 'ytdev-linter', 'init'], { cwd: fixtureDir }), 'Husky init');
  assertManagedHookState(hookPath, {
    expectedCommand: 'npx --no-install ytdev-linter lint',
    hasManagedBlock: true,
    markerCount: 1,
    userHookContent,
  });
  assertGitHooksPath(fixtureDir);

  assertSuccess(
    run(npxBin, ['--no-install', 'ytdev-linter', 'husky', 'enable'], { cwd: fixtureDir }),
    'Husky enable idempotency',
  );
  assertManagedHookState(hookPath, {
    expectedCommand: 'npx --no-install ytdev-linter lint',
    hasManagedBlock: true,
    markerCount: 1,
    userHookContent,
  });

  assertSuccess(
    run(npxBin, ['--no-install', 'ytdev-linter', 'husky', 'disable'], { cwd: fixtureDir }),
    'Husky disable',
  );
  assertManagedHookState(hookPath, { hasManagedBlock: false, markerCount: 0, userHookContent });
}

function verifyYarnHuskyExistingHook(tarballPath) {
  const fixtureDir = createFixture('yarn-husky-existing-hook', {
    packageManager: `yarn@${YARN_VERSION}`,
  });
  const hookPath = path.join(fixtureDir, '.husky', 'pre-commit');
  const userHookContent = '#!/usr/bin/env sh\necho user-hook\n';

  installPackedPackageWithYarn(fixtureDir, tarballPath);
  assertSuccess(run('git', ['init'], { cwd: fixtureDir }), 'git init in Yarn Husky fixture');
  writeFile(hookPath, userHookContent);

  assertSuccess(runYarn(['exec', 'ytdev-linter', 'husky', 'enable'], { cwd: fixtureDir }), 'Yarn Husky enable');
  assertManagedHookState(hookPath, {
    expectedCommand: 'yarn exec ytdev-linter lint',
    hasManagedBlock: true,
    markerCount: 1,
    userHookContent,
  });
  assertGitHooksPath(fixtureDir);

  assertSuccess(
    runYarn(['exec', 'ytdev-linter', 'husky', 'enable'], { cwd: fixtureDir }),
    'Yarn Husky enable idempotency',
  );
  assertManagedHookState(hookPath, {
    expectedCommand: 'yarn exec ytdev-linter lint',
    hasManagedBlock: true,
    markerCount: 1,
    userHookContent,
  });

  assertSuccess(runYarn(['exec', 'ytdev-linter', 'husky', 'disable'], { cwd: fixtureDir }), 'Yarn Husky disable');
  assertManagedHookState(hookPath, { hasManagedBlock: false, markerCount: 0, userHookContent });
}

function verifyYarnBerryHuskyWithoutPackageManager(tarballPath) {
  const fixtureDir = createFixture('yarn-berry-husky-without-package-manager');
  const hookPath = path.join(fixtureDir, '.husky', 'pre-commit');
  const userHookContent = '#!/usr/bin/env sh\necho user-hook\n';

  installPackedPackageWithYarn(fixtureDir, tarballPath);
  writeJson(path.join(fixtureDir, 'package.json'), {
    name: 'phase9-yarn-berry-husky-without-package-manager',
    private: true,
    type: 'module',
  });
  assertSuccess(run('git', ['init'], { cwd: fixtureDir }), 'git init in Yarn Berry Husky fixture');
  writeFile(hookPath, userHookContent);

  assertSuccess(
    run(
      process.execPath,
      [path.join(fixtureDir, 'node_modules', '@ytdev', 'linter', 'bin', 'ytdev-linter.mjs'), 'husky', 'enable'],
      { cwd: fixtureDir },
    ),
    'Yarn Berry Husky enable without packageManager',
  );
  assertManagedHookState(hookPath, {
    expectedCommand: 'yarn exec ytdev-linter lint',
    hasManagedBlock: true,
    markerCount: 1,
    userHookContent,
  });
  assertGitHooksPath(fixtureDir);
}

function assertGitHooksPath(fixtureDir) {
  const result = run('git', ['config', '--get', 'core.hooksPath'], { capture: true, cwd: fixtureDir });

  assertSuccess(result, 'git core.hooksPath read');
  assert(result.stdout.trim() === '.husky', `Expected core.hooksPath to be .husky, received ${result.stdout.trim()}.`);
}

function assertManagedHookState(hookPath, options) {
  const content = fs.readFileSync(hookPath, 'utf8');
  const markerCount = [...content.matchAll(new RegExp(MANAGED_BEGIN_MARKER, 'gu'))].length;

  assert(
    options.userHookContent
      .trim()
      .split('\n')
      .every((line) => content.includes(line)),
    'Husky fixture lost existing user hook content.',
  );
  assert(
    markerCount === options.markerCount,
    `Expected ${options.markerCount} managed block(s), found ${markerCount}.`,
  );
  assert(
    content.includes(MANAGED_BEGIN_MARKER) === options.hasManagedBlock &&
      content.includes(MANAGED_END_MARKER) === options.hasManagedBlock,
    'Husky managed block marker state is incorrect.',
  );

  if (options.expectedCommand) {
    assert(content.includes(options.expectedCommand), `Husky hook does not include ${options.expectedCommand}.`);
  }
}

const verifierGroups = new Map([
  [
    'npm',
    [
      verifyJsOnly,
      verifyTypeScript,
      verifyDefaultSonarFailure,
      verifyPackagePrettierConfig,
      verifyReactTypeScript,
      verifySonar,
      verifyReactSonar,
      verifyStrictReact,
      verifyMissingTsconfig,
    ],
  ],
  ['exports', [verifyExports]],
  ['husky', [verifyHuskyExistingHook, verifyYarnHuskyExistingHook, verifyYarnBerryHuskyWithoutPackageManager]],
  ['yarn', [verifyYarnJsOnly, verifyYarnHuskyExistingHook, verifyYarnBerryHuskyWithoutPackageManager]],
]);

function getSelectedVerifiers(args) {
  const selected = args.length > 0 ? args : [...verifierGroups.keys()];
  const verifiers = [];
  const added = new Set();

  for (const name of selected) {
    const group = verifierGroups.get(name);

    if (!group) {
      throw new Error(
        `Unknown consumer verification group "${name}". Expected one of: ${[...verifierGroups.keys()].join(', ')}.`,
      );
    }

    for (const verifier of group) {
      if (!added.has(verifier.name)) {
        added.add(verifier.name);
        verifiers.push(verifier);
      }
    }
  }

  return verifiers;
}

try {
  fs.mkdirSync(WORK_DIR, { recursive: true });

  const tarballPath = packCurrentPackage();
  const verifiers = getSelectedVerifiers(process.argv.slice(2));

  for (const verifier of verifiers) {
    verifier(tarballPath);
  }

  console.log('Consumer package fixture verification passed.');
} finally {
  fs.rmSync(WORK_DIR, { force: true, recursive: true });
}
