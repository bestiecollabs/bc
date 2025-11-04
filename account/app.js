// account-auth-guard-start
(function(){
  async function reconcile(){
    try{
      const r = await fetch("/api/users/me", { credentials: "include" });
      if (r && r.ok) {
        var candidates = Array.from(document.querySelectorAll(".alert, .error, .notice, [data-role='signup-error']"));
        candidates.forEach(function(el){ if (el && /sign up failed/i.test(el.textContent||"")) el.style.display="none"; });
        document.documentElement.setAttribute("data-auth","1");
      } else {
        document.documentElement.setAttribute("data-auth","0");
      }
    } catch(_){
      document.documentElement.setAttribute("data-auth","0");
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", reconcile); else reconcile();
})();
// account-auth-guard-end
