import { jsonResponse } from "../../_lib.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.ADMIN_TOKEN) {
    return jsonResponse({ error: "not_configured" }, 501);
  }

  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token || token !== env.ADMIN_TOKEN) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  if (!env.LEADS) {
    return jsonResponse({ error: "not_configured" }, 501);
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") || undefined;

  const listResult = await env.LEADS.list({ prefix: "lead:", limit: 50, cursor });
  const leads = await Promise.all(
    listResult.keys.map(async (k) => {
      const raw = await env.LEADS.get(k.name);
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    })
  );

  return jsonResponse({
    leads: leads.filter(Boolean).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    nextCursor: listResult.list_complete ? null : listResult.cursor
  });
}
