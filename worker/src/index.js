const INTAKE_PATH = "/lead-intake";
const MAX_BODY_BYTES = 10000;

const REVIEW_INTAKE_PATH = "/review-intake";
const REVIEWS_PATH = "/reviews";
const REVIEW_APPROVE_PATH = "/review-approve";
const REVIEW_REJECT_PATH = "/review-reject";

const MAX_REVIEW_BODY_BYTES = 16000;
const REVIEW_TTL_SECONDS = 30 * 24 * 3600;
const GOOGLE_CACHE_TTL_SECONDS = 24 * 3600;
const MAX_TURNSTILE_TOKEN_LENGTH = 2048;
const TURNSTILE_HOSTNAMES = new Set(["epictech.club", "www.epictech.club"]);
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
  async fetch(request, env) {
    const url = new URL(request.url);
    switch (url.pathname) {
      case INTAKE_PATH:
        return handleLeadIntake(request, env);
      case REVIEW_INTAKE_PATH:
        return handleReviewIntake(request, env);
      case REVIEWS_PATH:
        return handleReviewsFeed(request, env);
      case REVIEW_APPROVE_PATH:
        return handleReviewAction(request, env, "approve");
      case REVIEW_REJECT_PATH:
        return handleReviewAction(request, env, "reject");
      default:
        return new Response("Not found", { status: 404 });
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(drainQueue(env));
  },
};

async function handleLeadIntake(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin, allowed) });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, origin, allowed);
  }

  if (allowed.length && origin && !allowed.includes(origin)) {
    return json({ error: "Forbidden" }, 403, origin, allowed);
  }

  if (!(request.headers.get("Content-Type") || "").includes("application/json")) {
    return json({ error: "Unsupported media type" }, 415, origin, allowed);
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ error: "Payload too large" }, 413, origin, allowed);
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON" }, 400, origin, allowed);
  }

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

  const token = String(body.token || body["cf-turnstile-response"] || "");
  const ip = request.headers.get("CF-Connecting-IP") || "";
  if (!(await verifyTurnstile(
    env.TURNSTILE_SECRET_KEY,
    token,
    ip,
    TURNSTILE_ACTIONS[INTAKE_PATH]
  ))) {
    return json({ error: "Verification failed" }, 403, origin, allowed);
  }

  const ua = request.headers.get("User-Agent") || "";
  const clientHash = await hmac(env.INTAKE_HMAC_SECRET, ip + "|" + ua);

  const submittedAt = new Date().toISOString();
  const lead = {
    name: name,
    business_name: business,
    email: email,
    phone: phone,
    service_requested: service,
    message: message,
    source_page: sourcePage,
    submitted_at: submittedAt,
  };

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
    "Message:\n" + message + "\n\n" +
    "--- Paste the block below into the CRM Intake Import ---\n" +
    "LEAD_INTAKE_START\n" +
    JSON.stringify(lead, null, 2) + "\n" +
    "LEAD_INTAKE_END\n";

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

  const crmPayload = {
    idempotency_key: crypto.randomUUID(),
    name: name,
    business_name: business,
    email: email,
    phone: phone,
    service: service,
    message: message,
    source_page: sourcePage,
    submitted_at: submittedAt,
  };
  const synced = await postToCRM(env, crmPayload);
  if (!synced) await enqueueLead(env, crmPayload);

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
    return new Response(null, { status: 204, headers: cors(origin, allowed, methods) });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, origin, allowed, methods);
  }
  if (allowed.length && origin && !allowed.includes(origin)) {
    return json({ error: "Forbidden" }, 403, origin, allowed, methods);
  }
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) {
    return json({ error: "Unsupported media type" }, 415, origin, allowed, methods);
  }

  const raw = await request.text();
  if (raw.length > MAX_REVIEW_BODY_BYTES) {
    return json({ error: "Payload too large" }, 413, origin, allowed, methods);
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON" }, 400, origin, allowed, methods);
  }

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

  const token = String(body.token || body["cf-turnstile-response"] || "");
  const ip = request.headers.get("CF-Connecting-IP") || "";
  if (!(await verifyTurnstile(
    env.TURNSTILE_SECRET_KEY,
    token,
    ip,
    TURNSTILE_ACTIONS[REVIEW_INTAKE_PATH]
  ))) {
    return json({ error: "Verification failed" }, 403, origin, allowed, methods);
  }

  if (!env.REVIEWS_KV) {
    console.log("REVIEWS_KV not bound — cannot accept review submissions.");
    return json({ error: "Reviews are temporarily unavailable" }, 503, origin, allowed, methods);
  }

  const ua = request.headers.get("User-Agent") || "";
  const clientHash = await hmac(env.INTAKE_HMAC_SECRET, ip + "|" + ua);

  const id = crypto.randomUUID();
  const submittedAt = new Date().toISOString();
  const expiresAt = Math.floor(Date.now() / 1000) + REVIEW_TTL_SECONDS;
  const pendingKey = "review:pending:" + id;

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
      expirationTtl: REVIEW_TTL_SECONDS,
    });
  } catch (err) {
    console.log("Failed to store pending review:", err && err.message);
    return json({ error: "Could not save review" }, 500, origin, allowed, methods);
  }

  const approveSig = await signReviewAction(env.REVIEW_APPROVAL_SECRET, id, "approve", expiresAt);
  const rejectSig = await signReviewAction(env.REVIEW_APPROVAL_SECRET, id, "reject", expiresAt);
  const base = "https://intake.epictech.club";
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

async function handleReviewsFeed(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const methods = "GET, OPTIONS";

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin, allowed, methods) });
  }
  if (request.method !== "GET") {
    return json({ error: "Method not allowed" }, 405, origin, allowed, methods);
  }

  const onsite = [];
  if (env.REVIEWS_KV) {
    try {
      const list = await env.REVIEWS_KV.list({ prefix: "review:published:", limit: 200 });
      for (const k of list.keys) {
        const raw = await env.REVIEWS_KV.get(k.name);
        if (!raw) continue;
        try {
          onsite.push(JSON.parse(raw));
        } catch {
          /* skip corrupt entry */
        }
      }
      onsite.sort((a, b) => String(b.submittedAt || "").localeCompare(String(a.submittedAt || "")));
    } catch (err) {
      console.log("Failed to list published reviews:", err && err.message);
    }
  }

  const google = env.REVIEWS_KV ? await getGoogleReviews(env) : null;

  return json({ google: google, onsite: onsite }, 200, origin, allowed, methods);
}

async function getGoogleReviews(env) {
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

  try {
    const apiUrl =
      "https://maps.googleapis.com/maps/api/place/details/json" +
      "?place_id=" + encodeURIComponent(env.GOOGLE_PLACE_ID) +
      "&fields=rating,user_ratings_total,reviews" +
      "&key=" + encodeURIComponent(env.GOOGLE_PLACES_API_KEY);
    const res = await fetch(apiUrl);
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
    try {
      await env.REVIEWS_KV.put(cacheKey, JSON.stringify({ fetchedAt: now, data: data }));
    } catch (err) {
      console.log("Failed to cache Google reviews:", err && err.message);
    }
    return data;
  } catch (err) {
    console.log("Google Places fetch failed, serving cache if any:", err && err.message);
    return cached ? cached.data : null;
  }
}

async function handleReviewAction(request, env, action) {
  const url = new URL(request.url);
  const id = String(url.searchParams.get("id") || "");
  const sig = String(url.searchParams.get("sig") || "");

  if (request.method !== "GET" && request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!id || !sig || !env.REVIEWS_KV) {
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
      await env.REVIEWS_KV.put("review:published:" + id, JSON.stringify(published));
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
  const page =
    "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
    "<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'\">" +
    "<title>" + escapeHtml(title) + "</title></head><body>" +
    "<h1>" + escapeHtml(title) + "</h1>" + bodyHtml +
    "</body></html>";
  return new Response(page, {
    status: status || 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function cors(origin, allowed, methods) {
  const h = {
    "Vary": "Origin",
    "Access-Control-Allow-Methods": methods || "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
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

async function verifyTurnstile(secret, token, ip, expectedAction) {
  if (
    typeof secret !== "string" ||
    !secret ||
    typeof token !== "string" ||
    !token ||
    token.length > MAX_TURNSTILE_TOKEN_LENGTH ||
    typeof expectedAction !== "string" ||
    !expectedAction
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
      TURNSTILE_HOSTNAMES.has(out.hostname) &&
      out.action === expectedAction
    );
  } catch {
    return false;
  }
}

async function hmac(secret, data) {
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

async function postToCRM(env, payload) {
  if (!env.CRM_INGEST_URL || !env.CRM_INGEST_SECRET) return true;
  try {
    const body = JSON.stringify(payload);
    const ts = Math.floor(Date.now() / 1000).toString();
    const signature = await hmac(env.CRM_INGEST_SECRET, ts + "." + body);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(env.CRM_INGEST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Timestamp": ts,
        "X-Signature": "sha256=" + signature,
      },
      body: body,
      signal: controller.signal,
    });
    clearTimeout(timer);
    console.log(res.ok ? "CRM sync ok" : "CRM sync non-OK: " + res.status);
    return res.ok;
  } catch (err) {
    console.log("CRM sync failed (email already sent):", err && err.message);
    return false;
  }
}

const QUEUE_PREFIX = "pending:";
const QUEUE_MAX_ATTEMPTS = 12;
const QUEUE_TTL_SECONDS = 3 * 24 * 3600;

async function enqueueLead(env, payload) {
  if (!env.LEAD_QUEUE) {
    console.log("CRM sync failed and no LEAD_QUEUE bound — lead not queued.");
    return;
  }
  const key = QUEUE_PREFIX + Date.now() + ":" + (payload.idempotency_key || crypto.randomUUID());
  const item = { payload: payload, attempts: 0, firstFailedAt: new Date().toISOString() };
  try {
    await env.LEAD_QUEUE.put(key, JSON.stringify(item), { expirationTtl: QUEUE_TTL_SECONDS });
    console.log("Lead queued for retry:", key);
  } catch (err) {
    console.log("Failed to queue lead:", err && err.message);
  }
}

async function drainQueue(env) {
  if (!env.LEAD_QUEUE) return;
  const list = await env.LEAD_QUEUE.list({ prefix: QUEUE_PREFIX, limit: 100 });
  for (const k of list.keys) {
    const raw = await env.LEAD_QUEUE.get(k.name);
    if (!raw) continue;
    let item;
    try {
      item = JSON.parse(raw);
    } catch {
      await env.LEAD_QUEUE.delete(k.name);
      continue;
    }
    const ok = await postToCRM(env, item.payload);
    if (ok) {
      await env.LEAD_QUEUE.delete(k.name);
      console.log("Replayed queued lead:", k.name);
    } else {
      item.attempts = (item.attempts || 0) + 1;
      if (item.attempts >= QUEUE_MAX_ATTEMPTS) {
        await env.LEAD_QUEUE.delete(k.name);
        console.log("Giving up on queued lead after", item.attempts, "attempts:", k.name);
      } else {
        await env.LEAD_QUEUE.put(k.name, JSON.stringify(item), { expirationTtl: QUEUE_TTL_SECONDS });
        console.log("Retry still failing, re-queued:", k.name, "attempt", item.attempts);
      }
    }
  }
}

async function sendEmail(env, opts) {
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
