import sharp from 'sharp';
import { founderAssets } from './media-catalog.mjs';

for (const asset of founderAssets) {
  const metadata = await sharp(asset.input, { failOn: 'error' }).metadata();
  if (!metadata.width || metadata.width < 1200) {
    throw new Error(asset.id + ' must be at least 1200 pixels wide');
  }
  console.log(JSON.stringify({
    id: asset.id,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    orientation: metadata.orientation || null,
    hasExif: Boolean(metadata.exif),
    hasIptc: Boolean(metadata.iptc),
    hasXmp: Boolean(metadata.xmp),
    hasComments: Boolean(metadata.comments)
  }));
}
