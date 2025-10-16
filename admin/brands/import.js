/* Admin Brands CSV Import — production */
(() => {
  const API_BASE = "https://api.bestiecollabs.com";
  const $ = s => document.querySelector(s);

  const file    = $("#file");
  const btnDry  = $("#dryrun");
  const btnCommit = $("#commit");

  if (!file || !btnDry || !btnCommit) return;

  const adminEmail = (window.ADMIN_EMAIL || "collabsbestie@gmail.com");
  const baseHeaders = { "x-admin-email": adminEmail };

  async function api(path, init = {}) {
    const url = (path.startsWith("http") ? path : API_BASE + path);
    const headers = Object.assign({}, baseHeaders, init.headers || {});
    const opts = Object.assign({ credentials: "include" }, init, { headers });
    const res = await fetch(url, opts);
    let json = null;
    try { json = await res.json(); } catch (_) {}
    if (!res.ok || !json) throw new Error(json?.error || ("HTTP " + res.status));
    return json;
  }

  let currentBatchId = null;

  async function dryRun() {
    const f = file.files && file.files[0];
    if (!f) { alert("Choose a CSV first"); return; }
    const text = await f.text();

    const j = await api("/api/admin/import/brands/batches", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: text
    });

    // Support either {id,...} or {batch_id,...}
    currentBatchId = j.id || j.batch_id;
    if (!currentBatchId) throw new Error("no batch id");

    const c = j.counts || {};
    alert(`Dry run OK. Batch ${currentBatchId}. Total ${c.total ?? "?"}, Valid ${c.valid ?? "?"}, Invalid ${c.invalid ?? "?"}`);
    window.BRAND_IMPORT_ID = currentBatchId;
  }

  async function commitDraft() {
    const id = currentBatchId || window.BRAND_IMPORT_ID;
    if (!id) { alert("Run Dry run first"); return; }

    const payload = { batchId: id, action: "draft", allow_non_us: 0 };
    const j = await api(`/api/admin/import/brands/batches/${id}/commit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (j.ok && (j.committed || j.id)) {
      alert(`Commit OK for ${id}`);
    } else {
      throw new Error(j.error || "commit failed");
    }
  }

  btnDry.addEventListener("click", () => dryRun().catch(e => { console.error(e); alert("Dry run error: " + e.message); }));
  btnCommit.addEventListener("click", () => commitDraft().catch(e => { console.error(e); alert("Commit error: " + e.message); }));
})();
