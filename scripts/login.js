document.addEventListener("DOMContentLoaded",function(){
  function bind(btnId,inputId){
    var b=document.getElementById(btnId), i=document.getElementById(inputId);
    if(!b||!i) return false;
    if(b.tagName==="BUTTON" && !b.getAttribute("type")) b.setAttribute("type","button");
    var eye    = '<svg class="icon-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
    var eyeOff = '<svg class="icon-eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.8 21.8 0 0 1 5.06-5.94"/><path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a21.8 21.8 0 0 1-3.16 4.19"/><line x1="1" y1="1" x2="23" y2="23"/><circle cx="12" cy="12" r="3"/></svg>';
    if(!b.querySelector('svg')) b.innerHTML = eye;
    b.addEventListener("click",function(e){
      e.preventDefault();
      var show = i.getAttribute("type")==="password";
      i.setAttribute("type", show ? "text" : "password");
      b.setAttribute("aria-pressed", show ? "true" : "false");
      b.innerHTML = show ? eyeOff : eye;
    });
    return true;
  }
  // Explicit ids
  bind("togglePw","password");
  bind("home-togglePw","home-password");
  // Generic fallback
  document.querySelectorAll(".input-wrap .pw-eye").forEach(function(b){
    if(b.dataset.bound==="1") return;
    if(b.tagName==="BUTTON" && !b.getAttribute("type")) b.setAttribute("type","button");
    var wrap=b.closest(".input-wrap"), i=wrap&&wrap.querySelector('input[type="password"],input[type="text"]');
    if(!i) return;
    b.addEventListener("click",function(e){
      e.preventDefault();
      var show = i.getAttribute("type")==="password";
      i.setAttribute("type", show ? "text" : "password");
      b.setAttribute("aria-pressed", show ? "true" : "false");
    });
    b.dataset.bound="1";
  });
});
