#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const PACKAGE_NAME = '@ytdev/linter';
const PACKAGE_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PACKAGE_ESLINT_CONFIG = path.join(PACKAGE_ROOT, 'eslint.config.mjs');
const BEGIN_MARKER = '# @ytdev/linter begin';
const END_MARKER = '# @ytdev/linter end';
const HOOK_COMMAND = 'npx --no-install ytdev-linter lint';
const require = createRequire(import.meta.url);
const DEFAULT_TARGETS = ['.'];
const ESLINT_ARGS = ['--ext', '.js,.mjs,.ts,.tsx', '--report-unused-disable-directives'];
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
  ytdev-linter init --husky
  ytdev-linter husky enable
  ytdev-linter husky disable

Commands:
  lint             Run ESLint for the provided paths, or "." by default.
  format           Run Prettier write for the provided paths, or "." by default.
  format --check   Run Prettier check for the provided paths, or "." by default.
  fix              Run ESLint autofix for the default non-Sonar config, then Prettier write.
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

function getTargets(args) {
  return args.length > 0 ? args : DEFAULT_TARGETS;
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

function getEslintConfigArgs(cwd) {
  return hasConsumerEslintConfig(cwd) ? [] : ['--config', PACKAGE_ESLINT_CONFIG];
}

function lint(args) {
  const targets = getTargets(args);

  assertFallbackTypeScriptReady(targets);
  process.exitCode = runEslint([...targets, ...getEslintConfigArgs(process.cwd()), ...ESLINT_ARGS]);
}

function format(args) {
  const [maybeCheck, ...rest] = args;
  const isCheck = maybeCheck === '--check';
  const targets = isCheck ? getTargets(rest) : getTargets(args);
  const prettierMode = isCheck ? '--check' : '--write';

  process.exitCode = runPrettier([prettierMode, ...targets]);
}

function fix(args) {
  const targets = getTargets(args);

  assertFallbackTypeScriptReady(targets);

  const eslintStatus = runEslint([...targets, ...getEslintConfigArgs(process.cwd()), ...ESLINT_ARGS, '--fix']);

  if (eslintStatus !== 0) {
    process.exitCode = eslintStatus;
    return;
  }

  process.exitCode = runPrettier(['--write', ...targets]);
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

function getHookPath(cwd) {
  return path.join(cwd, '.husky', 'pre-commit');
}

function createManagedBlock(eol) {
  return [BEGIN_MARKER, HOOK_COMMAND, END_MARKER].join(eol);
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

  const hookPath = getHookPath(cwd);
  const existing = fs.existsSync(hookPath) ? fs.readFileSync(hookPath, 'utf8') : '';
  const eol = getEol(existing);
  const userContent = removeManagedBlock(existing);
  const managedBlock = createManagedBlock(eol);
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

  if (command === 'init' && subcommand === '--husky' && rest.length === 0) {
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
