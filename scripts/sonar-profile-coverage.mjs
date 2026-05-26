import base from '../configs/base.mjs';
import react from '../configs/react.mjs';
import strict from '../configs/strict.mjs';

export const PUBLIC_PROFILE_ORDER = ['base', 'react', 'strict', 'sonar', 'react-sonar'];

export function buildPublicProfileRuleIds(sonarCommonRules = {}, sonarTypeCheckedRules = {}) {
  const sonarRuleConfigs = [{ rules: sonarCommonRules }, { rules: sonarTypeCheckedRules }];

  return {
    base: collectEnabledRuleIds(base),
    react: collectEnabledRuleIds(react),
    strict: collectEnabledRuleIds(strict),
    sonar: collectEnabledRuleIds([...base, ...sonarRuleConfigs]),
    'react-sonar': collectEnabledRuleIds([...react, ...sonarRuleConfigs]),
  };
}

export function getCoveredProfiles(rule, profileRuleIds) {
  if (!rule.eslintRuleId || rule.status === 'DEPRECATED') {
    return [];
  }

  return PUBLIC_PROFILE_ORDER.filter((profileName) => profileRuleIds[profileName]?.has(rule.eslintRuleId));
}

function collectEnabledRuleIds(configs) {
  const ruleIds = new Set();

  for (const config of configs) {
    for (const [ruleId, setting] of Object.entries(config.rules ?? {})) {
      if (isEnabledRuleSetting(setting)) {
        ruleIds.add(ruleId);
      }
    }
  }

  return ruleIds;
}

function isEnabledRuleSetting(setting) {
  if (Array.isArray(setting)) {
    return setting[0] !== 'off' && setting[0] !== 0;
  }

  return setting !== 'off' && setting !== 0;
}
