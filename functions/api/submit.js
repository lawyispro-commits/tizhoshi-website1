import { cleanText, isValidEmail, checkRateLimit, getClientIp, jsonResponse } from "../_lib.js";

const CATEGORY_KEYS = ["number", "shape", "analogy", "odd"];

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function validateScorePayload(body) {
  if (!isPlainObject(body)) return null;
  const scaledScore = Number(body.scaledScore);
  const pct = Number(body.pct);
  if (!Number.isFinite(scaledScore) || scaledScore < 0 || scaledScore > 200) return null;
  if (!Number.isFinite(pct) || pct < 0 || pct > 1) return null;
  if (!isPlainObject(body.totals) || !isPlainObject(body.correct)) return null;

  const totals = {};
  const correct = {};
  for (const key of CATEGORY_KEYS) {
    const t = Number(body.totals[key]);
    const c = Number(body.correct[key]);
    if (!Number.isInteger(t) || t < 0 || t > 50) return null;
    if (!Number.isInteger(c) || c < 0 || c > t) return null;
    totals[key] = t;
    correct[key] = c;
  }

  return {
    scaledScore: Math.round(scaledScore),
    pct: pct,
    band: cleanText(body.band, 60),
    totals: totals,
    correct: correct
  };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.RESULTS) {
    return jsonResponse({ error: "not_configured" }, 501);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  if (typeof body.website === "string" && body.website.trim() !== "") {
    return jsonResponse({ id: "ok" }, 200);
  }

  const ip = getClientIp(request);
  const allowed = await checkRateLimit(env.RESULTS, ip, { limit: 20, windowSeconds: 3600 });
  if (!allowed) {
    return jsonResponse({ error: "rate_limited" }, 429);
  }

  const score = validateScorePayload(body);
  if (!score) {
    return jsonResponse({ error: "invalid_payload" }, 400);
  }

  const name = cleanText(body.name, 60);
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const hasValidEmail = email !== "" && isValidEmail(email);
  if (email !== "" && !hasValidEmail) {
    return jsonResponse({ error: "invalid_email" }, 400);
  }

  const id = crypto.randomUUID();
  const record = {
    name: name || null,
    scaledScore: score.scaledScore,
    pct: score.pct,
    band: score.band,
    totals: score.totals,
    correct: score.correct,
    createdAt: new Date().toISOString()
  };

  await env.RESULTS.put("result:" + id, JSON.stringify(record), {
    expirationTtl: 60 * 60 * 24 * 730
  });

  if (hasValidEmail && env.LEADS) {
    const leadKey = "lead:" + Date.now() + ":" + crypto.randomUUID().slice(0, 8);
    await env.LEADS.put(
      leadKey,
      JSON.stringify({
        name: name || null,
        email: email,
        scaledScore: score.scaledScore,
        band: score.band,
        resultId: id,
        createdAt: new Date().toISOString()
      })
    );
  }

  return jsonResponse({ id: id }, 201);
}
