import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { founderAssets, outputPath, socialAssets, workshopAssets } from './media-catalog.mjs';
const publicImagesDirectory = 'assets/images';
const allowedExtensions = new Set(['.avif', '.webp', '.jpg', '.jpeg']);
const forbiddenPrivacyTokens = ['GPS', 'DateTimeOriginal', 'Make', 'Model', 'SerialNumber', 'gmail.com', 'tel:'];

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function projectPath(rootDirectory, path) {
  return resolve(rootDirectory, path);
}

function displayPath(rootDirectory, path) {
  return relative(resolve(rootDirectory), path).split('\\').join('/');
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else if (entry.isFile()) files.push(path);
    else throw new Error('Unsupported public image entry: ' + path);
  }
  return files.sort();
}

async function verifyNoPublicPrivacyData(rootDirectory, publicFiles) {
  for (const path of publicFiles) {
    const bytes = await readFile(path);
    for (const token of forbiddenPrivacyTokens) {
      if (bytes.includes(Buffer.from(token))) {
        throw new Error(displayPath(rootDirectory, path) + ' contains forbidden privacy token ' + token);
      }
    }
  }
}

async function verifyMetadataFree(path, display) {
  const metadata = await sharp(path).metadata();
  for (const key of ['exif', 'iptc', 'xmp', 'comments']) {
    requireCondition(metadata[key] === undefined, display + ' contains ' + key);
  }
  return metadata;
}

async function verifyFounderAssets(rootDirectory) {
  for (const asset of founderAssets) {
    for (const width of asset.widths) {
      const height = Math.round(width * asset.aspect.height / asset.aspect.width);
      for (const format of asset.formats) {
        const relativePath = outputPath(asset.outputBase, width, format);
        const path = projectPath(rootDirectory, relativePath);
        const metadata = await verifyMetadataFree(path, relativePath);
        requireCondition(metadata.width === width, relativePath + ' width must be ' + width);
        requireCondition(metadata.height === height, relativePath + ' height must be ' + height);
        if (format === 'avif') {
          requireCondition(['avif', 'heif'].includes(metadata.format), relativePath + ' must be AVIF');
        } else {
          requireCondition(metadata.format === format, relativePath + ' must be ' + format);
        }
        const maximumBytes = width === 640
          ? (format === 'avif' ? 180000 : 220000)
          : (format === 'avif' ? 320000 : 400000);
        requireCondition((await stat(path)).size <= maximumBytes, relativePath + ' exceeds its byte budget');
      }
    }
    for (const width of asset.jpgWidths) {
      const relativePath = outputPath(asset.outputBase, width, 'jpg');
      const path = projectPath(rootDirectory, relativePath);
      const metadata = await verifyMetadataFree(path, relativePath);
      requireCondition(metadata.width === width, relativePath + ' width must be ' + width);
      requireCondition(
        metadata.height === Math.round(width * asset.aspect.height / asset.aspect.width),
        relativePath + ' height is incorrect'
      );
      requireCondition(metadata.format === 'jpeg', relativePath + ' must be JPEG');
      requireCondition((await stat(path)).size <= 500000, relativePath + ' exceeds its byte budget');
    }
  }
}

async function verifyWorkshopAssets(rootDirectory) {
  for (const asset of workshopAssets) {
    for (const width of asset.widths) {
      const height = Math.round(width * asset.aspect.height / asset.aspect.width);
      for (const format of asset.formats) {
        const relativePath = outputPath(asset.outputBase, width, format);
        const path = projectPath(rootDirectory, relativePath);
        const metadata = await verifyMetadataFree(path, relativePath);
        requireCondition(metadata.width === width, relativePath + ' width must be ' + width);
        requireCondition(metadata.height === height, relativePath + ' height must be ' + height);
        if (format === 'avif') {
          requireCondition(['avif', 'heif'].includes(metadata.format), relativePath + ' must be AVIF');
        } else {
          requireCondition(metadata.format === format, relativePath + ' must be ' + format);
        }
        requireCondition(
          (await stat(path)).size <= asset.budgets[width],
          relativePath + ' exceeds its byte budget'
        );
      }
    }
  }
}

async function verifySocialAssets(rootDirectory) {
  for (const asset of socialAssets) {
    const path = projectPath(rootDirectory, asset.output);
    const metadata = await verifyMetadataFree(path, asset.output);
    requireCondition(metadata.width === 1200, asset.output + ' width must be 1200');
    requireCondition(metadata.height === 630, asset.output + ' height must be 630');
    requireCondition(metadata.format === 'jpeg', asset.output + ' must be JPEG');
    requireCondition((await stat(path)).size <= asset.maximumBytes, asset.output + ' exceeds its byte budget');
  }
}

export async function verifyMedia(options = {}) {
  const rootDirectory = options.rootDirectory ?? '.';
  const founderFiles = await listFiles(projectPath(rootDirectory, 'assets/images/founder'));
  const serviceVisualFiles = await listFiles(projectPath(rootDirectory, 'assets/images/service-visuals'));
  const socialFiles = await listFiles(projectPath(rootDirectory, 'assets/images/social'));
  requireCondition(founderFiles.length === 5, 'assets/images/founder must contain exactly five files');
  const expectedServiceVisualFiles = workshopAssets.reduce(
    (total, asset) => total + (asset.widths.length * asset.formats.length),
    0
  );
  requireCondition(
    serviceVisualFiles.length === expectedServiceVisualFiles,
    'assets/images/service-visuals must contain exactly ' + expectedServiceVisualFiles + ' files'
  );
  requireCondition(socialFiles.length === 2, 'assets/images/social must contain exactly two files');

  const publicFiles = await listFiles(projectPath(rootDirectory, publicImagesDirectory));
  for (const path of publicFiles) {
    const publicPath = displayPath(rootDirectory, path);
    const lowerPath = publicPath.toLowerCase();
    requireCondition(!lowerPath.endsWith('master.png'), 'Public master image is forbidden: ' + publicPath);
    requireCondition(
      !lowerPath.includes('.private-media')
        && !lowerPath.includes('-original')
        && !lowerPath.includes('-working')
        && !lowerPath.includes('-source'),
      'Private source image is forbidden: ' + publicPath
    );
    requireCondition(
      allowedExtensions.has(extname(lowerPath)),
      'Unsupported public image extension: ' + publicPath
    );
  }
  await verifyNoPublicPrivacyData(rootDirectory, publicFiles);
  await verifyFounderAssets(rootDirectory);
  await verifyWorkshopAssets(rootDirectory);
  await verifySocialAssets(rootDirectory);

  return {
    founderFiles: founderFiles.length,
    serviceVisualFiles: serviceVisualFiles.length,
    socialFiles: socialFiles.length,
    privacyFindings: 0
  };
}

async function main() {
  const result = await verifyMedia();
  console.log(
    'PASS media: ' + result.founderFiles + ' founder files; '
      + result.serviceVisualFiles + ' service visuals; '
      + result.socialFiles + ' social files; '
      + result.privacyFindings + ' privacy findings.'
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
