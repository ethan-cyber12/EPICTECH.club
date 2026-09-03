import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

export async function sha256File(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

export async function differenceHash(path) {
  const pixels = await sharp(path).resize(9, 8, { fit: 'fill' }).greyscale().raw().toBuffer();
  let hash = 0n;
  let bit = 0n;
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      if (pixels[row * 9 + column] > pixels[row * 9 + column + 1]) hash |= 1n << bit;
      bit += 1n;
    }
  }
  return hash;
}

export function hammingDistance(left, right) {
  let value = left ^ right;
  let count = 0;
  while (value !== 0n) {
    value &= value - 1n;
    count += 1;
  }
  return count;
}
