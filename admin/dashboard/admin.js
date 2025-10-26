// Gate access: only admin users may proceed.
async function requireAdmin() {
  const res = await fetch('/api/users/me', { credentials: 'include' });
  const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch {}
  if (!res.ok || !json || json.ok === false) {
    location.assign(`/login/?next=${encodeURIComponent('/admin/dashboard/')}`); return;
  }
  const u = json.user || {};
  if (!(u.role === 'admin' || u.is_admin === true)) {
    location.assign(`/login/?next=${encodeURIComponent('/admin/dashboard/')}`); return;
  }
  const tag = document.getElementById('adminEmail');
  if (tag) tag.textContent = u.email || 'admin';
}
requireAdmin();

// Simple router
const sections = [...document.querySelectorAll('.main > article')];
const nav = document.getElementById('adminNav');
function show(hash) {
  const id = (hash || '#overview').split('?')[0];
  sections.forEach(s => s.classList.toggle('hidden', `#${s.id}` !== id));
  [...nav.querySelectorAll('a')].forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
  if (id === '#overview') initBoard();
}
window.addEventListener('hashchange', () => show(location.hash));
show(location.hash);

// Toast
const toast = document.getElementById('toast');
function notify(msg){ toast.textContent = msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'), 2200); }

// Progress board (local only)
const DEFAULT_BOARD = {
  built: [
    { id:'b1', t:'Account Signup Flow' },
    { id:'b2', t:'Auth & Login' },
  ],
  progress: [
    { id:'p1', t:'Admin Framework UI' },
  ],
  planned: [
    { id:'pl1', t:'Billing & Plans' },
    { id:'pl2', t:'Email Templates' },
    { id:'pl3', t:'Feature Flags API' },
  ]
};
const boardKey = 'bc_admin_board_v1';
let board = null;
function loadBoard(){ try{ board = JSON.parse(localStorage.getItem(boardKey)) || DEFAULT_BOARD; }catch{ board = DEFAULT_BOARD; } }
function saveBoard(){ localStorage.setItem(boardKey, JSON.stringify(board)); }
function pill(item){
  const el = document.createElement('div');
  el.textContent = item.t;
  el.className = 'status plan';
  el.draggable = true;
  el.dataset.id = item.id;
  el.ondragstart = e=>{ e.dataTransfer.setData('text/plain', item.id); };
  return el;
}
function renderCol(id, arr, cls){
  const col = document.getElementById(id);
  col.innerHTML = '';
  arr.forEach(it => {
    const p = pill(it);
    p.className = `status ${cls}`;
    col.appendChild(p);
  });
}
function initBoard(){
  if (!board) loadBoard();
  renderCol('col-built', board.built, 'built');
  renderCol('col-progress', board.progress, 'prog');
  renderCol('col-planned', board.planned, 'plan');

  ['col-built','col-progress','col-planned'].forEach(cid=>{
    const c = document.getElementById(cid);
    c.ondragover = e=>e.preventDefault();
    c.ondrop = e=>{
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      moveCard(id, cid);
    };
  });

  document.getElementById('resetBoard')?.addEventListener('click', ()=>{
    localStorage.removeItem(boardKey); loadBoard(); initBoard(); notify('Board reset');
  });
  document.getElementById('exportBoard')?.addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(board, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'admin-progress.json'; a.click();
    URL.revokeObjectURL(url);
  });
}
function moveCard(id, targetColId){
  const buckets = { 'col-built':'built', 'col-progress':'progress', 'col-planned':'planned' };
  const target = buckets[targetColId];
  if (!target) return;
  ['built','progress','planned'].forEach(k=>{
    const i = board[k].findIndex(x=>x.id===id);
    if (i>=0) board[k].splice(i,1);
  });
  const title = [...document.querySelectorAll(`[data-id="${id}"]`)].map(x=>x.textContent)[0] || 'Item';
  board[target].push({ id, t:title });
  saveBoard(); initBoard();
}

// Users (framework; replace with real endpoints later)
async function fetchUsers(){
  return [
    { email:'admin@bestiecollabs.com', username:'admin', role:'admin', created:'2024-01-01' },
    { email:'brand@example.com', username:'brand1', role:'brand', created:'2025-09-01' },
    { email:'creator@example.com', username:'creator1', role:'creator', created:'2025-09-20' },
  ];
}
async function renderUsers(){
  const tbody = document.getElementById('usersTbody');
  tbody.innerHTML = '<tr><td colspan="5" class="muted" style="background:transparent;border:0;padding:0">Loading…</td></tr>';
  const q = document.getElementById('qUsers').value.trim().toLowerCase();
  const role = document.getElementById('roleFilter').value;
  const rows = (await fetchUsers()).filter(u=>{
    const matchQ = !q || u.email.toLowerCase().includes(q) || (u.username||'').toLowerCase().includes(q);
    const matchR = !role || u.role===role;
    return matchQ && matchR;
  });
  tbody.innerHTML = rows.map(u=>`
    <tr>
      <td>${u.email}</td>
      <td>${u.username||''}</td>
      <td><span class="tag">${u.role}</span></td>
      <td>${u.created}</td>
      <td>
        <button class="btn btn-ghost" data-act="imp" data-id="${u.email}">Impersonate</button>
        <button class="btn btn-ghost" data-act="promote" data-id="${u.email}">Make Admin</button>
        <button class="btn btn-ghost" data-act="disable" data-id="${u.email}">Disable</button>
      </td>
    </tr>
  `).join('');
}
document.getElementById('refreshUsers')?.addEventListener('click', renderUsers);
document.getElementById('qUsers')?.addEventListener('input', renderUsers);
document.getElementById('roleFilter')?.addEventListener('change', renderUsers);

// Flags
const FLAGS = [
  { key:'beta_admin', name:'Admin Beta' },
  { key:'signup_precheck', name:'Signup Precheck' },
  { key:'creator_fastpath', name:'Creator Fast Path' },
];
function loadFlags(){
  const box = document.getElementById('flagsList');
  box.innerHTML = FLAGS.map(f=>{
    const v = localStorage.getItem('flag_'+f.key)==='1';
    return `<label style="display:flex;align-items:center;gap:8px">
      <input type="checkbox" data-flag="${f.key}" ${v?'checked':''}>
      <span>${f.name}</span>
    </label>`;
  }).join('');
}
document.getElementById('saveFlags')?.addEventListener('click', ()=>{
  document.querySelectorAll('[data-flag]').forEach(i=>{
    localStorage.setItem('flag_'+i.dataset.flag, i.checked ? '1' : '0');
  });
  notify('Flags saved (local)');
});

// Logs
document.getElementById('refreshLogs')?.addEventListener('click', ()=>{
  const box = document.getElementById('logsBox');
  box.textContent = `[${new Date().toISOString()}] Admin viewed logs
[${new Date().toISOString()}] Placeholder event stream...`;
});

// Settings
document.getElementById('saveSettings')?.addEventListener('click', ()=>{
  const s = {
    siteName: document.getElementById('siteName').value,
    supportEmail: document.getElementById('supportEmail').value
  };
  localStorage.setItem('bc_admin_settings', JSON.stringify(s));
  notify('Settings saved (local)');
});

// Left-nav quick links
document.querySelectorAll('[data-link]')?.forEach(b=>{
  b.addEventListener('click', ()=>{ location.hash = b.getAttribute('data-link'); });
});

// First renders
renderUsers();
loadFlags();
initBoard();
document.getElementById('refreshSignups')?.addEventListener('click', ()=>notify('Signups refresh pending API'));
document.getElementById('refreshSessions')?.addEventListener('click', ()=>notify('Sessions refresh pending API'));
