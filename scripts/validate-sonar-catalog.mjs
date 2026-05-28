import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { sonarCommonRules, sonarTypeCheckedRules } from '../configs/rules/sonar.generated.mjs';

import {
  buildPublicProfileRuleIds,
  getCoveredProfiles,
  isReactOnlyExternalRuleId,
  PUBLIC_PROFILE_ORDER,
} from './sonar-profile-coverage.mjs';
import { loadSonarSource } from './sonar-source.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const generatedCatalogPath = path.join(rootDir, 'configs', 'sonar-catalog.generated.json');

const generatedCatalog = JSON.parse(await fs.readFile(generatedCatalogPath, 'utf8'));
const { sourceKind, sourceRules } = await loadSonarSource(rootDir);
const generatedRules = generatedCatalog.rules ?? [];
const publicProfileRuleIds = buildPublicProfileRuleIds(sonarCommonRules, sonarTypeCheckedRules);

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
assertProfileSemantics(publicProfileRuleIds);

for (const rule of generatedRules) {
  assert(Array.isArray(rule.coveredByProfiles ?? []), `${rule.key} has invalid coveredByProfiles`);
  assert(
    (rule.coveredByProfiles ?? []).every((profileName) => PUBLIC_PROFILE_ORDER.includes(profileName)),
    `${rule.key} references unknown public profile coverage`,
  );

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
    assert(rule.coveredByProfiles.includes('sonar'), `${rule.key} SonarJS rule is not covered by sonar`);
    assert(rule.coveredByProfiles.includes('react-sonar'), `${rule.key} SonarJS rule is not covered by react-sonar`);
  }

  const expectedCoveredByProfiles = getCoveredProfiles(rule, publicProfileRuleIds);

  assert(
    JSON.stringify(rule.coveredByProfiles ?? []) === JSON.stringify(expectedCoveredByProfiles),
    `${rule.key} has mismatched coveredByProfiles: ${JSON.stringify({
      actual: rule.coveredByProfiles ?? [],
      expected: expectedCoveredByProfiles,
    })}`,
  );

  if (rule.integrationStatus === 'external-eslint') {
    assert(
      expectedCoveredByProfiles.length > 0,
      `${rule.key} is external-eslint but not covered by any public profile`,
    );
    assert(
      rule.coveredByProfiles.length > 0,
      `${rule.key} is external-eslint but has empty coveredByProfiles metadata`,
    );

    if (isReactOnlyExternalRuleId(rule.eslintRuleId)) {
      assert(
        !rule.coveredByProfiles.some((profileName) => ['base', 'strict', 'sonar'].includes(profileName)),
        `${rule.key} is React-only external rule ${rule.eslintRuleId} but claims non-React profile coverage`,
      );
    }

    if (rule.coveredByProfiles.includes('sonar')) {
      assert(
        rule.coveredByProfiles.includes('base'),
        `${rule.key} claims plain sonar external coverage without base coverage`,
      );
    }

    if (rule.coveredByProfiles.includes('react')) {
      assert(
        rule.coveredByProfiles.includes('react-sonar'),
        `${rule.key} claims react external coverage without react-sonar coverage`,
      );
    }
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

function assertProfileSemantics(profileRuleIds) {
  assert(isSubset(profileRuleIds.base, profileRuleIds.sonar), 'sonar profile must include every base profile rule');
  assert(
    isSubset(profileRuleIds.react, profileRuleIds['react-sonar']),
    'react-sonar profile must include every react profile rule',
  );
  assert(
    !setsEqual(profileRuleIds.sonar, profileRuleIds['react-sonar']),
    'sonar and react-sonar profiles must remain semantically distinct',
  );

  for (const ruleId of executableRuleIds) {
    assert(profileRuleIds.sonar.has(ruleId), `sonar profile is missing executable SonarJS rule ${ruleId}`);
    assert(
      profileRuleIds['react-sonar'].has(ruleId),
      `react-sonar profile is missing executable SonarJS rule ${ruleId}`,
    );
  }
}

function isSubset(left, right) {
  return [...left].every((value) => right.has(value));
}

function setsEqual(left, right) {
  return left.size === right.size && isSubset(left, right);
}

function countBy(items, field) {
  return items.reduce((counts, item) => {
    const key = item[field] ?? '<missing>';
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
