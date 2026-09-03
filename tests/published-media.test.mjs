import assert from 'node:assert/strict';
import { appendFile, cp, mkdir, mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import { workshopAssets, socialAssets, outputPath } from '../scripts/media-catalog.mjs';
import { buildReviewSheet } from '../scripts/build-review-sheets.mjs';
import { verifyMedia } from '../scripts/verify-media.mjs';

test('service visuals have exact dimensions, formats, budgets, and no metadata', async () => {
  for (const asset of workshopAssets) {
    for (const width of asset.widths) {
      const height = Math.round(width * asset.aspect.height / asset.aspect.width);
      for (const format of asset.formats) {
        const path = outputPath(asset.outputBase, width, format);
        const metadata = await sharp(path).metadata();
        assert.equal(metadata.width, width, path);
        assert.equal(metadata.height, height, path);
        if (format === 'avif') {
          assert.ok(['avif', 'heif'].includes(metadata.format), path);
        } else {
          assert.equal(metadata.format, format, path);
        }
        for (const key of ['exif', 'iptc', 'xmp', 'comments']) {
          assert.equal(metadata[key], undefined, path + ' contains ' + key);
        }
        assert.ok((await stat(path)).size <= asset.budgets[width], path);
      }
    }
  }
});

test('social images are complete metadata-free JPEGs', async () => {
  for (const asset of socialAssets) {
    const metadata = await sharp(asset.output).metadata();
    assert.equal(metadata.width, 1200, asset.output);
    assert.equal(metadata.height, 630, asset.output);
    assert.equal(metadata.format, 'jpeg', asset.output);
    for (const key of ['exif', 'iptc', 'xmp', 'comments']) {
      assert.equal(metadata[key], undefined, asset.output + ' contains ' + key);
    }
    assert.ok((await stat(asset.output)).size <= asset.maximumBytes, asset.output);
  }
});

test('founder social image uses the approved real graduation derivative and reviewed EPIC art', () => {
  const asset = socialAssets.find(({ id }) => id === 'ethan-platt-founder-og');
  assert.ok(asset.input.startsWith('assets/images/founder/ethan-platt-graduation-close-'));
  assert.ok(!asset.input.includes('.private-media/founder'));
  assert.equal(asset.artInput, '.private-media/workshop-masters/epic-hero-connected-workshop-master.png');
  assert.equal(asset.position, 'north');
});

test('independent verifier accepts the complete public media interface', async () => {
  assert.deepEqual(await verifyMedia(), {
    founderFiles: 5,
    serviceVisualFiles: 102,
    socialFiles: 2,
    privacyFindings: 0
  });
});

test('independent verifier reports a forbidden privacy token and its public path', async () => {
  const root = await mkdtemp(join(tmpdir(), 'epic-public-media-'));
  try {
    await mkdir(join(root, 'assets'), { recursive: true });
    await cp('assets/images', join(root, 'assets/images'), { recursive: true });
    const publicPath = join(root, 'assets/images/social/epic-tech-home-og-1200x630.jpg');
    await appendFile(publicPath, Buffer.from('GPS'));

    await assert.rejects(verifyMedia({ rootDirectory: root }), (error) => {
      assert.match(error.message, /epic-tech-home-og-1200x630\.jpg/);
      assert.match(error.message, /GPS/);
      return true;
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('review-sheet builder creates inspectable workshop and social contact sheets', async () => {
  for (const group of ['workshop', 'social']) {
    const path = await buildReviewSheet(group);
    const metadata = await sharp(path).metadata();
    assert.equal(metadata.format, 'jpeg', path);
    assert.ok(metadata.width >= 1200, path);
    assert.ok(metadata.height >= 630, path);
  }
});
