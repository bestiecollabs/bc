export const config = { runtime: "edge" };

function json(o, s = 200, extra = {}) {
  return new Response(JSON.stringify(o), {
    status: s,
    headers: { "content-type": "application/json", ...extra }
  });
}
function cors() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, PATCH, OPTIONS",
    "access-control-allow-headers": "content-type, x-admin-email, x-import-mode"
  };
}
function forbid(m) { return json({ ok: false, error: m }, 401, cors()); }
function bad(m) { return json({ ok: false, error: m }, 400, cors()); }

// Safe ID generator without crypto
function genId() {
  return "ib_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
}

const STRICT_HEADERS = [
  "brand_name","website_url","category_primary","category_secondary","category_tertiary",
  "instagram_url","tiktok_url","description","customer_age_min","customer_age_max","us_based"
];

function parseCSV(text) {
  const lines = (text || "").trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { header: [], rows: [] };
  const header = lines[0].split(",").map(s => s.trim());
  const rows = lines.slice(1).map((ln, i) => {
    const cols = ln.split(",").map(s => s.trim());
    return { row_num: i + 1, cols };
  });
  return { header, rows };
}

function normalizeRow(cols) {
  return {
    name: cols[0] || "",
    website_url: cols[1] || "",
    category_primary: cols[2] || "",
    category_secondary: cols[3] || "",
    category_tertiary: cols[4] || "",
    instagram_url: cols[5] || "",
    tiktok_url: cols[6] || "",
    description: cols[7] || "",
    customer_age_min: Number.parseInt(cols[8] || "0", 10) || 0,
    customer_age_max: Number.parseInt(cols[9] || "0", 10) || 0,
    us_based: (String(cols[10] || "0").trim() === "1") ? 1 : 0
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function onRequestGet(ctx) {
  const admin = (ctx.request.headers.get("x-admin-email") || "").toLowerCase();
  if (admin !== "collabsbestie@gmail.com") return forbid("not_allowed");
  const q = await ctx.env.DB.prepare(`
    SELECT id, status
    FROM import_batches
    ORDER BY rowid DESC
    LIMIT 50
  `).all();
  return json({ ok: true, batches: (q.results || []).map(r => ({ id: r.id, status: r.status })) }, 200, cors());
}

export async function onRequestPost(ctx) {
  try {
    const admin = (ctx.request.headers.get("x-admin-email") || "").toLowerCase();
    if (admin !== "collabsbestie@gmail.com") return forbid("not_allowed");

    // Force live save mode
    const mode = "save";

    const body = await ctx.request.text();
    if (!body) return bad("empty_body");

    const { header, rows } = parseCSV(body);
    const headerOk = JSON.stringify(header) === JSON.stringify(STRICT_HEADERS);
    if (!headerOk) {
      return json({ ok: true, id: "", mode: "dry-run", counts: { total: 0, valid: 0, invalid: 0 }, header: header.join(",") }, 200, cors());
    }

    const id = genId();
    let total = 0, valid = 0, invalid = 0;

    await ctx.env.DB
      .prepare(`INSERT INTO import_batches (id, status, created_at) VALUES (?1, 'new', datetime('now'))`)
      .bind(id).run();

    for (const r of rows) {
      total++;
      const obj = normalizeRow(r.cols);
      const okRow = (obj.name && obj.name.trim().length > 0) ? 1 : 0;
      await ctx.env.DB.prepare(`
        INSERT INTO import_rows (batch_id, row_num, parsed_json, valid)
        VALUES (?1, ?2, ?3, ?4)
      `).bind(id, r.row_num, JSON.stringify(obj), okRow).run();
      if (okRow) valid++; else invalid++;
    }

    return json({ ok: true, id, mode, counts: { total, valid, invalid }, header: STRICT_HEADERS.join(",") }, 200, cors());
  } catch (err) {
    return json({ ok: false, error: "internal_error", detail: String(err && err.message || err) }, 500, cors());
  }
}