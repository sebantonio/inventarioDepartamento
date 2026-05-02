// ═════════════════════════════════════════════════════════
// MODAL ITEM
// ═════════════════════════════════════════════════════════
function fillModalSelects(){
  document.getElementById('f_aula').innerHTML=AULAS.map(a=>`<option value="${a.id}">${a.name} — ${a.desc}</option>`).join('');
  document.getElementById('f_ciclo').innerHTML='<option value="">Sin asignar</option>'+CICLOS.map(c=>`<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  document.getElementById('f_cat').innerHTML=Object.keys(CATS).map(c=>`<option value="${c}">${c}</option>`).join('');
}

function updateModSelect(){
  const cId = document.getElementById('f_ciclo').value;
  const sel = document.getElementById('f_mod');
  if(!cId){ sel.innerHTML='<option value="">Sin asignar</option>'; return; }
  const c = CICLOS.find(x=>x.id===cId);
  sel.innerHTML='<option value="">Sin asignar</option>'+c.modulos.map(m=>`<option value="${cId}__${m.cod}">${m.cod} — ${m.name}</option>`).join('');
}

function openModal(id=null){
  eid=id; fillModalSelects();
  const m=id?items.find(x=>x.id===id):null;
  document.getElementById('mT').textContent=id?'Editar ítem':'Nuevo ítem';
  document.getElementById('f_ref').value=m?.ref||'';
  document.getElementById('f_aula').value=m?.aula||(cf?.type==='aula'?cf.id:AULAS[0]?.id);
  document.getElementById('f_item').value=m?.item||'';
  document.getElementById('f_qty').value=m?.qty??1;
  document.getElementById('f_min').value=m?.min??0;
  document.getElementById('f_cat').value=m?.cat||Object.keys(CATS)[0]||'Componentes electrónicos';
  // ciclo y módulo
  const itemCiclo = m?.mod ? m.mod.split('__')[0] : (cf?.type==='mod' ? cf.ciclo.id : '');
  document.getElementById('f_ciclo').value = itemCiclo;
  updateModSelect();
  document.getElementById('f_mod').value = m?.mod || (cf?.type==='mod'?cf.id:'');
  document.getElementById('f_loc').value=m?.loc||'';
  document.getElementById('f_est').value=m?.est||'Bueno';
  document.getElementById('f_util').value=m?.util||'';
  document.getElementById('f_fecha').value=m?.fecha||new Date().toISOString().split('T')[0];
  document.getElementById('f_obs').value=m?.obs||'';
  initDocSection(id);
  document.getElementById('mItem').classList.add('open');
}
function closeM(){document.getElementById('mItem').classList.remove('open')}

async function saveItem(){
  const name=document.getElementById('f_item').value.trim();
  if(!name){toast('El nombre es obligatorio','err');return}
  const v={
    ref:document.getElementById('f_ref').value.trim(),
    aula:document.getElementById('f_aula').value,
    item:name,
    qty:parseInt(document.getElementById('f_qty').value)||0,
    min:parseInt(document.getElementById('f_min').value)||0,
    cat:document.getElementById('f_cat').value,
    mod:document.getElementById('f_mod').value,
    loc:document.getElementById('f_loc').value.trim(),
    est:document.getElementById('f_est').value,
    util:document.getElementById('f_util').value.trim(),
    fecha:document.getElementById('f_fecha').value,
    obs:document.getElementById('f_obs').value.trim(),
  };
  const btn = document.getElementById('btnSave');
  btn.disabled = true; btn.textContent = '⏳ Guardando...';
  try {
    if(eid){
      const item={...items.find(x=>x.id===eid),...v};
      const res = await apiPost({action:'update', item});
      if(!res.ok) throw new Error(res.error);
      const i=items.findIndex(x=>x.id===eid); items[i]=item;
      await uploadPendingDocs(eid, item.item, item.aula);
      toast('Ítem actualizado','ok');
    } else {
      const res = await apiPost({action:'add', item:v});
      if(!res.ok) throw new Error(res.error);
      items.push(res.item);
      await uploadPendingDocs(res.item.id, res.item.item, res.item.aula);
      toast('Ítem añadido','ok');
    }
    closeM();
    if(cf) openSub(); else renderHome();
  } catch(err) { toast('Error: '+err.message,'err'); }
  finally { btn.disabled=false; btn.textContent='💾 Guardar'; }
}

// ═════════════════════════════════════════════════════════
// DELETE ITEM
// ═════════════════════════════════════════════════════════
let dId=null;
function confDel(id){
  const it=items.find(x=>x.id===id);dId=id;
  document.getElementById('cTitle').textContent = '¿Eliminar ítem?';
  document.getElementById('cSub').textContent=`"${it?.item}" será eliminado permanentemente.`;
  document.getElementById('cOk').onclick = async () => {
    const btn = document.getElementById('cOk');
    btn.disabled = true; btn.textContent = '⏳';
    try {
      const res = await apiPost({action:'delete', id:dId});
      if(!res.ok) throw new Error(res.error);
      items = items.filter(x=>x.id!==dId);
      closeConf();
      if(cf) openSub(); else renderHome();
      toast('Ítem eliminado','ok');
    } catch(err) { toast('Error: '+err.message,'err'); }
    finally { btn.disabled=false; btn.textContent='Eliminar'; }
  };
  document.getElementById('mConf').classList.add('open');
}
function closeConf(){document.getElementById('mConf').classList.remove('open')}

// ═════════════════════════════════════════════════════════
// BAJA DE MATERIAL
// ═════════════════════════════════════════════════════════
let bajaId = null;

function openBaja(id){
  bajaId = id;
  const it = items.find(x=>x.id===id);
  if(!it) return;
  const qty = Number(it.qty)||0;
  document.getElementById('bajaItemName').textContent = `${it.ref ? it.ref+' — ' : ''}${it.item}`;
  document.getElementById('bajaQtyActual').textContent = qty;
  document.getElementById('bajaCantidad').max = qty;
  document.getElementById('bajaCantidad').value = 1;
  document.getElementById('bajaMotivo').value = '';
  document.getElementById('bajaFecha').value = new Date().toISOString().split('T')[0];
  updateBajaRestante();
  document.getElementById('mBaja').classList.add('open');
}

function updateBajaRestante(){
  const it = items.find(x=>x.id===bajaId);
  if(!it) return;
  const qty = Number(it.qty)||0;
  const cant = Math.min(Number(document.getElementById('bajaCantidad').value)||1, qty);
  const restante = qty - cant;
  const el = document.getElementById('bajaQtyRestante');
  el.textContent = restante;
  el.style.color = restante === 0 ? 'var(--red)' : 'var(--green)';
  document.getElementById('bajaNote').textContent = restante === 0
    ? '⚠ El ítem pasará a estado Baja (sin stock).'
    : `El ítem mantendrá ${restante} unidad${restante!==1?'es':''} en activo.`;
}

function closeBaja(){ document.getElementById('mBaja').classList.remove('open'); bajaId = null; }

async function saveBaja(){
  const motivo = document.getElementById('bajaMotivo').value.trim();
  if(!motivo){ toast('Escribe el motivo de la baja','err'); return; }
  const it = items.find(x=>x.id===bajaId);
  if(!it) return;
  const qty = Number(it.qty)||0;
  const cant = Math.min(Number(document.getElementById('bajaCantidad').value)||1, qty);
  if(cant < 1){ toast('La cantidad debe ser al menos 1','err'); return; }
  const fecha = document.getElementById('bajaFecha').value;
  const restante = qty - cant;
  const obsNuevo = `[BAJA ${fecha}: ${cant} ud.] ${motivo}${it.obs ? '\n'+it.obs : ''}`;
  const updated = {
    ...it,
    qty: restante,
    est: restante === 0 ? 'Baja' : it.est,
    fecha,
    obs: obsNuevo
  };
  const btn = document.getElementById('btnBaja');
  btn.disabled = true; btn.textContent = '⏳ Guardando...';
  try{
    const res = await apiPost({action:'update', item:updated});
    if(!res.ok) throw new Error(res.error);
    const idx = items.findIndex(x=>x.id===bajaId);
    items[idx] = updated;
    closeBaja();
    if(cf) openSub(); else renderHome();
    toast(restante===0 ? 'Ítem dado de baja completamente' : `${cant} unidad${cant!==1?'es':''} dada${cant!==1?'s':''} de baja · Quedan ${restante}`,'ok');
  }catch(err){ toast('Error: '+err.message,'err'); }
  finally{ btn.disabled=false; btn.textContent='⛔ Confirmar baja'; }
}

// ═════════════════════════════════════════════════════════
// SOLICITUD DE COMPRA (PEDIDOS)
// ═════════════════════════════════════════════════════════
let pedidos = JSON.parse(localStorage.getItem('inv_pedidos')||'{}');

function savePedidosLocal(){ localStorage.setItem('inv_pedidos', JSON.stringify(pedidos)); }

function isPedido(id){ return !!pedidos[id]; }

function updatePedBadge(){
  const n = Object.keys(pedidos).length;
  const badge = document.getElementById('pedBadge');
  if(!badge) return;
  badge.textContent = n;
  badge.style.display = n > 0 ? 'inline' : 'none';
}

function togglePedido(id){
  if(pedidos[id]){ delete pedidos[id]; }
  else {
    const it = items.find(x=>x.id===id);
    pedidos[id] = { qty: Math.max(1, (Number(it?.min)||1) - (Number(it?.qty)||0)), nota:'' };
  }
  savePedidosLocal();
  updatePedBadge();
  if(cf) openSub(); else renderHome();
}

function openPedidos(){
  renderPedidosList();
  document.getElementById('mPedidos').classList.add('open');
}
function closePedidos(){ document.getElementById('mPedidos').classList.remove('open'); }

function renderPedidosList(){
  const ids = Object.keys(pedidos);
  const el = document.getElementById('pedList');
  if(!ids.length){
    el.innerHTML=`<div class="ped-empty">🛒 No hay ítems en la lista de pedido.<br><span style="font-size:12px">Usa el botón 🛒 en cada ítem para añadirlos.</span></div>`;
    return;
  }
  el.innerHTML = ids.map(id=>{
    const it = items.find(x=>String(x.id)===String(id));
    if(!it) return '';
    const aula = AULAS.find(a=>a.id===it.aula)?.name||it.aula;
    return`<div class="ped-row">
      <div style="flex:1">
        <div class="ped-name">${it.item}</div>
        <div class="ped-meta">${it.ref?it.ref+' · ':''}${aula} · Stock actual: ${it.qty}</div>
        <input style="margin-top:6px;width:100%;padding:4px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;background:var(--white)" placeholder="Nota (opcional)" value="${pedidos[id].nota||''}" oninput="pedidos['${id}'].nota=this.value;savePedidosLocal()">
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
        <span style="font-size:10px;color:var(--muted)">Cantidad</span>
        <input class="ped-qty" type="number" min="1" value="${pedidos[id].qty||1}" oninput="pedidos['${id}'].qty=Number(this.value)||1;savePedidosLocal()">
        <button class="ped-del" onclick="removePedido('${id}')">🗑</button>
      </div>
    </div>`;
  }).join('');
}

function removePedido(id){
  delete pedidos[id];
  savePedidosLocal();
  updatePedBadge();
  renderPedidosList();
  if(cf) openSub(); else renderHome();
}

function clearPedidos(){
  if(!confirm('¿Vaciar toda la lista de pedido?')) return;
  pedidos = {};
  savePedidosLocal();
  updatePedBadge();
  renderPedidosList();
  if(cf) openSub(); else renderHome();
}

function printPedidos(){
  const ids = Object.keys(pedidos);
  if(!ids.length){ toast('La lista de pedido está vacía','err'); return; }
  const fecha = new Date().toLocaleDateString('es-ES');
  const filas = ids.map(id=>{
    const it = items.find(x=>String(x.id)===String(id));
    if(!it) return '';
    const aula = AULAS.find(a=>a.id===it.aula)?.name||it.aula;
    return `<tr>
      <td>${it.ref||'—'}</td>
      <td><strong>${it.item}</strong></td>
      <td>${aula}</td>
      <td style="text-align:center">${it.qty}</td>
      <td style="text-align:center;font-weight:700">${pedidos[id].qty}</td>
      <td>${pedidos[id].nota||''}</td>
    </tr>`;
  }).join('');
  const html=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
  <title>Solicitud de compra — ${fecha}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:32px;color:#111;font-size:13px}
    h1{font-size:20px;margin-bottom:4px}
    .sub{color:#666;font-size:12px;margin-bottom:24px}
    table{width:100%;border-collapse:collapse}
    th{background:#2563eb;color:#fff;padding:8px 10px;text-align:left;font-size:12px}
    td{padding:7px 10px;border-bottom:1px solid #e5e7eb}
    tr:nth-child(even) td{background:#f9fafb}
    .footer{margin-top:32px;font-size:11px;color:#999}
  </style></head><body>
  <h1>🛒 Solicitud de compra</h1>
  <div class="sub">IES Juan Bosco · Generado el ${fecha}</div>
  <table>
    <thead><tr><th>Ref.</th><th>Ítem</th><th>Aula</th><th>Stock actual</th><th>Cantidad a pedir</th><th>Nota</th></tr></thead>
    <tbody>${filas}</tbody>
  </table>
  <div class="footer">Inventario Taller FP</div>
  </body></html>`;
  const w = window.open('','_blank');
  w.document.write(html);
  w.document.close();
  w.print();
}
