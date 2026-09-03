import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { outputPath, workshopAssets } from './media-catalog.mjs';
import { differenceHash, hammingDistance, sha256File } from './originality-lib.mjs';

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

export async function verifyPublishedVisuals(options = {}) {
  const catalog = options.catalog ?? workshopAssets;
  const rootDirectory = options.rootDirectory ?? '.';
  const records = [];

  for (const asset of catalog) {
    const width = Math.max(...asset.widths);
    const relativePath = outputPath(asset.outputBase, width, 'webp');
    const path = resolve(rootDirectory, relativePath);
    records.push({
      id: asset.id,
      sha256: await sha256File(path),
      differenceHash: await differenceHash(path)
    });
  }

  const idsByHash = new Map();
  for (const record of records) {
    const previousId = idsByHash.get(record.sha256);
    requireCondition(
      previousId === undefined,
      'duplicate published visual content for ' + previousId + ' and ' + record.id
    );
    idsByHash.set(record.sha256, record.id);
  }

  let minimumPairwiseDistance = null;
  for (let left = 0; left < records.length; left += 1) {
    for (let right = left + 1; right < records.length; right += 1) {
      const distance = hammingDistance(records[left].differenceHash, records[right].differenceHash);
      requireCondition(
        distance >= 12,
        records[left].id + ' and ' + records[right].id
          + ' have difference-hash distance ' + distance + ', below 12'
      );
      minimumPairwiseDistance = minimumPairwiseDistance === null
        ? distance
        : Math.min(minimumPairwiseDistance, distance);
    }
  }

  return {
    checkedVisuals: records.length,
    uniqueFileHashes: idsByHash.size,
    minimumPairwiseDistance
  };
}

async function main() {
  const result = await verifyPublishedVisuals();
  console.log(
    'PASS visual integrity: ' + result.checkedVisuals + ' published visuals; '
      + result.uniqueFileHashes + ' unique file hashes; minimum pairwise distance '
      + result.minimumPairwiseDistance + '.'
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
