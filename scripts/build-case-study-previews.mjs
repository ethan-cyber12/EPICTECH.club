import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import sharp from 'sharp';

const previews = [
  ['assets/projects/epic-cloud-security-automation-public-sample.pdf', 'assets/images/case-studies/epic-cloud-security-automation-first-page-800.webp'],
  ['assets/projects/epic-disa-stig-hardening-public-sample.pdf', 'assets/images/case-studies/epic-disa-stig-hardening-first-page-800.webp'],
  ['assets/projects/epic-network-infrastructure-public-sample.pdf', 'assets/images/case-studies/epic-network-infrastructure-first-page-800.webp']
];

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'epictech-case-previews-'));
const fontCacheDirectory = join(temporaryDirectory, 'font-cache');
const fontConfigPath = join(temporaryDirectory, 'fonts.conf');

try {
  mkdirSync(fontCacheDirectory);
  writeFileSync(
    fontConfigPath,
    `<fontconfig><dir>/System/Library/Fonts</dir><dir>/Library/Fonts</dir><cachedir>${fontCacheDirectory}</cachedir></fontconfig>`
  );

  for (const [input, output] of previews) {
    const prefix = join(temporaryDirectory, basename(output, '.webp'));
    execFileSync(
      'pdftoppm',
      ['-f', '1', '-l', '1', '-singlefile', '-png', '-r', '110', input, prefix],
      {
        stdio: 'inherit',
        env: { ...process.env, FONTCONFIG_FILE: fontConfigPath }
      }
    );
    mkdirSync(dirname(output), { recursive: true });
    await sharp(`${prefix}.png`)
      .resize({ width: 800, height: 1035, fit: 'contain', background: '#FFFFFF' })
      .webp({ quality: 82, effort: 6 })
      .toFile(output);
    process.stdout.write(`${output}\n`);
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
