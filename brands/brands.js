async function loadBrands() {
  const qs = new URLSearchParams(location.search);
  const category = qs.get("category") || "";
  const q = qs.get("q") || "";
  const url = new URL("/api/brands", location.origin);
  if (category) url.searchParams.set("category", category);
  if (q) url.searchParams.set("q", q);
  url.searchParams.set("limit","60");

  const res = await fetch(url.toString(), { headers: { "accept":"application/json" }});
  const data = await res.json().catch(()=>({ ok:false, items:[] }));
  const list = document.getElementById("brand-list");
  list.innerHTML = "";
  if (!data.ok || !data.items || data.items.length===0) {
    list.innerHTML = "<p>No brands yet.</p>";
    return;
  }
  for (const b of data.items) {
    const cats = [b.category_primary, b.category_secondary, b.category_tertiary].filter(Boolean).join(" • ");
    const card = document.createElement("a");
    card.className = "card";
    card.href = b.website_url;
    card.target = "_blank";
    card.rel = "noopener";
    card.innerHTML = `
      <div class="card-body">
        <div class="card-title" style="display:flex;align-items:center;gap:12px">
          ${b.logo_url ? `<img src="${b.logo_url}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:8px">` : ``}
          <strong>${b.name}</strong>
          ${b.featured ? `<span class="badge">Featured</span>` : ``}
        </div>
        <div class="card-text" style="margin-top:6px">${cats || ""}</div>
        <div class="card-text" style="color:#666;margin-top:4px">${b.domain || ""}</div>
      </div>`;
    list.appendChild(card);
  }
}
document.addEventListener("DOMContentLoaded", loadBrands);
