import { cachedReviews, invalidateReviews, reviewState } from './reviews-cache.js';

const INTAKE_PATH = "/lead-intake";
const MAX_BODY_BYTES = 10000;

const REVIEW_INTAKE_PATH = "/review-intake";
const REVIEWS_PATH = "/reviews";
const REVIEW_APPROVE_PATH = "/review-approve";
const REVIEW_REJECT_PATH = "/review-reject";

const MAX_REVIEW_BODY_BYTES = 16000;
const REVIEW_TTL_SECONDS = 30 * 24 * 3600;
const STAGING_TTL_SECONDS = 60 * 60;
const GOOGLE_CACHE_TTL_SECONDS = 24 * 3600;
const MAX_TURNSTILE_TOKEN_LENGTH = 2048;
const TURNSTILE_HOSTNAMES = new Set(["epictech.club", "www.epictech.club"]);
const STAGING_TURNSTILE_HOSTNAMES = new Set(["example.com"]);
const STAGING_WORKER_ORIGIN = "https://epictech-emailer-staging.ethanplatt0120.workers.dev";
const TURNSTILE_ACTIONS = Object.freeze({
  [INTAKE_PATH]: "lead_intake",
  [REVIEW_INTAKE_PATH]: "review_intake",
});

const ALLOWED_SERVICES = [
  "Website Launch",
  "Website Refresh",
  "Business Apps & Dashboards",
  "Network & Wi-Fi",
  "Firewall & Security",
  "Automation",
  "E-Commerce",
  "Monthly Support",
  "Not sure yet",
];

export default {
  async fetch(request, env, ctx) {
    if (isStaging(env)) {
      if (!hasValidStagingConfiguration(request, env)) {
        return new Response("Service unavailable", {
          status: 503,
          headers: { "Cache-Control": "no-store" },
        });
      }
      if (request.method !== "OPTIONS" && !hasStagingAccess(request, env)) {
        return new Response("Not found", {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        });
      }
    }

    const url = new URL(request.url);
    switch (url.pathname) {
      case INTAKE_PATH:
        return handleLeadIntake(request, env);
      case REVIEW_INTAKE_PATH:
        return handleReviewIntake(request, env);
      case REVIEWS_PATH:
        return handleReviewsFeed(request, env, ctx);
      case REVIEW_APPROVE_PATH:
        return handleReviewAction(request, env, "approve");
      case REVIEW_REJECT_PATH:
        return handleReviewAction(request, env, "reject");
      default:
        return new Response("Not found", { status: 404 });
    }
  },

};

async function handleLeadIntake(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (request.method === "OPTIONS") {
    if (!allowed.includes(origin)) {
      return json({ error: "Forbidden" }, 403, origin, allowed);
    }
    return new Response(null, {
      status: 204,
      headers: cors(origin, allowed, undefined, isStaging(env)),
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, origin, allowed);
  }

  if (!allowed.includes(origin)) {
    return json({ error: "Forbidden" }, 403, origin, allowed);
  }

  if (!isJsonRequest(request)) {
    return json({ error: "Unsupported media type" }, 415, origin, allowed);
  }
  const parsed = await readJsonObject(request, MAX_BODY_BYTES);
  if (!parsed.ok) {
    return json({ error: parsed.error }, parsed.status, origin, allowed);
  }
  const body = parsed.body;

  if (String(body._hp || "").trim().length > 0) {
    return json({ ok: true }, 200, origin, allowed);
  }

  const name = clean(body.name, 80);
  const business = clean(body.business != null ? body.business : body.businessName, 80);
  const email = clean(body.email, 120).toLowerCase();
  const phone = clean(body.phone, 30);
  const service = clean(body.service, 80);
  const message = clean(body.message, 900);
  const sourcePage = clean(body.sourcePage, 200);

  if (!name) return json({ error: "Name is required" }, 422, origin, allowed);
  if (!isEmail(email)) return json({ error: "Valid email is required" }, 422, origin, allowed);
  if (!ALLOWED_SERVICES.includes(service)) {
    return json({ error: "Invalid service selection" }, 422, origin, allowed);
  }
  if (message.length < 20) {
    return json({ error: "Message too short" }, 422, origin, allowed);
  }

  const token = getTurnstileToken(body);
  if (!token || token.length > MAX_TURNSTILE_TOKEN_LENGTH) {
    return json({ error: "Verification failed" }, 403, origin, allowed);
  }
  const ip = request.headers.get("CF-Connecting-IP") || "";
  if (!ip) {
    return json({ error: "Service unavailable" }, 503, origin, allowed);
  }
  const ua = request.headers.get("User-Agent") || "";
  let clientHash;
  let rateLimitKey;
  try {
    clientHash = await hmac(env.INTAKE_HMAC_SECRET, ip + "|" + ua);
    rateLimitKey = await hmac(env.INTAKE_HMAC_SECRET, "rate-limit|" + ip);
  } catch {
    return json({ error: "Service unavailable" }, 503, origin, allowed);
  }

  const rateLimit = await checkRateLimit(env.LEAD_RATE_LIMITER, rateLimitKey);
  if (rateLimit !== "allowed") {
    return rateLimitError(rateLimit, origin, allowed);
  }

  if (!(await verifyTurnstile(
    turnstileSecret(env),
    token,
    ip,
    turnstileExpectedAction(env, INTAKE_PATH),
    turnstileHostnames(env)
  ))) {
    return json({ error: "Verification failed" }, 403, origin, allowed);
  }

  const submittedAt = new Date().toISOString();
  const text =
    "New lead from the EPIC TECH website.\n\n" +
    "Name:     " + name + "\n" +
    "Business: " + (business || "-") + "\n" +
    "Email:    " + email + "\n" +
    "Phone:    " + (phone || "-") + "\n" +
    "Service:  " + service + "\n" +
    "Page:     " + (sourcePage || "-") + "\n" +
    "Time:     " + submittedAt + "\n" +
    "Client:   " + clientHash + "\n\n" +
    "Message:\n" + message + "\n";

  try {
    await sendEmail(env, {
      from: env.NOTIFY_FROM || "noreply@epictech.club",
      to: env.NOTIFY_TO || "epictechllc@yahoo.com",
      replyTo: email,
      subject: "New lead: " + (business || name) + " (" + service + ")",
      text: text,
    });
  } catch (err) {
    console.log("intake email failed:", err && err.message);
    return json({ error: "Could not deliver message" }, 500, origin, allowed);
  }

  return json({ ok: true }, 200, origin, allowed);
}

async function handleReviewIntake(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const methods = "POST, OPTIONS";

  if (request.method === "OPTIONS") {
    if (!allowed.includes(origin)) {
      return json({ error: "Forbidden" }, 403, origin, allowed, methods);
    }
    return new Response(null, {
      status: 204,
      headers: cors(origin, allowed, methods, isStaging(env)),
    });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, origin, allowed, methods);
  }
  if (!allowed.includes(origin)) {
    return json({ error: "Forbidden" }, 403, origin, allowed, methods);
  }
  if (!isJsonRequest(request)) {
    return json({ error: "Unsupported media type" }, 415, origin, allowed, methods);
  }

  const parsed = await readJsonObject(request, MAX_REVIEW_BODY_BYTES);
  if (!parsed.ok) {
    return json({ error: parsed.error }, parsed.status, origin, allowed, methods);
  }
  const body = parsed.body;

  if (String(body._hp || "").trim().length > 0) {
    return json({ ok: true }, 200, origin, allowed, methods);
  }

  const name = clean(body.name, 100);
  const email = clean(body.email, 254).toLowerCase();
  const text = cleanReviewText(body.text, 2000);
  const ratingNum = Number(body.rating);

  if (name.length < 2) {
    return json({ error: "Name must be at least 2 characters" }, 422, origin, allowed, methods);
  }
  if (!isEmail(email) || email.length > 254) {
    return json({ error: "Valid email is required" }, 422, origin, allowed, methods);
  }
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return json({ error: "Rating must be an integer from 1 to 5" }, 422, origin, allowed, methods);
  }
  if (text.length < 10) {
    return json({ error: "Review must be at least 10 characters" }, 422, origin, allowed, methods);
  }

  const token = getTurnstileToken(body);
  if (!token || token.length > MAX_TURNSTILE_TOKEN_LENGTH) {
    return json({ error: "Verification failed" }, 403, origin, allowed, methods);
  }
  const ip = request.headers.get("CF-Connecting-IP") || "";
  if (!ip) {
    return json({ error: "Service unavailable" }, 503, origin, allowed, methods);
  }
  const ua = request.headers.get("User-Agent") || "";
  let clientHash;
  let rateLimitKey;
  try {
    clientHash = await hmac(env.INTAKE_HMAC_SECRET, ip + "|" + ua);
    rateLimitKey = await hmac(env.INTAKE_HMAC_SECRET, "rate-limit|" + ip);
  } catch {
    return json({ error: "Service unavailable" }, 503, origin, allowed, methods);
  }

  const rateLimit = await checkRateLimit(env.REVIEW_RATE_LIMITER, rateLimitKey);
  if (rateLimit !== "allowed") {
    return rateLimitError(rateLimit, origin, allowed, methods);
  }

  if (!(await verifyTurnstile(
    turnstileSecret(env),
    token,
    ip,
    turnstileExpectedAction(env, REVIEW_INTAKE_PATH),
    turnstileHostnames(env)
  ))) {
    return json({ error: "Verification failed" }, 403, origin, allowed, methods);
  }

  if (!env.REVIEWS_KV) {
    console.log("REVIEWS_KV not bound — cannot accept review submissions.");
    return json({ error: "Reviews are temporarily unavailable" }, 503, origin, allowed, methods);
  }

  const id = crypto.randomUUID();
  const submittedAt = new Date().toISOString();
  const reviewTtl = isStaging(env) ? STAGING_TTL_SECONDS : REVIEW_TTL_SECONDS;
  const expiresAt = Math.floor(Date.now() / 1000) + reviewTtl;
  const pendingKey = "review:pending:" + id;
  let approveSig;
  let rejectSig;
  try {
    approveSig = await signReviewAction(env.REVIEW_APPROVAL_SECRET, id, "approve", expiresAt);
    rejectSig = await signReviewAction(env.REVIEW_APPROVAL_SECRET, id, "reject", expiresAt);
  } catch {
    return json({ error: "Reviews are temporarily unavailable" }, 503, origin, allowed, methods);
  }

  const record = {
    id: id,
    name: name,
    email: email,
    rating: ratingNum,
    text: text,
    clientHash: clientHash,
    submittedAt: submittedAt,
    expiresAt: expiresAt,
  };

  try {
    await env.REVIEWS_KV.put(pendingKey, JSON.stringify(record), {
      expirationTtl: reviewTtl,
    });
  } catch (err) {
    console.log("Failed to store pending review:", err && err.message);
    return json({ error: "Could not save review" }, 500, origin, allowed, methods);
  }

  const base = isStaging(env)
    ? new URL(request.url).origin
    : "https://intake.epictech.club";
  const approveUrl = base + REVIEW_APPROVE_PATH + "?id=" + id + "&sig=" + approveSig;
  const rejectUrl = base + REVIEW_REJECT_PATH + "?id=" + id + "&sig=" + rejectSig;

  const emailFields = {
    name: name,
    email: email,
    rating: ratingNum,
    text: text,
    clientHash: clientHash,
    submittedAt: submittedAt,
    approveUrl: approveUrl,
    rejectUrl: rejectUrl,
  };

  try {
    await sendEmail(env, {
      from: env.NOTIFY_FROM || "noreply@epictech.club",
      to: env.NOTIFY_TO || "epictechllc@yahoo.com",
      replyTo: email,
      subject: "New review pending approval (" + ratingNum + "/5, " + name + ")",
      text: buildReviewEmailText(emailFields),
      html: buildReviewEmailHtml(emailFields),
    });
  } catch (err) {
    console.log("review notification email failed:", err && err.message);
    try {
      await env.REVIEWS_KV.delete(pendingKey);
    } catch (cleanupErr) {
      console.log("Failed to roll back pending review after email failure:", cleanupErr && cleanupErr.message);
    }
    return json({ error: "Could not deliver notification" }, 500, origin, allowed, methods);
  }

  return json({ ok: true }, 200, origin, allowed, methods);
}

async function handleReviewsFeed(request, env, ctx) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const methods = "GET, OPTIONS";

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: cors(origin, allowed, methods, isStaging(env)),
    });
  }
  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405, origin, allowed, methods);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "";
  let key;
  try {
    if (!ip) throw new Error("Missing trusted client IP");
    key = await hmac(env.INTAKE_HMAC_SECRET, "reviews-feed|" + ip);
  } catch {
    return json({ error: "Service unavailable" }, 503, origin, allowed, methods);
  }
  const decision = await checkRateLimit(env.REVIEWS_FEED_RATE_LIMITER, key);
  if (decision !== "allowed") return rateLimitError(decision, origin, allowed, methods);

  try {
    const data = isStaging(env) || !env.REVIEWS_KV
      ? await buildReviewsFeed(env)
      : await cachedReviews(env, ctx, () => buildReviewsFeed(env));
    const response = json(data, 200, origin, allowed, methods);
    if (!isStaging(env)) response.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=240");
    return response;
  } catch {
    return json({ error: "Reviews are temporarily unavailable" }, 503, origin, allowed, methods);
  }
}

async function buildReviewsFeed(env) {
  const onsite = [];
  if (env.REVIEWS_KV) {
    try {
      const list = await env.REVIEWS_KV.list({ prefix: "review:published:", limit: 200 });
      for (const k of list.keys) {
        const raw = await env.REVIEWS_KV.get(k.name);
        if (!raw) continue;
        try {
          const item = JSON.parse(raw);
          if (!item || typeof item !== "object") continue;
          onsite.push({ id: item.id, name: item.name, rating: item.rating, text: item.text, submittedAt: item.submittedAt });
        } catch {
          /* skip corrupt entry */
        }
      }
      onsite.sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));
    } catch (err) {
      // Do not cache an incomplete list as a successful fresh feed.
      throw new Error("Published reviews unavailable");
    }
  }

  const google = env.REVIEWS_KV ? await getGoogleReviews(env) : null;

  return { google: google, onsite: onsite };
}

async function getGoogleReviews(env) {
  if (isStaging(env)) return null;

  const state = reviewState(env);
  if (state.googlePending) return state.googlePending;
  state.googlePending = refreshGoogleReviews(env, state).finally(() => { state.googlePending = null; });
  return state.googlePending;
}

async function refreshGoogleReviews(env, state) {

  const cacheKey = "google:reviews";
  let cached = null;
  try {
    const raw = await env.REVIEWS_KV.get(cacheKey);
    if (raw) cached = JSON.parse(raw);
  } catch {
    /* ignore corrupt cache entry, treat as no cache */
  }

  const now = Math.floor(Date.now() / 1000);
  if (cached && now - (cached.fetchedAt || 0) < GOOGLE_CACHE_TTL_SECONDS) {
    return cached.data;
  }

  if (!env.GOOGLE_PLACES_API_KEY || !env.GOOGLE_PLACE_ID) {
    return cached ? cached.data : null;
  }

  if (state.googleRetryAt > Date.now()) return state.googleData || (cached ? cached.data : null);
  try {
    const retryAt = Number(await env.REVIEWS_KV.get("google:reviews:retry"));
    if (retryAt > Date.now()) {
      state.googleRetryAt = retryAt;
      return cached ? cached.data : null;
    }
  } catch { /* A shared refresh budget and local backoff still bound retries. */ }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  // Retain this local backoff even if all KV writes fail.
  state.googleRetryAt = Date.now() + 300_000;

  try {
    const apiUrl =
      "https://maps.googleapis.com/maps/api/place/details/json" +
      "?place_id=" + encodeURIComponent(env.GOOGLE_PLACE_ID) +
      "&fields=rating,user_ratings_total,reviews" +
      "&key=" + encodeURIComponent(env.GOOGLE_PLACES_API_KEY);
    const res = await fetch(apiUrl, { signal: controller.signal });
    if (!res.ok) throw new Error("Places API unavailable");
    const out = await res.json();
    if (out.status !== "OK" || !out.result) {
      throw new Error("Places API status: " + out.status);
    }
    const result = out.result;
    const data = {
      rating: typeof result.rating === "number" ? result.rating : null,
      totalRatings: typeof result.user_ratings_total === "number" ? result.user_ratings_total : null,
      reviews: (result.reviews || []).slice(0, 5).map((r) => ({
        author: clean(r.author_name, 80),
        rating: typeof r.rating === "number" ? r.rating : null,
        text: cleanReviewText(r.text, 600),
        relativeTime: clean(r.relative_time_description, 40),
      })),
      googleReviewUrl:
        "https://search.google.com/local/writereview?placeid=" + encodeURIComponent(env.GOOGLE_PLACE_ID),
    };
    state.googleData = data;
    try {
      await env.REVIEWS_KV.put(cacheKey, JSON.stringify({ fetchedAt: now, data: data }));
    } catch (err) {
      console.log("Failed to cache Google reviews");
    }
    return data;
  } catch (err) {
    try {
      await env.REVIEWS_KV.put("google:reviews:retry", String(state.googleRetryAt), { expirationTtl: 300 });
    } catch { /* Local backoff remains active if KV is unavailable. */ }
    console.log("Google Places unavailable; serving existing cache");
    return state.googleData || (cached ? cached.data : null);
  } finally {
    clearTimeout(timer);
  }
}

async function handleReviewAction(request, env, action) {
  const url = new URL(request.url);
  const id = String(url.searchParams.get("id") || "");
  const sig = String(url.searchParams.get("sig") || "");

  if (request.method !== "GET" && request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!isReviewActionInput(id, sig) || !env.REVIEWS_KV) {
    return htmlPage("Invalid link", "<p>This link is missing required information.</p>", 400);
  }

  const pendingKey = "review:pending:" + id;
  const raw = await env.REVIEWS_KV.get(pendingKey);
  if (!raw) {
    return htmlPage(
      "Already processed",
      "<p>This review has already been approved or rejected, or the link has expired.</p>",
      200
    );
  }

  let record;
  try {
    record = JSON.parse(raw);
  } catch {
    return htmlPage("Error", "<p>This review record is corrupted and cannot be processed.</p>", 500);
  }

  const now = Math.floor(Date.now() / 1000);
  const validSig = await verifyReviewAction(env.REVIEW_APPROVAL_SECRET, id, action, record.expiresAt, sig);
  if (!validSig || now > record.expiresAt) {
    return htmlPage("Invalid or expired link", "<p>This link is invalid or has expired.</p>", 403);
  }

  if (request.method === "GET") {
    return confirmPage(action, record, id, sig);
  }

  const form = await request.formData().catch(() => null);
  const postedId = form ? String(form.get("id") || "") : "";
  const postedSig = form ? String(form.get("sig") || "") : "";
  if (postedId !== id || postedSig !== sig) {
    return htmlPage("Invalid request", "<p>This confirmation could not be verified. Please use the link from your email again.</p>", 400);
  }

  if (action === "approve") {
    const published = {
      id: record.id,
      name: record.name,
      rating: record.rating,
      text: record.text,
      submittedAt: record.submittedAt,
    };
    try {
      await env.REVIEWS_KV.put(
        "review:published:" + id,
        JSON.stringify(published),
        isStaging(env) ? { expirationTtl: STAGING_TTL_SECONDS } : undefined
      );
      if (!isStaging(env)) await invalidateReviews(env);
    } catch (err) {
      console.log("Failed to publish review:", err && err.message);
      return htmlPage("Error", "<p>Could not publish this review. Please try again.</p>", 500);
    }
  }

  await env.REVIEWS_KV.delete(pendingKey);

  return htmlPage(
    action === "approve" ? "Review approved" : "Review rejected",
    action === "approve"
      ? "<p>This review is now live on epictech.club.</p>"
      : "<p>This review has been discarded.</p>",
    200
  );
}

function confirmPage(action, record, id, sig) {
  const stars = "★".repeat(record.rating) + "☆".repeat(5 - record.rating);
  const verb = action === "approve" ? "Approve" : "Reject";
  const body =
    "<p><strong>" + escapeHtml(record.name) + "</strong> &mdash; " + stars + "</p>" +
    "<p>" + escapeHtml(record.text) + "</p>" +
    "<form method=\"POST\">" +
    "<input type=\"hidden\" name=\"id\" value=\"" + escapeHtml(id) + "\">" +
    "<input type=\"hidden\" name=\"sig\" value=\"" + escapeHtml(sig) + "\">" +
    "<button type=\"submit\">Confirm " + verb + "</button>" +
    "</form>";
  return htmlPage("Confirm: " + verb + " this review?", body, 200);
}

function htmlPage(title, bodyHtml, status) {
  const contentSecurityPolicy =
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; " +
    "frame-ancestors 'none'; form-action 'self'";
  const page =
    "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
    "<meta http-equiv=\"Content-Security-Policy\" content=\"" + contentSecurityPolicy + "\">" +
    "<title>" + escapeHtml(title) + "</title></head><body>" +
    "<h1>" + escapeHtml(title) + "</h1>" + bodyHtml +
    "</body></html>";
  return new Response(page, {
    status: status || 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": contentSecurityPolicy,
      "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function cors(origin, allowed, methods, allowStagingHeader) {
  const h = {
    "Vary": "Origin",
    "Access-Control-Allow-Methods": methods || "POST, OPTIONS",
    "Access-Control-Allow-Headers": allowStagingHeader
      ? "Content-Type, X-Epictech-Staging-Key"
      : "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  if (allowed.length && allowed.includes(origin)) {
    h["Access-Control-Allow-Origin"] = origin;
  }
  return h;
}

function json(obj, status, origin, allowed, methods) {
  return new Response(JSON.stringify(obj), {
    status: status,
    headers: Object.assign(
      {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      cors(origin, allowed, methods)
    ),
  });
}

function isJsonRequest(request) {
  const mediaType = (request.headers.get("Content-Type") || "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
  return mediaType === "application/json";
}

async function readJsonObject(request, maxBytes) {
  const declaredLength = request.headers.get("Content-Length");
  if (
    declaredLength &&
    /^\d+$/.test(declaredLength) &&
    Number(declaredLength) > maxBytes
  ) {
    return { ok: false, status: 413, error: "Payload too large" };
  }

  if (!request.body) {
    return { ok: false, status: 400, error: "Invalid JSON" };
  }

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => {});
        return { ok: false, status: 413, error: "Payload too large" };
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { ok: false, status: 400, error: "Invalid JSON" };
    }
    return { ok: true, body: body };
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON" };
  }
}

function getTurnstileToken(body) {
  const token = typeof body.token === "string" ? body.token : "";
  const alias =
    typeof body["cf-turnstile-response"] === "string"
      ? body["cf-turnstile-response"]
      : "";
  if (token && alias && token !== alias) return "";
  return token || alias;
}

function isReviewActionInput(id, sig) {
  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) &&
    /^[0-9a-f]{64}$/i.test(sig)
  );
}

async function checkRateLimit(limiter, key) {
  if (!limiter || typeof limiter.limit !== "function") return "unavailable";
  try {
    const result = await limiter.limit({ key: key });
    if (!result || typeof result.success !== "boolean") return "unavailable";
    return result.success ? "allowed" : "limited";
  } catch {
    return "unavailable";
  }
}

function rateLimitError(decision, origin, allowed, methods) {
  if (decision === "limited") {
    const response = json({ error: "Too many requests" }, 429, origin, allowed, methods);
    response.headers.set("Retry-After", "60");
    return response;
  }
  return json({ error: "Service unavailable" }, 503, origin, allowed, methods);
}

function stripControl(s) {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 32 || c === 127) continue;
    out += s[i];
  }
  return out;
}

function clean(value, max) {
  return stripControl(String(value == null ? "" : value))
    .replace(/[<>\`\\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanReviewText(value, max) {
  return stripControl(String(value == null ? "" : value))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isEmail(v) {
  return /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}$/.test(v);
}

function isStaging(env) {
  return env && env.ENVIRONMENT === "staging";
}

function hasValidStagingConfiguration(request, env) {
  let base;
  try {
    base = new URL(env.STAGING_BASE_URL);
  } catch {
    return false;
  }

  return (
    base.protocol === "https:" &&
    base.username === "" &&
    base.password === "" &&
    base.pathname === "/" &&
    base.search === "" &&
    base.hash === "" &&
    base.origin === env.STAGING_BASE_URL &&
    base.origin === STAGING_WORKER_ORIGIN &&
    new URL(request.url).origin === base.origin &&
    env.STAGING_TURNSTILE_TEST_MODE === "true" &&
    typeof env.INTAKE_HMAC_SECRET === "string" &&
    env.INTAKE_HMAC_SECRET.length >= 32 &&
    typeof env.REVIEW_APPROVAL_SECRET === "string" &&
    env.REVIEW_APPROVAL_SECRET.length >= 32 &&
    typeof env.STAGING_TURNSTILE_SECRET_KEY === "string" &&
    env.STAGING_TURNSTILE_SECRET_KEY.length > 0 &&
    typeof env.STAGING_ACCESS_TOKEN === "string" &&
    /^[0-9a-f]{64}$/.test(env.STAGING_ACCESS_TOKEN) &&
    env.REVIEWS_KV &&
    env.STAGING_EVENTS &&
    env.LEAD_RATE_LIMITER &&
    env.REVIEW_RATE_LIMITER &&
    env.REVIEWS_FEED_RATE_LIMITER
  );
}

function hasStagingAccess(request, env) {
  const expected = env.STAGING_ACCESS_TOKEN;
  const provided = request.headers.get("X-Epictech-Staging-Key") || "";
  return /^[0-9a-f]{64}$/.test(provided) && constantTimeEqual(provided, expected);
}

function constantTimeEqual(left, right) {
  const leftBytes = new TextEncoder().encode(String(left));
  const rightBytes = new TextEncoder().encode(String(right));
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;
  for (let i = 0; i < length; i++) {
    difference |= (leftBytes[i] || 0) ^ (rightBytes[i] || 0);
  }
  return difference === 0;
}

function turnstileHostnames(env) {
  return isStaging(env) && env.STAGING_TURNSTILE_TEST_MODE === "true"
    ? STAGING_TURNSTILE_HOSTNAMES
    : TURNSTILE_HOSTNAMES;
}

function turnstileSecret(env) {
  return isStaging(env) && env.STAGING_TURNSTILE_TEST_MODE === "true"
    ? env.STAGING_TURNSTILE_SECRET_KEY
    : env.TURNSTILE_SECRET_KEY;
}

function turnstileExpectedAction(env, path) {
  return isStaging(env) && env.STAGING_TURNSTILE_TEST_MODE === "true"
    ? null
    : TURNSTILE_ACTIONS[path];
}

async function verifyTurnstile(secret, token, ip, expectedAction, allowedHostnames) {
  if (
    typeof secret !== "string" ||
    !secret ||
    typeof token !== "string" ||
    !token ||
    token.length > MAX_TURNSTILE_TOKEN_LENGTH ||
    !(
      expectedAction === null ||
      (typeof expectedAction === "string" && expectedAction.length > 0)
    ) ||
    !(allowedHostnames instanceof Set)
  ) {
    return false;
  }

  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: form }
    );
    if (!res.ok) return false;

    const out = await res.json();
    return (
      out &&
      out.success === true &&
      typeof out.hostname === "string" &&
      allowedHostnames.has(out.hostname) &&
      (expectedAction === null ? out.action == null : out.action === expectedAction)
    );
  } catch {
    return false;
  }
}

async function hmac(secret, data) {
  if (typeof secret !== "string" || !secret) {
    throw new Error("HMAC secret is not configured");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function signReviewAction(secret, id, action, expiresAt) {
  return hmac(secret, id + "." + action + "." + expiresAt);
}

function hexToBytes(hex) {
  if (typeof hex !== "string" || !/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) {
    return null;
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

async function verifyReviewAction(secret, id, action, expiresAt, sigHex) {
  const sigBytes = hexToBytes(sigHex);
  if (!sigBytes || !secret) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    return await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(id + "." + action + "." + expiresAt)
    );
  } catch {
    return false;
  }
}

function buildReviewEmailText(r) {
  const stars = "*".repeat(r.rating) + "-".repeat(5 - r.rating);
  return (
    "New review pending approval on epictech.club.\n\n" +
    "Name:      " + r.name + "\n" +
    "Email:     " + r.email + "\n" +
    "Rating:    " + r.rating + "/5 (" + stars + ")\n" +
    "Submitted: " + r.submittedAt + "\n" +
    "Client:    " + r.clientHash + "\n\n" +
    "Review:\n" + r.text + "\n\n" +
    "Approve: " + r.approveUrl + "\n" +
    "Reject:  " + r.rejectUrl + "\n\n" +
    "Both links open a confirmation page first — nothing is approved or " +
    "rejected until you click Confirm there.\n"
  );
}

function buildReviewEmailHtml(r) {
  const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
  return (
    "<div>" +
    "<p>New review pending approval on epictech.club.</p>" +
    "<p><strong>" + escapeHtml(r.name) + "</strong> (" + escapeHtml(r.email) + ") &mdash; " + stars + "</p>" +
    "<p>" + escapeHtml(r.text) + "</p>" +
    "<p>Submitted: " + escapeHtml(r.submittedAt) + "<br>Client: " + escapeHtml(r.clientHash) + "</p>" +
    "<p><a href=\"" + r.approveUrl + "\">Review &amp; Approve</a> &nbsp;|&nbsp; " +
    "<a href=\"" + r.rejectUrl + "\">Review &amp; Reject</a></p>" +
    "<p>Both links open a confirmation page first &mdash; nothing is approved " +
    "or rejected until you click Confirm there.</p>" +
    "</div>"
  );
}

async function sendEmail(env, opts) {
  if (isStaging(env)) {
    await captureStagingEvent(env, "email", opts);
    return "staging-capture";
  }

  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const payload = {
    from: opts.from,
    to: [opts.to],
    subject: opts.subject,
    text: opts.text,
  };
  if (opts.replyTo) payload.reply_to = opts.replyTo;
  if (opts.html) payload.html = opts.html;

  let res;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (netErr) {
    throw new Error("Resend request failed: " + (netErr && netErr.message));
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body — handled below via status check */
  }

  if (!res.ok) {
    const detail =
      data && (data.message || data.name)
        ? (data.name || "error") + ": " + (data.message || "")
        : "HTTP " + res.status;
    console.log("Resend send failed:", res.status, detail);
    throw new Error("Resend send failed (" + detail + ")");
  }

  const id = data && data.id ? data.id : "(no id returned)";
  console.log("Email send completed. Resend id:", id);
  return id;
}

async function captureStagingEvent(env, type, payload) {
  if (!isStaging(env) || !env.STAGING_EVENTS) {
    throw new Error("Staging event capture is not configured");
  }

  const capturedAt = new Date().toISOString();
  const key = "staging:" + type + ":" + Date.now() + ":" + crypto.randomUUID();
  await env.STAGING_EVENTS.put(
    key,
    JSON.stringify({ type: type, capturedAt: capturedAt, payload: payload }),
    { expirationTtl: STAGING_TTL_SECONDS }
  );
  return key;
}
