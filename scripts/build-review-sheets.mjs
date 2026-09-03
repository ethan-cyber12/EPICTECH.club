import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { founderAssets, outputPath, socialAssets, workshopAssets } from './media-catalog.mjs';

const reviewDirectory = '.media-review';

function groupConfiguration(group) {
  if (group === 'founder') {
    return {
      output: reviewDirectory + '/founder-contact-sheet.jpg',
      columns: 3,
      tileWidth: 600,
      tileHeight: 900,
      items: founderAssets.map((asset) => ({
        id: asset.id,
        path: outputPath(asset.outputBase, 1200, 'jpg')
      }))
    };
  }
  if (group === 'workshop') {
    return {
      output: reviewDirectory + '/workshop-contact-sheet.jpg',
      columns: 3,
      tileWidth: 480,
      tileHeight: 300,
      items: workshopAssets.map((asset) => ({
        id: asset.id,
        path: outputPath(asset.outputBase, 1200, 'webp')
      }))
    };
  }
  if (group === 'social') {
    return {
      output: reviewDirectory + '/social-contact-sheet.jpg',
      columns: 2,
      tileWidth: 600,
      tileHeight: 315,
      items: socialAssets.map((asset) => ({ id: asset.id, path: asset.output }))
    };
  }
  throw new Error('group must be founder, workshop, or social');
}

export async function buildReviewSheet(group) {
  const config = groupConfiguration(group);
  const gap = 30;
  const labelHeight = 50;
  const rows = Math.ceil(config.items.length / config.columns);
  const canvasWidth = gap + config.columns * (config.tileWidth + gap);
  const canvasHeight = Math.max(630, gap + rows * (labelHeight + config.tileHeight + gap));
  const composites = [];

  for (const [index, item] of config.items.entries()) {
    const column = index % config.columns;
    const row = Math.floor(index / config.columns);
    const left = gap + column * (config.tileWidth + gap);
    const rowTop = gap + row * (labelHeight + config.tileHeight + gap);
    const image = await sharp(item.path)
      .resize(config.tileWidth, config.tileHeight, { fit: 'contain', background: '#F4F7FB' })
      .jpeg({ quality: 88, mozjpeg: true })
      .toBuffer();
    const label = Buffer.from(
      `<svg width="${config.tileWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">`
        + '<rect width="100%" height="100%" fill="#F4F7FB"/>'
        + `<text x="12" y="31" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#101820">${item.id}</text>`
        + '</svg>'
    );
    composites.push({ input: label, left, top: rowTop });
    composites.push({ input: image, left, top: rowTop + labelHeight });
  }

  await mkdir(reviewDirectory, { recursive: true });
  await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 3,
      background: '#F4F7FB'
    }
  })
    .composite(composites)
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(config.output);
  return config.output;
}

async function main() {
  const group = process.argv[2] === '--group' ? process.argv[3] : undefined;
  if (!group || process.argv.length !== 4) {
    throw new Error('Usage: node scripts/build-review-sheets.mjs --group founder|workshop|social');
  }
  console.log(await buildReviewSheet(group));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
