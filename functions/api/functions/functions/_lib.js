export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (ch) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
  });
}

export function cleanText(value, maxLen) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return typeof value === "string" && value.length <= 254 && EMAIL_RE.test(value.trim());
}

export async function checkRateLimit(kv, ip, { limit = 20, windowSeconds = 3600 } = {}) {
  const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = "rl:" + ip + ":" + bucket;
  const current = parseInt((await kv.get(key)) || "0", 10);
  if (current >= limit) return false;
  await kv.put(key, String(current + 1), { expirationTtl: windowSeconds + 60 });
  return true;
}

export function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

export function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
