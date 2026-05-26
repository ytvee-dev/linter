import fs from 'node:fs/promises';
import path from 'node:path';

const RAW_SONAR_SOURCE = 'sonarqube-frontend-rules.json';
const GENERATED_SONAR_SOURCE = path.join('configs', 'sonar-catalog.generated.json');

export async function loadSonarSource(rootDir) {
  const rawCatalogPath = path.join(rootDir, RAW_SONAR_SOURCE);
  const generatedCatalogPath = path.join(rootDir, GENERATED_SONAR_SOURCE);
  const rawCatalog = await readJsonIfExists(rawCatalogPath);

  if (rawCatalog) {
    return {
      sourceKind: 'raw-catalog',
      sourcePath: rawCatalogPath,
      sourceMeta: {
        exportedAt: rawCatalog.exportedAt ?? null,
        source: rawCatalog.source ?? null,
        note: rawCatalog.note ?? null,
      },
      sourceRules: Object.entries(rawCatalog.languages ?? {}).flatMap(([bucket, language]) =>
        (language.rules ?? []).map((rule) => ({
          ...rule,
          bucket,
        })),
      ),
    };
  }

  const generatedCatalog = await readJsonIfExists(generatedCatalogPath);

  if (!generatedCatalog) {
    throw new Error(
      `Unable to load Sonar source data. Neither ${RAW_SONAR_SOURCE} nor ${GENERATED_SONAR_SOURCE} exists.`,
    );
  }

  return {
    sourceKind: 'generated-catalog',
    sourcePath: generatedCatalogPath,
    sourceMeta: {
      exportedAt: generatedCatalog.source?.exportedAt ?? null,
      source: generatedCatalog.source?.source ?? null,
      note: generatedCatalog.source?.note ?? null,
    },
    sourceRules: (generatedCatalog.rules ?? []).map((rule) => ({
      ...rule,
      params: rule.params ?? [],
      impacts: rule.impacts ?? [],
      descriptionSections: [],
    })),
  };
}

export function createGeneratedSourceMetadata(sourceKind, sourcePath, sourceMeta, rootDir) {
  const relativeSourcePath = path.relative(rootDir, sourcePath).replaceAll('\\', '/');

  return {
    artifact: sourceKind,
    path: relativeSourcePath,
    exportedAt: sourceMeta.exportedAt ?? null,
    source: sourceMeta.source ?? null,
    note:
      sourceKind === 'raw-catalog'
        ? (sourceMeta.note ?? null)
        : 'Generated catalog is acting as the Sonar source of truth because the raw export is unavailable.',
  };
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}
