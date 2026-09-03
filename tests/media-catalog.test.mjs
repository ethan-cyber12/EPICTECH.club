import assert from 'node:assert/strict';
import test from 'node:test';
import {
  founderAssets,
  workshopAssets,
  socialAssets,
  outputPath
} from '../scripts/media-catalog.mjs';

test('catalog exposes the three supplied founder sources', () => {
  assert.deepEqual(founderAssets.map((asset) => asset.id), [
    'ethan-platt-graduation-close',
    'ethan-platt-graduation-full-body',
    'ethan-platt-graduation-open-arms'
  ]);
  assert.deepEqual(founderAssets.map((asset) => asset.input), [
    '.private-media/founder/ethan-close-graduation-original',
    '.private-media/founder/ethan-full-body-graduation-original',
    '.private-media/founder/ethan-open-arms-graduation-original'
  ]);
  for (const asset of founderAssets) {
    assert.deepEqual(asset.widths, [640, 1200]);
    assert.deepEqual(asset.formats, ['avif', 'webp']);
    assert.deepEqual(asset.jpgWidths, [1200]);
    assert.match(asset.outputBase, /^assets\/images\/founder\//);
  }
});

test('catalog matches the visual-pages workshop interface exactly', () => {
  assert.deepEqual(workshopAssets.map((asset) => asset.id), [
    'epic-hero-connected-workshop',
    'epic-service-network-wifi',
    'epic-service-firewalls-security',
    'epic-service-websites',
    'epic-service-business-apps',
    'epic-service-automation',
    'epic-service-ecommerce',
    'epic-service-virtualization',
    'epic-service-internal-tools'
  ]);
  for (const asset of workshopAssets) {
    assert.deepEqual(asset.widths, [640, 1200, 1920]);
    assert.deepEqual(asset.formats, ['avif', 'webp']);
    assert.match(asset.master, /^\.private-media\/workshop-masters\//);
    assert.equal(asset.outputBase, 'assets/images/service-visuals/' + asset.id);
  }
});

test('catalog defines two complete social images', () => {
  assert.deepEqual(socialAssets.map((asset) => asset.output), [
    'assets/images/social/epic-tech-home-og-1200x630.jpg',
    'assets/images/social/ethan-platt-founder-og-1200x630.jpg'
  ]);
  for (const asset of socialAssets) {
    assert.equal(asset.width, 1200);
    assert.equal(asset.height, 630);
  }
});

test('outputPath is stable', () => {
  assert.equal(
    outputPath('assets/images/service-visuals/epic-service-websites', 1200, 'avif'),
    'assets/images/service-visuals/epic-service-websites-1200.avif'
  );
});
