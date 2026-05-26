# SonarQube Rules Integration Roadmap

## Goal

Integrate every rule from `sonarqube-frontend-rules.json` without duplicate lint execution:

- keep a compact generated catalog for all 1095 SonarQube source rules;
- execute only rules that have a reliable ESLint implementation;
- record unsupported CSS, HTML/Web, deprecated, and unmapped JS/TS rules as metadata coverage gaps;
- keep the existing base, React, and strict profiles semantically unchanged.

## Checklist

- [x] Confirm the raw catalog shape and counts.
- [x] Add `eslint-plugin-sonarjs` as the executable SonarJS rule source.
- [x] Add generator and validator scripts.
- [x] Generate compact SonarQube catalog metadata.
- [x] Generate deduplicated executable SonarJS rule profile.
- [x] Add `sonar` and `react-sonar` public ESLint profiles.
- [x] Document metadata coverage vs executable coverage.
- [x] Run generator, validator, import smoke checks, lint, prettier, and pack verification.

## Integration Policy

- `sonarqube-frontend-rules.json` is the preferred raw source artifact when it is present.
- `configs/sonar-catalog.generated.json` is the fallback source of truth when the raw export is absent.
- `configs/sonar-catalog.generated.json` is the compact runtime/documentation catalog.
- `configs/rules/sonar.generated.mjs` is the executable ESLint rule map.
- Sonar coverage is tracked at two levels: package-level integration status and profile-level execution via `coveredByProfiles`.
- `status: DEPRECATED` rules stay in the catalog but are never enabled.
- CSS and HTML/Web rules stay metadata-only until this package has a supported analyzer path for them.
- JS/TS rules are enabled only when `eslint-plugin-sonarjs` exposes the matching RSPEC rule.
- Rules already covered by the existing base/React/TypeScript configs are recorded as `external-eslint` coverage instead of being enabled twice, with the exact public profiles recorded in `coveredByProfiles`.

## Verification

- `npm run generate:sonar`
- `npm run validate:sonar`
- `node -e "import('./configs/sonar.mjs')"`
- `node -e "import('./configs/react-sonar.mjs')"`
- `node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('configs/sonar-catalog.generated.json','utf8')); console.log('ok')"`
- `npx eslint . --ext .js,.mjs,.ts,.tsx --report-unused-disable-directives`
- `npx prettier --check .`
- `npm pack --dry-run`
