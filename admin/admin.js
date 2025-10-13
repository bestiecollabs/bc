/* Admin shared utilities: nav active, toast, drawer hook, auth hint via /api/users/me */
(function(){
  // Nav active
  const here = location.pathname.replace(/\/+$/,"/").toLowerCase();
  document.querySelectorAll('[data-link="nav"], .rail nav a').forEach(a=>{
    const href = (a.getAttribute("href")||"").toLowerCase();
    if (here === href) a.classList.add("active");
  });

  // Toast
  window.toast = function(msg, ms=2600){
    const t = document.getElementById("toast");
    if(!t){ console.log("[toast]", msg); return; }
    t.textContent = msg;
    t.style.display = "block";
    clearTimeout(t._h);
    t._h = setTimeout(()=>{ t.style.display="none"; }, ms);
  };

  // Auth user probe once
  (async function(){
    try{
      const res = await fetch("/api/users/me", { credentials: "include" });
      if(!res.ok) return;
      const data = await res.json().catch(()=>null);
      if (data && data.user){
        window.__USER = data.user;
        const el = document.getElementById("admin-user");
        if (el) el.textContent = "Signed in: " + (data.user.email || "unknown");
      }
    }catch(e){ /* silent */ }
  })();
})();
