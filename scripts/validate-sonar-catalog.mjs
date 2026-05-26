import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { sonarCommonRules, sonarTypeCheckedRules } from '../configs/rules/sonar.generated.mjs';

import { loadSonarSource } from './sonar-source.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const generatedCatalogPath = path.join(rootDir, 'configs', 'sonar-catalog.generated.json');

const generatedCatalog = JSON.parse(await fs.readFile(generatedCatalogPath, 'utf8'));
const { sourceKind, sourceRules } = await loadSonarSource(rootDir);
const generatedRules = generatedCatalog.rules ?? [];

assert(sourceRules.length === 1095, `Expected 1095 source rules, received ${sourceRules.length}`);
assert(generatedRules.length === sourceRules.length, 'Generated catalog does not cover every raw rule');
assertNoDuplicates(
  sourceRules.map((rule) => rule.key),
  'SonarQube source rule key',
);
assertNoDuplicates(
  generatedRules.map((rule) => rule.key),
  'generated SonarQube rule key',
);

assertSameCounts(sourceRules, generatedRules, 'status');
assertSameCounts(sourceRules, generatedRules, 'severity');
assertSameCounts(sourceRules, generatedRules, 'type');
assertSameCounts(sourceRules, generatedRules, 'scope');

const executableRuleIds = [...Object.keys(sonarCommonRules), ...Object.keys(sonarTypeCheckedRules)];
assertNoDuplicates(executableRuleIds, 'executable ESLint rule id');

for (const rule of generatedRules) {
  if (rule.status === 'DEPRECATED') {
    assert(rule.integrationStatus === 'deprecated', `${rule.key} is deprecated but not marked deprecated`);
    assert(!rule.enabledByDefault, `${rule.key} is deprecated but enabled`);
  }

  if (rule.lang === 'css' || rule.lang === 'web') {
    assert(
      rule.integrationStatus === 'metadata-only' || rule.integrationStatus === 'deprecated',
      `${rule.key} is ${rule.lang} but marked ${rule.integrationStatus}`,
    );
  }

  if (rule.integrationStatus === 'sonarjs') {
    assert(rule.eslintRuleId?.startsWith('sonarjs/'), `${rule.key} has invalid SonarJS rule id`);
    assert(executableRuleIds.includes(rule.eslintRuleId), `${rule.key} is not in executable rules`);
  }
}

console.log(
  JSON.stringify(
    {
      sourceKind,
      rawRules: sourceRules.length,
      generatedRules: generatedRules.length,
      executableRules: executableRuleIds.length,
      byIntegrationStatus: generatedCatalog.summary.byIntegrationStatus,
    },
    null,
    2,
  ),
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNoDuplicates(values, label) {
  const seen = new Set();

  for (const value of values) {
    assert(!seen.has(value), `Duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

function assertSameCounts(sourceRules, generatedRules, field) {
  const sourceCounts = countBy(sourceRules, field);
  const generatedCounts = countBy(generatedRules, field);

  assert(
    JSON.stringify(sourceCounts) === JSON.stringify(generatedCounts),
    `Mismatched ${field} counts: ${JSON.stringify({ sourceCounts, generatedCounts })}`,
  );
}

function countBy(items, field) {
  return items.reduce((counts, item) => {
    const key = item[field] ?? '<missing>';
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
