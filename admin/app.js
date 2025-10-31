/* admin/app.js - renderer with actions */
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
    try { const ms = ts > 1e12 ? ts : ts * 1000; return new Date(ms).toLocaleString(); }
    catch { return String(ts); }
  };

  const splitByStatus = (users) => {
    const norm = (s) => (s || 'active').toLowerCase();
    return {
      active:    users.filter(u => norm(u.status) === 'active'),
      suspended: users.filter(u => norm(u.status) === 'suspended'),
      deleted:   users.filter(u => norm(u.status) === 'deleted'),
    };
  };

  const btn = (label, action, id, extra='') =>
    `<button class="btn btn-ghost" data-action="${action}" data-id="${id}" ${extra}>${label}</button>`;

  const rowHtml = (u, kind) => {
    const base = `
      <td>${u.id ?? ''}</td>
      <td>${u.email ?? ''}</td>
      <td>${u.username ?? ''}</td>
      <td>${u.role ?? ''}</td>
      <td>${fmtTime(u.created_at)}</td>
    `;
    let actions = btn('View','view',u.id);
    if (kind === 'active') {
      actions = btn('Suspend','suspend',u.id) + btn('Delete','delete',u.id,'data-confirm="Are you sure?"') + actions;
    } else if (kind === 'suspended') {
      actions = btn('Restore','restore',u.id) + btn('Delete','delete',u.id,'data-confirm="Are you sure?"') + actions;
    } else if (kind === 'deleted') {
      actions = btn('Restore','restore',u.id) + actions;
    }
    return base + `<td class="actions">${actions}</td>`;
  };

  const render = (tbody, list, kind) => {
    if (!tbody) return;
    tbody.innerHTML = '';
    for (const u of list) {
      const tr = document.createElement('tr');
      tr.innerHTML = rowHtml(u, kind);
      tbody.appendChild(tr);
    }
  };

  async function apiAction(payload) {
    const r = await fetch('/api/admin/users', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return r.ok ? r.json().catch(()=>({})) : Promise.reject(new Error('HTTP '+r.status));
  }

  async function load() {
    els.status && (els.status.textContent = 'Loading...');
    const r = await fetch('/api/admin/users', { credentials: 'include' });
    if (!r.ok) { els.status && (els.status.textContent = `HTTP ${r.status}`); return; }
    let data; try { data = await r.json(); } catch { els.status && (els.status.textContent = 'Invalid JSON'); return; }

    let buckets;
    if (Array.isArray(data?.users)) buckets = splitByStatus(data.users);
    else buckets = { active: data.active ?? [], suspended: data.suspended ?? [], deleted: data.deleted ?? [] };

    render(els.active, buckets.active, 'active');
    render(els.suspended, buckets.suspended, 'suspended');
    render(els.deleted, buckets.deleted, 'deleted');
    els.status && (els.status.textContent = '');
  }

  // Create new user
  if (els.form && els.emailNew) {
    els.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = els.emailNew.value.trim(); if (!email) return;
      els.status && (els.status.textContent = 'Creating...');
      try { await apiAction({ action: 'create', email }); els.emailNew.value=''; await load(); }
      catch (err) { els.status && (els.status.textContent = 'Create failed: ' + err.message); }
    });
  }

  // Action delegation
  const onClick = async (e) => {
    const t = e.target.closest('button[data-action][data-id]'); if (!t) return;
    const action = t.getAttribute('data-action'); const id = Number(t.getAttribute('data-id'));
    if (t.dataset.confirm && !confirm(t.dataset.confirm)) return;

    if (action === 'view') { alert('User ID: ' + id); return; }

    els.status && (els.status.textContent = action.charAt(0).toUpperCase()+action.slice(1)+'...');
    try {
      // Supported actions: suspend, delete, restore
      await apiAction({ action, id });
      await load();
    } catch (err) {
      els.status && (els.status.textContent = action + ' failed: ' + err.message);
    }
  };

  ['active','suspended','deleted'].forEach(k => els[k]?.addEventListener('click', onClick));

  load();
});
