import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import test from 'node:test';

import worker from '../worker/src/index.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const originalFetch = globalThis.fetch;
const siteverifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const resendUrl = 'https://api.resend.com/emails';

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

function makeKv() {
  const operations = [];
  return {
    operations,
    async delete(key) {
      operations.push({ type: 'delete', key });
    },
    async get() {
      return null;
    },
    async list() {
      return { keys: [] };
    },
    async put(key, value, options) {
      operations.push({ type: 'put', key, value, options });
    },
  };
}

function makeEnv() {
  const kv = makeKv();
  return {
    kv,
    env: {
      ALLOWED_ORIGINS: 'https://epictech.club,https://www.epictech.club',
      INTAKE_HMAC_SECRET: 'test-intake-hmac-secret',
      NOTIFY_FROM: 'noreply@epictech.club',
      NOTIFY_TO: 'info@epictech.club',
      RESEND_API_KEY: 'test-resend-key',
      REVIEW_APPROVAL_SECRET: 'test-review-approval-secret',
      REVIEWS_KV: kv,
      TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
    },
  };
}

function bodyFor(path, token = 'test-token') {
  if (path === '/lead-intake') {
    return {
      email: 'tester@example.test',
      message: 'This is a legitimate test message.',
      name: 'Test Person',
      service: 'Website Launch',
      token,
    };
  }

  return {
    email: 'tester@example.test',
    name: 'Test Person',
    rating: 5,
    text: 'A legitimate review for the test suite.',
    token,
  };
}

function requestFor(path, body = bodyFor(path), origin = 'https://epictech.club') {
  return new Request('https://intake.epictech.club' + path, {
    method: 'POST',
    headers: {
      'CF-Connecting-IP': '203.0.113.9',
      'Content-Type': 'application/json',
      Origin: origin,
      'User-Agent': 'EPIC-TECH-test',
    },
    body: JSON.stringify(body),
  });
}

function installFetch(siteverifyResult, options = {}) {
  const calls = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    calls.push({ url, init });

    if (url === siteverifyUrl) {
      if (options.siteverifyError) throw options.siteverifyError;
      if (options.invalidJson) {
        return new Response('not json', { status: options.siteverifyStatus || 200 });
      }
      return Response.json(siteverifyResult, { status: options.siteverifyStatus || 200 });
    }

    if (url === resendUrl) {
      return Response.json({ id: 'test-message-id' });
    }

    throw new Error('Unexpected outbound request: ' + url);
  };
  return calls;
}

test('accepts only the exact hostname and action pair for each intake route', async () => {
  const routes = [
    ['/lead-intake', 'lead_intake'],
    ['/review-intake', 'review_intake'],
  ];

  for (const [path, action] of routes) {
    for (const hostname of ['epictech.club', 'www.epictech.club']) {
      const { env, kv } = makeEnv();
      const calls = installFetch({ success: true, hostname, action });
      const response = await worker.fetch(requestFor(path), env);

      assert.equal(response.status, 200, path + ' should accept ' + hostname);
      assert.equal(calls[0].url, siteverifyUrl);
      assert.equal(calls[1].url, resendUrl);
      assert.equal(calls[0].init.body.get('secret'), 'test-turnstile-secret');
      assert.equal(calls[0].init.body.get('response'), 'test-token');
      assert.equal(calls[0].init.body.get('remoteip'), '203.0.113.9');
      if (path === '/review-intake') {
        assert.equal(kv.operations.filter((entry) => entry.type === 'put').length, 1);
      }
    }
  }
});

test('rejects swapped actions and hostname lookalikes before any side effect', async () => {
  const cases = [
    ['/lead-intake', { success: true, hostname: 'epictech.club', action: 'review_intake' }],
    ['/review-intake', { success: true, hostname: 'www.epictech.club', action: 'lead_intake' }],
    ['/lead-intake', { success: true, hostname: 'intake.epictech.club', action: 'lead_intake' }],
    ['/review-intake', { success: true, hostname: 'epictech.club.evil.example', action: 'review_intake' }],
    ['/lead-intake', { success: true, hostname: 'epictech.club.', action: 'lead_intake' }],
    ['/review-intake', { success: true, action: 'review_intake' }],
    ['/lead-intake', { success: true, hostname: 'epictech.club' }],
  ];

  for (const [path, result] of cases) {
    const { env, kv } = makeEnv();
    const calls = installFetch(result);
    const response = await worker.fetch(requestFor(path), env);

    assert.equal(response.status, 403, path + ' should reject ' + JSON.stringify(result));
    assert.deepEqual(calls.map((call) => call.url), [siteverifyUrl]);
    assert.equal(kv.operations.length, 0);
  }
});

test('rejects invalid Siteverify responses and oversized tokens fail closed', async () => {
  const failures = [
    [{ success: false, hostname: 'epictech.club', action: 'lead_intake' }, {}],
    [{ success: true, hostname: 'epictech.club', action: 'lead_intake' }, { siteverifyStatus: 503 }],
    [null, { invalidJson: true }],
    [null, { siteverifyError: new Error('network unavailable') }],
  ];

  for (const [result, options] of failures) {
    const { env } = makeEnv();
    const calls = installFetch(result, options);
    const response = await worker.fetch(requestFor('/lead-intake'), env);
    assert.equal(response.status, 403);
    assert.deepEqual(calls.map((call) => call.url), [siteverifyUrl]);
  }

  const { env } = makeEnv();
  const calls = installFetch({ success: true, hostname: 'epictech.club', action: 'lead_intake' });
  const response = await worker.fetch(
    requestFor('/lead-intake', bodyFor('/lead-intake', 'x'.repeat(2049))),
    env,
  );
  assert.equal(response.status, 403);
  assert.equal(calls.length, 0);
});

test('preserves the legacy token alias and rejects a missing secret without a request', async () => {
  const { env } = makeEnv();
  const calls = installFetch({
    success: true,
    hostname: 'epictech.club',
    action: 'lead_intake',
  });
  const aliasBody = bodyFor('/lead-intake');
  delete aliasBody.token;
  aliasBody['cf-turnstile-response'] = 'alias-token';

  const accepted = await worker.fetch(requestFor('/lead-intake', aliasBody), env);
  assert.equal(accepted.status, 200);
  assert.equal(calls[0].init.body.get('response'), 'alias-token');

  const missingSecret = makeEnv().env;
  delete missingSecret.TURNSTILE_SECRET_KEY;
  const noRequestCalls = installFetch({
    success: true,
    hostname: 'epictech.club',
    action: 'lead_intake',
  });
  const rejected = await worker.fetch(requestFor('/lead-intake'), missingSecret);
  assert.equal(rejected.status, 403);
  assert.equal(noRequestCalls.length, 0);
});

test('expected action comes from the route and the honeypot remains side-effect free', async () => {
  const { env } = makeEnv();
  const calls = installFetch({
    success: true,
    hostname: 'epictech.club',
    action: 'lead_intake',
  });
  const body = { ...bodyFor('/lead-intake'), action: 'review_intake' };
  const accepted = await worker.fetch(requestFor('/lead-intake', body), env);

  assert.equal(accepted.status, 200);
  assert.deepEqual(calls.map((call) => call.url), [siteverifyUrl, resendUrl]);

  const honeypotCalls = installFetch({
    success: true,
    hostname: 'epictech.club',
    action: 'lead_intake',
  });
  const honeypot = await worker.fetch(
    requestFor('/lead-intake', { _hp: 'filled by bot' }),
    env,
  );
  assert.equal(honeypot.status, 200);
  assert.equal(honeypotCalls.length, 0);
});
