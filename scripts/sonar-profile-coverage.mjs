import base from '../configs/base.mjs';
import react from '../configs/react.mjs';
import strict from '../configs/strict.mjs';

export const PUBLIC_PROFILE_ORDER = ['base', 'react', 'strict', 'sonar', 'react-sonar'];
export const REACT_ONLY_EXTERNAL_RULE_PREFIXES = ['react/', 'react-hooks/', 'jsx-a11y/'];

export function buildPublicProfileRuleIds(sonarCommonRules = {}, sonarTypeCheckedRules = {}) {
  const sonarRuleConfigs = [{ rules: sonarCommonRules }, { rules: sonarTypeCheckedRules }];
  const profileConfigs = {
    base,
    react,
    strict,
    sonar: [...base, ...sonarRuleConfigs],
    'react-sonar': [...react, ...sonarRuleConfigs],
  };

  return {
    base: collectEnabledRuleIds(profileConfigs.base),
    react: collectEnabledRuleIds(profileConfigs.react),
    strict: collectEnabledRuleIds(profileConfigs.strict),
    sonar: collectEnabledRuleIds(profileConfigs.sonar),
    'react-sonar': collectEnabledRuleIds(profileConfigs['react-sonar']),
  };
}

export function getCoveredProfiles(rule, profileRuleIds) {
  if (!rule.eslintRuleId || rule.status === 'DEPRECATED') {
    return [];
  }

  return PUBLIC_PROFILE_ORDER.filter((profileName) => profileRuleIds[profileName]?.has(rule.eslintRuleId));
}

export function isReactOnlyExternalRuleId(ruleId) {
  return REACT_ONLY_EXTERNAL_RULE_PREFIXES.some((prefix) => ruleId?.startsWith(prefix));
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
