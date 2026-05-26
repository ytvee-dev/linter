import sonarjs from 'eslint-plugin-sonarjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

import pluginJs from '@eslint/js';

import { bestPracticesRule } from '../configs/rules/best-practices.rule.mjs';
import { importRule } from '../configs/rules/import.rule.mjs';
import { importsRule } from '../configs/rules/import-sort.rule.mjs';
import { javascriptRule } from '../configs/rules/javascript.rule.mjs';
import { oneModuleRule } from '../configs/rules/one-module.rule.mjs';
import { reactRule } from '../configs/rules/react.rule.mjs';
import { typescriptRule } from '../configs/rules/typescript.rule.mjs';

import { buildPublicProfileRuleIds, getCoveredProfiles } from './sonar-profile-coverage.mjs';
import { createGeneratedSourceMetadata, loadSonarSource } from './sonar-source.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const generatedCatalogPath = path.join(rootDir, 'configs', 'sonar-catalog.generated.json');
const generatedRulesPath = path.join(rootDir, 'configs', 'rules', 'sonar.generated.mjs');

const existingRuleConfigs = [
  pluginJs.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  bestPracticesRule,
  importRule,
  importsRule,
  javascriptRule,
  oneModuleRule,
  reactRule,
  typescriptRule,
];

const existingEnabledRuleIds = new Set();

for (const config of existingRuleConfigs) {
  for (const [ruleId, setting] of Object.entries(config.rules ?? {})) {
    if (isEnabledRuleSetting(setting)) {
      existingEnabledRuleIds.add(ruleId);
    }
  }
}

const sonarPlugin = sonarjs.default ?? sonarjs;
const sonarRuleByRspec = new Map();

for (const [ruleName, rule] of Object.entries(sonarPlugin.rules ?? {})) {
  const rspecKey = rule.meta?.docs?.url?.match(/rspec\/(S\d+)\//u)?.[1];

  if (!rspecKey) {
    continue;
  }

  sonarRuleByRspec.set(rspecKey, {
    ruleId: `sonarjs/${ruleName}`,
    fixable: Boolean(rule.meta?.fixable),
    hasSuggestions: Boolean(rule.meta?.hasSuggestions),
    requiresTypeChecking: Boolean(rule.meta?.docs?.requiresTypeChecking),
  });
}

const { sourceKind, sourceMeta, sourcePath, sourceRules } = await loadSonarSource(rootDir);

const seenSourceKeys = new Set();
const cleanRules = [];

for (const sourceRule of sourceRules) {
  if (seenSourceKeys.has(sourceRule.key)) {
    throw new Error(`Duplicate SonarQube rule key: ${sourceRule.key}`);
  }

  seenSourceKeys.add(sourceRule.key);
  cleanRules.push(toCleanRule(sourceRule));
}

const executableRulesById = new Map();

for (const rule of cleanRules) {
  if (rule.integrationStatus !== 'sonarjs' || !rule.eslintRuleId) {
    continue;
  }

  const current = executableRulesById.get(rule.eslintRuleId);

  if (!current) {
    executableRulesById.set(rule.eslintRuleId, {
      severity: sonarSeverityToEslint(rule),
      requiresTypeChecking: rule.requiresTypeChecking,
    });
    continue;
  }

  current.severity = mergeSeverity(current.severity, sonarSeverityToEslint(rule));
  current.requiresTypeChecking = current.requiresTypeChecking || rule.requiresTypeChecking;
}

const commonRules = {};
const typeCheckedRules = {};

for (const [ruleId, rule] of [...executableRulesById.entries()].sort(([left], [right]) => left.localeCompare(right))) {
  if (rule.requiresTypeChecking) {
    typeCheckedRules[ruleId] = rule.severity;
  } else {
    commonRules[ruleId] = rule.severity;
  }
}

const publicProfileRuleIds = buildPublicProfileRuleIds(commonRules, typeCheckedRules);

for (const rule of cleanRules) {
  rule.coveredByProfiles = getCoveredProfiles(rule, publicProfileRuleIds);
}

const generatedCatalog = {
  generatedAt: new Date().toISOString(),
  source: createGeneratedSourceMetadata(sourceKind, sourcePath, sourceMeta, rootDir),
  summary: {
    total: cleanRules.length,
    byLanguage: countBy(cleanRules, 'bucket'),
    byStatus: countBy(cleanRules, 'status'),
    bySeverity: countBy(cleanRules, 'severity'),
    byType: countBy(cleanRules, 'type'),
    byIntegrationStatus: countBy(cleanRules, 'integrationStatus'),
    executableRuleCount: executableRulesById.size,
    executableCommonRuleCount: Object.keys(commonRules).length,
    executableTypeCheckedRuleCount: Object.keys(typeCheckedRules).length,
    externalCoverageByProfile: countCoveredProfiles(cleanRules),
  },
  rules: cleanRules,
};

await fs.writeFile(generatedCatalogPath, `${JSON.stringify(generatedCatalog, null, 2)}\n`);
await fs.writeFile(generatedRulesPath, buildGeneratedRulesModule(commonRules, typeCheckedRules));

console.log(
  JSON.stringify(
    {
      catalog: path.relative(rootDir, generatedCatalogPath),
      rules: path.relative(rootDir, generatedRulesPath),
      summary: generatedCatalog.summary,
    },
    null,
    2,
  ),
);

function toCleanRule(sourceRule) {
  const rspecKey = sourceRule.key.split(':')[1];
  const isDeprecated = sourceRule.status === 'DEPRECATED';
  const isScriptLanguage = sourceRule.lang === 'js' || sourceRule.lang === 'ts';
  const sonarRule = sonarRuleByRspec.get(rspecKey);
  const externalRuleId = isScriptLanguage ? findExternalEslintRuleId(sourceRule) : undefined;

  if (isDeprecated) {
    return createCleanRule(sourceRule, {
      integrationStatus: 'deprecated',
      enabledByDefault: false,
    });
  }

  if (isScriptLanguage && sonarRule) {
    return createCleanRule(sourceRule, {
      eslintRuleId: sonarRule.ruleId,
      eslintSource: 'eslint-plugin-sonarjs',
      enabledByDefault: true,
      fixable: sonarRule.fixable,
      hasSuggestions: sonarRule.hasSuggestions,
      requiresTypeChecking: sonarRule.requiresTypeChecking,
      integrationStatus: 'sonarjs',
    });
  }

  if (isScriptLanguage && externalRuleId) {
    return createCleanRule(sourceRule, {
      eslintRuleId: externalRuleId,
      eslintSource: 'existing-eslint-config',
      enabledByDefault: true,
      integrationStatus: 'external-eslint',
    });
  }

  return createCleanRule(sourceRule, {
    integrationStatus: 'metadata-only',
    enabledByDefault: false,
  });
}

function createCleanRule(sourceRule, integration) {
  return {
    key: sourceRule.key,
    repo: sourceRule.repo,
    name: sourceRule.name,
    severity: sourceRule.severity,
    type: sourceRule.type,
    status: sourceRule.status,
    scope: sourceRule.scope,
    lang: sourceRule.lang,
    bucket: sourceRule.bucket,
    params: normalizeParams(sourceRule.params),
    impacts: sourceRule.impacts ?? [],
    eslintRuleId: integration.eslintRuleId ?? null,
    eslintSource: integration.eslintSource ?? null,
    enabledByDefault: Boolean(integration.enabledByDefault),
    fixable: Boolean(integration.fixable),
    hasSuggestions: Boolean(integration.hasSuggestions),
    requiresTypeChecking: Boolean(integration.requiresTypeChecking),
    integrationStatus: integration.integrationStatus,
  };
}

function normalizeParams(params) {
  return (params ?? []).map((param) => ({
    key: param.key,
    defaultValue: param.defaultValue ?? null,
    type: param.type ?? null,
  }));
}

function findExternalEslintRuleId(sourceRule) {
  const description = JSON.stringify(sourceRule.descriptionSections ?? []);
  const candidates = [
    ...extractRuleIds(description, /eslint\.org\/docs\/(?:latest\/)?rules\/([a-z0-9-]+)/giu, ''),
    ...extractRuleIds(description, /typescript-eslint\.io\/rules\/([a-z0-9-]+)/giu, '@typescript-eslint/'),
    ...extractRuleIds(description, /eslint-plugin-jsx-a11y[^"']*\/rules\/([a-z0-9-]+)\.md/giu, 'jsx-a11y/'),
    ...extractRuleIds(description, /eslint-plugin-react[^"']*\/rules\/([a-z0-9-]+)\.md/giu, 'react/'),
    ...extractRuleIds(description, /eslint-plugin-import[^"']*\/rules\/([a-z0-9-]+)\.md/giu, 'import/'),
  ];
  const fallbackRuleId = sourceRule.eslintSource === 'existing-eslint-config' ? sourceRule.eslintRuleId : undefined;

  return candidates.find((ruleId) => existingEnabledRuleIds.has(ruleId)) ?? findExistingRuleId(fallbackRuleId);
}

function findExistingRuleId(ruleId) {
  if (!ruleId || !existingEnabledRuleIds.has(ruleId)) {
    return undefined;
  }

  return ruleId;
}

function extractRuleIds(text, pattern, prefix) {
  return [...text.matchAll(pattern)].map((match) => `${prefix}${match[1]}`);
}

function isEnabledRuleSetting(setting) {
  if (Array.isArray(setting)) {
    return setting[0] !== 'off' && setting[0] !== 0;
  }

  return setting !== 'off' && setting !== 0;
}

function sonarSeverityToEslint(rule) {
  if (rule.type === 'SECURITY_HOTSPOT') {
    return 'warn';
  }

  if (rule.severity === 'MINOR' || rule.severity === 'INFO') {
    return 'warn';
  }

  return 'error';
}

function mergeSeverity(left, right) {
  return left === 'error' || right === 'error' ? 'error' : 'warn';
}

function countBy(items, field) {
  return items.reduce((counts, item) => {
    const key = item[field] ?? '<missing>';
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function countCoveredProfiles(items) {
  return items
    .filter((item) => item.integrationStatus === 'external-eslint')
    .reduce((counts, item) => {
      for (const profileName of item.coveredByProfiles ?? []) {
        counts[profileName] = (counts[profileName] ?? 0) + 1;
      }

      return counts;
    }, {});
}

function buildGeneratedRulesModule(commonRules, typeCheckedRules) {
  return `import sonarjs from 'eslint-plugin-sonarjs';

const sonarPlugin = sonarjs.default ?? sonarjs;

export const sonarCommonRules = ${serializeRules(commonRules)};

export const sonarTypeCheckedRules = ${serializeRules(typeCheckedRules)};

export const sonarRules = [
  {
    name: '@ytvee-dev/sonarjs/common',
    files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'],
    plugins: {
      sonarjs: sonarPlugin,
    },
    rules: sonarCommonRules,
  },
  {
    name: '@ytvee-dev/sonarjs/type-checked',
    files: ['**/*.{ts,tsx}'],
    rules: sonarTypeCheckedRules,
  },
];
`;
}

function serializeRules(rules) {
  const entries = Object.entries(rules);

  if (entries.length === 0) {
    return '{}';
  }

  const lines = entries.map(([ruleId, severity]) => `  '${ruleId}': '${severity}',`);

  return `{\n${lines.join('\n')}\n}`;
}
