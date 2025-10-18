export const config = { runtime: "edge" };

function json(o, s = 200, extra = {}) {
  return new Response(JSON.stringify(o), {
    status: s,
    headers: { "content-type": "application/json", ...extra }
  });
}
function cors(h = {}) {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, PATCH, OPTIONS",
    "access-control-allow-headers": "content-type, x-admin-email, x-import-mode"
  };
}
function forbid(m) { return json({ ok: false, error: m }, 401, cors()); }
function bad(m) { return json({ ok: false, error: m }, 400, cors()); }
function uuid() { return crypto.randomUUID(); }

const STRICT_HEADERS = [
  "brand_name","website_url","category_primary","category_secondary","category_tertiary",
  "instagram_url","tiktok_url","description","customer_age_min","customer_age_max","us_based"
];

function parseCSV(text) {
  // minimal CSV splitter for our strict one-line rows without quotes
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { header: [], rows: [] };
  const header = lines[0].split(",").map(s => s.trim());
  const rows = lines.slice(1).map((ln, i) => {
    const cols = ln.split(",").map(s => s.trim());
    return { row_num: i + 1, cols };
  });
  return { header, rows };
}

function normalizeRow(cols) {
  // map by index to our 11 fields
  const o = {
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
  return o;
}

export async function onRequestOptions(ctx) {
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
  const admin = (ctx.request.headers.get("x-admin-email") || "").toLowerCase();
  if (admin !== "collabsbestie@gmail.com") return forbid("not_allowed");

  const url = new URL(ctx.request.url);
  // Save by default. Allow overrides via query or header.
  const modeQ = url.searchParams.get("mode") || url.searchParams.get("save") || url.searchParams.get("persist");
  const modeH = ctx.request.headers.get("x-import-mode");
  const mode = (modeQ && String(modeQ).toLowerCase() !== "0") || (modeH && String(modeH).toLowerCase() !== "dry") ? "save" : "save";

  const body = await ctx.request.text();
  if (!body) return bad("empty_body");

  const { header, rows } = parseCSV(body);
  const headerOk = JSON.stringify(header) === JSON.stringify(STRICT_HEADERS);
  if (!headerOk) {
    return json({ ok: true, id: "", mode: "dry-run", counts: { total: 0, valid: 0, invalid: 0 }, header: header.join(",") }, 200, cors());
  }

  const id = uuid();
  let total = 0, valid = 0, invalid = 0;

  // Always create a batch row so commit can find it
  await ctx.env.DB.prepare(`INSERT INTO import_batches (id, status, created_at) VALUES (?1, 'new', datetime('now'))`).bind(id).run();

  for (const r of rows) {
    total++;
    const obj = normalizeRow(r.cols);
    // basic validity: require brand name
    const okRow = (obj.name && obj.name.trim().length > 0) ? 1 : 0;
    if (mode === "save") {
      await ctx.env.DB.prepare(`
        INSERT INTO import_rows (batch_id, row_num, parsed_json, valid)
        VALUES (?1, ?2, ?3, ?4)
      `).bind(id, r.row_num, JSON.stringify(obj), okRow).run();
    }
    if (okRow) valid++; else invalid++;
  }

  return json({
    ok: true,
    id,
    mode,
    counts: { total, valid, invalid },
    header: STRICT_HEADERS.join(",")
  }, 200, cors());
}