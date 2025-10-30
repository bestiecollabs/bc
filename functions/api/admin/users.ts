type Row = { id: string | number; email?: string; created_at?: string | number };

export const onRequest: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const req = ctx.request;
  const access = req.headers.get("CF-Access-Jwt-Assertion");
  if (!access) return new Response("Unauthorized", { status: 401 });

  const method = req.method.toUpperCase();

  if (method === "GET") {
    const rows = await listUsers(ctx.env.DB);
    return json({ ok: true, route: "/api/admin/users", count: rows.length, items: rows });
  }

  return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET" } });
};

async function listUsers(db: D1Database): Promise<Row[]> {
  // Try common table names without breaking if one does not exist.
  const queries = [
    `SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 200`,
    `SELECT id, email, created_at FROM accounts ORDER BY created_at DESC LIMIT 200`,
  ];

  for (const sql of queries) {
    try {
      const r = await db.prepare(sql).all();
      // If the table exists and has rows or zero rows, return shape
      if (r && Array.isArray(r.results)) {
        return r.results as Row[];
      }
    } catch {
      // ignore and try next
    }
  }

  // As a last resort, enumerate any table that has an email column
  try {
    const candidates = await db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`
      )
      .all();

    for (const row of candidates.results as { name: string }[]) {
      try {
        const test = await db.prepare(
          `SELECT id, email, created_at FROM ${row.name} ORDER BY 1 DESC LIMIT 50`
        ).all();
        if (test && Array.isArray(test.results)) return test.results as Row[];
      } catch {
        // skip tables without these columns
      }
    }
  } catch {
    // ignore
  }

  return [];
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
