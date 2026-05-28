import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const WORK_DIR = path.join(ROOT_DIR, 'tmp', 'phase7-consumer-fixtures');
const PACK_DIR = path.join(WORK_DIR, 'pack');
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
    name: `phase7-${name}`,
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

function verifyJsOnly(tarballPath) {
  const fixtureDir = createFixture('js-only');

  writeFile(path.join(fixtureDir, 'src', 'index.js'), 'export function greet(name) {\n  return `Hello ${name}`;\n}\n');
  installPackedPackage(fixtureDir, tarballPath);
  assertSuccess(
    run(npxBin, ['--no-install', 'ytdev-linter', 'lint', 'src/index.js'], { cwd: fixtureDir }),
    'JS-only fixture lint',
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
      '  interface Element {}',
      '  interface IntrinsicElements {',
      '    div: { children?: unknown };',
      '  }',
      '}',
      '',
    ].join('\n'),
  );
  writeFile(path.join(fixtureDir, 'src', 'App.tsx'), 'export function App(): JSX.Element {\n  return <div />;\n}\n');
  installPackedPackage(fixtureDir, tarballPath);
  assertSuccess(
    run(npxBin, ['--no-install', 'ytdev-linter', 'lint', 'src/App.tsx'], { cwd: fixtureDir }),
    'React TypeScript fixture lint',
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

  if (!output.includes('type-aware TypeScript linting requires a tsconfig.json')) {
    throw new Error('Missing tsconfig fixture did not print the expected actionable message.');
  }

  if (output.includes('node_modules') && output.includes('@ytdev/linter') && output.includes('tsconfig.json')) {
    throw new Error('Missing tsconfig fixture referenced a package-local tsconfig path.');
  }
}

fs.rmSync(WORK_DIR, { force: true, recursive: true });
fs.mkdirSync(WORK_DIR, { recursive: true });

const tarballPath = packCurrentPackage();

verifyJsOnly(tarballPath);
verifyTypeScript(tarballPath);
verifyReactTypeScript(tarballPath);
verifyMissingTsconfig(tarballPath);

fs.rmSync(WORK_DIR, { force: true, recursive: true });

console.log('Consumer TypeScript fixture verification passed.');
