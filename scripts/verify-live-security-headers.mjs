import { pathToFileURL } from 'node:url';

export function preventsFraming(headers) {
  // An enforced frame-ancestors directive overrides X-Frame-Options. In a
  // policy the first duplicate directive wins; multiple policies all apply.
  const policies = (headers.get('Content-Security-Policy') || '').split(',');
  const ancestors = policies.map(policy => policy.split(';').map(s => s.trim())
    .find(s => /^frame-ancestors(?:\s|$)/i.test(s))).filter(Boolean);
  if (ancestors.length) return ancestors.some(s => /^frame-ancestors\s+'none'\s*$/i.test(s));
  return /^DENY$/i.test((headers.get('X-Frame-Options') || '').trim());
}

export async function verifyHeaders(baseUrl, fetcher = fetch) {
  const base = new URL(baseUrl);
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) {
    throw new Error('BASE_URL must be an HTTPS URL without credentials, query, or fragment');
  }
  const results = [];
  for (const page of ['contact.html', 'reviews.html']) {
    const url = new URL(page, base.origin + '/');
    const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(15_000) });
    const result = {
      url: url.href, status: response.status,
      protected: response.ok && preventsFraming(response.headers),
      csp: response.headers.get('Content-Security-Policy'),
      xFrameOptions: response.headers.get('X-Frame-Options'),
    };
    await response.body?.cancel();
    results.push(result);
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const results = await verifyHeaders(process.env.BASE_URL || 'https://epictech.club');
    console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
    if (results.some(r => !r.protected)) process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
