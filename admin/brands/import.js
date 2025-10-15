/* admin/brands/import.js — module */
const ACCEPTED_HEADERS_11 = [
  'brand_name','website_url',
  'category_primary','category_secondary','category_tertiary',
  'instagram_url','tiktok_url',
  'description','customer_age_min','customer_age_max','us_based'
];

async function apiGet(p){
  const r = await fetch(p);
  if(!r.ok) throw new Error(p + ' -> ' + r.status);
  return r.json();
}
async function apiPost(p,b){
  const r = await fetch(p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b||{})});
  if(!r.ok) throw new Error(p + ' -> ' + r.status);
  return r.json();
}

function validateHeaderLine(line){
  const got = line.trim().replace(/\r/g,'').split(',').map(s=>s.trim());
  const need = ACCEPTED_HEADERS_11;
  const missing = need.filter(h => !got.includes(h));
  const extras  = got.filter(h => !need.includes(h));
  return { ok: missing.length===0 && extras.length===0 && got.length===need.length, missing, extras, got };
}
async function ensureCsvHeaders(file){
  const text = await file.text();
  const first = (text.split(/\n/)[0] || '').trim();
  const chk = validateHeaderLine(first);
  if (!chk.ok){
    alert(
      'CSV headers invalid.\n' +
      (chk.missing.length ? ('Missing: ' + chk.missing.join(', ') + '\n') : '') +
      (chk.extras.length  ? ('Unexpected: ' + chk.extras.join(', ') + '\n') : '') +
      'Expected exactly: ' + ACCEPTED_HEADERS_11.join(', ')
    );
    throw new Error('invalid_csv_headers');
  }
}

function parseCsv(text){
  const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(Boolean);
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
  const rowsObjs = parsed.rows.map(r => {
    const o = {};
    for (let i=0;i<headers.length;i++){ o[headers[i]] = r[i] || ''; }
    return o;
  });

  statusEl.textContent = commit ? 'Committing…' : 'Dry run…';

  // 1) create batch
  const batch = await apiPost('/api/admin/import/brands/batches', { mode: commit ? 'commit' : 'dry-run' });
  if (!batch || !batch.id){ alert('Failed to create batch'); statusEl.textContent=''; return; }

  // 2) send chunks
  const size = 300;
  for (let i=0;i<rowsObjs.length;i+=size){
    const chunk = rowsObjs.slice(i, i+size);
    await apiPost('/api/admin/import/brands/batches/' + batch.id + '/rows', { batchId: batch.id, rows: chunk });
    statusEl.textContent = (commit ? 'Committing… ' : 'Dry run… ') + (i+chunk.length) + '/' + rowsObjs.length;
  }

  // 3) finalize
  const final = await apiPost('/api/admin/import/brands/batches/' + batch.id + '/commit', { batchId: batch.id, commit: !!commit });
  statusEl.textContent = (final && final.ok===false) ? 'Finalize error.' : (commit ? 'Commit complete.' : 'Dry run complete.');
}

async function loadBrands(){
  const tbody = document.getElementById('brandsTbody');
  if (!tbody) return;
  try{
    let data = null;
    for (const p of ['/api/admin/brands','/api/admin/brands/list']){
      try { data = await apiGet(p); if (data) break; } catch(e){}
    }
    const rows = (data && (data.rows || data)) || [];
    if (!rows.length){ tbody.innerHTML = '<tr><td colspan="6" class="muted">No brands yet</td></tr>'; return; }
    tbody.innerHTML = rows.map(b => {
      const id = b.id || '';
      const name = b.name || '';
      const slug = b.slug || '';
      const st = b.status || 'draft';
      const del = b.deleted ? 'yes' : '';
      return '<tr><td>'+id+'</td><td>'+name+'</td><td>'+slug+'</td><td>'+st+'</td><td>'+del+'</td><td><button data-del="'+id+'">Del</button> <button data-undo="'+id+'">Undo</button></td></tr>';
    }).join('');
  } catch(e){
    console.error(e);
    tbody.innerHTML = '<tr><td colspan="6" class="muted">Load error</td></tr>';
  }
}

document.addEventListener('DOMContentLoaded', function(){
  const dry    = document.getElementById('dryBtn');
  const commit = document.getElementById('commitBtn');
  const refresh= document.getElementById('refreshBtn');

  if (dry)    dry.addEventListener('click',  function(){ runImport(false); });
  if (commit) commit.addEventListener('click',function(){ runImport(true); });
  if (refresh)refresh.addEventListener('click',function(){ loadBrands(); });

  loadBrands();
});