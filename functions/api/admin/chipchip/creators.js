import { assertAdmin, json, notFound } from "./_lib/db.js";

function esc(v){ if(v==null) return ""; const s=String(v); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }
function toCSV(headers, rows){
  const head=headers.join(",");
  const arr=(rows.results??rows);
  const body=arr.map(r=>headers.map(h=>esc(r[h])).join(",")).join("\n");
  return head+"\n"+body+(arr.length? "\n": "");
}

export async function onRequest({ env, request }) {
  const email = assertAdmin(env, request);
  if (!email) return notFound();
  if (request.method !== "GET") return notFound();

  const url = new URL(request.url);
  const exportAll = url.searchParams.get("export") === "all";
  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const limit = Math.min(Number(url.searchParams.get("limit") || 100), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);

  const where = [];
  const params = [];
  if (q) {
    where.push("(handle_lower LIKE ? OR tiktok_user_id LIKE ? OR instagram_user_id LIKE ? OR email LIKE ?)");
    params.push(`%${q}%`,`%${q}%`,`%${q}%`,`%${q}%`);
  }
  const WHERE = where.length ? `WHERE ${where.join(" AND ")}` : "";

  if (exportAll) {
    const headers = [
      "id","platform","handle","tiktok_user_id","instagram_user_id","email","audience_country",
      "followers_total","avg_weekly_posts","engagement_rate","avg_views","avg_likes",
      "avg_comments","avg_shares","audience_category_1","audience_category_2","audience_category_3",
      "audience_age_range","audience_sex","audience_location","last_active",
      "tiktok_followers","tiktok_avg_views","tiktok_avg_likes","tiktok_avg_comments","tiktok_avg_shares",
      "instagram_followers","instagram_avg_views","instagram_avg_likes","instagram_avg_comments","instagram_avg_shares"
    ];
    const rows = await env.DB.prepare(`SELECT ${headers.join(",")} FROM directory_creators ${WHERE} ORDER BY handle_lower`)
      .bind(...params).all();
    const csv = toCSV(headers, rows);
    return new Response(csv, {
      headers: {
        "content-type":"text/csv; charset=utf-8",
        "content-disposition":"attachment; filename=creators_export.csv"
      }
    });
  }

  const total = await env.DB.prepare(`SELECT COUNT(1) AS c FROM directory_creators ${WHERE}`).bind(...params).first();
  const rows = await env.DB.prepare(
    `SELECT id,platform,handle,tiktok_user_id,instagram_user_id,followers_total,engagement_rate,last_active,public_code
     FROM directory_creators ${WHERE}
     ORDER BY handle_lower
     LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all();

  return json({ total: total?.c ?? 0, rows: rows.results ?? rows });
}
