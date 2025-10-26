function cookieEmail(req){
  const c = req.headers.get("Cookie") || "";
  const m = c.split(";").map(s=>s.trim()).find(s=>s.startsWith("bestie_email="));
  return m ? decodeURIComponent(m.split("=").slice(1).join("=")) : "";
}
function pick(txt, name){const m = txt.match(new RegExp(`<${name}>([^<]*)</${name}>`, "i")); return m ? m[1].trim() : ""; }
function json(body, status=200){return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json"}});}

export async function onRequestPost({ request, env }) {
  const email = cookieEmail(request);
  if (!email) return json({ ok:false, error:"unauthorized" }, 401);

  const user = await env.DB.prepare("SELECT id, role FROM users WHERE email=?").bind(email).first();
  if (!user) return json({ ok:false, error:"not_found" }, 404);
  if (user.role !== 'creator') return json({ ok:false, error:"not_creator" }, 400);

  const b = await request.json().catch(()=>({}));
  let street = String(b.street||"").trim();
  let apt    = String(b.apt||"").trim();
  let city   = String(b.city||"").trim();
  let state  = String(b.state||"").trim().toUpperCase();
  let zip    = String(b.zip||"").trim();

  if (!street || !city || !state || !/^\d{5}(-\d{4})?$/.test(zip)) return json({ ok:false, error:"bad_address" }, 400);

  // USPS verify again server-side
  if (!env.USPS_USERID) return json({ ok:false, error:"missing_usps_userid" }, 500);
  const zip5 = (zip.match(/^\d{5}/)||[""])[0];
  const xml = `<AddressValidateRequest USERID="${env.USPS_USERID}"><Revision>1</Revision><Address ID="0"><Address1>${apt}</Address1><Address2>${street}</Address2><City>${city}</City><State>${state}</State><Zip5>${zip5}</Zip5><Zip4></Zip4></Address></AddressValidateRequest>`;
  const url = `https://secure.shippingapis.com/ShippingAPI.dll?API=Verify&XML=${encodeURIComponent(xml)}`;
  const resp = await fetch(url);
  const txt = await resp.text();
  if (/<Error>/i.test(txt)) return json({ ok:false, error:"usps_fail", desc: pick(txt,"Description") }, 400);

  const nStreet = pick(txt,"Address2");

  const nCity   = pick(txt,"City");
  const nState  = pick(txt,"State");
  const zip5n   = pick(txt,"Zip5");
  const zip4n   = pick(txt,"Zip4");
  const zip9    = zip4n ? `${zip5n}-${zip4n}` : zip5n;

  await env.DB.prepare(`
    INSERT INTO addresses (user_id,country,street,city,region,postal)
    VALUES (?,?,?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET
      country=excluded.country, street=excluded.street, city=excluded.city,
      region=excluded.region, postal=excluded.postal, updated_at=unixepoch();
  `).bind(user.id, 'US', nStreet, nCity, nState, zip9).run();

  return json({ ok:true });
}


