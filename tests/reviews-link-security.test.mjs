import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

function loadReviewRenderer() {
  const source = readFileSync(new URL('../assets/js/reviews.js', import.meta.url), 'utf8');
  const instrumented = source.replace(
    /\}\)\(\);\s*$/,
    '\n  globalThis.__epicTest = { renderGoogle };\n})();\n',
  );
  assert.notEqual(instrumented, source, 'reviews.js test instrumentation must attach');

  const link = { href: 'https://g.page/r/static-fallback/review' };
  const document = {
    readyState: 'loading',
    addEventListener() {},
    querySelector(selector) {
      return selector === '[data-google-link]' ? link : null;
    },
  };
  const context = vm.createContext({ document, URL, window: {} });
  vm.runInContext(instrumented, context);
  return { link, ...context.__epicTest };
}

test('Worker data cannot replace the reviewed static Google destination', () => {
  const { link, renderGoogle } = loadReviewRenderer();
  const fallback = link.href;
  const backendValues = [
    'javascript:alert(1)',
    'https://google.com.evil.example/review',
    'https://translate.google.com/translate?u=https%3A%2F%2Fexample.com%2F',
    'https://g.page/r/a-different-business/review',
    'https://www.google.com/maps?cid=123',
  ];

  for (const googleReviewUrl of backendValues) {
    renderGoogle({ status: 'degraded', googleReviewUrl });
    assert.equal(link.href, fallback);
  }
});
