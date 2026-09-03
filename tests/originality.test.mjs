import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import { sha256File, differenceHash, hammingDistance } from '../scripts/originality-lib.mjs';
import { workshopAssets } from '../scripts/media-catalog.mjs';
import { verifyPublishedVisuals } from '../scripts/verify-originality.mjs';

test('hash helpers are deterministic', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'epic-integrity-'));
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

test('published service visuals are distinct without a persisted review manifest', async () => {
  const result = await verifyPublishedVisuals();
  assert.equal(result.checkedVisuals, workshopAssets.length);
  assert.equal(result.uniqueFileHashes, workshopAssets.length);
  assert.ok(result.minimumPairwiseDistance >= 12);
});

test('published visual verifier rejects duplicate image content', async () => {
  const root = await mkdtemp(join(tmpdir(), 'epic-duplicate-'));
  const images = join(root, 'assets/images');
  await mkdir(images, { recursive: true });
  await cp(
    'assets/images/service-visuals/epic-service-websites-1920.webp',
    join(images, 'first-1920.webp')
  );
  await cp(join(images, 'first-1920.webp'), join(images, 'second-1920.webp'));
  const catalog = ['first', 'second'].map((id) => ({
    id,
    outputBase: 'assets/images/' + id,
    widths: [1920]
  }));

  await assert.rejects(
    verifyPublishedVisuals({ catalog, rootDirectory: root }),
    /duplicate published visual content/
  );
});
