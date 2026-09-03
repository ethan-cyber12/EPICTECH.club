import assert from "node:assert/strict";
import { readdir, rm } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { buildPublicSite, OUTPUT_DIR } from "../scripts/build-public-site.mjs";

async function artifactFiles() {
  const entries = await readdir(OUTPUT_DIR, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(OUTPUT_DIR, path.join(entry.parentPath, entry.name)).replaceAll("\\", "/"))
    .sort();
}

test("public build contains only the explicit deployable surface", async (context) => {
  context.after(() => rm(OUTPUT_DIR, { recursive: true, force: true }));
  const { copied } = await buildPublicSite();
  const files = await artifactFiles();

  assert.equal(files.length, copied);
  assert.ok(files.includes("index.html"));
  assert.ok(files.includes("contact.html"));
  assert.ok(files.includes("services/index.html"));
  assert.ok(files.includes("case-studies/index.html"));
  assert.ok(files.includes("assets/js/main.js"));
  assert.ok(files.includes("assets/projects/epic-secure-web-and-sdlc-public-sample.pdf"));

  const forbiddenRoots = new Set([
    ".git",
    ".github",
    ".private-media",
    ".media-review",
    "docs",
    "node_modules",
    "scripts",
    "tests",
    "tools",
  ]);
  for (const file of files) {
    assert.ok(!forbiddenRoots.has(file.split("/")[0]), `development path leaked into artifact: ${file}`);
  }

  for (const forbiddenFile of ["package.json", "package-lock.json", "requirements-dev.txt", "assets/projects/README.md"]) {
    assert.ok(!files.includes(forbiddenFile), `development file leaked into artifact: ${forbiddenFile}`);
  }
});
