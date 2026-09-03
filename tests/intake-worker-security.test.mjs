import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import test from 'node:test';

import worker from '../worker/src/index.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const originalFetch = globalThis.fetch;
const siteverifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const resendUrl = 'https://api.resend.com/emails';
const legacyCrmUrl = 'https://intake-crm.epictech.club/api/leads/ingest';
const canonicalCrmUrl = 'https://crm.epictech.club/api/leads/ingest';
const stagingBaseUrl = 'https://epictech-emailer-staging.ethanplatt0120.workers.dev';
const stagingAccessToken = 'a'.repeat(64);

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
    async get(key) {
      operations.push({ type: 'get', key });
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

function makeRateLimiter(success = true) {
  const calls = [];
  return {
    calls,
    async limit(input) {
      calls.push(input);
      return { success };
    },
  };
}

function makeEnv() {
  const kv = makeKv();
  const leadLimiter = makeRateLimiter();
  const reviewLimiter = makeRateLimiter();
  return {
    kv,
    leadLimiter,
    reviewLimiter,
    env: {
      ALLOWED_ORIGINS: 'https://epictech.club,https://www.epictech.club',
      INTAKE_HMAC_SECRET: 'test-intake-hmac-secret',
      LEAD_RATE_LIMITER: leadLimiter,
      NOTIFY_FROM: 'noreply@epictech.club',
      NOTIFY_TO: 'info@epictech.club',
      RESEND_API_KEY: 'test-resend-key',
      REVIEW_APPROVAL_SECRET: 'test-review-approval-secret',
      REVIEW_RATE_LIMITER: reviewLimiter,
      REVIEWS_KV: kv,
      TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
    },
  };
}

function makeStagingEnv() {
  const current = makeEnv();
  const events = makeKv();
  const queue = makeKv();
  Object.assign(current.env, {
    ALLOWED_ORIGINS: 'http://localhost:4173,http://127.0.0.1:4173',
    ENVIRONMENT: 'staging',
    INTAKE_HMAC_SECRET: 'h'.repeat(32),
    LEAD_QUEUE: queue,
    REVIEW_APPROVAL_SECRET: 'r'.repeat(32),
    STAGING_ACCESS_TOKEN: stagingAccessToken,
    STAGING_BASE_URL: stagingBaseUrl,
    STAGING_EVENTS: events,
    STAGING_TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
    STAGING_TURNSTILE_TEST_MODE: 'true',
  });
  delete current.env.RESEND_API_KEY;
  return { ...current, events, queue };
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

function requestFor(path, body = bodyFor(path), origin = 'https://epictech.club', options = {}) {
  const headers = {
    'Content-Type': options.contentType || 'application/json',
  };
  if (options.stagingKey) headers['X-Epictech-Staging-Key'] = options.stagingKey;
  if (options.cfConnectingIp !== null) {
    headers['CF-Connecting-IP'] = options.cfConnectingIp || '203.0.113.9';
  }
  if (options.userAgent !== null) {
    headers['User-Agent'] = options.userAgent || 'EPIC-TECH-test';
  }
  if (origin !== null) headers.Origin = origin;
  if (options.contentLength) headers['Content-Length'] = options.contentLength;

  return new Request((options.baseUrl || 'https://intake.epictech.club') + path, {
    method: 'POST',
    headers,
    body: options.rawBody === undefined ? JSON.stringify(body) : options.rawBody,
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

    if (url === legacyCrmUrl || url === canonicalCrmUrl) {
      if (options.crmError) throw options.crmError;
      return Response.json({ ok: true }, { status: options.crmStatus || 200 });
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
      const { env, kv, leadLimiter, reviewLimiter } = makeEnv();
      const calls = installFetch({ success: true, hostname, action });
      const response = await worker.fetch(requestFor(path), env);

      assert.equal(response.status, 200, path + ' should accept ' + hostname);
      assert.equal(calls[0].url, siteverifyUrl);
      assert.equal(calls[1].url, resendUrl);
      assert.equal(calls[0].init.body.get('secret'), 'test-turnstile-secret');
      assert.equal(calls[0].init.body.get('response'), 'test-token');
      assert.equal(calls[0].init.body.get('remoteip'), '203.0.113.9');
      const expectedLimiter = path === '/lead-intake' ? leadLimiter : reviewLimiter;
      const unusedLimiter = path === '/lead-intake' ? reviewLimiter : leadLimiter;
      assert.equal(expectedLimiter.calls.length, 1);
      assert.match(expectedLimiter.calls[0].key, /^[0-9a-f]{64}$/);
      assert.equal(unusedLimiter.calls.length, 0);
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
    ['/lead-intake', { success: true, hostname: 'epictech.club', action: 'LEAD_INTAKE' }],
    ['/lead-intake', { success: true, hostname: 'intake.epictech.club', action: 'lead_intake' }],
    ['/review-intake', { success: true, hostname: 'epictech.club.evil.example', action: 'review_intake' }],
    ['/lead-intake', { success: true, hostname: 'epictech.club.', action: 'lead_intake' }],
    ['/lead-intake', { success: true, hostname: 'EPICtech.club', action: 'lead_intake' }],
    ['/review-intake', { success: true, action: 'review_intake' }],
    ['/lead-intake', { success: true, hostname: 'epictech.club' }],
    ['/lead-intake', { success: 'true', hostname: 'epictech.club', action: 'lead_intake' }],
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
    [
      {
        success: false,
        hostname: 'epictech.club',
        action: 'lead_intake',
        'error-codes': ['timeout-or-duplicate'],
      },
      {},
    ],
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

test('accepts identical token aliases and rejects conflicting aliases before rate limiting', async () => {
  const identical = bodyFor('/lead-intake');
  identical['cf-turnstile-response'] = identical.token;
  const acceptedEnv = makeEnv();
  const acceptedCalls = installFetch({
    success: true,
    hostname: 'epictech.club',
    action: 'lead_intake',
  });

  const accepted = await worker.fetch(requestFor('/lead-intake', identical), acceptedEnv.env);
  assert.equal(accepted.status, 200);
  assert.deepEqual(acceptedCalls.map((call) => call.url), [siteverifyUrl, resendUrl]);

  const conflicting = bodyFor('/lead-intake');
  conflicting['cf-turnstile-response'] = 'different-token';
  const rejectedEnv = makeEnv();
  const rejectedCalls = installFetch({
    success: true,
    hostname: 'epictech.club',
    action: 'lead_intake',
  });
  const rejected = await worker.fetch(requestFor('/lead-intake', conflicting), rejectedEnv.env);

  assert.equal(rejected.status, 403);
  assert.equal(rejectedCalls.length, 0);
  assert.equal(rejectedEnv.leadLimiter.calls.length, 0);
});

test('requires an exact allowed Origin and JSON media type before reading intake data', async () => {
  const cases = [
    [requestFor('/lead-intake', undefined, null), 403, null],
    [requestFor('/lead-intake', undefined, 'https://epictech.club.evil.example'), 403, null],
    [requestFor('/review-intake', undefined, 'https://www.epictech.club.evil.example'), 403, null],
    [
      requestFor('/lead-intake', undefined, 'https://epictech.club', {
        contentType: 'text/plain; application/json',
      }),
      415,
      'https://epictech.club',
    ],
  ];

  for (const [request, expectedStatus, expectedCorsOrigin] of cases) {
    const current = makeEnv();
    const calls = installFetch({ success: true, hostname: 'epictech.club', action: 'lead_intake' });
    const response = await worker.fetch(request, current.env);

    assert.equal(response.status, expectedStatus);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), expectedCorsOrigin);
    assert.equal(calls.length, 0);
    assert.equal(current.leadLimiter.calls.length, 0);
    assert.equal(current.reviewLimiter.calls.length, 0);
  }

  const current = makeEnv();
  const validTypeCalls = installFetch({
    success: true,
    hostname: 'epictech.club',
    action: 'lead_intake',
  });
  const validType = await worker.fetch(
    requestFor('/lead-intake', undefined, 'https://epictech.club', {
      contentType: 'Application/JSON; Charset=UTF-8',
    }),
    current.env,
  );
  assert.equal(validType.status, 200);
  assert.deepEqual(validTypeCalls.map((call) => call.url), [siteverifyUrl, resendUrl]);
});

test('CORS preflights succeed only for exact approved origins', async () => {
  for (const [origin, expectedStatus] of [
    ['https://epictech.club', 204],
    ['https://www.epictech.club', 204],
    ['https://epictech.club.evil.example', 403],
    [null, 403],
  ]) {
    const headers = origin ? { Origin: origin } : {};
    const response = await worker.fetch(
      new Request('https://intake.epictech.club/lead-intake', {
        method: 'OPTIONS',
        headers,
      }),
      makeEnv().env,
    );
    assert.equal(response.status, expectedStatus);
    assert.equal(
      response.headers.get('Access-Control-Allow-Origin'),
      expectedStatus === 204 ? origin : null,
    );
    assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'Content-Type');
  }
});

test('rejects malformed, non-object, and byte-oversized JSON before rate limiting', async () => {
  const cases = [
    [requestFor('/lead-intake', undefined, undefined, { rawBody: '{' }), 400],
    [requestFor('/lead-intake', null), 400],
    [requestFor('/lead-intake', []), 400],
    [
      requestFor('/lead-intake', {
        ...bodyFor('/lead-intake'),
        message: '\ud83d\ude00'.repeat(3000),
      }),
      413,
    ],
    [requestFor('/lead-intake', {}, undefined, { contentLength: '10001' }), 413],
  ];

  for (const [request, expectedStatus] of cases) {
    const current = makeEnv();
    const calls = installFetch({ success: true, hostname: 'epictech.club', action: 'lead_intake' });
    const response = await worker.fetch(request, current.env);

    assert.equal(response.status, expectedStatus);
    assert.equal(calls.length, 0);
    assert.equal(current.leadLimiter.calls.length, 0);
  }
});

test('enforces the Turnstile token boundary exactly', async () => {
  const acceptedEnv = makeEnv();
  const acceptedCalls = installFetch({
    success: true,
    hostname: 'epictech.club',
    action: 'lead_intake',
  });
  const accepted = await worker.fetch(
    requestFor('/lead-intake', bodyFor('/lead-intake', 'x'.repeat(2048))),
    acceptedEnv.env,
  );

  assert.equal(accepted.status, 200);
  assert.equal(acceptedCalls[0].init.body.get('response').length, 2048);
});

test('rate-limit bindings are mandatory, route-specific, and fail closed', async () => {
  const limited = makeEnv();
  limited.env.LEAD_RATE_LIMITER = makeRateLimiter(false);
  const limitedCalls = installFetch({ success: true, hostname: 'epictech.club', action: 'lead_intake' });
  const limitedResponse = await worker.fetch(requestFor('/lead-intake'), limited.env);
  assert.equal(limitedResponse.status, 429);
  assert.equal(limitedResponse.headers.get('Retry-After'), '60');
  assert.equal(limitedCalls.length, 0);
  assert.equal(limited.kv.operations.length, 0);

  const missing = makeEnv();
  delete missing.env.REVIEW_RATE_LIMITER;
  const missingCalls = installFetch({ success: true, hostname: 'epictech.club', action: 'review_intake' });
  const missingResponse = await worker.fetch(requestFor('/review-intake'), missing.env);
  assert.equal(missingResponse.status, 503);
  assert.equal(missingCalls.length, 0);
  assert.equal(missing.kv.operations.length, 0);

  const failed = makeEnv();
  failed.env.LEAD_RATE_LIMITER = {
    async limit() {
      throw new Error('rate-limit service unavailable');
    },
  };
  const failedCalls = installFetch({ success: true, hostname: 'epictech.club', action: 'lead_intake' });
  const failedResponse = await worker.fetch(requestFor('/lead-intake'), failed.env);
  assert.equal(failedResponse.status, 503);
  assert.equal(failedCalls.length, 0);
});

test('rate limiting is stable across User-Agent rotation and requires Cloudflare client IP', async () => {
  for (const [path, action, limiterName] of [
    ['/lead-intake', 'lead_intake', 'leadLimiter'],
    ['/review-intake', 'review_intake', 'reviewLimiter'],
  ]) {
    const current = makeEnv();
    const calls = installFetch({
      success: false,
      hostname: 'epictech.club',
      action,
    });
    const first = await worker.fetch(
      requestFor(path, undefined, undefined, { userAgent: 'UA-one' }),
      current.env,
    );
    const second = await worker.fetch(
      requestFor(path, undefined, undefined, { userAgent: 'UA-two' }),
      current.env,
    );

    assert.equal(first.status, 403);
    assert.equal(second.status, 403);
    assert.equal(current[limiterName].calls.length, 2);
    assert.equal(current[limiterName].calls[0].key, current[limiterName].calls[1].key);
    assert.deepEqual(calls.map((call) => call.url), [siteverifyUrl, siteverifyUrl]);

    const missingIp = makeEnv();
    const missingIpCalls = installFetch({
      success: true,
      hostname: 'epictech.club',
      action,
    });
    const missingIpResponse = await worker.fetch(
      requestFor(path, undefined, undefined, { cfConnectingIp: null }),
      missingIp.env,
    );
    assert.equal(missingIpResponse.status, 503);
    assert.equal(missingIp[limiterName].calls.length, 0);
    assert.equal(missingIpCalls.length, 0);
  }
});

test('missing HMAC configuration fails before rate limiting or outbound requests', async () => {
  const current = makeEnv();
  delete current.env.INTAKE_HMAC_SECRET;
  const calls = installFetch({ success: true, hostname: 'epictech.club', action: 'lead_intake' });
  const response = await worker.fetch(requestFor('/lead-intake'), current.env);

  assert.equal(response.status, 503);
  assert.equal(calls.length, 0);
  assert.equal(current.leadLimiter.calls.length, 0);
});

test('missing review-approval secret cannot create an unmoderatable pending record', async () => {
  const current = makeEnv();
  delete current.env.REVIEW_APPROVAL_SECRET;
  const calls = installFetch({
    success: true,
    hostname: 'epictech.club',
    action: 'review_intake',
  });
  const response = await worker.fetch(requestFor('/review-intake'), current.env);

  assert.equal(response.status, 503);
  assert.deepEqual(calls.map((call) => call.url), [siteverifyUrl]);
  assert.equal(current.kv.operations.length, 0);
});

test('staging is private and fails closed before parsing or outbound work', async () => {
  const current = makeStagingEnv();
  const calls = installFetch({
    success: true,
    hostname: 'example.com',
    action: null,
  });

  for (const stagingKey of [undefined, 'wrong-staging-key']) {
    const response = await worker.fetch(
      requestFor('/lead-intake', undefined, undefined, {
        baseUrl: stagingBaseUrl,
        stagingKey,
      }),
      current.env,
    );
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }

  assert.equal(calls.length, 0);
  assert.equal(current.leadLimiter.calls.length, 0);
  assert.equal(current.events.operations.length, 0);
});

test('staging configuration and hostname must be exact before any work', async () => {
  for (const mutate of [
    (env) => { env.STAGING_BASE_URL = 'https://other.example.workers.dev'; },
    (env) => { delete env.STAGING_EVENTS; },
    (env) => { env.STAGING_TURNSTILE_TEST_MODE = 'false'; },
  ]) {
    const current = makeStagingEnv();
    mutate(current.env);
    const calls = installFetch({ success: true, hostname: 'example.com', action: null });
    const response = await worker.fetch(
      requestFor('/lead-intake', undefined, 'http://localhost:4173', {
        baseUrl: stagingBaseUrl,
        stagingKey: stagingAccessToken,
      }),
      current.env,
    );

    assert.equal(response.status, 503);
    assert.equal(calls.length, 0);
    assert.equal(current.leadLimiter.calls.length, 0);
    assert.equal(current.events.operations.length, 0);
  }
});

test('a copied staging environment cannot activate on the production origin', async () => {
  const current = makeStagingEnv();
  current.env.STAGING_BASE_URL = 'https://intake.epictech.club';
  const calls = installFetch({ success: true, hostname: 'example.com', action: null });
  const response = await worker.fetch(
    requestFor('/lead-intake', undefined, 'https://epictech.club', {
      stagingKey: stagingAccessToken,
    }),
    current.env,
  );

  assert.equal(response.status, 503);
  assert.equal(calls.length, 0);
  assert.equal(current.events.operations.length, 0);
});

test('staging preflight permits only an exact local QA origin and names the access header', async () => {
  const current = makeStagingEnv();
  const accepted = await worker.fetch(
    new Request(stagingBaseUrl + '/lead-intake', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:4173',
        'Access-Control-Request-Headers': 'content-type,x-epictech-staging-key',
        'Access-Control-Request-Method': 'POST',
      },
    }),
    current.env,
  );
  assert.equal(accepted.status, 204);
  assert.equal(accepted.headers.get('Access-Control-Allow-Origin'), 'http://localhost:4173');
  assert.match(accepted.headers.get('Access-Control-Allow-Headers'), /X-Epictech-Staging-Key/);

  const rejected = await worker.fetch(
    new Request(stagingBaseUrl + '/lead-intake', {
      method: 'OPTIONS',
      headers: { Origin: 'https://epictech.club' },
    }),
    current.env,
  );
  assert.equal(rejected.status, 403);
});

test('production ignores staging credentials and never accepts the dummy validation identity', async () => {
  const current = makeEnv();
  Object.assign(current.env, {
    STAGING_ACCESS_TOKEN: stagingAccessToken,
    STAGING_BASE_URL: stagingBaseUrl,
    STAGING_EVENTS: makeKv(),
    STAGING_TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
    STAGING_TURNSTILE_TEST_MODE: 'true',
  });
  const calls = installFetch({ success: true, hostname: 'localhost', action: 'test' });
  const response = await worker.fetch(
    requestFor('/lead-intake', undefined, 'https://epictech.club', {
      stagingKey: stagingAccessToken,
    }),
    current.env,
  );

  assert.equal(response.status, 403);
  assert.deepEqual(calls.map((call) => call.url), [siteverifyUrl]);
  assert.equal(current.kv.operations.length, 0);
});

test('staging accepts only the pinned dummy Turnstile identity and captures synthetic lead side effects', async () => {
  const current = makeStagingEnv();
  const calls = installFetch({
    success: true,
    hostname: 'example.com',
    action: null,
  });

  const response = await worker.fetch(
    requestFor('/lead-intake', undefined, 'http://localhost:4173', {
      baseUrl: stagingBaseUrl,
      stagingKey: stagingAccessToken,
    }),
    current.env,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls.map((call) => call.url), [siteverifyUrl]);
  const captures = current.events.operations.filter((entry) => entry.type === 'put');
  assert.equal(captures.length, 2);
  assert.deepEqual(captures.map((entry) => JSON.parse(entry.value).type).sort(), ['crm', 'email']);
  assert.ok(captures.every((entry) => entry.options.expirationTtl === 3600));
});

test('staging never calls or caches Google Places even if production variables are injected', async () => {
  const current = makeStagingEnv();
  current.env.GOOGLE_PLACES_API_KEY = 'must-not-be-used';
  current.env.GOOGLE_PLACE_ID = 'must-not-be-used';
  const calls = installFetch({});
  const response = await worker.fetch(
    new Request(stagingBaseUrl + '/reviews', {
      headers: {
        Origin: 'http://localhost:4173',
        'X-Epictech-Staging-Key': stagingAccessToken,
      },
    }),
    current.env,
  );

  assert.equal(response.status, 200);
  assert.equal((await response.json()).google, null);
  assert.equal(calls.length, 0);
  assert.equal(
    current.kv.operations.filter((entry) => entry.type === 'put' && entry.key === 'google:reviews').length,
    0,
  );
});

test('staging review records and captured moderation links expire quickly and stay on staging', async () => {
  const current = makeStagingEnv();
  const calls = installFetch({
    success: true,
    hostname: 'example.com',
    action: null,
  });

  const response = await worker.fetch(
    requestFor('/review-intake', undefined, 'http://localhost:4173', {
      baseUrl: stagingBaseUrl,
      stagingKey: stagingAccessToken,
    }),
    current.env,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(calls.map((call) => call.url), [siteverifyUrl]);
  const pending = current.kv.operations.find(
    (entry) => entry.type === 'put' && entry.key.startsWith('review:pending:'),
  );
  assert.equal(pending.options.expirationTtl, 3600);
  const capturedEmail = current.events.operations.find(
    (entry) => entry.type === 'put' && JSON.parse(entry.value).type === 'email',
  );
  const captured = JSON.parse(capturedEmail.value);
  assert.match(
    captured.payload.text,
    /https:\/\/epictech-emailer-staging\.ethanplatt0120\.workers\.dev\/review-approve/,
  );
});

test('lead sync supports the deployed legacy CRM variable name without weakening signing', async () => {
  const current = makeEnv();
  current.env.CRN_INGEST_URL = legacyCrmUrl;
  current.env.CRM_INGEST_SECRET = 'test-crm-ingest-secret';
  const calls = installFetch({
    success: true,
    hostname: 'epictech.club',
    action: 'lead_intake',
  });
  const response = await worker.fetch(requestFor('/lead-intake'), current.env);

  assert.equal(response.status, 200);
  assert.deepEqual(calls.map((call) => call.url), [siteverifyUrl, resendUrl, legacyCrmUrl]);
  const crmCall = calls[2];
  assert.equal(crmCall.init.method, 'POST');
  assert.match(crmCall.init.headers['X-Signature'], /^sha256=[0-9a-f]{64}$/);
  assert.match(crmCall.init.headers['X-Timestamp'], /^\d+$/);
  assert.equal(crmCall.init.headers['Content-Type'], 'application/json');

  const canonical = makeEnv();
  canonical.env.CRM_INGEST_URL = canonicalCrmUrl;
  canonical.env.CRN_INGEST_URL = legacyCrmUrl;
  canonical.env.CRM_INGEST_SECRET = 'test-crm-ingest-secret';
  const canonicalCalls = installFetch({
    success: true,
    hostname: 'epictech.club',
    action: 'lead_intake',
  });
  const canonicalResponse = await worker.fetch(requestFor('/lead-intake'), canonical.env);
  assert.equal(canonicalResponse.status, 200);
  assert.deepEqual(
    canonicalCalls.map((call) => call.url),
    [siteverifyUrl, resendUrl, canonicalCrmUrl],
  );
});

test('partial CRM configuration queues the emailed lead instead of reporting a false sync', async () => {
  for (const partial of [
    { CRM_INGEST_SECRET: 'test-crm-ingest-secret' },
    { CRN_INGEST_URL: legacyCrmUrl },
  ]) {
    const current = makeEnv();
    const queue = makeKv();
    Object.assign(current.env, partial, { LEAD_QUEUE: queue });
    const calls = installFetch({
      success: true,
      hostname: 'epictech.club',
      action: 'lead_intake',
    });
    const response = await worker.fetch(requestFor('/lead-intake'), current.env);

    assert.equal(response.status, 200);
    assert.deepEqual(calls.map((call) => call.url), [siteverifyUrl, resendUrl]);
    assert.equal(queue.operations.filter((entry) => entry.type === 'put').length, 1);
    assert.match(queue.operations[0].key, /^pending:/);
  }
});

test('CRM non-OK and network failures queue the emailed lead', async () => {
  for (const fetchOptions of [
    { crmStatus: 503 },
    { crmError: new Error('CRM network unavailable') },
  ]) {
    const current = makeEnv();
    const queue = makeKv();
    Object.assign(current.env, {
      CRN_INGEST_URL: legacyCrmUrl,
      CRM_INGEST_SECRET: 'test-crm-ingest-secret',
      LEAD_QUEUE: queue,
    });
    const calls = installFetch(
      { success: true, hostname: 'epictech.club', action: 'lead_intake' },
      fetchOptions,
    );
    const response = await worker.fetch(requestFor('/lead-intake'), current.env);

    assert.equal(response.status, 200);
    assert.deepEqual(calls.map((call) => call.url), [siteverifyUrl, resendUrl, legacyCrmUrl]);
    assert.equal(queue.operations.filter((entry) => entry.type === 'put').length, 1);
  }
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

test('moderation HTML sends anti-framing and browser hardening headers', async () => {
  const { env, kv } = makeEnv();
  const response = await worker.fetch(
    new Request('https://intake.epictech.club/review-approve?id=missing&sig=missing'),
    env,
  );

  assert.equal(response.status, 400);
  assert.equal(kv.operations.length, 0);
  assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
  assert.match(response.headers.get('Content-Security-Policy'), /form-action 'self'/);
  assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
});

test('moderation lookup accepts only generated UUID and HMAC shapes', async () => {
  const { env, kv } = makeEnv();
  const id = '123e4567-e89b-42d3-a456-426614174000';
  const sig = 'a'.repeat(64);
  const response = await worker.fetch(
    new Request('https://intake.epictech.club/review-approve?id=' + id + '&sig=' + sig),
    env,
  );

  assert.equal(response.status, 200);
  assert.deepEqual(kv.operations, [{ type: 'get', key: 'review:pending:' + id }]);
});
