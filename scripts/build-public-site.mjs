import { copyFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const SITE_ROOT = path.resolve(SCRIPT_DIR, "..");
export const OUTPUT_DIR = path.join(SITE_ROOT, "_site");

export const PUBLIC_ROOT_FILES = Object.freeze([
  ".nojekyll",
  "CNAME",
  "about.html",
  "contact.html",
  "founder.html",
  "index.html",
  "pricing.html",
  "privacy.html",
  "reviews.html",
  "robots.txt",
  "sitemap.xml",
]);

export const PUBLIC_TREES = Object.freeze([
  { directory: "assets/css", extensions: new Set([".css"]) },
  { directory: "assets/images", extensions: new Set([".avif", ".jpg", ".webp"]) },
  { directory: "assets/js", extensions: new Set([".js"]) },
  { directory: "assets/projects", extensions: new Set([".pdf"]) },
  { directory: "case-studies", extensions: new Set([".html"]) },
  { directory: "services", extensions: new Set([".html"]) },
]);

function assertSafeOutputDirectory() {
  const relative = path.relative(SITE_ROOT, OUTPUT_DIR);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to replace unsafe output directory: ${OUTPUT_DIR}`);
  }
}

async function copyPublicTree(tree) {
  const sourceRoot = path.join(SITE_ROOT, tree.directory);
  const entries = await readdir(sourceRoot, { withFileTypes: true, recursive: true });
  let copied = 0;

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const source = path.join(entry.parentPath, entry.name);
    const relative = path.relative(SITE_ROOT, source);
    if (!tree.extensions.has(path.extname(entry.name).toLowerCase())) continue;

    const destination = path.join(OUTPUT_DIR, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(source, destination);
    copied += 1;
  }

  return copied;
}

export async function buildPublicSite() {
  assertSafeOutputDirectory();
  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  let copied = 0;
  for (const relative of PUBLIC_ROOT_FILES) {
    const source = path.join(SITE_ROOT, relative);
    const sourceStat = await stat(source);
    if (!sourceStat.isFile()) throw new Error(`Public root entry is not a file: ${relative}`);

    const destination = path.join(OUTPUT_DIR, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await copyFile(source, destination);
    copied += 1;
  }

  for (const tree of PUBLIC_TREES) copied += await copyPublicTree(tree);

  process.stdout.write(`Built allowlisted public site: ${copied} files in ${OUTPUT_DIR}\n`);
  return { copied, outputDirectory: OUTPUT_DIR };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) await buildPublicSite();
