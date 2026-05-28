import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const WORK_DIR = path.join(ROOT_DIR, 'tmp', 'phase9-consumer-fixtures');
const PACK_DIR = path.join(WORK_DIR, 'pack');
const MANAGED_BEGIN_MARKER = '# @ytdev/linter begin';
const MANAGED_END_MARKER = '# @ytdev/linter end';
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function run(command, args, options = {}) {
  const commandFile =
    process.platform === 'win32' && command.endsWith('.cmd') ? process.env.ComSpec || 'cmd.exe' : command;
  const commandArgs =
    process.platform === 'win32' && command.endsWith('.cmd') ? ['/d', '/s', '/c', [command, ...args].join(' ')] : args;
  const result = spawnSync(commandFile, commandArgs, {
    cwd: options.cwd || ROOT_DIR,
    encoding: 'utf8',
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

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function writeJson(filePath, value) {
  writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function createFixture(name) {
  const fixtureDir = path.join(WORK_DIR, name);

  fs.mkdirSync(fixtureDir, { recursive: true });
  writeJson(path.join(fixtureDir, 'package.json'), {
    name: `phase9-${name}`,
    private: true,
    type: 'module',
  });

  return fixtureDir;
}

function installPackedPackage(fixtureDir, tarballPath) {
  assertSuccess(
    run(npmBin, ['install', '--no-audit', '--ignore-scripts', '--save-dev', tarballPath], { cwd: fixtureDir }),
    `npm install in ${path.basename(fixtureDir)}`,
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
  const forbiddenFiles = new Set(['ROADMAP.md', 'SONAR_ROADMAP.md', 'index.html', 'build-docbook.js']);
  const requiredFiles = [
    'LICENSE',
    'README.md',
    'README_RU.md',
    'bin/ytdev-linter.mjs',
    'configs/base.mjs',
    'configs/react.mjs',
    'configs/strict.mjs',
    'configs/sonar.mjs',
    'configs/react-sonar.mjs',
    'configs/sonar-catalog.generated.json',
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

function verifyExports(tarballPath) {
  const fixtureDir = createFixture('exports');

  installPackedPackage(fixtureDir, tarballPath);

  const importScript = [
    "await import('@ytdev/linter');",
    "await import('@ytdev/linter/configs/react');",
    "await import('@ytdev/linter/configs/strict');",
    "await import('@ytdev/linter/configs/sonar');",
    "await import('@ytdev/linter/configs/react-sonar');",
    "await import('@ytdev/linter/configs/sonar-catalog', { with: { type: 'json' } });",
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

  assertSuccess(run(npxBin, ['--no-install', 'ytdev-linter', 'husky', 'enable'], { cwd: fixtureDir }), 'Husky enable');
  assertManagedHookState(hookPath, { hasManagedBlock: true, markerCount: 1, userHookContent });

  assertSuccess(
    run(npxBin, ['--no-install', 'ytdev-linter', 'husky', 'enable'], { cwd: fixtureDir }),
    'Husky enable idempotency',
  );
  assertManagedHookState(hookPath, { hasManagedBlock: true, markerCount: 1, userHookContent });

  assertSuccess(
    run(npxBin, ['--no-install', 'ytdev-linter', 'husky', 'disable'], { cwd: fixtureDir }),
    'Husky disable',
  );
  assertManagedHookState(hookPath, { hasManagedBlock: false, markerCount: 0, userHookContent });
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
}

fs.rmSync(WORK_DIR, { force: true, recursive: true });
fs.mkdirSync(WORK_DIR, { recursive: true });

const tarballPath = packCurrentPackage();

verifyJsOnly(tarballPath);
verifyTypeScript(tarballPath);
verifyReactTypeScript(tarballPath);
verifySonar(tarballPath);
verifyReactSonar(tarballPath);
verifyExports(tarballPath);
verifyMissingTsconfig(tarballPath);
verifyHuskyExistingHook(tarballPath);

fs.rmSync(WORK_DIR, { force: true, recursive: true });

console.log('Consumer package fixture verification passed.');
