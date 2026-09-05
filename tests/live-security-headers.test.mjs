import assert from 'node:assert/strict';
import test from 'node:test';
import { preventsFraming, verifyHeaders } from '../scripts/verify-live-security-headers.mjs';

test('anti-framing check requires enforced protection and respects CSP precedence', () => {
  for (const [headers, expected] of [
    [{}, false],
    [{'Content-Security-Policy-Report-Only': "frame-ancestors 'none'"}, false],
    [{'Content-Security-Policy': "frame-ancestors 'none'"}, true],
    [{'X-Frame-Options': 'DENY'}, true],
    [{'Content-Security-Policy': "frame-ancestors *",'X-Frame-Options':'DENY'}, false],
    [{'Content-Security-Policy': "frame-ancestors *; frame-ancestors 'none'"}, false],
    [{'Content-Security-Policy': "default-src 'self', frame-ancestors 'none'"}, true],
  ]) assert.equal(preventsFraming(new Headers(headers)),expected);
});

test('live verifier checks both form pages without following redirects', async () => {
  const calls=[];
  const results=await verifyHeaders('https://epictech.club',async(url,options)=>{
    calls.push(String(url));assert.equal(options.redirect,'error');
    return new Response('',{headers:{'Content-Security-Policy':"frame-ancestors 'none'"}});
  });
  assert.deepEqual(calls,['https://epictech.club/contact.html','https://epictech.club/reviews.html']);
  assert.ok(results.every(r=>r.protected));
});
