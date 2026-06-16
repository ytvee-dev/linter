const PUBLIC_PROFILES = ['base', 'react', 'strict', 'sonar', 'react-sonar', 'strict-react'];

function normalizeRuleValue(value) {
  return JSON.stringify(value);
}

function getConfigName(profileName, config, index) {
  return config.name || `${profileName}[${index}]`;
}

function getFileScope(config) {
  if (!config.files) {
    return { type: 'all' };
  }

  const files = Array.isArray(config.files) ? config.files : [config.files];
  const extensions = new Set();

  for (const pattern of files) {
    if (typeof pattern !== 'string') {
      return { type: 'unknown' };
    }

    const braceMatch = pattern.match(/\{([^}]+)\}/);

    if (braceMatch) {
      for (const extension of braceMatch[1].split(',')) {
        extensions.add(extension.replace(/^\./, ''));
      }

      continue;
    }

    const extensionMatches = pattern.matchAll(/\.([cm]?[jt]sx?)/g);

    for (const match of extensionMatches) {
      extensions.add(match[1]);
    }
  }

  return extensions.size > 0 ? { type: 'extensions', extensions } : { type: 'unknown' };
}

function scopesOverlap(left, right) {
  if (left.type === 'all' || right.type === 'all') {
    return true;
  }

  if (left.type === 'unknown' || right.type === 'unknown') {
    return true;
  }

  return [...left.extensions].some((extension) => right.extensions.has(extension));
}

function sourceSet(entries) {
  return new Set(entries.map((entry) => entry.source));
}

function hasSource(entries, source) {
  return sourceSet(entries).has(source);
}

function getDuplicateRationale(profileName, ruleId, entries) {
  if (hasSource(entries, 'eslint-config-prettier')) {
    return 'eslint-config-prettier is the final conflict suppressor for formatting-related rules.';
  }

  if (
    ruleId === 'no-dupe-class-members' &&
    hasSource(entries, '@eslint/js/recommended') &&
    hasSource(entries, '@ytvee/linter/best-practices')
  ) {
    return 'The local profile intentionally disables the core duplicate class member rule.';
  }

  if (hasSource(entries, '@eslint/js/recommended') && hasSource(entries, 'typescript-eslint/eslint-recommended')) {
    return 'typescript-eslint/eslint-recommended intentionally adjusts core rules for TypeScript files.';
  }

  if (
    hasSource(entries, '@eslint/js/recommended') &&
    hasSource(entries, 'typescript-eslint/recommended-type-checked')
  ) {
    return 'typescript-eslint/recommended-type-checked intentionally adjusts core rules for TypeScript files.';
  }

  if (
    ['@typescript-eslint/no-explicit-any', '@typescript-eslint/no-unused-vars'].includes(ruleId) &&
    hasSource(entries, 'typescript-eslint/recommended-type-checked') &&
    hasSource(entries, '@ytvee/linter/typescript')
  ) {
    return 'The local TypeScript profile intentionally overrides recommendedTypeChecked semantics.';
  }

  if (
    ['strict', 'strict-react'].includes(profileName) &&
    ruleId === '@typescript-eslint/no-explicit-any' &&
    hasSource(entries, '@ytvee/linter/strict')
  ) {
    return 'The strict profile intentionally re-enables no-explicit-any after base disables it.';
  }

  if (
    ['strict', 'strict-react'].includes(profileName) &&
    ruleId === 'no-restricted-syntax' &&
    hasSource(entries, '@ytvee/linter/javascript') &&
    hasSource(entries, '@ytvee/linter/one-module')
  ) {
    return 'The strict profile extends base Symbol/BigInt restrictions with the one-module TypeScript selector.';
  }

  return null;
}

function getOverlappingEntries(entries) {
  const overlappingIndexes = new Set();

  for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
      if (scopesOverlap(entries[leftIndex].scope, entries[rightIndex].scope)) {
        overlappingIndexes.add(leftIndex);
        overlappingIndexes.add(rightIndex);
      }
    }
  }

  return [...overlappingIndexes].map((index) => entries[index]);
}

async function getProfileRules(profileName) {
  const profile = await import(`../configs/${profileName}.mjs`);
  const configs = Array.isArray(profile.default) ? profile.default : [profile.default];
  const rules = new Map();

  configs.forEach((config, index) => {
    if (!config?.rules) {
      return;
    }

    const source = getConfigName(profileName, config, index);
    const scope = getFileScope(config);

    for (const [ruleId, value] of Object.entries(config.rules)) {
      if (!rules.has(ruleId)) {
        rules.set(ruleId, []);
      }

      rules.get(ruleId).push({
        index,
        source,
        scope,
        value,
        normalizedValue: normalizeRuleValue(value),
      });
    }
  });

  return rules;
}

function formatEntry(entry) {
  const scope = entry.scope.type === 'extensions' ? [...entry.scope.extensions].sort().join(',') : entry.scope.type;

  return `    ${entry.index}: ${entry.source} [${scope}] ${entry.normalizedValue}`;
}

async function run() {
  let failureCount = 0;
  let allowedCount = 0;

  for (const profileName of PUBLIC_PROFILES) {
    const rules = await getProfileRules(profileName);

    for (const [ruleId, entries] of rules.entries()) {
      const overlappingEntries = getOverlappingEntries(entries);

      if (overlappingEntries.length < 2) {
        continue;
      }

      const rationale = getDuplicateRationale(profileName, ruleId, overlappingEntries);
      const distinctValues = new Set(overlappingEntries.map((entry) => entry.normalizedValue));

      if (rationale) {
        allowedCount += 1;
        console.log(`ALLOW ${profileName} ${ruleId}: ${rationale}`);
        for (const entry of overlappingEntries) {
          console.log(formatEntry(entry));
        }
        continue;
      }

      failureCount += 1;
      const duplicateKind = distinctValues.size === 1 ? 'identical' : 'distinct';
      console.error(`FAIL ${profileName} ${ruleId}: ${duplicateKind} overlapping duplicate without allowlist.`);
      for (const entry of overlappingEntries) {
        console.error(formatEntry(entry));
      }
    }
  }

  if (failureCount > 0) {
    console.error(`Rule duplicate audit failed: ${failureCount} unintended duplicate(s).`);
    process.exitCode = 1;
    return;
  }

  console.log(`Rule duplicate audit passed: ${allowedCount} intentional duplicate(s) allowlisted.`);
}

await run();
