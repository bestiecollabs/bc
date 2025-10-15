// Minimal helpers
async function apiGet(p){ const r = await fetch(p); if(!r.ok) throw new Error(p+\" -> \"+r.status); return r.json(); }
async function apiPost(p,b){ const r = await fetch(p,{method:\"POST\",headers:{\"content-type\":\"application/json\"},body:JSON.stringify(b||{})}); if(!r.ok) throw new Error(p+\" -> \"+r.status); return r.json(); }

// Header validation (keeps instagram_url, tiktok_url)
const ACCEPTED_HEADERS_11 = [
  \"brand_name\",\"website_url\",
  \"category_primary\",\"category_secondary\",\"category_tertiary\",
  \"instagram_url\",\"tiktok_url\",
  \"description\",\"customer_age_min\",\"customer_age_max\",\"us_based\"
];
function validateCsvHeaderLine(line){
  const got = line.trim().replace(/\r/g,'').split(',').map(s => s.trim());
  const need = ACCEPTED_HEADERS_11;
  const missing = need.filter(h => !got.includes(h));
  const extras  = got.filter(h => !need.includes(h));
  return { ok: missing.length===0 && extras.length===0 && got.length===need.length, missing, extras, got };
}
async function ensureCsvHeaders(file){
  const text = await file.text();
  const firstLine = (text.split(/\\n/)[0] || '').trim();
  const chk = validateCsvHeaderLine(firstLine);
  if (!chk.ok){
    const msg = [
      'CSV headers invalid.',
      chk.missing.length ? ('Missing: ' + chk.missing.join(', ')) : '',
      chk.extras.length ? ('Unexpected: ' + chk.extras.join(', ')) : '',
      'Expected exactly: ' + ACCEPTED_HEADERS_11.join(', ')
    ].filter(Boolean).join('\\n');
    alert(msg);
    throw new Error('invalid_csv_headers');
  }
}

function parseCsv(text){
  const lines = text.replace(/\\r\\n/g,'\\n').replace(/\\r/g,'\\n').split('\\n').filter(Boolean);
  const headers = lines[0].split(',').map(s=>s.trim());
  const rows = lines.slice(1).map(l=>l.split(',').map(s=>s.trim()));
  return { headers, rows };
}

async function runImport(commit){
  const fileEl   = document.getElementById('csv');
  const statusEl = document.getElementById('uploadStatus');
  if (!fileEl || !fileEl.files || !fileEl.files[0]) { alert('Select a CSV file'); return; }
  const file = fileEl.files[0];

  await ensureCsvHeaders(file);

  const text = await file.text();
  const parsed = parseCsv(text);
  const headers = parsed.headers;
  const rowsObjs = parsed.rows.map(r => Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])));

  statusEl.textContent = commit ? 'Committing…' : 'Dry run…';

  // 1) create batch
  const batch = await apiPost('/api/admin/import/brands/batches', { mode: commit ? 'commit' : 'dry-run' });
  if (!batch || !batch.id){ alert('Failed to create batch'); statusEl.textContent=''; return; }

  // 2) send chunks
  const size = 300;
  for (let i=0;i<rowsObjs.length;i+=size){
    const chunk = rowsObjs.slice(i, i+size);
    const res = await apiPost('/api/admin/import/brands/batches/'+batch.id+'/rows', { batchId: batch.id, rows: chunk });
    if (!res || res.ok===false){ alert('Rows error'); statusEl.textContent=''; return; }
    statusEl.textContent = (commit ? 'Committing… ' : 'Dry run… ') + (i+chunk.length) + '/' + rowsObjs.length;
  }

  // 3) finalize
  const final = await apiPost('/api/admin/import/brands/batches/'+batch.id+'/commit', { batchId: batch.id, commit: !!commit });
  if (final && final.ok !== false){
    statusEl.textContent = commit ? 'Commit complete.' : 'Dry run complete.';
  } else {
    statusEl.textContent = 'Finalize error.';
  }
}

async function loadBrandsIntoTable(){
  const tbody = document.getElementById('brandsTbody');
  if (!tbody) return;
  try{
    // Try common endpoints
    let data=null, errs=[];
    for (const p of ['/api/admin/brands','/api/admin/brands/list']){
      try { data = await apiGet(p); if (data) break; } catch(e){ errs.push(String(e)); }
    }
    if (!data || !Array.isArray(data.rows||data)){ tbody.innerHTML = '<tr><td colspan=\"6\" class=\"muted\">Unable to load brands</td></tr>'; return; }
    const rows = data.rows || data;
    if (!rows.length){ tbody.innerHTML = '<tr><td colspan=\"6\" class=\"muted\">No brands yet</td></tr>'; return; }
    tbody.innerHTML = rows.map(b => {
      const id = b.id ?? '';
      const name = b.name ?? '';
      const slug = b.slug ?? '';
      const status = b.status ?? 'draft';
      const del = b.deleted ? 'yes' : '';
      return `<tr><td>${id}</td><td>${name}</td><td>${slug}</td><td>${status}</td><td>${del}</td><td><button data-del=\"${id}\">Del</button> <button data-undo=\"${id}\">Undo</button></td></tr>`;
    }).join('');
  } catch(e){
    console.error(e);
    tbody.innerHTML = '<tr><td colspan=\"6\" class=\"muted\">Load error</td></tr>';
  }
}

document.addEventListener('DOMContentLoaded', function(){
  const dry    = document.getElementById('dryBtn');
  const commit = document.getElementById('commitBtn');
  const refresh= document.getElementById('refreshBtn');

  if (dry)    dry.addEventListener('click',  ()=>runImport(false));
  if (commit) commit.addEventListener('click',()=>runImport(true));
  if (refresh)refresh.addEventListener('click',loadBrandsIntoTable);

  loadBrandsIntoTable();
});