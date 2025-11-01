(function(){
  function $(id){ return document.getElementById(id); }
  function toggle(id, btnId){
    const i = $(id), b = $(btnId);
    b.addEventListener("click", ()=> {
      i.type = i.type === "password" ? "text" : "password";
      b.textContent = i.type === "password" ? "Show" : "Hide";
    });
  }

  document.addEventListener("DOMContentLoaded", ()=>{
    toggle("password","togglePwd");
    toggle("confirm","toggleConfirm");

    const form = $("signupForm");
    const msg  = $("msg");
    const btn  = $("submitBtn");

    form.addEventListener("submit", async (e)=>{
      e.preventDefault();
      msg.textContent = "";

      // Require fields via HTML5; also check match
      const pwd = $("password").value;
      const cfm = $("confirm").value;
      if (pwd !== cfm) {
        alert("Passwords do not match."); // hard alert by request
        return;
      }
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const role = (new FormData(form)).get("role");
      const email = $("email").value.trim();

      btn.disabled = true;
      try {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "content-type":"application/json" },
          body: JSON.stringify({ email, password: pwd, role })
        });
        const data = await res.json().catch(()=> ({}));
        if (res.ok && data?.ok) {
          window.location.href = "/login/?created=1";
        } else {
          msg.textContent = data?.error || "Sign up failed.";
        }
      } catch(err){
        msg.textContent = "Network error.";
      } finally {
        btn.disabled = false;
      }
    });
  });
})();
