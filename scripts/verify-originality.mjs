import { access, readFile } from 'node:fs/promises';
import { basename, isAbsolute, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { workshopAssets } from './media-catalog.mjs';
import { differenceHash, hammingDistance, sha256File } from './originality-lib.mjs';

const manifestPath = 'docs/media/epic-signal-workshop-originality.json';
const sha256Pattern = /^[0-9a-f]{64}$/;
const differenceHashPattern = /^[0-9a-f]{16}$/;
const externalReviewStates = new Set([
  'no-material-match',
  'not-performed-user-opt-out',
  'performed-result-not-recorded'
]);

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function safePublicPath(path, rootDirectory) {
  requireCondition(typeof path === 'string' && path.length > 0, 'public derivative path is required');
  requireCondition(!isAbsolute(path), 'public derivative path must be relative: ' + path);
  requireCondition(!path.includes('.private-media'), 'public derivative path exposes private media: ' + path);
  const root = resolve(rootDirectory);
  const target = resolve(root, path);
  requireCondition(target.startsWith(root + sep), 'public derivative path escapes the project: ' + path);
  return target;
}

export async function verifyOriginalityManifest(manifest, options = {}) {
  const catalog = options.catalog ?? workshopAssets;
  const rootDirectory = options.rootDirectory ?? '.';

  requireCondition(manifest && manifest.schemaVersion === 1, 'schemaVersion must be 1');
  requireCondition(manifest.generationTool === 'OpenAI ImageGen', 'generationTool must be OpenAI ImageGen');
  requireCondition(Array.isArray(manifest.assets) && manifest.assets.length > 0, 'assets must be a non-empty array');

  if (catalog.length > 0) {
    requireCondition(
      manifest.assets.length === catalog.length,
      'manifest must contain ' + catalog.length + ' reviewed originals'
    );
    for (let index = 0; index < catalog.length; index += 1) {
      requireCondition(
        manifest.assets[index]?.id === catalog[index].id,
        'manifest asset order or id does not match catalog at index ' + index
      );
    }
  }

  const sourceHashes = new Map();
  let minimumPairwiseDistance = null;
  let verifiedPublicDerivatives = 0;
  let googleLensNoMaterialMatches = 0;
  let bingVisualSearchNoMaterialMatches = 0;
  let externalChecksNotPerformed = 0;

  for (const asset of manifest.assets) {
    requireCondition(typeof asset.id === 'string' && asset.id.length > 0, 'asset id is required');
    requireCondition(
      typeof asset.privateMasterName === 'string'
        && basename(asset.privateMasterName) === asset.privateMasterName,
      asset.id + ' privateMasterName must be a basename'
    );
    requireCondition(sha256Pattern.test(asset.sourceSha256), asset.id + ' sourceSha256 is invalid');
    requireCondition(differenceHashPattern.test(asset.differenceHash), asset.id + ' differenceHash is invalid');
    requireCondition(Array.isArray(asset.publicDerivatives), asset.id + ' publicDerivatives must be an array');

    const review = asset.review;
    requireCondition(review?.noVendorMarks === true, asset.id + ' noVendorMarks must be true');
    requireCondition(review.noReadableTextOrUi === true, asset.id + ' noReadableTextOrUi must be true');
    requireCondition(review.noForbiddenCliches === true, asset.id + ' noForbiddenCliches must be true');
    requireCondition(review.noAppleTradeDress === true, asset.id + ' noAppleTradeDress must be true');
    requireCondition(review.appleComparison === 'homepage-clear', asset.id + ' appleComparison must be homepage-clear');
    requireCondition(
      review.reverseImageSearch && typeof review.reverseImageSearch === 'object',
      asset.id + ' reverseImageSearch must name each service state'
    );
    for (const service of ['googleLens', 'bingVisualSearch']) {
      requireCondition(
        externalReviewStates.has(review.reverseImageSearch[service]),
        asset.id + ' ' + service + ' review state is invalid'
      );
      if (review.reverseImageSearch[service] === 'not-performed-user-opt-out') {
        externalChecksNotPerformed += 1;
      }
    }
    if (review.reverseImageSearch.googleLens === 'no-material-match') googleLensNoMaterialMatches += 1;
    if (review.reverseImageSearch.bingVisualSearch === 'no-material-match') bingVisualSearchNoMaterialMatches += 1;
    requireCondition(
      review.humanDecision === 'approved-local-originality-gates',
      asset.id + ' humanDecision must be approved-local-originality-gates'
    );

    const duplicateId = sourceHashes.get(asset.sourceSha256);
    requireCondition(
      duplicateId === undefined,
      'duplicate SHA-256 values for ' + duplicateId + ' and ' + asset.id
    );
    sourceHashes.set(asset.sourceSha256, asset.id);

    for (const derivative of asset.publicDerivatives) {
      requireCondition(sha256Pattern.test(derivative.sha256), asset.id + ' public derivative SHA-256 is invalid');
      const publicPath = safePublicPath(derivative.path, rootDirectory);
      requireCondition(await exists(publicPath), asset.id + ' public derivative is missing: ' + derivative.path);
      requireCondition(
        await sha256File(publicPath) === derivative.sha256,
        asset.id + ' public derivative hash mismatch: ' + derivative.path
      );
      verifiedPublicDerivatives += 1;
    }
  }

  for (let left = 0; left < manifest.assets.length; left += 1) {
    for (let right = left + 1; right < manifest.assets.length; right += 1) {
      const leftAsset = manifest.assets[left];
      const rightAsset = manifest.assets[right];
      const distance = hammingDistance(BigInt('0x' + leftAsset.differenceHash), BigInt('0x' + rightAsset.differenceHash));
      requireCondition(
        distance >= 12,
        leftAsset.id + ' and ' + rightAsset.id + ' have difference-hash distance ' + distance + ', below 12'
      );
      minimumPairwiseDistance = minimumPairwiseDistance === null
        ? distance
        : Math.min(minimumPairwiseDistance, distance);
    }
  }

  let verifiedPrivateMasters = 0;
  const privateMediaPresent = await exists(resolve(rootDirectory, '.private-media'));
  for (const catalogAsset of catalog) {
    const record = manifest.assets.find((asset) => asset.id === catalogAsset.id);
    const privatePath = isAbsolute(catalogAsset.master)
      ? catalogAsset.master
      : resolve(rootDirectory, catalogAsset.master);
    const privateMasterPresent = await exists(privatePath);
    if (privateMediaPresent) {
      requireCondition(privateMasterPresent, catalogAsset.id + ' private master is missing');
    }
    if (!privateMasterPresent) continue;
    requireCondition(await sha256File(privatePath) === record.sourceSha256, catalogAsset.id + ' source SHA-256 mismatch');
    const actualDifferenceHash = (await differenceHash(privatePath)).toString(16).padStart(16, '0');
    requireCondition(actualDifferenceHash === record.differenceHash, catalogAsset.id + ' difference hash mismatch');
    verifiedPrivateMasters += 1;
  }

  return {
    reviewedOriginals: manifest.assets.length,
    minimumPairwiseDistance,
    verifiedPrivateMasters,
    verifiedPublicDerivatives,
    googleLensNoMaterialMatches,
    bingVisualSearchNoMaterialMatches,
    externalChecksNotPerformed
  };
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const result = await verifyOriginalityManifest(manifest);
  console.log(
    'PASS originality: '
      + result.reviewedOriginals + ' reviewed originals; minimum pairwise distance '
      + result.minimumPairwiseDistance + '; '
      + result.verifiedPrivateMasters + ' private masters verified; '
      + result.verifiedPublicDerivatives + ' public derivatives verified; Google Lens no-material-match '
      + result.googleLensNoMaterialMatches + '; Bing Visual Search no-material-match '
      + result.bingVisualSearchNoMaterialMatches + '; not performed by user opt-out '
      + result.externalChecksNotPerformed + '.'
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
