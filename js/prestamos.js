// ═════════════════════════════════════════════════════════
// PRÉSTAMOS
// ═════════════════════════════════════════════════════════
function getPrestamosActivos(){
  return prestamos.filter(p=>p.estado==='Activo'||p.estado==='Parcial');
}

function isVencido(pres){
  if(pres.estado!=='Activo'&&pres.estado!=='Parcial') return false;
  if(!pres.fechaPrevista) return false;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const prev = new Date(pres.fechaPrevista);
  return prev < hoy;
}

function getVencidos(){
  return getPrestamosActivos().filter(isVencido);
}

function goPrestamos(tab){
  _push({page:'prestamos'}, '#prestamos');
  cf=null; currentCiclo=null;
  if(tab) currentPresTab = tab;
  document.getElementById('btnN').style.display='none';
  document.getElementById('btnE').style.display='none';
  _hideHomeButtons();
  document.getElementById('bc').innerHTML=`<span class="bc-link" onclick="goHome()">Inicio</span><span class="sep">›</span><strong>📋 Préstamos</strong>`;

  // Stats
  const activos = getPrestamosActivos().length;
  const vencidos = getVencidos().length;
  const devueltos = prestamos.filter(p=>p.estado==='Devuelto').length;
  document.getElementById('presStats').innerHTML=`
    <div class="scard"><div class="scard-icon">🟡</div><div><div class="scard-num">${activos}</div><div class="scard-lbl">activos</div></div></div>
    <div class="scard"><div class="scard-icon">🔴</div><div><div class="scard-num" style="color:var(--red)">${vencidos}</div><div class="scard-lbl">vencidos</div></div></div>
    <div class="scard"><div class="scard-icon">✅</div><div><div class="scard-num">${devueltos}</div><div class="scard-lbl">devueltos (histórico)</div></div></div>
    <div class="scard"><div class="scard-icon">👥</div><div><div class="scard-num">${profesores.length}</div><div class="scard-lbl">profesores</div></div></div>
  `;
  document.getElementById('presMeta').textContent = `${prestamos.length} préstamo${prestamos.length!==1?'s':''} registrado${prestamos.length!==1?'s':''} en total`;

  // Tabs
  document.getElementById('ptActivos').classList.toggle('active', currentPresTab==='activos');
  document.getElementById('ptVencidos').classList.toggle('active', currentPresTab==='vencidos');
  document.getElementById('ptDevueltos').classList.toggle('active', currentPresTab==='devueltos');

  show('pPres');
  renderPrestamos();
}

function setPresTab(tab){
  currentPresTab = tab;
  goPrestamos(tab);
}

function renderPrestamos(){
  const q = document.getElementById('presSearch').value.toLowerCase();
  let data;
  if(currentPresTab==='activos') data = getPrestamosActivos().filter(p=>!isVencido(p));
  else if(currentPresTab==='vencidos') data = getVencidos();
  else data = prestamos.filter(p=>p.estado==='Devuelto');

  if(q){
    data = data.filter(p=>[p.itemNombre,p.profesorNombre,p.obs].join(' ').toLowerCase().includes(q));
  }

  // Ordenar: más reciente primero para histórico, más antiguo primero para activos/vencidos
  data.sort((a,b)=>{
    if(currentPresTab==='devueltos') return new Date(b.fechaDevolucion||b.fechaPrestamo) - new Date(a.fechaDevolucion||a.fechaPrestamo);
    return new Date(a.fechaPrevista||a.fechaPrestamo) - new Date(b.fechaPrevista||b.fechaPrestamo);
  });

  const mc = document.getElementById('presContent');
  if(!data.length){
    const msgs = {
      activos:'No hay préstamos activos',
      vencidos:'¡Sin préstamos vencidos! 🎉',
      devueltos:'No hay préstamos en el histórico'
    };
    mc.innerHTML=`<div class="empty"><div class="ei">📋</div><div class="et">${msgs[currentPresTab]}</div></div>`;
    return;
  }

  mc.innerHTML = data.map(p=>{
    const venc = isVencido(p);
    const item = items.find(x=>Number(x.id)===Number(p.itemId));
    const aulaO = AULAS.find(a=>a.id===p.aulaOrigen)?.name || p.aulaOrigen;
    const aulaD = p.aulaDestino ? (AULAS.find(a=>a.id===p.aulaDestino)?.name || p.aulaDestino) : '—';
    const pendiente = Number(p.cantidad) - Number(p.cantidadDevuelta||0);
    const stateClass = p.estado==='Devuelto'?'devuelto':(p.estado==='Parcial'?'parcial':(venc?'vencido':''));
    const pillClass = p.estado==='Devuelto'?'devuelto':(p.estado==='Parcial'?'parcial':(venc?'vencido':''));

    return `<div class="pres-card ${stateClass}">
      <div class="pres-info">
        <div class="pres-name">${p.itemNombre} ${item?`<span style="color:var(--muted);font-weight:400;font-size:12px">· ${item.ref||''}</span>`:''}</div>
        <div class="pres-prof">${p.profesorNombre}</div>
        <div class="pres-meta">
          <span>📅 ${p.fechaPrestamo}${p.fechaPrevista?` → ${p.fechaPrevista}`:''}</span>
          <span>🏫 ${aulaO}${p.aulaDestino?` → ${aulaD}`:''}</span>
          <span class="pres-pill ${pillClass}">${p.estado}${venc&&p.estado!=='Devuelto'?' (vencido)':''}</span>
        </div>
        ${p.obs?`<div style="font-size:11px;color:var(--muted);margin-top:4px">💬 ${p.obs}</div>`:''}
      </div>
      <div class="pres-actions">
        <div class="pres-qty-info">
          <div class="pres-qty-num">${pendiente}/${p.cantidad}</div>
          <div>pendiente</div>
        </div>
        ${p.estado!=='Devuelto'?`<button class="btn btn-sm btn-return" onclick="openDevolver(${p.id})">📥 Devolver</button>`:''}
      </div>
    </div>`;
  }).join('');
}

// ─── PRESTAR ─────────────────────────────────────────────
function _fillPrestarInfo(item){
  document.getElementById('prestarItemInfo').innerHTML = `
    <div style="font-weight:700;font-size:14px;margin-bottom:4px">${item.item}</div>
    <div style="font-size:12px;color:var(--muted)">
      ${item.ref?`<span style="font-family:var(--mono);background:var(--white);padding:2px 6px;border-radius:4px;margin-right:8px">${item.ref}</span>`:''}
      Stock disponible: <strong style="color:var(--accent)">${item.qty} unidades</strong>
    </div>`;
}

function _buildPresItemOptions(filtered){
  document.getElementById('pres_item').innerHTML =
    '<option value="">— Seleccionar ítem —</option>' +
    filtered.map(x=>`<option value="${x.id}">${x.item}${x.ref?' ['+x.ref+']':''} · ${x.qty} uds.</option>`).join('');
}

function filterPresItems(){
  const aulaVal = document.getElementById('pres_filtAula').value;
  const q = document.getElementById('pres_filtQ').value.toLowerCase().trim();
  let filtered = items.filter(x=>Number(x.qty)>0);
  if(aulaVal) filtered = filtered.filter(x=>String(x.aula)===String(aulaVal));
  if(q) filtered = filtered.filter(x=>(x.item+' '+(x.ref||'')).toLowerCase().includes(q));
  filtered.sort((a,b)=>a.item.localeCompare(b.item));
  _buildPresItemOptions(filtered);
  // reset selection
  prestarItemId = null;
  document.getElementById('prestarItemInfo').innerHTML='<div style="color:var(--muted);font-size:13px">Selecciona un ítem para ver su información</div>';
}

function onPresItemChange(val){
  if(!val){ prestarItemId=null; document.getElementById('prestarItemInfo').innerHTML='<div style="color:var(--muted);font-size:13px">Selecciona un ítem para ver su información</div>'; return; }
  const item = items.find(x=>String(x.id)===String(val));
  if(!item) return;
  prestarItemId = item.id;
  _fillPrestarInfo(item);
  document.getElementById('pres_aulaDest').innerHTML = '<option value="">— Sin especificar —</option>' +
    AULAS.filter(a=>a.id!==item.aula).map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  document.getElementById('pres_cant').max = item.qty;
  document.getElementById('pres_cant').value = 1;
}

function openPrestar(itemId){
  if(!profesores.length){
    if(confirm('No hay profesores registrados. ¿Quieres añadir alguno ahora?')){ openProfModal(); }
    return;
  }

  const selector = document.getElementById('prestarItemSelector');

  if(itemId!==undefined && itemId!==null){
    const item = items.find(x=>Number(x.id)===Number(itemId));
    if(!item) return;
    if(Number(item.qty)<=0){ toast('No hay stock disponible para prestar','err'); return; }
    prestarItemId = itemId;
    selector.style.display = 'none';
    _fillPrestarInfo(item);
    document.getElementById('pres_aulaDest').innerHTML = '<option value="">— Sin especificar —</option>' +
      AULAS.filter(a=>a.id!==item.aula).map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
    document.getElementById('pres_cant').value = 1;
    document.getElementById('pres_cant').max = item.qty;
  } else {
    prestarItemId = null;
    selector.style.display = '';
    // Filtro de aulas
    document.getElementById('pres_filtAula').innerHTML = '<option value="">Todas las aulas</option>' +
      AULAS.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
    document.getElementById('pres_filtQ').value = '';
    // Lista de ítems (todos con stock, ordenados)
    const disponibles = items.filter(x=>Number(x.qty)>0).sort((a,b)=>a.item.localeCompare(b.item));
    _buildPresItemOptions(disponibles);
    document.getElementById('prestarItemInfo').innerHTML = '<div style="color:var(--muted);font-size:13px">Selecciona un ítem para ver su información</div>';
    document.getElementById('pres_aulaDest').innerHTML = '<option value="">— Sin especificar —</option>';
    document.getElementById('pres_cant').value = 1;
    document.getElementById('pres_cant').max = 9999;
  }

  document.getElementById('pres_prof').innerHTML = '<option value="">— Seleccionar —</option>' +
    profesores.map(p=>`<option value="${p.id}">${p.nombre}${p.departamento?' ('+p.departamento+')':''}</option>`).join('');

  const f = new Date(); f.setDate(f.getDate()+7);
  document.getElementById('pres_fecha').value = f.toISOString().split('T')[0];
  document.getElementById('pres_obs').value = '';

  document.getElementById('mPrestar').classList.add('open');
}
function closePrestar(){ document.getElementById('mPrestar').classList.remove('open'); }

async function confirmPrestar(){
  if(prestarItemId===null||prestarItemId===undefined){ toast('Selecciona un ítem','err'); return; }
  const profId = document.getElementById('pres_prof').value;
  const cant = parseInt(document.getElementById('pres_cant').value)||0;
  if(!profId){ toast('Selecciona un profesor','err'); return; }
  if(cant<=0){ toast('Cantidad inválida','err'); return; }

  const item = items.find(x=>Number(x.id)===Number(prestarItemId));
  const prof = profesores.find(p=>Number(p.id)===Number(profId));
  if(!item){ toast('Ítem no encontrado','err'); return; }
  if(!prof){ toast('Profesor no encontrado','err'); return; }
  if(cant > Number(item.qty)){ toast(`Solo hay ${item.qty} disponible(s)`,'err'); return; }

  const modInfo = findModulo(item.mod);
  const pres = {
    itemId: item.id,
    itemNombre: item.item,
    cantidad: cant,
    aulaOrigen: item.aula,
    aulaDestino: document.getElementById('pres_aulaDest').value,
    profesorId: prof.id,
    profesorNombre: prof.nombre,
    fechaPrevista: document.getElementById('pres_fecha').value,
    obs: document.getElementById('pres_obs').value.trim(),
    moduloCod: modInfo ? modInfo.cod : '',
    moduloNombre: modInfo ? modInfo.name : '',
  };

  const btn = document.getElementById('btnPrestarSave');
  btn.disabled = true; btn.textContent = '⏳ Registrando...';
  try {
    const res = await apiPost({action:'prestar', prestamo:pres});
    if(!res.ok) throw new Error(res.error);
    prestamos.push(res.prestamo);
    const i = items.findIndex(x=>Number(x.id)===Number(item.id));
    items[i].qty = Number(items[i].qty) - cant;
    closePrestar();
    toast(`Préstamo registrado: ${cant} × ${item.item}`,'ok');
    if(cf) openSub(); else renderHome();
  } catch(err){ toast('Error: '+err.message,'err'); }
  finally { btn.disabled=false; btn.textContent='📤 Registrar préstamo'; }
}

// ─── DEVOLVER ────────────────────────────────────────────
function openDevolver(presId){
  const p = prestamos.find(x=>Number(x.id)===Number(presId));
  if(!p) return;
  devolverPresId = presId;
  const btn = document.getElementById('btnDevolverSave');
  btn.disabled = false; btn.textContent = '📥 Confirmar devolución';
  const pendiente = Number(p.cantidad) - Number(p.cantidadDevuelta||0);

  document.getElementById('devolverInfo').innerHTML = `
    <div style="font-weight:700;font-size:14px;margin-bottom:4px">${p.itemNombre}</div>
    <div style="font-size:12px;color:var(--muted)">
      Profesor: <strong>${p.profesorNombre}</strong><br>
      Pendiente de devolver: <strong style="color:var(--green)">${pendiente} unidad${pendiente!==1?'es':''}</strong>${Number(p.cantidadDevuelta)>0?` (de ${p.cantidad} prestadas)`:''}
    </div>`;

  const cantInput = document.getElementById('dev_cant');
  cantInput.value = pendiente;
  cantInput.max = pendiente;
  document.getElementById('dev_obs').value = '';

  document.getElementById('mDevolver').classList.add('open');
}
function closeDevolver(){ document.getElementById('mDevolver').classList.remove('open'); }

async function confirmDevolver(){
  const cant = parseInt(document.getElementById('dev_cant').value)||0;
  if(cant<=0){ toast('Cantidad inválida','err'); return; }

  const btn = document.getElementById('btnDevolverSave');
  btn.disabled = true; btn.textContent = '⏳ Devolviendo...';
  try {
    const res = await apiPost({action:'devolver', id:devolverPresId, cantidadDevuelta:cant});
    if(!res.ok) throw new Error(res.error);
    closeDevolver();
    toast('Devolución registrada','ok');
    await loadData(); // recargar todo
    goPrestamos();
  } catch(err){ toast('Error: '+err.message,'err'); btn.disabled=false; btn.textContent='📥 Confirmar devolución'; }
}

// ─── PROFESORES (modal de gestión) ───────────────────────
let profEditing = [];

function openProfModal(){
  profEditing = JSON.parse(JSON.stringify(profesores));
  renderProfList();
  document.getElementById('mProf').classList.add('open');
}
function closeProfModal(){ document.getElementById('mProf').classList.remove('open'); }

function renderProfList(){
  if(!profEditing.length){
    document.getElementById('profList').innerHTML='<div class="empty" style="padding:20px"><div class="et" style="font-size:13px">Aún no hay profesores. Pulsa "+ Añadir profesor" para empezar.</div></div>';
    return;
  }
  document.getElementById('profList').innerHTML = profEditing.map((p,i)=>`
    <div class="prof-row">
      <input class="fi-w name-input" value="${p.nombre||''}" onchange="profEditing[${i}].nombre=this.value" placeholder="Nombre completo">
      <input class="fi-w dept-input" value="${p.departamento||''}" onchange="profEditing[${i}].departamento=this.value" placeholder="Departamento">
      <button class="del-btn" onclick="removeProfRow(${i})" title="Eliminar">🗑</button>
    </div>
  `).join('');
}

function addProfRow(){
  profEditing.push({id:0, nombre:'', departamento:'', email:''}); // id 0 = nuevo
  renderProfList();
}

function removeProfRow(idx){
  const p = profEditing[idx];
  const usados = prestamos.filter(pr=>Number(pr.profesorId)===Number(p.id) && (pr.estado==='Activo'||pr.estado==='Parcial')).length;
  if(usados > 0){
    toast(`No puedes eliminar: tiene ${usados} préstamo(s) activo(s)`,'err');
    return;
  }
  profEditing.splice(idx,1);
  renderProfList();
}

async function saveProfesores(){
  // Validación
  const validos = profEditing.filter(p=>p.nombre && p.nombre.trim());
  if(validos.length !== profEditing.length){
    if(!confirm('Hay profesores sin nombre que se descartarán. ¿Continuar?')) return;
  }

  // Calcular cambios respecto a profesores actuales
  const toAdd = validos.filter(p=>!p.id);
  const toUpdate = validos.filter(p=>{
    if(!p.id) return false;
    const orig = profesores.find(x=>Number(x.id)===Number(p.id));
    if(!orig) return false;
    return orig.nombre!==p.nombre || orig.departamento!==p.departamento || orig.email!==p.email;
  });
  const idsValidos = new Set(validos.filter(p=>p.id).map(p=>Number(p.id)));
  const toDelete = profesores.filter(p=>!idsValidos.has(Number(p.id)));

  if(!toAdd.length && !toUpdate.length && !toDelete.length){
    closeProfModal(); return;
  }

  try {
    for(const p of toAdd){
      const res = await apiPost({action:'profAdd', profesor:p});
      if(!res.ok) throw new Error(res.error);
      profesores.push(res.profesor);
    }
    for(const p of toUpdate){
      const res = await apiPost({action:'profUpdate', profesor:p});
      if(!res.ok) throw new Error(res.error);
      const i = profesores.findIndex(x=>Number(x.id)===Number(p.id));
      if(i>=0) profesores[i] = p;
    }
    for(const p of toDelete){
      const res = await apiPost({action:'profDelete', id:p.id});
      if(!res.ok) throw new Error(res.error);
      profesores = profesores.filter(x=>Number(x.id)!==Number(p.id));
    }
    closeProfModal();
    toast('Profesores actualizados','ok');
    if(document.getElementById('pPres').classList.contains('active')) goPrestamos();
  } catch(err){
    toast('Error: '+err.message,'err');
  }
}

// ─── PICKER PRESTAR / DEVOLVER ────────────────────────────
let _pickerItemId = null;

function openPresDevModal(itemId){
  const item = items.find(x=>Number(x.id)===Number(itemId));
  if(!item) return;
  _pickerItemId = itemId;

  document.getElementById('pickerItemName').textContent = item.item;

  const btnPrestar = document.getElementById('pickerBtnPrestar');
  const noStock = Number(item.qty) <= 0;
  btnPrestar.disabled = noStock;
  btnPrestar.style.opacity = noStock ? '0.4' : '1';

  const activeLoans = prestamos.filter(p=>
    Number(p.itemId)===Number(itemId) &&
    (p.estado==='Activo'||p.estado==='Parcial')
  );

  const loansEl = document.getElementById('pickerLoans');
  if(activeLoans.length){
    loansEl.innerHTML =
      `<div style="font-size:12px;color:var(--muted);margin-bottom:8px;font-weight:600">Préstamos activos:</div>` +
      activeLoans.map(p=>{
        const pendiente = Number(p.cantidad) - Number(p.cantidadDevuelta||0);
        const venc = isVencido(p);
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg);border-radius:8px;gap:8px;margin-bottom:6px;border:1px solid var(--border)">
          <div style="font-size:13px">
            <strong>${p.profesorNombre}</strong>
            <div style="font-size:11px;color:${venc?'var(--red)':'var(--muted)'};margin-top:2px">${pendiente} ud${pendiente!==1?'s':''} · devolver: ${p.fechaPrevista||'—'}${venc?' ⚠ Vencido':''}</div>
          </div>
          <button class="btn btn-sm btn-return" onclick="closePresDevModal();openDevolver(${p.id})">📥 Devolver</button>
        </div>`;
      }).join('');
  } else {
    loansEl.innerHTML = `<div style="font-size:13px;color:var(--muted);text-align:center;padding:8px 0">Sin préstamos activos</div>`;
  }

  document.getElementById('mPresDevPicker').classList.add('open');
}

function closePresDevModal(){
  document.getElementById('mPresDevPicker').classList.remove('open');
}
