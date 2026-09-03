import { rename } from 'node:fs/promises';
import sharp from 'sharp';
import { workshopAssets } from './media-catalog.mjs';

const finalWidth = 1920;
const finalHeight = 1200;
const minimumContentWidth = 1500;
const minimumContentHeight = 937;
const maximumScale = Math.min(finalWidth / 8, finalHeight / 5);

for (const asset of workshopAssets) {
  const metadata = await sharp(asset.master, { failOn: 'error' }).metadata();
  if (!metadata.width || !metadata.height
    || metadata.width < minimumContentWidth
    || metadata.height < minimumContentHeight) {
    throw new Error(asset.id + ' master must contain at least 1500 by 937 native pixels');
  }

  const scale = Math.min(
    Math.floor(metadata.width / 8),
    Math.floor(metadata.height / 5),
    maximumScale
  );
  const cropWidth = scale * 8;
  const cropHeight = scale * 5;
  const left = Math.floor((metadata.width - cropWidth) / 2);
  const top = Math.floor((metadata.height - cropHeight) / 2);
  const extendLeft = Math.floor((finalWidth - cropWidth) / 2);
  const extendRight = finalWidth - cropWidth - extendLeft;
  const extendTop = Math.floor((finalHeight - cropHeight) / 2);
  const extendBottom = finalHeight - cropHeight - extendTop;
  const temporary = asset.master + '.normalized.png';

  await sharp(asset.master, { failOn: 'error' })
    .rotate()
    .toColorspace('srgb')
    .extract({ left, top, width: cropWidth, height: cropHeight })
    .extend({
      left: extendLeft,
      right: extendRight,
      top: extendTop,
      bottom: extendBottom,
      background: '#F4F7FB'
    })
    .png({ compressionLevel: 9 })
    .toFile(temporary);

  const clean = await sharp(temporary).metadata();
  if (clean.width !== finalWidth || clean.height !== finalHeight) {
    throw new Error(asset.id + ' did not normalize to 1920 by 1200 pixels');
  }
  for (const key of ['exif', 'iptc', 'xmp', 'comments']) {
    if (clean[key] !== undefined) throw new Error(asset.id + ' retained ' + key);
  }
  await rename(temporary, asset.master);
}
