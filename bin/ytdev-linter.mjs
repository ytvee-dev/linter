#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const PACKAGE_NAME = '@ytdev/linter';
const PACKAGE_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PACKAGE_DEFAULT_ESLINT_CONFIG = path.join(PACKAGE_ROOT, 'eslint.config.mjs');
const PACKAGE_FIX_ESLINT_CONFIG = path.join(PACKAGE_ROOT, 'configs', 'fix.mjs');
const PACKAGE_PRETTIER_CONFIG = path.join(PACKAGE_ROOT, 'prettier.js');
const BEGIN_MARKER = '# @ytdev/linter begin';
const END_MARKER = '# @ytdev/linter end';
const require = createRequire(import.meta.url);
const DEFAULT_LINT_TARGETS = ['.'];
const DEFAULT_FORMAT_TARGETS = ['**/*.{js,cjs,mjs,jsx,ts,tsx,json,jsonc,css,scss,html,yml,yaml}'];
const ESLINT_ARGS = ['--ext', '.js,.mjs,.ts,.tsx', '--report-unused-disable-directives'];
const PRETTIER_ARGS = ['--config', PACKAGE_PRETTIER_CONFIG, '--ignore-unknown'];
const TYPESCRIPT_EXTENSIONS = new Set(['.ts', '.tsx']);
const SKIPPED_SCAN_DIRECTORIES = new Set(['.git', '.next', 'build', 'coverage', 'dist', 'node_modules', 'out']);
const ESLINT_CONFIG_FILES = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.cts',
];

const helpText = `
ytdev-linter

Usage:
  ytdev-linter --help
  ytdev-linter lint [paths...]
  ytdev-linter format [--check] [paths...]
  ytdev-linter fix [paths...]
  ytdev-linter init
  ytdev-linter init --husky
  ytdev-linter husky enable
  ytdev-linter husky disable

Commands:
  lint             Run ESLint with the default React + SonarJS profile when no local ESLint config exists.
  format           Run Prettier write for the provided paths, or safe source/config globs by default.
  format --check   Run Prettier check for the provided paths, or safe source/config globs by default.
  fix              Run non-Sonar ESLint autofix, then Prettier write.
  init             Enable the managed pre-commit hook in the current project.
  init --husky      Enable the managed pre-commit hook in the current project.
  husky enable     Add or update the managed pre-commit hook block.
  husky disable    Remove only the managed pre-commit hook block.

The Husky commands operate in process.cwd() and never run during package install.
`;

function printHelp() {
  console.log(helpText.trim());
}

function runNodeBin(binPath, args) {
  const result = spawnSync(process.execPath, [binPath, ...args], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

function getTargets(args, defaultTargets) {
  return args.length > 0 ? args : defaultTargets;
}

function runPrettier(args) {
  return runNodeBin(path.join(path.dirname(require.resolve('prettier/package.json')), 'bin', 'prettier.cjs'), args);
}

function runEslint(args) {
  return runNodeBin(path.join(path.dirname(require.resolve('eslint/package.json')), 'bin', 'eslint.js'), args);
}

function hasConsumerEslintConfig(cwd) {
  return ESLINT_CONFIG_FILES.some((fileName) => fs.existsSync(path.join(cwd, fileName)));
}

function readPackageJson(cwd) {
  const packageJsonPath = path.join(cwd, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch {
    return null;
  }
}

function detectPackageManager(cwd) {
  const packageJson = readPackageJson(cwd);
  const packageManager = typeof packageJson?.packageManager === 'string' ? packageJson.packageManager : '';

  if (packageManager.startsWith('yarn@')) {
    return packageManager.includes('yarn@1.') ? 'yarn-classic' : 'yarn-berry';
  }

  if (packageManager.startsWith('pnpm@')) {
    return 'pnpm';
  }

  if (packageManager.startsWith('npm@')) {
    return 'npm';
  }

  if (fs.existsSync(path.join(cwd, '.yarnrc.yml'))) {
    return 'yarn-berry';
  }

  if (fs.existsSync(path.join(cwd, 'yarn.lock'))) {
    return 'yarn-classic';
  }

  if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }

  if (fs.existsSync(path.join(cwd, 'package-lock.json')) || fs.existsSync(path.join(cwd, 'npm-shrinkwrap.json'))) {
    return 'npm';
  }

  return 'npm';
}

function createHookCommand(cwd) {
  const packageManager = detectPackageManager(cwd);

  if (packageManager === 'yarn-berry') {
    return 'yarn exec ytdev-linter lint';
  }

  if (packageManager === 'yarn-classic') {
    return 'yarn run -s ytdev-linter lint';
  }

  if (packageManager === 'pnpm') {
    return 'pnpm exec ytdev-linter lint';
  }

  return 'npx --no-install ytdev-linter lint';
}

function hasConsumerTsconfig(cwd) {
  return fs.existsSync(path.join(cwd, 'tsconfig.json'));
}

function isTypeScriptFilePath(filePath) {
  return TYPESCRIPT_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function directoryContainsTypeScript(dirPath) {
  let entries;

  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return false;
  }

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!SKIPPED_SCAN_DIRECTORIES.has(entry.name) && directoryContainsTypeScript(entryPath)) {
        return true;
      }

      continue;
    }

    if (entry.isFile() && isTypeScriptFilePath(entryPath)) {
      return true;
    }
  }

  return false;
}

function targetContainsTypeScript(target, cwd) {
  if (target.startsWith('-')) {
    return false;
  }

  const targetPath = path.resolve(cwd, target);

  if (!fs.existsSync(targetPath)) {
    return /\.(ts|tsx)$/u.test(target);
  }

  const targetStat = fs.statSync(targetPath);

  if (targetStat.isDirectory()) {
    return directoryContainsTypeScript(targetPath);
  }

  return targetStat.isFile() && isTypeScriptFilePath(targetPath);
}

function assertFallbackTypeScriptReady(targets) {
  const cwd = process.cwd();

  if (hasConsumerEslintConfig(cwd) || hasConsumerTsconfig(cwd)) {
    return;
  }

  if (!targets.some((target) => targetContainsTypeScript(target, cwd))) {
    return;
  }

  throw new Error(
    [
      `${PACKAGE_NAME}: type-aware TypeScript linting requires a tsconfig.json in the consumer project root.`,
      'Create a project tsconfig.json, lint JavaScript-only targets, or add a local eslint.config.* to control parserOptions yourself.',
    ].join('\n'),
  );
}

function getEslintConfigArgs(cwd, fallbackConfigPath) {
  return hasConsumerEslintConfig(cwd) ? [] : ['--config', fallbackConfigPath];
}

function lint(args) {
  const targets = getTargets(args, DEFAULT_LINT_TARGETS);

  assertFallbackTypeScriptReady(targets);
  process.exitCode = runEslint([
    ...targets,
    ...getEslintConfigArgs(process.cwd(), PACKAGE_DEFAULT_ESLINT_CONFIG),
    ...ESLINT_ARGS,
  ]);
}

function format(args) {
  const [maybeCheck, ...rest] = args;
  const isCheck = maybeCheck === '--check';
  const targets = isCheck ? getTargets(rest, DEFAULT_FORMAT_TARGETS) : getTargets(args, DEFAULT_FORMAT_TARGETS);
  const prettierMode = isCheck ? '--check' : '--write';

  process.exitCode = runPrettier([...PRETTIER_ARGS, prettierMode, ...targets]);
}

function fix(args) {
  const targets = getTargets(args, DEFAULT_LINT_TARGETS);
  const prettierTargets = args.length > 0 ? targets : DEFAULT_FORMAT_TARGETS;

  assertFallbackTypeScriptReady(targets);

  const eslintStatus = runEslint([
    ...targets,
    ...getEslintConfigArgs(process.cwd(), PACKAGE_FIX_ESLINT_CONFIG),
    ...ESLINT_ARGS,
    '--fix',
  ]);

  if (eslintStatus !== 0) {
    process.exitCode = eslintStatus;
    return;
  }

  process.exitCode = runPrettier([...PRETTIER_ARGS, '--write', ...prettierTargets]);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getEol(content) {
  return content.includes('\r\n') ? '\r\n' : '\n';
}

function assertGitProject(cwd) {
  if (!fs.existsSync(path.join(cwd, '.git'))) {
    throw new Error(`Cannot manage Husky hooks: ${cwd} is not a Git project.`);
  }
}

function configureHuskyHookPath(cwd) {
  const result = spawnSync('git', ['config', 'core.hooksPath', '.husky'], {
    cwd,
    stdio: 'pipe',
    encoding: 'utf8',
  });

  if (result.error) {
    throw new Error(`Cannot configure Husky hooks: ${result.error.message}`);
  }

  if ((result.status ?? 1) !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    const details = output ? ` ${output}` : '';

    throw new Error(`Cannot configure Husky hooks with git config.${details}`);
  }
}

function getHookPath(cwd) {
  return path.join(cwd, '.husky', 'pre-commit');
}

function createManagedBlock(cwd, eol) {
  return [BEGIN_MARKER, createHookCommand(cwd), END_MARKER].join(eol);
}

function removeManagedBlock(content) {
  const pattern = new RegExp(
    `(?:\\r?\\n){0,2}${escapeRegExp(BEGIN_MARKER)}[\\s\\S]*?${escapeRegExp(END_MARKER)}(?:\\r?\\n){0,2}`,
    'g',
  );

  return content.replace(pattern, '\n').trimEnd();
}

function writeHook(hookPath, content) {
  fs.mkdirSync(path.dirname(hookPath), { recursive: true });
  fs.writeFileSync(hookPath, content, 'utf8');

  try {
    fs.chmodSync(hookPath, 0o755);
  } catch {
    // chmod can fail on Windows; Husky still reads the hook file.
  }
}

function enableHusky(cwd) {
  assertGitProject(cwd);
  configureHuskyHookPath(cwd);

  const hookPath = getHookPath(cwd);
  const existing = fs.existsSync(hookPath) ? fs.readFileSync(hookPath, 'utf8') : '';
  const eol = getEol(existing);
  const userContent = removeManagedBlock(existing);
  const managedBlock = createManagedBlock(cwd, eol);
  const nextContent = userContent ? `${userContent}${eol}${eol}${managedBlock}${eol}` : `${managedBlock}${eol}`;

  writeHook(hookPath, nextContent);
  console.log(`${PACKAGE_NAME}: managed Husky pre-commit hook enabled at ${hookPath}`);
}

function disableHusky(cwd) {
  assertGitProject(cwd);

  const hookPath = getHookPath(cwd);

  if (!fs.existsSync(hookPath)) {
    console.log(`${PACKAGE_NAME}: no pre-commit hook found at ${hookPath}`);
    return;
  }

  const existing = fs.readFileSync(hookPath, 'utf8');
  const eol = getEol(existing);
  const nextContent = removeManagedBlock(existing);

  writeHook(hookPath, nextContent ? `${nextContent}${eol}` : '');
  console.log(`${PACKAGE_NAME}: managed Husky pre-commit hook disabled at ${hookPath}`);
}

function run(argv) {
  const [command, subcommand, ...rest] = argv;

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'format') {
    format([subcommand, ...rest].filter(Boolean));
    return;
  }

  if (command === 'lint') {
    lint([subcommand, ...rest].filter(Boolean));
    return;
  }

  if (command === 'fix') {
    fix([subcommand, ...rest].filter(Boolean));
    return;
  }

  if (command === 'init' && ((!subcommand && rest.length === 0) || (subcommand === '--husky' && rest.length === 0))) {
    enableHusky(process.cwd());
    return;
  }

  if (command === 'husky' && subcommand === 'enable' && rest.length === 0) {
    enableHusky(process.cwd());
    return;
  }

  if (command === 'husky' && subcommand === 'disable' && rest.length === 0) {
    disableHusky(process.cwd());
    return;
  }

  printHelp();
  process.exitCode = 1;
}

try {
  run(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
