(function(){
  const fileInput = document.getElementById("file");
  const dryBtn = document.getElementById("dryrun") || Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim().toLowerCase() === "dry run");
  const commitBtn = document.getElementById("commit") || Array.from(document.querySelectorAll("button")).find(b => b.textContent.trim().toLowerCase() === "commit");
  const statusEl = document.getElementById("actout") || document.querySelector(".muted");
  function show(msg){ if(statusEl) statusEl.textContent = String(msg); }

  async function uploadCSV(){
    const f = fileInput && fileInput.files && fileInput.files[0];
    if(!f) throw new Error("select a CSV file");
    const res = await fetch("https://api.bestiecollabs.com/api/admin/import/brands/batches", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: await f.text()
    });
    if(!res.ok) throw new Error("HTTP "+res.status);
    return res.json();
  }

  dryBtn && dryBtn.addEventListener("click", async ()=>{
    try{
      const j = await uploadCSV();
      show(`parsed: total=${j.counts?.total||0} valid=${j.counts?.valid||0} invalid=${j.counts?.invalid||0} (batch ${j.batch_id})`);
    }catch(e){ show("error: "+e.message); }
  });

  commitBtn && commitBtn.addEventListener("click", async ()=>{
    try{
      const j = await uploadCSV();
      const r = await fetch(`https://api.bestiecollabs.com/api/admin/import/brands/batches/${j.batch_id}/commit`, { method:"POST" });
      const cj = await r.json().catch(()=>({}));
      show(cj.ok ? "publish ok" : ("commit failed: "+(cj.error||r.status)));
    }catch(e){ show("error: "+e.message); }
  });
})();