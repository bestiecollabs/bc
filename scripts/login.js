document.addEventListener("DOMContentLoaded", function(){
  function ensureIcons(btn){
    if (!btn.querySelector(".icon-eye") && !btn.querySelector(".icon-eye-off")) {
      btn.innerHTML =
        '<svg class="icon-eye" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg>' +
        '<svg class="icon-eye-off" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.8 21.8 0 0 1 5.06-5.94"/><path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a21.8 21.8 0 0 1-3.16 4.19"/><line x1="1" y1="1" x2="23" y2="23"/><circle cx="12" cy="12" r="3"/></svg>';
    }
  }
  function bindPair(btn, inp){
    if (!btn || !inp || btn.dataset.bound === "1") return;
    if (btn.tagName === "BUTTON") btn.type = "button";
    ensureIcons(btn);
    btn.addEventListener("click", function(e){
      e.preventDefault();
      e.stopPropagation();
      var show = inp.type === "password";
      inp.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", show ? "true" : "false");
    });
    btn.dataset.bound = "1";
  }
  function byIds(btnId, inpId){
    var b = document.getElementById(btnId);
    var i = document.getElementById(inpId);
    bindPair(b, i);
  }
  function generic(){
    document.querySelectorAll(".input-wrap .pw-eye").forEach(function(b){
      var wrap = b.closest(".input-wrap");
      var i = wrap && wrap.querySelector('input[type="password"], input[type="text"]');
      bindPair(b, i);
    });
  }
  // Initial binds
  byIds("togglePw","password");
  byIds("home-togglePw","home-password");
  generic();

  // Bind late-loaded DOM
  var mo = new MutationObserver(function(){ byIds("togglePw","password"); byIds("home-togglePw","home-password"); generic(); });
  mo.observe(document.documentElement, {subtree:true, childList:true});
});
