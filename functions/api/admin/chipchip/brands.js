import { assertAdmin, json, notFound } from "./_lib/db.js";

function esc(v) {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCSV(headers, rows) {
  const head = headers.join(",");
  const body = (rows.results ?? rows).map(r => headers.map(h => esc(r[h])).join(",")).join("\n");
  return head + "\n" + body + "\n";
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
    where.push("(brand_name_lower LIKE ? OR website_normalized LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }
  const WHERE = where.length ? `WHERE ${where.join(" AND ")}` : "";

  if (exportAll) {
    const headers = [
      "id","brand_name","website","shortDesc","category_1","category_2","category_3",
      "public_contact","reviews_total","rating_avg","priceRange","estimated_monthly",
      "customer_age_range","customer_sex","social_platform_1","social_platform_2",
      "top_creator_videos_1","top_creator_videos_2","last_seen"
    ];
    const rows = await env.DB
      .prepare(`SELECT ${headers.join(",")}
                FROM directory_brands ${WHERE}
                ORDER BY brand_name_lower`)
      .bind(...params).all();

    const csv = toCSV(headers, rows);
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=brands_export.csv"
      }
    });
  }

  const total = await env.DB
    .prepare(`SELECT COUNT(1) AS c FROM directory_brands ${WHERE}`)
    .bind(...params).first();

  const rows = await env.DB
    .prepare(`SELECT id,brand_name,website,priceRange,rating_avg,last_seen,public_code
              FROM directory_brands ${WHERE}
              ORDER BY brand_name_lower
              LIMIT ? OFFSET ?`)
    .bind(...params, limit, offset).all();

  return json({ total: total?.c ?? 0, rows: rows.results ?? rows });
}
