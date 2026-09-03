import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import test from 'node:test';
import sharp from 'sharp';

const previews = [
  'epic-cloud-security-automation-first-page-800.webp',
  'epic-disa-stig-hardening-first-page-800.webp',
  'epic-network-infrastructure-first-page-800.webp'
];

test('case-study previews are faithful fixed-size page-one renders', async () => {
  for (const name of previews) {
    const path = `assets/images/case-studies/${name}`;
    const metadata = await sharp(path).metadata();
    assert.equal(metadata.width, 800);
    assert.equal(metadata.height, 1035);
    assert.equal(metadata.format, 'webp');
    assert.equal(metadata.exif, undefined);
    assert.equal(metadata.xmp, undefined);
    assert.ok((await stat(path)).size <= 120 * 1024, `${name} exceeds 120 KiB`);
  }
});
