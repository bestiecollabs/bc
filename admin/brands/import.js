// admin/brands/import.js
(function () {
  ensureUi();
  const fileInput = document.getElementById('csvFile');
  const btnDry = document.getElementById('btnDryRun');
  const btnCommit = document.getElementById('btnCommit');
  const progressEl = document.getElementById('progress');
  const resultsEl = document.getElementById('results');

  btnDry.addEventListener('click', () => runImport({ commit: false }));
  btnCommit.addEventListener('click', () => runImport({ commit: true }));

  async function runImport({ commit }) {
    const file = fileInput.files && fileInput.files[0];
    if (!file) { toast('Select a CSV file first.'); return; }
    disable(true);
    resultsEl.innerHTML = '';
    setProgress(0);

    try {
      const batch = await apiPost('/api/admin/import/brands/batches', { mode: commit ? 'commit' : 'dry-run' });

      const rows = await parseCsv(file);
      if (!rows.length) { toast('CSV is empty.'); return; }

      const chunkSize = 500;
      let uploaded = 0;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        await apiPost('/api/admin/import/brands/rows', { batchId: batch.id, rows: chunk });
        uploaded += chunk.length;
        setProgress(Math.round((uploaded / rows.length) * 80)); // 0-80% for upload
      }

      const finalize = await apiPost('/api/admin/import/brands/commit', { batchId: batch.id, commit });

      renderResults(finalize);
      setProgress(100);
      toast(commit ? 'Import committed.' : 'Dry-run complete.');
    } catch (e) {
      console.error(e);
      toast('Import failed. Check console for details.');
    } finally {
      disable(false);
    }
  }

  function renderResults(payload) {
    const { total = 0, created = 0, updated = 0, skipped = 0, errors = [], sample = [] } = payload || {};
    const parts = [];
    parts.push(`<div class="card"><div class="card-title">Summary</div>
      <div class="grid grid-4">
        <div><b>Total</b><div>${total}</div></div>
        <div><b>Created</b><div>${created}</div></div>
        <div><b>Updated</b><div>${updated}</div></div>
        <div><b>Skipped</b><div>${skipped}</div></div>
      </div>
    </div>`);
    if (errors.length) {
      parts.push(`<div class="card mt-2"><div class="card-title">Errors (${errors.length})</div>
        <ol>${errors.slice(0, 100).map(e => `<li>Row ${e.row}: ${escapeHtml(e.message || e.error || 'Unknown error')}</li>`).join('')}</ol>
        ${errors.length > 100 ? `<div>+${errors.length - 100} more…</div>` : ''}
      </div>`);
    }
    if (sample.length) {
      parts.push(`<div class="card mt-2"><div class="card-title">Sample</div>
        <pre>${escapeHtml(JSON.stringify(sample.slice(0, 5), null, 2))}</pre>
      </div>`);
    }
    resultsEl.innerHTML = parts.join('\n');
  }

  function ensureUi() {
    let file = document.getElementById('csvFile');
    let dry = document.getElementById('btnDryRun');
    let commit = document.getElementById('btnCommit');
    let progress = document.getElementById('progress');
    let results = document.getElementById('results');

    if (file && dry && commit && progress && results) return;

    const wrap = document.createElement('div');
    wrap.className = 'card';
    wrap.innerHTML = `
      <div class="card-title">Brands CSV Import</div>
      <input type="file" id="csvFile" accept=".csv" />
      <div class="row mt-1">
        <button id="btnDryRun" class="btn fun">Dry run</button>
        <button id="btnCommit" class="btn">Commit</button>
      </div>
      <div class="mt-1">
        <progress id="progress" max="100" value="0" style="width: 100%"></progress>
      </div>
      <div id="results" class="mt-2"></div>
    `;
    document.body.appendChild(wrap);
  }

  function setProgress(v) { const el = document.getElementById('progress'); if (el) el.value = v; }
  function disable(flag) { ['csvFile','btnDryRun','btnCommit'].forEach(id => { const el = document.getElementById(id); if (el) el.disabled = flag; }); }

  async function apiPost(path, body) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body || {})
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`POST ${path} failed: ${res.status} ${text}`);
    }
    return res.json();
  }

  function parseCsv(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        try {
          const text = String(reader.result || '');
          const rows = csvToObjects(text);
          resolve(rows);
        } catch (e) { reject(e); }
      };
      reader.readAsText(file);
    });
  }

  function csvToObjects(text) {
    const lines = splitCsvLines(text);
    if (!lines.length) return [];
    const headers = parseCsvLine(lines[0]).map(h => h.trim());
    const out = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const vals = parseCsvLine(lines[i]);
      const obj = {};
      headers.forEach((h, idx) => obj[h] = vals[idx] ?? '');
      out.push(obj);
    }
    return out;
  }

  function splitCsvLines(text) {
    const lines = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; continue; }
      if (c === '"') { inQ = !inQ; continue; }
      if (!inQ && (c === '\n' || c === '\r')) { if (cur.length) { lines.push(cur); cur = ''; } continue; }
      cur += c;
    }
    if (cur.length) lines.push(cur);
    return lines;
  }

  function parseCsvLine(line) {
    const vals = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; continue; }
      if (c === '"') { inQ = !inQ; continue; }
      if (!inQ && c === ',') { vals.push(cur); cur = ''; continue; }
      cur += c;
    }
    vals.push(cur);
    return vals;
  }

  function toast(msg) { if (window.alert) alert(msg); else console.log(msg); }
  function escapeHtml(s) { return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
})();
