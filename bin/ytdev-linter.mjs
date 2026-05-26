#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const PACKAGE_NAME = '@ytdev/linter';
const BEGIN_MARKER = '# @ytdev/linter begin';
const END_MARKER = '# @ytdev/linter end';
const HOOK_COMMAND = 'npx --no-install eslint . --ext .js,.mjs,.ts,.tsx --report-unused-disable-directives';

const helpText = `
ytdev-linter

Usage:
  ytdev-linter --help
  ytdev-linter init --husky
  ytdev-linter husky enable
  ytdev-linter husky disable

Commands:
  init --husky      Enable the managed pre-commit hook in the current project.
  husky enable     Add or update the managed pre-commit hook block.
  husky disable    Remove only the managed pre-commit hook block.

The Husky commands operate in process.cwd() and never run during package install.
`;

function printHelp() {
  console.log(helpText.trim());
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
