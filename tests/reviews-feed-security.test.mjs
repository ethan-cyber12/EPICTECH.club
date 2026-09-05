import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import worker from '../worker/src/index.js';

const originalFetch = globalThis.fetch;
const originalCaches = globalThis.caches;
const originalNow = Date.now;
let now;
let edge;
test.beforeEach(() => {
  now = 1_800_000_000_000;
  Date.now = () => now;
  edge = new Map();
  globalThis.caches = { default: {
    async match(req) { return edge.get(req.url)?.clone(); },
    async put(req, response) {
      assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
      assert.equal(response.headers.get('Set-Cookie'), null);
      edge.set(req.url, response.clone());
    },
    async delete(req) { return edge.delete(req.url); },
  }};
  globalThis.fetch = async () => { throw new Error('Unexpected external request'); };
});
test.afterEach(() => { globalThis.fetch = originalFetch; globalThis.caches = originalCaches; Date.now = originalNow; });

function fixture() {
  const records = new Map();
  for (let i = 0; i < 200; i++) records.set('review:published:' + i, JSON.stringify({id:String(i),name:'Public name',rating:5,text:'Public text',submittedAt:'2026-09-01',email:'private@example.test',clientHash:'private-hash'}));
  const counts = {get:0,list:0,put:0,google:0};
  const limiterCalls=[];
  const env = {
    ALLOWED_ORIGINS:'https://epictech.club,https://www.epictech.club',
    INTAKE_HMAC_SECRET:'synthetic-intake-secret', REVIEW_APPROVAL_SECRET:'synthetic-approval-secret',
    REVIEWS_FEED_RATE_LIMITER:{async limit({key}) {limiterCalls.push(key);return {success:true};}},
    REVIEWS_KV:{
      async get(key) {counts.get++;return records.get(key) ?? null;},
      async list({prefix,limit}) {counts.list++;return {keys:[...records.keys()].filter(k=>k.startsWith(prefix)).slice(0,limit).map(name=>({name}))};},
      async put(key,value) {counts.put++;records.set(key,value);},
      async delete(key) {records.delete(key);},
    },
  };
  return {env,records,counts,limiterCalls};
}
function request(origin='https://epictech.club',suffix='',headers={}) {
  return new Request('https://intake.epictech.club/reviews'+suffix,{headers:{'CF-Connecting-IP':'203.0.113.7',...(origin?{Origin:origin}:{}),...headers}});
}
function google(f, fail=false) {
  f.env.GOOGLE_PLACES_API_KEY='synthetic-key';f.env.GOOGLE_PLACE_ID='synthetic-place';
  globalThis.fetch=async (_url,init) => {
    f.counts.google++;
    assert.ok(init.signal instanceof AbortSignal);
    return Response.json(fail?{status:'OVER_QUERY_LIMIT'}:{status:'OK',result:{rating:4.5,user_ratings_total:2,reviews:[]}});
  };
}

test('feed denials, missing bindings, missing HMAC and missing trusted IP perform no backend work',async()=>{
  for(const mode of ['deny','missing','throws','malformed','hmac','ip']) {
    const f=fixture();google(f);
    if(mode==='deny') f.env.REVIEWS_FEED_RATE_LIMITER.limit=async()=>({success:false});
    if(mode==='missing') delete f.env.REVIEWS_FEED_RATE_LIMITER;
    if(mode==='throws') f.env.REVIEWS_FEED_RATE_LIMITER.limit=async()=>{throw new Error('offline');};
    if(mode==='malformed') f.env.REVIEWS_FEED_RATE_LIMITER.limit=async()=>({success:'true'});
    if(mode==='hmac') delete f.env.INTAKE_HMAC_SECRET;
    const req=request();if(mode==='ip') req.headers.delete('CF-Connecting-IP');
    const response=await worker.fetch(req,f.env);
    assert.equal(response.status,mode==='deny'?429:503,mode);
    assert.equal(response.headers.get('Cache-Control'),'no-store');
    assert.deepEqual(f.counts,{get:0,list:0,put:0,google:0});
  }
});

test('repeated feed requests share public data, preserve CORS and ignore cache-busting inputs',async()=>{
  const f=fixture();google(f);
  let firstCounts;
  for(const [i,origin] of ['https://epictech.club','https://www.epictech.club','https://evil.example',''].entries()) {
    const res=await worker.fetch(request(origin,'?nonce='+i,{'User-Agent':'agent-'+i,'Cache-Control':'no-cache'}),f.env);
    assert.equal(res.status,200);
    assert.equal(res.headers.get('Access-Control-Allow-Origin'),i<2?origin:null);
    assert.equal(res.headers.get('Vary'),'Origin');
    assert.match(res.headers.get('Cache-Control'),/^public/);
    const body=await res.json();assert.equal(body.onsite.length,200);
    assert.ok(!JSON.stringify(body).includes('private'));
    if(i===0) firstCounts={...f.counts}; else assert.deepEqual(f.counts,firstCounts);
  }
  assert.equal(f.counts.list,1);assert.equal(f.counts.google,1);assert.equal(edge.size,1);
  const ipKeys=f.limiterCalls.filter(k=>k!=='reviews-refresh:v1');
  assert.equal(new Set(ipKeys).size,1);assert.match(ipKeys[0],/^[a-f0-9]{64}$/);
});

test('cold concurrent requests coalesce; fresh snapshots serve another environment without a fan-out',async()=>{
  const f=fixture();google(f);
  const responses=await Promise.all(Array.from({length:12},()=>worker.fetch(request(),f.env)));
  assert.ok(responses.every(r=>r.status===200));assert.equal(f.counts.list,1);assert.equal(f.counts.google,1);
  const before={...f.counts};
  assert.equal((await worker.fetch(request(),{...f.env})).status,200);
  assert.deepEqual(f.counts,before);
  edge.clear();
  assert.equal((await worker.fetch(request(),{...f.env})).status,200);
  assert.equal(f.counts.list,1);assert.equal(f.counts.get,before.get+1);
});

test('stale responses revalidate once per isolate using waitUntil and retain last good data on failure',async()=>{
  const f=fixture();google(f);await worker.fetch(request(),f.env);
  now+=61_000;
  let release;const gate=new Promise(resolve=>{release=resolve;});
  f.env.REVIEWS_KV.list=async()=>{f.counts.list++;await gate;throw new Error('KV unavailable');};
  const pending=[];const ctx={waitUntil(p){pending.push(p);}};
  const responses=await Promise.all(Array.from({length:8},()=>worker.fetch(request(),f.env,ctx)));
  assert.ok(responses.every(r=>r.status===200));assert.equal(f.counts.list,2);
  release();await Promise.all(pending);
  assert.equal((await worker.fetch(request(),f.env)).status,200);assert.equal(f.counts.list,2);
  now+=301_000;
  assert.equal((await worker.fetch(request(),f.env)).status,503);
});

test('Google failures preserve stale success and shared retry backoff across cold environments',async()=>{
  const f=fixture();google(f,true);
  f.records.set('google:reviews',JSON.stringify({fetchedAt:Math.floor(now/1000)-90_000,data:{rating:4,reviews:[]}}));
  const first=await (await worker.fetch(request(),f.env)).json();assert.equal(first.google.rating,4);
  assert.equal(f.counts.google,1);assert.ok(f.records.has('google:reviews:retry'));
  now+=61_000;edge.clear();f.records.delete('reviews:feed:v1');
  const second=await (await worker.fetch(request(),{...f.env})).json();
  assert.equal(second.google.rating,4);assert.equal(f.counts.google,1);
  now+=301_000;edge.clear();f.records.delete('reviews:feed:v1');
  await worker.fetch(request(),{...f.env});assert.equal(f.counts.google,2);
});

test('successful Google fetch with failed cache writes still backs off locally',async()=>{
  const f=fixture();google(f);f.env.REVIEWS_KV.put=async()=>{throw new Error('write unavailable');};
  await worker.fetch(request(),f.env);now+=61_000;
  const body=await (await worker.fetch(request(),f.env)).json();
  assert.equal(body.google.rating,4.5);assert.equal(f.counts.google,1);
  now+=301_000;google(f,true);
  const afterRetry=await (await worker.fetch(request(),f.env)).json();
  assert.equal(afterRetry.google.rating,4.5);assert.equal(f.counts.google,2);
});

test('Google timeout aborts the upstream request and returns stale data',async()=>{
  const f=fixture();google(f);
  f.records.set('google:reviews',JSON.stringify({fetchedAt:1,data:{rating:3,reviews:[]}}));
  globalThis.fetch=(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}));
  const body=await (await worker.fetch(request(),f.env)).json();assert.equal(body.google.rating,3);
  assert.ok(f.records.has('google:reviews:retry'));
});

test('global rebuild budget denial fails closed before published KV fan-out or Google',async()=>{
  const f=fixture();google(f);
  f.env.REVIEWS_FEED_RATE_LIMITER.limit=async({key})=>({success:key!=='reviews-refresh:v1'});
  const res=await worker.fetch(request(),f.env);assert.equal(res.status,503);
  assert.equal(f.counts.list,0);assert.equal(f.counts.google,0);
});

test('approval invalidates caches and publishes only public fields; reject never publishes',async()=>{
  const f=fixture();f.records.clear();await worker.fetch(request(),f.env);
  for(const action of ['approve','reject']) {
    const id=action==='approve'?'12345678-1234-4123-8123-123456789abc':'12345678-1234-4123-8123-123456789abd';
    const expiresAt=Math.floor(now/1000)+3600;
    f.records.set('review:pending:'+id,JSON.stringify({id,name:'Approved name',rating:5,text:'Approved text',submittedAt:'2026-09-04',expiresAt,email:'private@example.test',clientHash:'private-hash'}));
    const sig=createHmac('sha256',f.env.REVIEW_APPROVAL_SECRET).update(id+'.'+action+'.'+expiresAt).digest('hex');
    const url='https://intake.epictech.club/review-'+action+'?id='+id+'&sig='+sig;
    const preview=await worker.fetch(new Request(url),f.env);assert.equal(preview.status,200);
    assert.ok(f.records.has('review:pending:'+id));assert.ok(!f.records.has('review:published:'+id));
    const result=await worker.fetch(new Request(url,{method:'POST',body:new URLSearchParams({id,sig})}),f.env);
    assert.equal(result.status,200);assert.equal(result.headers.get('Cache-Control'),'no-store');
    assert.ok(!f.records.has('review:pending:'+id));
    assert.equal(f.records.has('review:published:'+id),action==='approve');
  }
  const body=await (await worker.fetch(request(),f.env)).json();assert.equal(body.onsite.length,1);
  assert.ok(!JSON.stringify(body).includes('private'));assert.ok(!JSON.stringify(body).includes('expiresAt'));
});

test('OPTIONS and unsupported methods do no work; absent KV preserves empty-feed contract',async()=>{
  const f=fixture();
  for(const method of ['OPTIONS','PUT']) {
    const res=await worker.fetch(new Request('https://intake.epictech.club/reviews',{method}),f.env);
    assert.equal(res.status,method==='OPTIONS'?204:405);
  }
  assert.deepEqual(f.counts,{get:0,list:0,put:0,google:0});
  delete f.env.REVIEWS_KV;
  assert.deepEqual(await (await worker.fetch(request(),f.env)).json(),{google:null,onsite:[]});
});
