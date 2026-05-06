// ═════════════════════════════════════════════════════════
// SUBPAGE / INVENTARIO
// ═════════════════════════════════════════════════════════
function renderSubStats(data,low){
  const units=data.reduce((a,x)=>a+(Number(x.qty)||0),0);
  const av=data.filter(x=>x.est==='Avería'||x.est==='Baja').length;
  document.getElementById('sStats').innerHTML=`
    <div class="scard"><div class="scard-icon">📋</div><div><div class="scard-num">${data.length}</div><div class="scard-lbl">tipos de ítem</div></div></div>
    <div class="scard"><div class="scard-icon">🔢</div><div><div class="scard-num">${units}</div><div class="scard-lbl">unidades</div></div></div>
    <div class="scard"><div class="scard-icon">⚠️</div><div><div class="scard-num" style="color:var(--red)">${low}</div><div class="scard-lbl">stock bajo</div></div></div>
    <div class="scard"><div class="scard-icon">🔴</div><div><div class="scard-num" style="color:var(--red)">${av}</div><div class="scard-lbl">averías/bajas</div></div></div>
  `;
}

function getBase(){
  return items.filter(x=>{
    if(cf.type==='aula') return x.aula===cf.id;
    if(cf.type==='cat') return x.cat===cf.id;
    if(cf.type==='lowstock') return Number(x.qty)<=Number(x.min);
    return x.mod===cf.id;
  });
}

function getFiltered(){
  const q=document.getElementById('srch').value.toLowerCase();
  const fc=document.getElementById('fCat').value;
  const fe=document.getElementById('fEst').value;
  return getBase().filter(x=>{
    if(fc&&x.cat!==fc)return false;
    if(fe&&x.est!==fe)return false;
    if(q&&![x.ref,x.item,x.loc,x.util,x.obs].join(' ').toLowerCase().includes(q))return false;
    return true;
  }).sort((a,b)=>{
    let av=a[sk]??'',bv=b[sk]??'';
    if(sk==='qty'||sk==='min') return sa?Number(av)-Number(bv):Number(bv)-Number(av);
    return sa?String(av).localeCompare(String(bv)):String(bv).localeCompare(String(av));
  });
}

function renderInv(){
  const data=getFiltered();
  const low=data.filter(x=>Number(x.qty)<=Number(x.min)).length;
  document.getElementById('iCount').textContent=`${data.length} ítem${data.length!==1?'s':''}`;
  document.getElementById('iLow').textContent=low>0?`⚠ ${low} con stock bajo`:'';
  const mc=document.getElementById('iContent');
  if(!data.length){mc.innerHTML=`<div class="empty"><div class="ei">🔍</div><div class="et">No hay ítems con estos filtros.</div></div>`;return}
  const mode = getInvRenderMode();
  _lastInvRenderMode = mode;
  mode === 'table' ? rTable(data,mc) : rCards(data,mc);
}

let _lastInvRenderMode = null;
let _cardsRenderJob = 0;
function getInvRenderMode(){
  return (view==='table' && window.innerWidth > 640) ? 'table' : 'cards';
}

function th2(k,l){const i=k===sk?(sa?'▲':'▼'):'↕';return`<th onclick="sort('${k}')" class="${k===sk?'srt':''}">${l} <span style="font-size:9px;opacity:.6">${i}</span></th>`}

function rTable(data,mc){
  _cardsRenderJob++;
  mc.innerHTML=`<div class="tw"><div class="tw-scroll"><table>
    <thead><tr>${th2('ref','Ref.')}${th2('aula','Aula')}${th2('item','Ítem')}${th2('qty','Cant.')}<th>Mín.</th>${th2('cat','Categoría')}${th2('loc','Ubicación')}${th2('est','Estado')}${th2('util','Utilidad')}<th>Acciones</th></tr></thead>
    <tbody>${data.map(x=>{
      const low=Number(x.qty)<=Number(x.min),cat=CATS[x.cat]||CATS['Otros']||{c:'#6b7280',bg:'#f9fafb',i:'🔧'},ec=ESTC[x.est]||'#6b7280';
      return`<tr>
        <td><span class="rbadge">${x.ref||'—'}</span></td>
        <td style="font-size:12px;color:var(--muted)">${AULAS.find(a=>a.id===x.aula)?.name||x.aula}</td>
        <td style="max-width:200px;font-weight:600" title="${x.item}">${x.item}</td>
        <td><span class="qval ${low?'qlow':'qok'}">${x.qty}${low?' ⚠':''}</span></td>
        <td style="color:var(--muted);font-family:var(--mono);font-size:12px">${x.min}</td>
        <td>${x.cat?`<span class="cpill" style="background:${cat.bg};color:${cat.c}">${cat.i} ${x.cat}</span>`:'—'}</td>
        <td style="color:var(--muted);font-size:12px" title="${x.loc}">${x.loc||'—'}</td>
        <td>${x.est?`<span class="edot"><span class="dot" style="background:${ec}"></span>${x.est}</span>`:'—'}</td>
        <td style="color:var(--muted);font-size:12px" title="${x.util}">${x.util||'—'}</td>
        <td><div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="openModal(${x.id})" title="Editar">✏️</button>
          <button class="btn btn-sm" onclick="duplicateItem(${x.id})" title="Duplicar">⧉</button>
          <button class="btn btn-sm" onclick="openDocsModal(${x.id})" title="Documentación">📌</button>
          <button class="btn btn-sm btn-loan"
             onclick="openPresDevModal(${x.id})"
             title="Prestar / Devolver"
             style="font-size:16px;line-height:1">
            ⌛
          </button>
          <button class="btn btn-sm btn-pedido${isPedido(x.id)?' activo':''}" onclick="togglePedido(${x.id})" title="${isPedido(x.id)?'Quitar del pedido':'Añadir al pedido'}">🛒</button>
          <button class="btn btn-sm btn-d" onclick="openDelModal(${x.id})" title="Baja / Eliminar">🗑️</button>
        </div></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div></div>`;
}

function cardHtml(x){
  const low=Number(x.qty)<=Number(x.min),cat=CATS[x.cat]||CATS['Otros']||{c:'#6b7280',bg:'#f9fafb',i:'🔧'},ec=ESTC[x.est]||'#6b7280',mod=findModulo(x.mod);
  return`<div class="icard${low?' low':''}">
      <div class="ch">
        <div><div class="cname">${x.item}</div><div class="cref">${x.ref||''}</div></div>
        <div class="cqbox"><div class="cqbig" style="color:${low?'var(--red)':'var(--green)'}">${x.qty}</div><div class="cqmin">mín. ${x.min}</div></div>
      </div>
      <div class="cpills">
        ${x.cat?`<span class="cpill" style="background:${cat.bg};color:${cat.c};font-size:11px">${cat.i} ${x.cat}</span>`:''}
        ${x.est?`<span class="edot" style="font-size:12px"><span class="dot" style="background:${ec}"></span>${x.est}</span>`:''}
        ${mod?`<span class="cpill" style="background:#eff6ff;color:#1d4ed8;font-size:11px">${mod.ciclo.icon||'📚'} ${mod.name}</span>`:''}
      </div>
      <div class="cfg">
        <div><div class="cfl">Aula</div><div class="cfv">${AULAS.find(a=>a.id===x.aula)?.name||x.aula}</div></div>
        <div><div class="cfl">Ubicación</div><div class="cfv">${x.loc||'—'}</div></div>
        <div><div class="cfl">Utilidad</div><div class="cfv" style="font-size:11px">${x.util||'—'}</div></div>
        <div><div class="cfl">Revisión</div><div class="cfv" style="font-family:var(--mono);font-size:11px">${x.fecha||'—'}</div></div>
      </div>
      ${x.obs?`<div class="cobs">💬 ${x.obs}</div>`:''}
      <div class="cfoot">
        <button class="btn btn-sm" onclick="openModal(${x.id})" title="Editar">✏️</button>
        <button class="btn btn-sm" onclick="duplicateItem(${x.id})" title="Duplicar">⧉</button>
        <button class="btn btn-sm" onclick="openDocsModal(${x.id})" title="Documentación">📌</button>
        <button class="btn btn-sm btn-loan" onclick="openPresDevModal(${x.id})" title="Prestar / Devolver" style="font-size:16px;line-height:1">⌛</button>
        <button class="btn btn-sm btn-pedido${isPedido(x.id)?' activo':''}" onclick="togglePedido(${x.id})" title="Pedido">🛒</button>
        <button class="btn btn-sm btn-d" onclick="openDelModal(${x.id})" title="Baja / Eliminar">🗑️</button>
      </div>
    </div>`;
}

function rCards(data,mc){
  const job = ++_cardsRenderJob;
  mc.innerHTML='<div class="cgrid"></div>';
  const grid = mc.querySelector('.cgrid');
  const chunkSize = window.innerWidth <= 900 ? 24 : data.length;
  let idx = 0;

  function addChunk(){
    if(job !== _cardsRenderJob) return;
    const end = Math.min(idx + chunkSize, data.length);
    let html = '';
    for(; idx < end; idx++) html += cardHtml(data[idx]);
    grid.insertAdjacentHTML('beforeend', html);
    if(idx < data.length) requestAnimationFrame(addChunk);
  }

  addChunk();
}

function sv(v){view=v;document.getElementById('vT').classList.toggle('on',v==='table');document.getElementById('vC').classList.toggle('on',v==='cards');renderInv()}
window.addEventListener('resize',()=>{
  if(!document.getElementById('pS')?.classList.contains('active')) return;
  const nextMode = getInvRenderMode();
  if(nextMode !== _lastInvRenderMode) renderInv();
});
function sort(k){if(sk===k)sa=!sa;else{sk=k;sa=true}renderInv()}

let _delItemId = null;
function openDelModal(itemId){
  if(!can('items.write') && !can('items.delete')){ requirePerm('items.write'); return; }
  const step1 = document.getElementById('delPickerStep1');
  const step2 = document.getElementById('delPickerStep2');
  const delBtn = document.getElementById('delBtnDelete');
  if(delBtn) delBtn.style.display = can('items.delete') ? '' : 'none';
  if(itemId !== undefined && itemId !== null){
    const item = items.find(x=>Number(x.id)===Number(itemId));
    if(!item) return;
    _delItemId = itemId;
    document.getElementById('delPickerName').textContent = item.item;
    document.getElementById('delBtnBaja').style.display = item.est !== 'Baja' && can('items.write') ? '' : 'none';
    step1.style.display = 'none';
    step2.style.display = 'flex';
  } else {
    _delItemId = null;
    document.getElementById('delPickerName').textContent = 'Baja / Eliminar';
    document.getElementById('delPickerSearch').value = '';
    step1.style.display = '';
    step2.style.display = 'none';
    delPickerFilter();
  }
  document.getElementById('mDelPicker').classList.add('open');
}
function closeDelModal(){
  document.getElementById('mDelPicker').classList.remove('open');
}
function delPickerFilter(){
  const q = document.getElementById('delPickerSearch').value.toLowerCase();
  const src = (cf ? getBase() : items).filter(x=>
    !q || x.item.toLowerCase().includes(q) || (x.ref||'').toLowerCase().includes(q)
  ).sort((a,b)=>a.item.localeCompare(b.item));
  const list = document.getElementById('delPickerList');
  if(!src.length){
    list.innerHTML='<div style="color:var(--muted);font-size:13px;text-align:center;padding:12px">Sin resultados</div>';
    return;
  }
  list.innerHTML=src.slice(0,25).map(x=>`
    <button class="btn" style="width:100%;justify-content:space-between;text-align:left;padding:9px 12px;font-size:13px" onclick="delPickerSelect(${x.id})">
      <span>${x.item}</span>
      <span style="font-size:11px;color:var(--muted)">${x.ref||''}</span>
    </button>`).join('');
}
function delPickerSelect(itemId){
  const item = items.find(x=>Number(x.id)===Number(itemId));
  if(!item) return;
  _delItemId = itemId;
  document.getElementById('delPickerName').textContent = item.item;
  document.getElementById('delBtnBaja').style.display = item.est !== 'Baja' && can('items.write') ? '' : 'none';
  document.getElementById('delPickerStep1').style.display = 'none';
  document.getElementById('delPickerStep2').style.display = 'flex';
}

// ═════════════════════════════════════════════════════════
// EXPORT
// ═════════════════════════════════════════════════════════
function exportCSV(){
  const data=getFiltered();
  const h='Referencia,Aula,Módulo,Ítem,Cantidad,Mínimo,Categoría,Ubicación,Estado,Utilidad,Revisión,Observaciones';
  const rows=data.map(x=>{
    const m = findModulo(x.mod);
    return [x.ref,AULAS.find(a=>a.id===x.aula)?.name||x.aula,m?`${m.cod} ${m.name}`:'',x.item,x.qty,x.min,x.cat,x.loc,x.est,x.util,x.fecha,x.obs].map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',');
  });
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,﻿'+encodeURIComponent([h,...rows].join('\n'));a.download='inventario.csv';a.click();
  toast('CSV exportado','ok');
}

// ═════════════════════════════════════════════════════════
// IMPRIMIR
// ═════════════════════════════════════════════════════════
function printInv(){
  const titulo = cf?.label || 'Inventario';
  const total = getBase().length;
  const uds = getBase().reduce((s,x)=>s+(Number(x.qty)||0),0);
  const fecha = new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'long',year:'numeric'});
  document.getElementById('printTitle').textContent = `${cf?.icon||'📦'} ${titulo}`;
  document.getElementById('printMeta').innerHTML =
    `IES El Bosco — Inventario Departamento<br>${total} tipos · ${uds} unidades<br>${fecha}`;
  const prev = document.title;
  document.title = `Inventario ${titulo}`;
  window.print();
  document.title = prev;
}

// ═════════════════════════════════════════════════════════
// TOAST
// ═════════════════════════════════════════════════════════
function toast(msg,type='ok'){
  const el=document.createElement('div');el.className=`toast ${type}`;
  el.innerHTML=`<span>${type==='ok'?'✅':'❌'}</span><span>${msg}</span>`;
  document.getElementById('toasts').appendChild(el);
  setTimeout(()=>{el.style.animation='ti .3s reverse forwards';setTimeout(()=>el.remove(),300)},3000);
}
