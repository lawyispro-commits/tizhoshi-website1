import { escapeHtml } from "../_lib.js";

function notFoundPage() {
  return `<!DOCTYPE html>
<html lang="ckb" dir="rtl"><head><meta charset="UTF-8">
<title>بروانامە نەدۆزرایەوە — تیزهۆشی</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body{font-family:'Vazirmatn',Tahoma,sans-serif;background:#f7f3ea;color:#1a2530;
       display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}
  a{color:#7a2e2e}
</style></head>
<body><div>
  <h1>ئەم بروانامەیە نەدۆزرایەوە</h1>
  <p>لینکەکە هەڵەیە یان بەسەرچووە.</p>
  <p><a href="/">گەڕانەوە بۆ تیزهۆشی</a></p>
</div></body></html>`;
}

export async function onRequestGet(context) {
  const { env, params } = context;
  const id = params.id;

  if (!env.RESULTS || !id || !/^[0-9a-f-]{10,40}$/i.test(id)) {
    return new Response(notFoundPage(), { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
  }

  const raw = await env.RESULTS.get("result:" + id);
  if (!raw) {
    return new Response(notFoundPage(), { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
  }

  let record;
  try {
    record = JSON.parse(raw);
  } catch (e) {
    return new Response(notFoundPage(), { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
  }

  const displayName = record.name ? escapeHtml(record.name) : "میوانێکی تیزهۆش";
  const score = Number(record.scaledScore) || 0;
  const band = escapeHtml(record.band || "");
  const date = new Date(record.createdAt || Date.now()).toLocaleDateString("en-GB", {
    year: "numeric", month: "long", day: "numeric"
  });

  const catLabels = { number: "زنجیرەی ژمارە", shape: "لۆژیکی شێوە", analogy: "پەیوەندی وشە", odd: "وشەی نامۆ" };
  const totals = record.totals || {};
  const correct = record.correct || {};

  let breakdownRows = "";
  for (const key of Object.keys(catLabels)) {
    const t = Number(totals[key]) || 0;
    const c = Number(correct[key]) || 0;
    const pct = t ? Math.round((c / t) * 100) : 0;
    breakdownRows += `
      <div class="row">
        <span class="label">${catLabels[key]}</span>
        <span class="track"><span class="fill" style="width:${pct}%"></span></span>
        <span class="num">${c}/${t}</span>
      </div>`;
  }

  const ogDescription = `${displayName} خاڵی ${score} بەدەستهێنا لە تاقیکردنەوەی تیزهۆشی (${band}).`;
  const pageUrl = new URL(context.request.url);

  const html = `<!DOCTYPE html>
<html lang="ckb" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>بروانامەی ${displayName} — تیزهۆشی</title>
<meta name="description" content="${escapeHtml(ogDescription)}">
<meta property="og:title" content="بروانامەی تیزهۆشی — ${displayName}">
<meta property="og:description" content="${escapeHtml(ogDescription)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${pageUrl.origin}${pageUrl.pathname}">
<meta name="twitter:card" content="summary">
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
<style>
  body{ display:flex; align-items:center; justify-content:center; min-height:100vh; }
  .cert{
    max-width:560px; width:92vw; background:var(--paper-card); border:1px solid var(--line);
    border-radius:var(--radius-l); box-shadow:var(--shadow-card); padding:clamp(28px,6vw,52px);
    text-align:center; position:relative;
  }
  .cert::before{
    content:""; position:absolute; inset:14px; border:1.5px solid var(--line-strong);
    border-radius:calc(var(--radius-l) - 8px); pointer-events:none;
  }
  .cert-eyebrow{ font-size:13px; font-weight:700; color:var(--gold); letter-spacing:0.08em; margin:0 0 6px; }
  .cert-brand{ font-size:20px; font-weight:800; margin:0 0 26px; }
  .cert-name{ font-size:clamp(24px,4vw,32px); font-weight:800; margin:0 0 4px; }
  .cert-band{ color:var(--accent); font-weight:700; font-size:15px; margin:0 0 22px; }
  .cert-score{ font-size:64px; font-weight:900; line-height:1; margin:0; }
  .cert-score-caption{ font-size:13px; color:var(--ink-soft); margin:2px 0 26px; }
  .breakdown{ display:flex; flex-direction:column; gap:10px; margin:0 0 26px; text-align:right; }
  .row{ display:grid; grid-template-columns:120px 1fr 40px; align-items:center; gap:10px; font-size:12.5px; }
  .label{ color:var(--ink-soft); font-weight:600; }
  .track{ height:6px; background:var(--paper-deep); border-radius:999px; overflow:hidden; }
  .fill{ display:block; height:100%; background:linear-gradient(90deg, var(--gold-soft), var(--accent)); border-radius:999px; }
  .num{ text-align:left; font-weight:700; }
  .cert-date{ font-size:12px; color:var(--ink-faint); margin:0 0 24px; }
  .cert-cta{ display:inline-block; background:var(--ink); color:var(--paper); text-decoration:none;
    font-weight:700; padding:13px 26px; border-radius:var(--radius-m); font-size:14.5px; }
</style>
</head>
<body>
<div class="paper-texture" aria-hidden="true"></div>
<div class="cert">
  <p class="cert-eyebrow">بروانامەی فەرمی</p>
  <p class="cert-brand">تیزهۆشی</p>
  <p class="cert-name">${displayName}</p>
  <p class="cert-band">${band}</p>
  <p class="cert-score">${score}</p>
  <p class="cert-score-caption">خاڵی مامناوەند</p>
  <div class="breakdown">${breakdownRows}</div>
  <p class="cert-date">${escapeHtml(date)}</p>
  <a class="cert-cta" href="/">تۆش تاقیکردنەوەکە بکە ←</a>
</div>
</body>
</html>`;

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" }
  });
}
