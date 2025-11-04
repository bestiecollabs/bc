// login-handler-v1-start
(function(){
  function q(list){ for(var i=0;i<list.length;i++){var el=document.querySelector(list[i]); if(el) return el} return null; }
  function closestForm(n){ while(n && n!==document.body){ if(n.tagName==="FORM") return n; n=n.parentElement } return null; }

  var email = q(['#email','input[name="email"]','#login_email']);
  var pass  = q(['#password','input[name="password"]','#login_password']);
  var btn   = q(['#loginBtn','form button[type="submit"]','form input[type="submit"]']);
  var form  = btn ? closestForm(btn) : document.querySelector('form');

  function setBusy(v){ if(btn){ btn.disabled = !!v } }
  function showErr(msg){
    var area = document.getElementById('loginError');
    if(!area){
      area = document.createElement('div');
      area.id='loginError';
      area.className='alert';
      var host = form || document.body;
      host.insertBefore(area, host.firstChild);
    }
    area.textContent = msg || '';
    area.style.display = msg ? 'block' : 'none';
  }
  function httpOk(r){ return r && r.status >= 200 && r.status <= 299; }

  async function doLogin(ev){
    try{
      if(ev && ev.preventDefault) ev.preventDefault();
      if(ev && ev.stopPropagation) ev.stopPropagation();
      showErr(''); setBusy(true);

      var emailVal = (email && email.value || '').trim();
      var passVal  = (pass  && pass.value  || '');

      var r = await fetch('/api/users/login', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body: JSON.stringify({ email: emailVal, password: passVal })
      });
      if(!httpOk(r)){
        var msg = 'Login failed ('+r.status+')';
        try{ var j = await r.json(); if(j && j.error) msg += ': ' + j.error }catch(_){}
        showErr(msg); return;
      }

      var me = await fetch('/api/users/me', { credentials:'include' });
      if(!httpOk(me)){ showErr('Session not established ('+me.status+')'); return; }

      location.assign('/dashboard/');
    }catch(_){ showErr('Login error'); }
    finally{ setBusy(false); }
  }

  function bind(){
    if(btn && btn.type !== 'button'){ try{ btn.type='button' }catch(_){ } }
    if(btn && !btn.dataset.boundLogin){ btn.addEventListener('click', doLogin); btn.dataset.boundLogin='1'; }
    if(form && !form.dataset.boundSubmit){ form.addEventListener('submit', doLogin, true); form.setAttribute('novalidate','novalidate'); form.dataset.boundSubmit='1'; }
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', bind) } else { bind() }
})();
// login-handler-v1-end
