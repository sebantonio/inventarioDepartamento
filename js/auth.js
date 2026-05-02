// ═════════════════════════════════════════════════════════
// LOGIN
// ═════════════════════════════════════════════════════════
async function doLogin(){
  const usuario = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const errorEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');

  errorEl.classList.remove('show');
  if(!usuario || !password){
    errorEl.textContent = 'Introduce usuario y contraseña';
    errorEl.classList.add('show');
    return;
  }

  btn.disabled = true; btn.textContent = 'Comprobando...';
  try {
    const u = encodeURIComponent(usuario);
    const p = encodeURIComponent(password);
    const sep = API_URL.includes('?') ? '&' : '?';
    const r = await fetch(`${API_URL}${sep}u=${u}&p=${p}&action=login`);
    if(!r.ok) throw new Error('HTTP '+r.status);
    const text = await r.text();
    let res;
    try {
      res = JSON.parse(text);
    } catch(e) {
      console.error('Respuesta no es JSON:', text);
      throw new Error('Respuesta inesperada del servidor. Revisa la URL del Apps Script y que la implementación esté actualizada.');
    }
    if(!res.ok) throw new Error(res.error||'Credenciales incorrectas');
    if(!res.user) throw new Error('Servidor no devolvió datos del usuario. Comprueba que la pestaña "Usuarios" existe y tiene las cabeceras correctas.');

    SESSION = {
      usuario: usuario,
      password: password,
      nombre: res.user.nombre || usuario,
      rol: res.user.rol || 'profesor'
    };
    localStorage.setItem('inv_session', JSON.stringify(SESSION));
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    showUserChip();
    loadData();
  } catch(err) {
    console.error(err);
    errorEl.textContent = err.message || 'Error de conexión';
    errorEl.classList.add('show');
  } finally {
    btn.disabled = false; btn.textContent = 'Entrar';
  }
}

function logout(){
  if(!confirm('¿Cerrar sesión?')) return;
  localStorage.removeItem('inv_session');
  SESSION = null;
  items = [];
  cf = null;
  currentCiclo = null;
  document.getElementById('userChip').style.display = 'none';
  document.getElementById('btnN').style.display = 'none';
  document.getElementById('btnE').style.display = 'none';
  document.getElementById('bc').innerHTML = '';
  setConn('', 'Sin sesión');
  show('pLogin');
}

function showUserChip(){
  if(!SESSION) return;
  const initials = (SESSION.nombre||SESSION.usuario).split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('userAvatar').textContent = initials;
  document.getElementById('userName').textContent = SESSION.nombre || SESSION.usuario;
  document.getElementById('userChip').style.display = 'flex';
}

async function loadData(){
  if(!SESSION){show('pLogin');setConn('','Sin sesión');return}
  showUserChip();
  setConn('loading','Cargando...');
  try{
    const res = await apiGet();
    if(!res.ok){
      // Sesión inválida: forzar relogin
      if(res.error && res.error.includes('autorizado')){
        localStorage.removeItem('inv_session');
        SESSION = null;
        document.getElementById('userChip').style.display = 'none';
        show('pLogin');
        setConn('err','Sesión expirada');
        return;
      }
      throw new Error(res.error||'Error');
    }
    items = res.items || [];
    profesores = res.profesores || [];
    prestamos = res.prestamos || [];
    if(res.aulas && res.aulas.length) AULAS = res.aulas;
    if(res.cats && res.cats.length) CATS = Object.fromEntries(res.cats.sort((a,b)=>a.orden-b.orden).map(c=>[c.name,{c:c.c,bg:c.bg,i:c.i}]));
    setConn('ok',`${items.length} ítems · sincronizado`);
    document.getElementById('btnN').style.display='flex';
    document.getElementById('btnPres').style.display='flex';
    document.getElementById('btnPed').style.display='flex';
    updatePedBadge();
    if(location.hash && location.hash.length > 1) navigateFromHash(location.hash);
    else if(cf) openSub(); else if(currentCiclo) openCiclo(currentCiclo.id); else goHome();
  }catch(err){
    console.error(err);
    setConn('err','Error de conexión');
    if(!items.length){
      show('pH');
      document.getElementById('hStats').innerHTML=`<div class="empty" style="grid-column:1/-1"><div class="ei">⚠️</div><div class="et">No se pudo conectar.<br><small>${err.message}</small></div></div>`;
    }
  }
}

// ─── INIT ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function(){
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeM();closeConf();closeAulasModal();closePrestar();closeDevolver();closeProfModal();closeImport()}});
  // Enter en login
  ['loginUser','loginPass'].forEach(id=>{
    document.getElementById(id).addEventListener('keydown',e=>{if(e.key==='Enter')doLogin()});
  });
  loadData();
});
