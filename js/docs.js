// ═════════════════════════════════════════════════════════
// DOCUMENTACIÓN ADJUNTA
// ═════════════════════════════════════════════════════════
let docsPendientes = [];
let docsActuales   = [];

const DOC_ICONS = {pdf:'📄',jpg:'🖼️',jpeg:'🖼️',png:'🖼️',gif:'🖼️',webp:'🖼️',
  doc:'📝',docx:'📝',xls:'📊',xlsx:'📊',ppt:'📊',pptx:'📊',
  zip:'🗜️',rar:'🗜️',mp4:'🎬',mp3:'🎵',txt:'📋',svg:'🖼️'};

function docIcon(name){ return DOC_ICONS[(name||'').split('.').pop().toLowerCase()]||'📎'; }

function initDocSection(itemId){
  docsPendientes = []; docsActuales = [];
  document.getElementById('f_doc_list').innerHTML = '';
  if(itemId) loadItemDocs(itemId);
}

async function loadItemDocs(itemId){
  try{
    const res = await apiPost({action:'getDocs', itemId});
    if(res.ok){ docsActuales = res.docs||[]; renderDocList(); }
  }catch(e){}
}

function addDocFiles(files){
  for(const f of files) docsPendientes.push(f);
  renderDocList();
}

function removePendingDoc(idx){ docsPendientes.splice(idx,1); renderDocList(); }

async function deleteExistingDoc(docId, driveId){
  if(!confirm('¿Eliminar este documento de Drive?')) return;
  try{
    const res = await apiPost({action:'deleteDoc', docId, driveId});
    if(!res.ok) throw new Error(res.error);
    docsActuales = docsActuales.filter(d=>d.id!==docId);
    renderDocList(); toast('Documento eliminado','ok');
  }catch(e){ toast('Error: '+e.message,'err'); }
}

function renderDocList(){
  const el = document.getElementById('f_doc_list');
  const ex = docsActuales.map(d=>`
    <div class="doc-row">
      <span class="di">${docIcon(d.fileName)}</span>
      <span class="dn" title="${d.fileName}">${d.fileName}</span>
      <a class="dv" href="${d.driveUrl}" target="_blank">Ver</a>
      <button class="dx" onclick="deleteExistingDoc(${d.id},'${d.driveId}')" title="Eliminar">✕</button>
    </div>`).join('');
  const pe = docsPendientes.map((f,i)=>`
    <div class="doc-row dp">
      <span class="di">${docIcon(f.name)}</span>
      <span class="dn" title="${f.name}">${f.name} <span style="color:var(--muted);font-size:10px">${(f.size/1024).toFixed(0)} KB · pendiente</span></span>
      <button class="dx" onclick="removePendingDoc(${i})" title="Quitar">✕</button>
    </div>`).join('');
  el.innerHTML = ex + pe;
}

function fileToBase64(file){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>res(r.result.split(',')[1]);
    r.onerror=rej;
    r.readAsDataURL(file);
  });
}

// ─── MODAL DOCS INDEPENDIENTE ────────────────────────────
let _dmItem = null;
let _dmActuales = [];
let _dmPendientes = [];

async function openDocsModal(itemId){
  const item = items.find(x=>Number(x.id)===Number(itemId));
  if(!item) return;
  _dmItem = item;
  _dmActuales = [];
  _dmPendientes = [];
  document.getElementById('docsModalTitle').textContent = `📎 ${item.item}`;
  document.getElementById('dm_doc_list').innerHTML = '<div style="color:var(--muted);font-size:13px;padding:8px 0">Cargando...</div>';
  document.getElementById('mDocs').classList.add('open');
  try {
    const res = await apiPost({action:'getDocs', itemId});
    if(res.ok) _dmActuales = res.docs || [];
  } catch(e) {}
  _renderDmList();
}

function closeDocsModal(){ document.getElementById('mDocs').classList.remove('open'); _dmItem=null; _dmPendientes=[]; }

function addDocsModalFiles(files){ for(const f of files) _dmPendientes.push(f); _renderDmList(); }

function _renderDmList(){
  const el = document.getElementById('dm_doc_list');
  const ex = _dmActuales.map(d=>`
    <div class="doc-row">
      <span class="di">${docIcon(d.fileName)}</span>
      <span class="dn" title="${d.fileName}">${d.fileName}</span>
      <a class="dv" href="${d.driveUrl}" target="_blank">Ver</a>
      <button class="dx" onclick="_dmDeleteDoc(${d.id},'${d.driveId}')" title="Eliminar">✕</button>
    </div>`).join('');
  const pe = _dmPendientes.map((f,i)=>`
    <div class="doc-row dp">
      <span class="di">${docIcon(f.name)}</span>
      <span class="dn">${f.name} <span style="color:var(--muted);font-size:10px">${(f.size/1024).toFixed(0)} KB · pendiente</span></span>
      <button class="dx" onclick="_dmPendientes.splice(${i},1);_renderDmList()" title="Quitar">✕</button>
    </div>`).join('');
  el.innerHTML = (ex+pe) || '<div style="color:var(--muted);font-size:13px;padding:8px 0">Sin documentos adjuntos.</div>';
}

async function _dmDeleteDoc(docId, driveId){
  if(!confirm('¿Eliminar este documento de Drive?')) return;
  try {
    const res = await apiPost({action:'deleteDoc', docId, driveId});
    if(!res.ok) throw new Error(res.error);
    _dmActuales = _dmActuales.filter(d=>d.id!==docId);
    _renderDmList(); toast('Documento eliminado','ok');
  } catch(e){ toast('Error: '+e.message,'err'); }
}

async function saveDocsModal(){
  if(!_dmPendientes.length){ closeDocsModal(); return; }
  if(!_dmItem) return;
  const btn = document.getElementById('btnDocsSave');
  btn.disabled = true; btn.textContent = '⏳ Subiendo...';
  const aulaName = AULAS.find(a=>a.id===_dmItem.aula)?.name || _dmItem.aula;
  for(const file of [..._dmPendientes]){
    try {
      toast(`Subiendo ${file.name}…`,'ok');
      const data = await fileToBase64(file);
      const res = await apiPost({action:'uploadDoc', itemId:_dmItem.id, itemNombre:_dmItem.item,
        aulaId:_dmItem.aula, aulaName, fileName:file.name, mimeType:file.type||'application/octet-stream', data});
      if(!res.ok) throw new Error(res.error);
      if(res.doc) _dmActuales.push(res.doc);
    } catch(e){ toast(`Error: ${e.message}`,'err'); }
  }
  _dmPendientes = [];
  _renderDmList();
  btn.disabled = false; btn.textContent = '💾 Guardar documentos';
  toast('Documentos guardados','ok');
}

async function uploadPendingDocs(itemId, itemNombre, aulaId){
  if(!docsPendientes.length) return;
  const aulaName = AULAS.find(a=>a.id===aulaId)?.name || aulaId;
  for(const file of [...docsPendientes]){
    try{
      toast(`Subiendo ${file.name}…`,'ok');
      const data = await fileToBase64(file);
      const res = await apiPost({action:'uploadDoc', itemId, itemNombre, aulaId, aulaName,
        fileName:file.name, mimeType:file.type||'application/octet-stream', data});
      if(!res.ok) throw new Error(res.error);
    }catch(e){ toast(`Error con ${file.name}: ${e.message}`,'err'); }
  }
  docsPendientes = [];
}
