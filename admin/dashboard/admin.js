const S = {
  pageSize: 10,
  brands: { q: "", offset: 0 },
  creators: { q: "", offset: 0 },
  recycle: { entity: "", offset: 0 },
};

function $(sel){ return document.querySelector(sel); }
function el(tag, attrs={}, ...kids){
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => k==="class"? n.className=v : n.setAttribute(k,v));
  kids.flat().forEach(k => n.append(k.nodeType? k : document.createTextNode(k)));
  return n;
}

async function api(path, opts={}) {
  const r = await fetch(path, { ...opts, headers: { ...(opts.headers||{}), "content-type":"application/json" }});
  if (!r.ok) throw new Error(`${r.status} ${path}`);
  return r.json();
}

// CHANGED: use admin namespace whoami so Access applies
async function checkMe() {
  const me = await api("/api/admin/chipchip/whoami");
  if (!me?.ok) throw new Error("not admin");
  $("#adminInfo").textContent = `${me.user.email}`;
}

function table(heads, rows){
  const t = document.createElement("table");
  t.className = "table";
  const thead = document.createElement("thead");
  const trh = document.createElement("tr");
  heads.forEach(h => { const th=document.createElement("th"); th.textContent=h; trh.append(th); });
  thead.append(trh);
  const tbody = document.createElement("tbody");
  rows.forEach(r => {
    const tr=document.createElement("tr");
    heads.forEach(h => { const td=document.createElement("td"); td.textContent=String(r[h] ?? ""); tr.append(td); });
    tbody.append(tr);
  });
  t.append(thead, tbody);
  return t;
}

async function loadBrands() {
  const { q, offset } = S.brands;
  const data = await api(`/api/admin/chipchip/brands?q=${encodeURIComponent(q)}&limit=${S.pageSize}&offset=${offset}`);
  const heads = ["id","brand_name","website","priceRange","rating_avg","last_seen","public_code"];
  const t = table(heads, data.rows || []);
  $("#brandsTable").replaceWith(t); t.id="brandsTable";
  $("#brandsPage").textContent = `${offset+1}–${offset + (data.rows?.length||0)} of ${data.total}`;
}

async function loadCreators() {
  const { q, offset } = S.creators;
  const data = await api(`/api/admin/chipchip/creators?q=${encodeURIComponent(q)}&limit=${S.pageSize}&offset=${offset}`);
  const heads = ["id","platform","handle","tiktok_user_id","instagram_user_id","followers_total","engagement_rate","last_active","public_code"];
  const t = table(heads, data.rows || []);
  $("#creatorsTable").replaceWith(t); t.id="creatorsTable";
  $("#creatorsPage").textContent = `${offset+1}–${offset + (data.rows?.length||0)} of ${data.total}`;
}

async function loadRecycle() {
  const { entity, offset } = S.recycle;
  const qs = new URLSearchParams({ limit:String(S.pageSize), offset:String(offset) });
  if (entity) qs.set("entity_table", entity);
  const data = await api(`/api/admin/chipchip/recycle?${qs.toString()}`);
  const heads = ["id","entity_table","entity_id","batch_id","created_at"];
  const t = table(heads, data.rows || []);
  $("#recycleTable").replaceWith(t); t.id="recycleTable";
}

async function undoBatch(batchId) {
  if (!batchId) return;
  const res = await api("/api/admin/chipchip/undo", {
    method:"POST",
    body: JSON.stringify({ batch_id: batchId })
  });
  alert(`Undone batch ${res.undone_batch}. Restored: ${res.restored}`);
  await loadRecycle();
  await loadBrands();
  await loadCreators();
}

async function loadAdmins() {
  const data = await api(`/api/admin/chipchip/users?dir=list&limit=50&offset=0`);
  const heads = ["id","email","username","full_name","role","last_login_at","bestie_score"];
  const t = table(heads, data.rows || []);
  $("#adminsTable").replaceWith(t); t.id="adminsTable";
}

async function loadAudit() {
  const data = await api(`/api/admin/chipchip/audit?limit=50`);
  const rows = (data.rows||[]).map(r => ({
    id: r.id, actor_email: r.actor_email, action: r.action,
    entity_table: r.entity_table, entity_id: r.entity_id, batch_id: r.batch_id, created_at: r.created_at
  }));
  const heads = ["id","actor_email","action","entity_table","entity_id","batch_id","created_at"];
  const t = table(heads, rows);
  $("#auditTable").replaceWith(t); t.id="auditTable";
}

function switchTab(name){
  document.querySelectorAll("nav.tabs button").forEach(b => b.classList.toggle("active", b.dataset.tab===name));
  document.querySelectorAll("main .view").forEach(v => v.classList.toggle("active", v.dataset.view===name));
}

function bindUI(){
  document.querySelectorAll("nav.tabs button").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      switchTab(btn.dataset.tab);
      if (btn.dataset.tab==="brands") await loadBrands();
      if (btn.dataset.tab==="creators") await loadCreators();
      if (btn.dataset.tab==="recycle") await loadRecycle();
      if (btn.dataset.tab==="admins") await loadAdmins();
      if (btn.dataset.tab==="audit") await loadAudit();
    });
  });

  $("#brandsSearch").onclick = ()=>{ S.brands.q = $("#brandsQ").value.trim(); S.brands.offset = 0; loadBrands(); };
  $("#brandsPrev").onclick   = ()=>{ S.brands.offset = Math.max(0, S.brands.offset - S.pageSize); loadBrands(); };
  $("#brandsNext").onclick   = ()=>{ S.brands.offset += S.pageSize; loadBrands(); };
  $("#brandsExport").onclick = ()=>{ window.location = "/api/admin/chipchip/brands?export=all"; };

  $("#creatorsSearch").onclick = ()=>{ S.creators.q = $("#creatorsQ").value.trim(); S.creators.offset = 0; loadCreators(); };
  $("#creatorsPrev").onclick   = ()=>{ S.creators.offset = Math.max(0, S.creators.offset - S.pageSize); loadCreators(); };
  $("#creatorsNext").onclick   = ()=>{ S.creators.offset += S.pageSize; loadCreators(); };
  $("#creatorsExport").onclick = ()=>{ window.location = "/api/admin/chipchip/creators?export=all"; };

  $("#recycleRefresh").onclick = ()=>{ S.recycle.entity = $("#recycleEntity").value; S.recycle.offset = 0; loadRecycle(); };
  $("#undoBatchBtn").onclick = ()=> undoBatch($("#undoBatchId").value.trim());
}

(async function init(){
  try {
    await checkMe();
    bindUI();
    await loadBrands();
  } catch (e) {
    location.href = "/account";
  }
})();

