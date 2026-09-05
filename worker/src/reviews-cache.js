// Only the public payload is cached. CORS and staging access stay in the router.
const FRESH_MS = 60_000;
const RETAIN_MS = 300_000;
const SNAPSHOT_KEY = 'reviews:feed:v1';
const CACHE_URL = 'https://intake.epictech.club/__reviews-cache-v1';
const states = new WeakMap();

export function reviewState(env) {
  let state = states.get(env);
  if (!state) {
    state = { entry: null, pending: null, retryAt: 0, googlePending: null, googleRetryAt: 0 };
    states.set(env, state);
  }
  return state;
}

function usable(entry) {
  return entry && Number.isFinite(entry.freshUntil) && Number.isFinite(entry.retainUntil) &&
    entry.retainUntil > Date.now() && entry.data && Array.isArray(entry.data.onsite);
}

function edgeCache() {
  return globalThis.caches?.default;
}

async function readSnapshot(env) {
  try {
    const response = await edgeCache()?.match(new Request(CACHE_URL));
    if (response) {
      const entry = await response.json();
      if (usable(entry)) return entry;
    }
  } catch { /* KV snapshot is the fallback when the edge cache is unavailable. */ }
  try {
    const raw = await env.REVIEWS_KV.get(SNAPSHOT_KEY);
    const entry = raw ? JSON.parse(raw) : null;
    return usable(entry) ? entry : null;
  } catch { return null; }
}

async function saveSnapshot(env, entry) {
  const body = JSON.stringify(entry);
  // No Origin, credentials, or request headers enter a shared cache key/value.
  try { await env.REVIEWS_KV.put(SNAPSHOT_KEY, body, { expirationTtl: RETAIN_MS / 1000 }); }
  catch { /* The isolate and edge caches still bound repeated refresh work. */ }
  try {
    await edgeCache()?.put(new Request(CACHE_URL), new Response(body, {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    }));
  } catch { /* The KV snapshot and isolate cache remain available. */ }
}

async function refresh(env, state, build) {
  if (state.pending) return state.pending;
  if (state.retryAt > Date.now()) {
    if (usable(state.entry)) return state.entry.data;
    throw new Error('Reviews refresh is backing off');
  }
  state.pending = (async () => {
    // An additional shared key bounds rebuild work across IPs and isolates in
    // each Cloudflare location. This uses the dedicated feed budget only.
    const decision = await env.REVIEWS_FEED_RATE_LIMITER.limit({ key: 'reviews-refresh:v1' });
    if (decision?.success !== true) throw new Error('Reviews refresh unavailable');
    const data = await build();
    const now = Date.now();
    const entry = { data, freshUntil: now + FRESH_MS, retainUntil: now + RETAIN_MS };
    state.entry = entry;
    await saveSnapshot(env, entry);
    return data;
  })().catch((error) => {
    state.retryAt = Date.now() + FRESH_MS;
    if (usable(state.entry)) return state.entry.data;
    throw error;
  }).finally(() => { state.pending = null; });
  return state.pending;
}

export async function cachedReviews(env, ctx, build) {
  const state = reviewState(env);
  if (!usable(state.entry)) {
    // Coalesce cold snapshot lookups as well as rebuilding inside this isolate.
    if (!state.loading) state.loading = readSnapshot(env).finally(() => { state.loading = null; });
    state.entry = await state.loading;
  }
  if (usable(state.entry) && state.entry.freshUntil > Date.now()) return state.entry.data;
  if (usable(state.entry) && ctx?.waitUntil) {
    ctx.waitUntil(refresh(env, state, build).catch(() => {}));
    return state.entry.data;
  }
  return refresh(env, state, build);
}

export async function invalidateReviews(env) {
  const state = reviewState(env);
  // Drain any older local build before invalidating; never copy pending data.
  await state.loading?.catch(() => {});
  await state.pending?.catch(() => {});
  state.entry = null;
  state.retryAt = 0;
  try { await env.REVIEWS_KV.delete(SNAPSHOT_KEY); } catch { /* TTL bounds stale data. */ }
  try { await edgeCache()?.delete(new Request(CACHE_URL)); } catch { /* TTL bounds stale data. */ }
}
