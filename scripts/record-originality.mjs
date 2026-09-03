import { basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
import { outputPath, workshopAssets } from './media-catalog.mjs';
import { differenceHash, sha256File } from './originality-lib.mjs';

const manifestPath = 'docs/media/epic-signal-workshop-originality.json';
const notPerformed = 'not-performed-user-opt-out';

export const recordedReverseSearchById = new Map([
  ['epic-hero-connected-workshop', {
    googleLens: 'no-material-match',
    bingVisualSearch: notPerformed
  }],
  ['epic-service-network-wifi', {
    googleLens: 'no-material-match',
    bingVisualSearch: notPerformed
  }]
]);

export function parseReviewArguments(argumentsList) {
  const values = new Map();
  for (let index = 0; index < argumentsList.length; index += 2) {
    const key = argumentsList[index];
    const value = argumentsList[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error('Review arguments must be supplied as --name value pairs');
    }
    values.set(key, value);
  }

  const expected = [
    ['--visual', 'approved'],
    ['--reverse-search', 'partial-user-opt-out'],
    ['--trade-dress', 'clear']
  ];
  for (const [key, requiredValue] of expected) {
    if (values.get(key) !== requiredValue) {
      throw new Error(key + ' must be ' + requiredValue);
    }
  }
  if (values.size !== expected.length) {
    throw new Error('Only --visual, --reverse-search, and --trade-dress are accepted');
  }

  return {
    visual: values.get('--visual'),
    reverseSearch: values.get('--reverse-search'),
    tradeDress: values.get('--trade-dress')
  };
}

export async function buildOriginalityManifest(assets, options = {}) {
  const normalizedOptions = options instanceof Map
    ? { publicDerivativesById: options }
    : options;
  const publicDerivativesById = normalizedOptions.publicDerivativesById ?? new Map();
  const reverseSearchById = normalizedOptions.reverseSearchById ?? new Map();

  return {
    schemaVersion: 1,
    generationMethod: 'documented-original-workflow',
    assets: await Promise.all(assets.map(async (asset) => ({
      id: asset.id,
      privateMasterName: basename(asset.master),
      sourceSha256: await sha256File(asset.master),
      differenceHash: (await differenceHash(asset.master)).toString(16).padStart(16, '0'),
      publicDerivatives: publicDerivativesById.get(asset.id) ?? [],
      review: {
        noVendorMarks: true,
        noReadableTextOrUi: true,
        noForbiddenCliches: true,
        noAppleTradeDress: true,
        appleComparison: 'homepage-clear',
        reverseImageSearch: reverseSearchById.get(asset.id) ?? {
          googleLens: notPerformed,
          bingVisualSearch: notPerformed
        },
        humanDecision: 'approved-local-originality-gates'
      }
    })))
  };
}

export async function buildPublicDerivativesById(assets) {
  const publicDerivativesById = new Map();
  for (const asset of assets) {
    const derivatives = [];
    for (const width of asset.widths) {
      for (const format of asset.formats) {
        const path = outputPath(asset.outputBase, width, format);
        derivatives.push({
          path,
          width,
          format,
          sha256: await sha256File(path)
        });
      }
    }
    publicDerivativesById.set(asset.id, derivatives);
  }
  return publicDerivativesById;
}

async function main() {
  parseReviewArguments(process.argv.slice(2));
  const manifest = await buildOriginalityManifest(workshopAssets, {
    publicDerivativesById: await buildPublicDerivativesById(workshopAssets),
    reverseSearchById: recordedReverseSearchById
  });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(
    'Recorded local originality gates for ' + manifest.assets.length
      + ' private masters with partial external-review evidence.'
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
