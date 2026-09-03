import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';
import { founderAssets, outputPath } from '../scripts/media-catalog.mjs';

test('founder derivatives have exact dimensions and no private metadata', async () => {
  for (const asset of founderAssets) {
    for (const width of asset.widths) {
      const height = Math.round(width * asset.aspect.height / asset.aspect.width);
      for (const format of asset.formats) {
        const path = outputPath(asset.outputBase, width, format);
        const metadata = await sharp(path).metadata();
        assert.equal(metadata.width, width, path);
        assert.equal(metadata.height, height, path);
        for (const key of ['exif', 'iptc', 'xmp', 'comments']) {
          assert.equal(metadata[key], undefined, path + ' contains ' + key);
        }
      }
    }
    for (const width of asset.jpgWidths) {
      const path = outputPath(asset.outputBase, width, 'jpg');
      const metadata = await sharp(path).metadata();
      assert.equal(metadata.width, width, path);
      assert.equal(metadata.height, Math.round(width * asset.aspect.height / asset.aspect.width), path);
      assert.equal(metadata.format, 'jpeg', path);
      for (const key of ['exif', 'iptc', 'xmp', 'comments']) {
        assert.equal(metadata[key], undefined, path + ' contains ' + key);
      }
    }
  }
});

test('founder files stay within bounded delivery sizes', async () => {
  for (const asset of founderAssets) {
    assert.ok((await stat(outputPath(asset.outputBase, 640, 'avif'))).size <= 180000);
    assert.ok((await stat(outputPath(asset.outputBase, 640, 'webp'))).size <= 220000);
    assert.ok((await stat(outputPath(asset.outputBase, 1200, 'avif'))).size <= 320000);
    assert.ok((await stat(outputPath(asset.outputBase, 1200, 'webp'))).size <= 400000);
    assert.ok((await stat(outputPath(asset.outputBase, 1200, 'jpg'))).size <= 500000);
  }
});
