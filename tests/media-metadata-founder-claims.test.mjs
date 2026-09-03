import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const home = await readFile('index.html', 'utf8');
const founder = await readFile('founder.html', 'utf8');

function count(text, value) {
  return text.split(value).length - 1;
}

test('home social metadata uses the original workshop image', () => {
  assert.match(home, /<meta property="og:image" content="https:\/\/epictech\.club\/assets\/images\/social\/epic-tech-home-og-1200x630\.jpg">/);
  assert.match(home, /<meta property="og:image:width" content="1200">/);
  assert.match(home, /<meta property="og:image:height" content="630">/);
  assert.match(home, /<meta property="og:image:type" content="image\/jpeg">/);
  assert.match(home, /<meta property="og:image:alt" content="Abstract EPIC TECH signal workshop connecting business technology systems">/);
  assert.match(home, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(home, /<meta name="twitter:image" content="https:\/\/epictech\.club\/assets\/images\/social\/epic-tech-home-og-1200x630\.jpg">/);
});

test('founder social metadata identifies Ethan without private detail', () => {
  assert.match(founder, /<meta property="og:image" content="https:\/\/epictech\.club\/assets\/images\/social\/ethan-platt-founder-og-1200x630\.jpg">/);
  assert.match(founder, /<meta property="og:image:width" content="1200">/);
  assert.match(founder, /<meta property="og:image:height" content="630">/);
  assert.match(founder, /<meta property="og:image:type" content="image\/jpeg">/);
  assert.match(founder, /<meta property="og:image:alt" content="Ethan Platt, founder of EPIC TECH LLC">/);
  assert.match(founder, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(founder, /<meta name="twitter:image" content="https:\/\/epictech\.club\/assets\/images\/social\/ethan-platt-founder-og-1200x630\.jpg">/);
});

test('approved credentials are exact and bounded', () => {
  assert.equal(count(founder, 'B.S. in Information Technology'), 1);
  assert.equal(count(founder, 'B.S. in Cybersecurity'), 1);
  assert.equal(count(founder, 'valedictorian'), 1);
  assert.equal(count(founder, 'Advanced Achievement Award recipient'), 1);
  assert.match(founder, /both programs/);
  assert.doesNotMatch(founder, /Academic Scholar/i);
});

test('founder content excludes sensitive or inflated claims', () => {
  assert.match(founder, /former United States Marine/);
  assert.match(founder, /communications and transmission systems/);
  assert.doesNotMatch(founder, /honorably discharged|Sergeant|certified veteran-owned|military-grade|cybersecurity engineer|GPA|clearance|deployment|duty station|home address|gmail\.com|tel:/i);
  assert.doesNotMatch(founder, /\b20(1[0-9]|2[0-9])\s*[–-]\s*20(1[0-9]|2[0-9])\b/);
});

test('founder portrait contract remains informative and responsive', () => {
  assert.match(founder, /ethan-platt-graduation-close-640\.avif/);
  assert.match(founder, /ethan-platt-graduation-close-1200\.webp/);
  assert.match(founder, /ethan-platt-graduation-close-1200\.jpg/);
  assert.match(founder, /width="1200" height="1500"/);
  assert.match(founder, /alt="Ethan Platt, founder of EPIC TECH LLC"/);
});
