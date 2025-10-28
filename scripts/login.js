document.addEventListener("DOMContentLoaded", function(){
  function ensureButton(btn){
    if (!btn) return null;
    if (btn.tagName === "BUTTON" && !btn.getAttribute("type")) btn.setAttribute("type","button");
    // Inject icons if missing
    if (!btn.querySelector(".icon-eye") && !btn.querySelector(".icon-eye-off")) {
      btn.innerHTML = ''
        + '<svg class="icon-eye" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>'
        + '<svg class="icon-eye-off" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3l18 18"/><path d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42"/><path d="M17.94 17.94C16.12 19.24 14.14 20 12 20 5 20 1 12 1 12a22.48 22.48 0 0 1 5.17-6.88"/><path d="M14.12 5.1A10.94 10.94 0 0 1 12 4C5 4 1 12 1 12a22.39 22.39 0 0 0 3.12 4.56"/></svg>';
    }
    if (!btn.hasAttribute("aria-pressed")) btn.setAttribute("aria-pressed","false");
    return btn;
  }

  function bindToggleByIds(btnId, inputId){
    var btn = ensureButton(document.getElementById(btnId));
    var inp = document.getElementById(inputId);
    if (!btn || !inp) return false;
    btn.addEventListener("click", function(e){
      e.preventDefault();
      var show = inp.getAttribute("type") === "password";
      inp.setAttribute("type", show ? "text" : "password");
      btn.setAttribute("aria-pressed", show ? "true" : "false");
    });
    return true;
  }

  function bindGeneric(){
    document.querySelectorAll(".input-wrap .pw-eye").forEach(function(btn){
      btn = ensureButton(btn);
      if (!btn || btn.dataset.bound === "1") return;
      var wrap = btn.closest(".input-wrap");
      var inp = wrap ? wrap.querySelector('input[type="password"], input[type="text"]') : null;
      if (!inp) return;
      btn.addEventListener("click", function(e){
        e.preventDefault();
        var show = inp.getAttribute("type") === "password";
        inp.setAttribute("type", show ? "text" : "password");
        btn.setAttribute("aria-pressed", show ? "true" : "false");
      });
      btn.dataset.bound = "1";
    });
  }

  // Try explicit IDs first, then generic bind for /login and home.
  var bound = false;
  bound = bindToggleByIds("togglePw","password") || bound;
  bound = bindToggleByIds("home-togglePw","home-password") || bound;
  bindGeneric();
});
