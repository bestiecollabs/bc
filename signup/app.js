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
  const passError=document.getElementById('pass_error');
  const ico1=document.getElementById('ico1');
  const ico2=document.getElementById('ico2');

  // Eye toggle like login: prevent mousedown focus, toggle class "eye"/"eye-off"
  function addReveal(inputId, btnId, icon){
    const input=document.getElementById(inputId);
    const btn=document.getElementById(btnId);
    btn.addEventListener('mousedown', e=>e.preventDefault());
    btn.addEventListener('click', ()=>{
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      icon.classList.toggle('eye', !show);
      icon.classList.toggle('eye-off', show);
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      btn.setAttribute('title', show ? 'Hide password' : 'Show password');
      input.focus({ preventScroll:true });
    });
  }
  addReveal('password','reveal1',ico1);
  addReveal('password2','reveal2',ico2);

  let busy=false, allOk=false;
  const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // Keep fun theme always; only disable/enable state changes
  function updateBtn(){
    btn.disabled = !allOk || busy;
  }

  function validate(){
    userErr.style.display='none';
    emailErr.style.display='none';
    emailUsed.style.display='none';

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

    passError.style.display = p2 && !match ? 'block' : 'none';
    hintUser.classList.toggle('hint-error', !!user && !userOk);
    hintPass.classList.toggle('hint-error', !!p1 && !passLenOk);

    allOk = !!first && !!last && validEmail(email) && userOk && passLenOk && match && roleOk && el.agree.checked;
    updateBtn();
  }

  Object.values(el).forEach(i=>{ i?.addEventListener('input',validate); i?.addEventListener('change',validate); });
  el.email.addEventListener('input', ()=>{ emailUsed.style.display='none'; emailErr.style.display='none'; });
  el.password2.addEventListener('blur', ()=>{ if(el.password.value && el.password2.value && el.password.value !== el.password2.value){ alert('Passwords do not match'); } });
  validate();

  function setBusy(s){ busy=s; btn.textContent = s ? 'Creating…' : 'Create Account'; updateBtn(); }

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
    if(el.password.value !== el.password2.value){ alert('Passwords do not match'); return; }

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
        emailUsed.style.display='inline';
        setBusy(false); validate(); return;
      }
      banner.textContent = `/auth/start failed. status ${s1.status}. body: ${s1.text.slice(0,300)}`;
      banner.style.display='block';
      await hardLogout(); setBusy(false); validate(); return;
    }

    const u = await probeUsername(base);
    await hardLogout();
    if(u.taken){
      userErr.style.display='block';
      hintUserTaken.style.display='inline';
      setBusy(false); validate(); return;
    }

    const payload = { ...base, password: el.password.value, accepted_terms: !!el.agree.checked, terms_version:'v1' };
    const s2 = await postJSON('/api/signup/complete', payload);
    if(!s2.ok || (s2.json && s2.json.ok===false)){
      await hardLogout();
      if(s2.status===409 || /user.*exist|username|user_id/.test(((s2.json && (s2.json.error||s2.json.code))||'').toLowerCase())){
        userErr.style.display='block'; hintUserTaken.style.display='inline'; setBusy(false); validate(); return;
      }
      banner.textContent = s2.text.slice(0,300) || 'Signup failed.';
      banner.style.display='block';
      setBusy(false); validate(); return;
    }

    location.assign('/account/');
  });
})();
