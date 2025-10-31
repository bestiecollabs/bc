/* admin/app.js - clean renderer */
document.addEventListener('DOMContentLoaded', () => {
  const els = {
    active:    document.getElementById('activeRows'),
    suspended: document.getElementById('suspendedRows'),
    deleted:   document.getElementById('deletedRows'),
    status:    document.getElementById('status'),
    emailNew:  document.getElementById('email'),
    form:      document.getElementById('createForm'),
  };

  const fmtTime = (ts) => {
    if (ts == null) return '';
    try {
      // API returns epoch seconds; convert if needed
      const ms = ts > 1e12 ? ts : ts * 1000;
      return new Date(ms).toLocaleString();
    } catch { return String(ts); }
  };

  const splitByStatus = (users) => {
    const norm = (s) => (s || 'active').toLowerCase();
    return {
      active:    users.filter(u => norm(u.status) === 'active'),
      suspended: users.filter(u => norm(u.status) === 'suspended'),
      deleted:   users.filter(u => norm(u.status) === 'deleted'),
    };
  };

  const render = (tbody, list) => {
    if (!tbody) return;
    tbody.innerHTML = '';
    for (const u of list) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.id ?? ''}</td>
        <td>${u.email ?? ''}</td>
        <td>${u.username ?? ''}</td>
        <td>${u.role ?? ''}</td>
        <td>${fmtTime(u.created_at)}</td>
        <td class="actions"><button class="btn btn-ghost" data-id="${u.id ?? ''}">View</button></td>
      `;
      tbody.appendChild(tr);
    }
  };

  async function load() {
    els.status && (els.status.textContent = 'Loading...');
    const r = await fetch('/api/admin/users', { credentials: 'include' });
    if (!r.ok) {
      els.status && (els.status.textContent = `HTTP ${r.status}`);
      return;
    }
    let data;
    try { data = await r.json(); }
    catch { els.status && (els.status.textContent = 'Invalid JSON'); return; }

    // Accept either {users:[...]} or {active:[],suspended:[],deleted:[]}
    let buckets;
    if (Array.isArray(data?.users)) {
      buckets = splitByStatus(data.users);
    } else {
      buckets = {
        active: data.active ?? [],
        suspended: data.suspended ?? [],
        deleted: data.deleted ?? [],
      };
    }

    render(els.active, buckets.active);
    render(els.suspended, buckets.suspended);
    render(els.deleted, buckets.deleted);
    els.status && (els.status.textContent = '');
  }

  if (els.form && els.emailNew) {
    els.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = els.emailNew.value.trim();
      if (!email) return;
      els.status && (els.status.textContent = 'Creating...');
      const r = await fetch('/api/admin/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!r.ok) {
        els.status && (els.status.textContent = `Create failed: HTTP ${r.status}`);
        return;
      }
      els.emailNew.value = '';
      await load();
    });
  }

  load();
});
