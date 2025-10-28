document.addEventListener("DOMContentLoaded",function(){
  function bind(btnId, inputId){
    var b=document.getElementById(btnId), i=document.getElementById(inputId);
    if(!b||!i) return;
    if(b.tagName==="BUTTON") b.type="button";
    b.addEventListener("click",function(e){
      e.preventDefault();
      var show = i.type==="password";
      i.type = show ? "text" : "password";
      b.setAttribute("aria-pressed", show ? "true" : "false");
    });
  }
  bind("togglePw","password");
  // Fallback for any .pw-eye near a password input
  document.querySelectorAll(".input-wrap .pw-eye").forEach(function(b){
    if(b.dataset.bound==="1") return;
    if(b.tagName==="BUTTON") b.type="button";
    var wrap=b.closest(".input-wrap");
    var i=wrap&&wrap.querySelector('input[type="password"],input[type="text"]');
    if(!i) return;
    b.addEventListener("click",function(e){
      e.preventDefault();
      var show = i.type==="password";
      i.type = show ? "text" : "password";
      b.setAttribute("aria-pressed", show ? "true" : "false");
    });
    b.dataset.bound="1";
  });
});
