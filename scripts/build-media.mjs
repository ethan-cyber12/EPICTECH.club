import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import sharp from 'sharp';
import { founderAssets, outputPath, socialAssets, workshopAssets } from './media-catalog.mjs';
import { verifyOriginalityManifest } from './verify-originality.mjs';

const originalityManifestPath = 'docs/media/epic-signal-workshop-originality.json';

const qualities = {
  avif: [52, 48, 44, 40],
  webp: [80, 76, 72, 68],
  jpg: [84, 80, 76, 72]
};

export async function encodeToBudget(pipeline, format, maximumBytes) {
  for (const quality of qualities[format]) {
    let buffer;
    if (format === 'avif') {
      buffer = await pipeline.clone().avif({ quality, effort: 6 }).toBuffer();
    } else if (format === 'webp') {
      buffer = await pipeline.clone().webp({ quality, effort: 6 }).toBuffer();
    } else {
      buffer = await pipeline.clone().jpeg({ quality, mozjpeg: true, progressive: true }).toBuffer();
    }
    if (buffer.length <= maximumBytes) return buffer;
  }
  throw new Error(format + ' cannot meet ' + maximumBytes + ' bytes without crossing the quality floor');
}

export async function buildFounderAsset(asset) {
  await mkdir(dirname(asset.outputBase), { recursive: true });
  const outputs = [];
  for (const width of asset.widths) {
    const height = Math.round(width * asset.aspect.height / asset.aspect.width);
    let pipeline = sharp(asset.workingInput || asset.input, { failOn: 'error' }).rotate().toColorspace('srgb');
    if (asset.crop.strategy === 'extract') {
      const { left, top, width: cropWidth, height: cropHeight } = asset.crop;
      pipeline = pipeline.extract({ left, top, width: cropWidth, height: cropHeight });
    }
    pipeline = pipeline.resize({
      width,
      height,
      fit: 'cover',
      position: asset.crop.strategy === 'attention' ? 'attention' : 'centre'
    });
    for (const format of asset.formats) {
      const maximumBytes = width === 640
        ? (format === 'avif' ? 180000 : 220000)
        : (format === 'avif' ? 320000 : 400000);
      const path = outputPath(asset.outputBase, width, format);
      await writeFile(path, await encodeToBudget(pipeline, format, maximumBytes));
      outputs.push(path);
    }
    if (asset.jpgWidths.includes(width)) {
      const path = outputPath(asset.outputBase, width, 'jpg');
      await writeFile(path, await encodeToBudget(pipeline, 'jpg', 500000));
      outputs.push(path);
    }
  }
  return outputs;
}

export async function buildWorkshopAsset(asset) {
  await mkdir(dirname(asset.outputBase), { recursive: true });
  const outputs = [];
  for (const width of asset.widths) {
    const height = Math.round(width * asset.aspect.height / asset.aspect.width);
    const base = sharp(asset.master, { failOn: 'error' })
      .toColorspace('srgb')
      .resize({ width, height, fit: 'cover', position: 'attention', withoutEnlargement: true });
    for (const format of asset.formats) {
      const path = outputPath(asset.outputBase, width, format);
      await writeFile(path, await encodeToBudget(base, format, asset.budgets[width]));
      outputs.push(path);
    }
  }
  return outputs;
}

export async function buildSocialAsset(asset) {
  await mkdir(dirname(asset.output), { recursive: true });
  let pipeline;
  if (asset.artInput) {
    const portrait = await sharp(asset.input, { failOn: 'error' })
      .rotate()
      .toColorspace('srgb')
      .resize({ width: 630, height: 630, fit: 'cover', position: asset.position })
      .png()
      .toBuffer();
    const art = await sharp(asset.artInput, { failOn: 'error' })
      .toColorspace('srgb')
      .resize({ width: 500, height: 313, fit: 'contain', background: '#F4F7FB' })
      .png()
      .toBuffer();
    pipeline = sharp({
      create: { width: 1200, height: 630, channels: 3, background: '#F4F7FB' }
    }).composite([
      { input: art, left: 35, top: 158 },
      { input: portrait, left: 570, top: 0 }
    ]);
  } else {
    pipeline = sharp(asset.input, { failOn: 'error' })
      .rotate()
      .toColorspace('srgb')
      .resize({ width: 1200, height: 630, fit: 'cover', position: asset.position });
  }
  await writeFile(asset.output, await encodeToBudget(pipeline, 'jpg', asset.maximumBytes));
  return asset.output;
}

async function verifyReviewedWorkshopSources() {
  const manifest = JSON.parse(await readFile(originalityManifestPath, 'utf8'));
  const result = await verifyOriginalityManifest(manifest);
  if (result.verifiedPrivateMasters !== workshopAssets.length) {
    throw new Error(
      'Originality verification did not verify every private workshop master: '
        + result.verifiedPrivateMasters + '/' + workshopAssets.length
    );
  }
}

async function buildGroup(group) {
  const outputs = [];
  if (group === 'founder' || group === 'all') {
    for (const asset of founderAssets) outputs.push(...await buildFounderAsset(asset));
  }
  if (group === 'workshop' || group === 'all') {
    await verifyReviewedWorkshopSources();
    for (const asset of workshopAssets) outputs.push(...await buildWorkshopAsset(asset));
  }
  if (group === 'social' || group === 'all') {
    await verifyReviewedWorkshopSources();
    for (const asset of socialAssets) outputs.push(await buildSocialAsset(asset));
  }
  return outputs;
}

const validGroups = new Set(['founder', 'workshop', 'social', 'all']);
if (process.argv[1] && process.argv[1].endsWith('build-media.mjs')) {
  const group = process.argv[2] === '--group' ? process.argv[3] : undefined;
  if (!group || !validGroups.has(group) || process.argv.length !== 4) {
    console.error('Usage: node scripts/build-media.mjs --group founder|workshop|social|all');
    process.exitCode = 1;
  } else {
    try {
      const outputs = await buildGroup(group);
      for (const output of outputs) console.log(output);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}
