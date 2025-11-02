(function(){
  const ids=['first_name','last_name','email','username','password','password2','agree','roleBrand','roleCreator'];
  const el=Object.fromEntries(ids.map(id=>[id,document.getElementById(id)]));
  const btn=document.getElementById('createBtn');
  const banner=document.getElementById('form_error');
  const userErr=document.getElementById('user_error');
  const emailErr=document.getElementById('email_error');
  const emailUsed=document.getElementById('email_used');
  const hintUser=document.getElementById('hint_user');
  const hintUserTaken=document.getElementById('hint_user_taken');
  const hintPass=document.getElementById('hint_pass');


  // Eye toggle identical to login: element is <i class="ico eye">; swap to eye-off; prevent focus jump
  );
    });
  }

  // Login-style eye toggle
  
let busy=false, allOk=false;
  const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  function validate(){
    userErr && (userErr.style.display='none');
    emailErr && (emailErr.style.display='none');
    emailUsed && (emailUsed.style.display='none');

    const first=el.first_name.value.trim();
    const last =el.last_name.value.trim();
    const email=el.email.value.trim();
    const user =el.username.value.trim();
    const p1   =el.password.value;
    const p2   =el.password2.value;
    const roleOk = el.roleBrand.checked || el.roleCreator.checked;

    const userOk = /^[A-Za-z0-9_]{3,15}$/.test(user);
    const passLenOk = p1.length>=8 && p1.length<=15;
    const match = p1 === p2 && p2.length>0;

    hintUser && hintUser.classList.toggle('hint-error', !!user && !userOk);
    hintPass && hintPass.classList.toggle('hint-error', !!p1 && !passLenOk);

    allOk = !!first && !!last && validEmail(email) && userOk && passLenOk && match && roleOk && el.agree.checked;
    btn.disabled = !allOk || busy;
  }

  Object.values(el).forEach(i=>{ i?.addEventListener('input',validate); i?.addEventListener('change',validate); });
  el.email.addEventListener('input', ()=>{ if(emailUsed) { emailUsed.style.display='none'; } if(emailErr) { emailErr.style.display='none'; } });
  validate();

  function setBusy(s){ busy=s; btn.textContent = s ? 'Creating…' : 'Create Account'; btn.disabled = !allOk || busy; }

  async function postJSON(url,data){
    try{
      const res=await fetch(url,{ method:'POST', headers:{'Accept':'application/json','Content-Type':'application/json'}, credentials:'include', body:JSON.stringify(data) });
      const text=await res.text(); let json=null; try{ json=JSON.parse(text); }catch{}
      return { ok:res.ok, status:res.status, json, text };
    }catch(e){ return { ok:false, status:0, json:null, text:String(e) }; }
  }
  async function hardLogout(){ try{ await fetch('/logout',{credentials:'include'}); }catch(_){ } }
  async function probeUsername(base){
    const probe = { ...base, password:'x', accepted_terms:false };
    const r = await postJSON('/api/signup/complete', probe);
    if(r.status===409) return { taken:true };
    const code = ((r.json && (r.json.error||r.json.code))||'').toLowerCase();
    if(/user.*exist|username|user_id/.test(code)) return { taken:true };
    return { taken:false };
  }

  btn.addEventListener('click', async ()=>{
    if(btn.disabled) return;

    setBusy(true);

    const role = el.roleCreator.checked ? 'creator' : el.roleBrand.checked ? 'brand' : '';
    const username = el.username.value.trim();
    const base = {
      email: el.email.value.trim(),
      username,
      user_id: username,
      full_name: (el.first_name.value.trim() + ' ' + el.last_name.value.trim()).trim(),
      role
    };

    const s1 = await postJSON('/auth/start', { email: base.email, role });
    if(!s1.ok || (s1.json && s1.json.ok===false)){
      const e = (s1.json && (s1.json.error||s1.json.code)) || '';
      if(s1.status===409 || /already|email/i.test(e)){
        await hardLogout();
        if(emailUsed) emailUsed.style.display='inline';
        setBusy(false); validate(); return;
      }
      banner.textContent = `/auth/start failed. status ${s1.status}. body: ${s1.text.slice(0,300)}`;
      banner.style.display='block';
      await hardLogout(); setBusy(false); validate(); return;
    }

    const u = await probeUsername(base);
    await hardLogout();
    if(u.taken){
      if(userErr) userErr.style.display='block';
      if(hintUserTaken) hintUserTaken.style.display='inline';
      setBusy(false); validate(); return;
    }

    const payload = { ...base, password: el.password.value, accepted_terms: !!el.agree.checked, terms_version:'v1' };
    const s2 = await postJSON('/api/signup/complete', payload);
    if(!s2.ok || (s2.json && s2.json.ok===false)){
      await hardLogout();
      const code = ((s2.json && (s2.json.error||s2.json.code))||'').toLowerCase();
      if(s2.status===409 || /user.*exist|username|user_id/.test(code)){
        if(userErr) userErr.style.display='block';
        if(hintUserTaken) hintUserTaken.style.display='inline';
        setBusy(false); validate(); return;
      }
      banner.textContent = s2.text.slice(0,300) || 'Signup failed.';
      banner.style.display='block';
      setBusy(false); validate(); return;
    }

    location.assign('/account/');
  });
  // pw-eye toggle and Terms gating (CSP-safe; external JS only)
  (function(){
    document.querySelectorAll('.pw-eye').forEach(function(btn){
      var id = btn.getAttribute('aria-controls');
      var input = document.getElementById(id);
      if (!input) return;
      btn.addEventListener('mousedown', function(e){ e.preventDefault(); });
      btn.addEventListener('click', function(){
        var show = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', String(show));
        input.type = show ? 'text' : 'password';
        try { input.focus({ preventScroll:true }); } catch(_) {}
      });
    });

    var agree  = document.getElementById('agree');
    var create = document.getElementById('createBtn');
    if (agree && create) {
      create.disabled = !agree.checked;
      agree.addEventListener('change', function(){ create.disabled = !agree.checked; });
    }
  })();})();


