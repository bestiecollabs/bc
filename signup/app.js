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

  let busy=false;
  let allOk=false;
  const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  function validate(){
    if(userErr)  userErr.style.display='none';
    if(emailErr) emailErr.style.display='none';
    if(emailUsed) emailUsed.style.display='none';

    const first = el.first_name?.value.trim() || '';
    const last  = el.last_name?.value.trim() || '';
    const email = el.email?.value.trim() || '';
    const user  = el.username?.value.trim() || '';
    const p1    = el.password?.value || '';
    const p2    = el.password2?.value || '';
    const roleOk = !!(el.roleBrand?.checked || el.roleCreator?.checked);

    const userOk    = /^[A-Za-z0-9_]{3,15}$/.test(user);
    const passLenOk = p1.length>=8 && p1.length<=15;
    const match     = p1===p2 && p2.length>0;

    if(hintUser) hintUser.classList.toggle('hint-error', !!user && !userOk);
    if(hintPass) hintPass.classList.toggle('hint-error', !!p1 && !passLenOk);

    allOk = !!first && !!last && validEmail(email) && userOk && passLenOk && match && roleOk && !!el.agree?.checked;
    if(btn) btn.disabled = !allOk || busy;
  }

  Object.values(el).forEach(i=>{ i?.addEventListener('input',validate); i?.addEventListener('change',validate); });
  el.email?.addEventListener('input', ()=>{ if(emailUsed) emailUsed.style.display='none'; if(emailErr) emailErr.style.display='none'; });
  validate();

  function setBusy(s){
    busy=s;
    if(btn){
      btn.textContent = s ? 'Creating…' : 'Create Account';
      btn.disabled = !allOk || busy;
    }
  }

  async function postJSON(url,data){
    try{
      const res = await fetch(url,{ method:'POST', headers:{'Accept':'application/json','Content-Type':'application/json'}, credentials:'include', body:JSON.stringify(data) });
      const text=await res.text(); let json=null; try{ json=JSON.parse(text); }catch(_){}
      return { ok:res.ok, status:res.status, json, text };
    }catch(e){ return { ok:false, status:0, json:null, text:String(e) }; }
  }

  async function hardLogout(){ try{ await fetch('/logout',{credentials:'include'}); }catch(_){} }

  async function probeUsername(base){
    const probe = { ...base, password:'x', accepted_terms:false };
    const r = await postJSON('/api/signup/complete', probe);
    if(r.status===409) return { taken:true };
    const code = ((r.json && (r.json.error||r.json.code))||'').toLowerCase();
    if(/user.*exist|username|user_id/.test(code)) return { taken:true };
    return { taken:false };
  }

  btn?.addEventListener('click', async ()=>{
    if(btn.disabled) return;

    setBusy(true);

    const role = el.roleCreator?.checked ? 'creator' : el.roleBrand?.checked ? 'brand' : '';
    const username = el.username?.value.trim() || '';
    const base = {
      email: el.email?.value.trim() || '',
      username,
      user_id: username,
      full_name: ((el.first_name?.value.trim()||'') + ' ' + (el.last_name?.value.trim()||'')).trim(),
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
      if(banner){ banner.textContent = `/auth/start failed. status ${s1.status}. body: ${s1.text.slice(0,300)}`; banner.style.display='block'; }
      await hardLogout(); setBusy(false); validate(); return;
    }

    const u = await probeUsername(base);
    await hardLogout();
    if(u.taken){
      if(userErr) userErr.style.display='block';
      if(hintUserTaken) hintUserTaken.style.display='inline';
      setBusy(false); validate(); return;
    }

    const payload = { ...base, password: el.password?.value || '', accepted_terms: !!el.agree?.checked, terms_version:'v1' };
    const s2 = await postJSON('/api/signup/complete', payload);
    if(!s2.ok || (s2.json && s2.json.ok===false)){
      await hardLogout();
      const code = ((s2.json && (s2.json.error||s2.json.code))||'').toLowerCase();
      if(s2.status===409 || /user.*exist|username|user_id/.test(code)){
        if(userErr) userErr.style.display='block';
        if(hintUserTaken) hintUserTaken.style.display='inline';
        setBusy(false); validate(); return;
      }
      if(banner){ banner.textContent = s2.text.slice(0,300) || 'Signup failed.'; banner.style.display='block'; }
      setBusy(false); validate(); return;
    }

    location.assign('/account/');
  });

  // .pw-eye toggle
  document.querySelectorAll('.pw-eye').forEach(btn=>{
    const id = btn.getAttribute('aria-controls');
    const input = document.getElementById(id);
    if(!input) return;
    btn.addEventListener('mousedown', e=>e.preventDefault());
    btn.addEventListener('click', ()=>{
      const show = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(show));
      input.type = show ? 'text' : 'password';
      try{ input.focus({ preventScroll:true }); }catch(_){}
    });
  });

  // Terms gating redundancy (also handled in validate)
  const agree = el.agree;
  if(agree && btn){
    btn.disabled = !agree.checked || !allOk || busy;
    agree.addEventListener('change', ()=>{ btn.disabled = !agree.checked || !allOk || busy; });
  }
})();
/* eslint-disable */
// signup-validate-start
(function () {
  function byId(id){ return document.getElementById(id); }

  var el = {
    first: byId('first_name'),
    last:  byId('last_name'),
    user:  byId('username'),
    email: byId('email'),
    pass:  byId('password'),
    pass2: byId('password2'),
    agree: byId('agree'),
    btn:   byId('createBtn')
  };

  var roles = Array.prototype.slice.call(document.querySelectorAll('input[name="role"]'));

  function allFilled() {
    var ok = true;
    [
      el.first, el.last, el.user, el.email, el.pass, el.pass2
    ].forEach(function(i){
      if (!i) ok = false;
      else if (i.type === 'email') { ok = ok && i.value.trim() !== '' && i.checkValidity(); }
      else { ok = ok && i.value.trim() !== ''; }
    });
    return ok;
  }

  function roleSelected() {
    return roles.some(function(r){ return r.checked; });
  }

  function passwordsValid() {
    var p1 = el.pass ? el.pass.value : '';
    var p2 = el.pass2 ? el.pass2.value : '';
    var lenOK = p1.length >= 8 && p1.length <= 15;
    var match = p1 === p2 && p2.length > 0;

    if (el.pass)  { el.pass.setCustomValidity(lenOK ? '' : 'Password must be 8–15 characters'); }
    if (el.pass2) { el.pass2.setCustomValidity(match ? '' : 'Passwords do not match'); }

    return lenOK && match;
  }

  function recompute() {
    var ok =
      el.btn &&
      el.agree && el.agree.checked &&
      allFilled() &&
      roleSelected() &&
      passwordsValid();

    if (el.btn) { el.btn.disabled = !ok; }
  }

  function bind(elm) {
    if (!elm) return;
    var evt = (elm.type === 'radio' || elm.type === 'checkbox') ? 'change' : 'input';
    elm.addEventListener(evt, recompute);
  }

  [el.first, el.last, el.user, el.email, el.pass, el.pass2, el.agree].forEach(bind);
  roles.forEach(bind);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', recompute);
  } else {
    recompute();
  }
})();
// signup-validate-end
/* eslint-disable */
// signup-bold-start
(function () {
  function byId(id){ return document.getElementById(id); }

  var el = {
    first: byId('first_name'),
    last:  byId('last_name'),
    user:  byId('username'),
    email: byId('email'),
    pass:  byId('password'),
    pass2: byId('password2')
  };
  var roles = Array.prototype.slice.call(document.querySelectorAll('input[name="role"]'));

  function labelFor(input) {
    if (!input || !input.parentElement) return null;
    return input.parentElement.querySelector('label');
  }

  function findIamLabel() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('span.funtext'));
    for (var i = 0; i < nodes.length; i++) {
      var t = (nodes[i].textContent || '').trim().toLowerCase();
      if (t === 'i am a') return nodes[i];
    }
    return null;
  }

  function setBold(node, on) {
    if (!node) return;
    node.style.fontWeight = on ? '700' : '';
  }

  function incomplete(val) {
    return !val || val.trim() === '';
  }

  function updateBold() {
    setBold(labelFor(el.first),  incomplete(el.first  ? el.first.value  : ''));
    setBold(labelFor(el.last),   incomplete(el.last   ? el.last.value   : ''));
    setBold(labelFor(el.user),   incomplete(el.user   ? el.user.value   : ''));
    setBold(labelFor(el.email),  incomplete(el.email  ? el.email.value  : ''));
    setBold(labelFor(el.pass),   incomplete(el.pass   ? el.pass.value   : ''));
    setBold(labelFor(el.pass2),  incomplete(el.pass2  ? el.pass2.value  : ''));

    var roleChosen = roles.some(function(r){ return r.checked; });
    setBold(findIamLabel(), !roleChosen);
  }

  function bind(elm) {
    if (!elm) return;
    var evt = (elm.type === 'radio' || elm.type === 'checkbox') ? 'change' : 'input';
    elm.addEventListener(evt, updateBold);
  }

  Object.keys(el).forEach(function(k){ bind(el[k]); });
  roles.forEach(bind);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateBold);
  } else {
    updateBold();
  }
})();
// signup-bold-end
// signup-afterlogin-start
(function () {
  function byId(id){ return document.getElementById(id); }
  var el = {
    first: byId("first_name"),
    last:  byId("last_name"),
    user:  byId("username"),
    email: byId("email"),
    pass:  byId("password"),
    pass2: byId("password2"),
    btn:   byId("createBtn")
  };
  var roles = Array.prototype.slice.call(document.querySelectorAll('input[name="role"]'));

  async function signUpAndLogin(ev){
    try {
      if (ev && ev.preventDefault) ev.preventDefault();
      if (el.btn) el.btn.disabled = true;

      var role = (roles.find(function(r){ return r.checked; }) || {}).value || null;

      // 1) Sign up
      var res = await fetch("/api/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          first_name: el.first?.value?.trim(),
          last_name:  el.last?.value?.trim(),
          username:   el.user?.value?.trim(),
          email:      el.email?.value?.trim(),
          password:   el.pass?.value || "",
          role:       role
        })
      });
      if (!res.ok) throw new Error("Signup failed");

      // 2) Immediately log in to get the session cookie
      var res2 = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email:    el.email?.value?.trim(),
          password: el.pass?.value || ""
        })
      });
      if (!res2.ok) throw new Error("Login after signup failed");

      // 3) Verify session before redirect to avoid race conditions
      var me = await fetch("/api/users/me", { credentials: "include" });
      if (!me.ok) throw new Error("Session not established");

      location.assign("/dashboard/");
    } catch (e) {
      alert(e && e.message ? e.message : "Signup flow error");
    } finally {
      if (el.btn) el.btn.disabled = false;
    }
  }

  // Bind without duplicating
  if (el.btn && !el.btn.dataset.boundSignup) {
    el.btn.addEventListener("click", signUpAndLogin);
    el.btn.dataset.boundSignup = "1";
  }
})();
// signup-afterlogin-end
