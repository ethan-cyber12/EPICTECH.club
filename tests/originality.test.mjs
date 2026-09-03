import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import { sha256File, differenceHash, hammingDistance } from '../scripts/originality-lib.mjs';
import { buildOriginalityManifest, parseReviewArguments } from '../scripts/record-originality.mjs';
import { verifyOriginalityManifest } from '../scripts/verify-originality.mjs';

test('hash helpers are deterministic', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'epic-originality-'));
  const file = join(directory, 'sample.bin');
  await writeFile(file, 'EPIC TECH');
  assert.equal(await sha256File(file), await sha256File(file));
  assert.equal(hammingDistance(0n, 3n), 2);
});

test('differenceHash separates distinct geometry', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'epic-dhash-'));
  const left = join(directory, 'left.png');
  const right = join(directory, 'right.png');
  await sharp({ create: { width: 90, height: 80, channels: 3, background: '#0B5CFF' } }).png().toFile(left);
  await sharp({ create: { width: 90, height: 80, channels: 3, background: '#00B67A' } })
    .composite([{ input: Buffer.from('<svg width="90" height="80"><rect x="45" width="45" height="80" fill="#101820"/></svg>') }])
    .png()
    .toFile(right);
  assert.notEqual(await differenceHash(left), await differenceHash(right));
});

test('review arguments require the honest partial external-review state', () => {
  assert.deepEqual(parseReviewArguments([
    '--visual', 'approved',
    '--reverse-search', 'partial-user-opt-out',
    '--trade-dress', 'clear'
  ]), {
    visual: 'approved',
    reverseSearch: 'partial-user-opt-out',
    tradeDress: 'clear'
  });
  assert.throws(() => parseReviewArguments(['--visual', 'approved']), /reverse-search/);
});

test('recorder hashes masters and scopes external review to recorded evidence', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'epic-recorder-'));
  const master = join(directory, 'sample-master.png');
  await sharp({ create: { width: 90, height: 80, channels: 3, background: '#0B5CFF' } })
    .png()
    .toFile(master);

  const manifest = await buildOriginalityManifest([{ id: 'sample', master }], {
    reverseSearchById: new Map([[
      'sample',
      { googleLens: 'no-material-match', bingVisualSearch: 'not-performed-user-opt-out' }
    ]])
  });

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.generationMethod, 'documented-original-workflow');
  assert.deepEqual(manifest.assets[0], {
    id: 'sample',
    privateMasterName: 'sample-master.png',
    sourceSha256: await sha256File(master),
    differenceHash: (await differenceHash(master)).toString(16).padStart(16, '0'),
    publicDerivatives: [],
    review: {
      noVendorMarks: true,
      noReadableTextOrUi: true,
      noForbiddenCliches: true,
      noAppleTradeDress: true,
      appleComparison: 'homepage-clear',
      reverseImageSearch: {
        googleLens: 'no-material-match',
        bingVisualSearch: 'not-performed-user-opt-out'
      },
      humanDecision: 'approved-local-originality-gates'
    }
  });
  assert.equal(JSON.stringify(manifest).includes(directory), false);
});

function reviewedAsset(id, sourceSha256, differenceHashValue, reverseImageSearch = {
  googleLens: 'not-performed-user-opt-out',
  bingVisualSearch: 'not-performed-user-opt-out'
}) {
  return {
    id,
    privateMasterName: id + '-master.png',
    sourceSha256,
    differenceHash: differenceHashValue,
    publicDerivatives: [],
    review: {
      noVendorMarks: true,
      noReadableTextOrUi: true,
      noForbiddenCliches: true,
      noAppleTradeDress: true,
      appleComparison: 'homepage-clear',
      reverseImageSearch,
      humanDecision: 'approved-local-originality-gates'
    }
  };
}

test('verifier rejects duplicate source hashes', async () => {
  const manifest = {
    schemaVersion: 1,
    generationMethod: 'documented-original-workflow',
    assets: [
      reviewedAsset('first', 'a'.repeat(64), '0000000000000000'),
      reviewedAsset('second', 'a'.repeat(64), 'ffffffffffffffff')
    ]
  };

  await assert.rejects(
    verifyOriginalityManifest(manifest, { catalog: [] }),
    /duplicate SHA-256.*first.*second/
  );
});

test('verifier rejects perceptual hashes less than 12 bits apart', async () => {
  const manifest = {
    schemaVersion: 1,
    generationMethod: 'documented-original-workflow',
    assets: [
      reviewedAsset('first', 'a'.repeat(64), '0000000000000000'),
      reviewedAsset('second', 'b'.repeat(64), '0000000000000001')
    ]
  };

  await assert.rejects(
    verifyOriginalityManifest(manifest, { catalog: [] }),
    /first.*second.*distance 1/
  );
});

test('verifier accepts complete review records at or above the distance gate', async () => {
  const manifest = {
    schemaVersion: 1,
    generationMethod: 'documented-original-workflow',
    assets: [
      reviewedAsset('first', 'a'.repeat(64), '0000000000000000'),
      reviewedAsset('second', 'b'.repeat(64), '0000000000000fff')
    ]
  };

  assert.deepEqual(await verifyOriginalityManifest(manifest, { catalog: [] }), {
    reviewedOriginals: 2,
    minimumPairwiseDistance: 12,
    verifiedPrivateMasters: 0,
    verifiedPublicDerivatives: 0,
    googleLensNoMaterialMatches: 0,
    bingVisualSearchNoMaterialMatches: 0,
    externalChecksNotPerformed: 4
  });
});

test('verifier rejects an unrecognized external-review claim', async () => {
  const manifest = {
    schemaVersion: 1,
    generationMethod: 'documented-original-workflow',
    assets: [reviewedAsset('first', 'a'.repeat(64), '0000000000000000', {
      googleLens: 'assumed-clear',
      bingVisualSearch: 'not-performed-user-opt-out'
    })]
  };

  await assert.rejects(
    verifyOriginalityManifest(manifest, { catalog: [] }),
    /googleLens review state is invalid/
  );
});
