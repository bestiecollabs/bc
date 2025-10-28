document.addEventListener("DOMContentLoaded", function(){
  function bindToggle(btnId, inputId){
    var btn = document.getElementById(btnId);
    var inp = document.getElementById(inputId);
    if(!btn || !inp) return;
    if (btn.tagName === "BUTTON" && !btn.getAttribute("type")) btn.setAttribute("type","button");
    btn.addEventListener("click", function(e){
      e.preventDefault();
      var t = inp.getAttribute("type")==="password" ? "text" : "password";
      inp.setAttribute("type", t);
      btn.setAttribute("aria-pressed", t==="text" ? "true" : "false");
    });
  }
  // Login page ids
  bindToggle("togglePw","password");
  // Home page ids (if present)
  bindToggle("home-togglePw","home-password");
  // Fallback: any .pw-eye controlling nearest input[type=password]
  document.querySelectorAll(".pw-eye").forEach(function(btn){
    if(!btn.hasAttribute("data-bound")){
      btn.setAttribute("type","button");
      var wrap = btn.closest(".input-wrap");
      var inp = wrap ? wrap.querySelector('input[type="password"], input[type="text"]') : null;
      if(inp){
        btn.addEventListener("click", function(e){
          e.preventDefault();
          var t = inp.getAttribute("type")==="password" ? "text" : "password";
          inp.setAttribute("type", t);
          btn.setAttribute("aria-pressed", t==="text" ? "true" : "false");
        });
        btn.setAttribute("data-bound","1");
      }
    }
  });
});
