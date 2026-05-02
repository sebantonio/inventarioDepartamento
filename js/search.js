// ═════════════════════════════════════════════════════════
// BÚSQUEDA GLOBAL
// ═════════════════════════════════════════════════════════
let gsIdx=-1;

function globalSearch(q){
  const res=document.getElementById('gsResults');
  const clr=document.getElementById('gsClear');
  q=q.trim();
  clr.style.display=q?'block':'none';
  if(q.length<2){res.classList.remove('open');gsIdx=-1;return;}
  const ql=q.toLowerCase();
  const matches=items.filter(x=>{
    const aulaName=AULAS.find(a=>a.id===x.aula)?.name||'';
    return [x.ref,x.item,x.loc,x.util,x.obs,x.cat,aulaName].join(' ').toLowerCase().includes(ql);
  });
  gsIdx=-1;
  if(!matches.length){
    res.innerHTML=`<div class="gsr-empty">Sin resultados para "<strong>${q}</strong>"</div>`;
    res.classList.add('open');return;
  }
  const visible=matches.slice(0,14);
  res.innerHTML=`<div class="gsr-header">${matches.length} resultado${matches.length!==1?'s':''} encontrado${matches.length!==1?'s':''}</div>`
    +visible.map((x,i)=>{
      const cat=CATS[x.cat]||null;
      const aulaName=AULAS.find(a=>a.id===x.aula)?.name||x.aula||'—';
      const low=Number(x.qty)<=Number(x.min);
      return`<div class="gsr-item" tabindex="-1" role="option" data-idx="${i}" onclick="gsGo('${x.aula}','${(x.item||'').replace(/'/g,"\\'")}')">
        ${cat?`<span class="cpill" style="background:${cat.bg};color:${cat.c};flex-shrink:0;font-size:11px">${cat.i}</span>`:'<span style="width:18px;flex-shrink:0"></span>'}
        <span class="gsr-name">${x.item}</span>
        <span class="gsr-aula">📍 ${aulaName}</span>
        <span class="gsr-qty ${low?'qlow':'qok'}">${x.qty}</span>
      </div>`;
    }).join('')
    +(matches.length>14?`<div class="gsr-more">+${matches.length-14} más — sigue escribiendo para filtrar</div>`:'');
  res.classList.add('open');
}

function gsKey(e){
  const res=document.getElementById('gsResults');
  const rows=[...res.querySelectorAll('.gsr-item')];
  if(!rows.length)return;
  if(e.key==='ArrowDown'){e.preventDefault();gsIdx=Math.min(gsIdx+1,rows.length-1);rows[gsIdx]?.focus();}
  else if(e.key==='ArrowUp'){e.preventDefault();gsIdx=Math.max(gsIdx-1,-1);if(gsIdx<0)document.getElementById('gsInput').focus();else rows[gsIdx]?.focus();}
  else if(e.key==='Escape'){gsClear();}
  else if(e.key==='Enter'&&gsIdx>=0){rows[gsIdx]?.click();}
}

function gsGo(aulaId,term){
  gsClear();
  goAula(aulaId);
  setTimeout(()=>{const s=document.getElementById('srch');if(s){s.value=term;renderInv();}},60);
}

function gsClear(){
  document.getElementById('gsInput').value='';
  document.getElementById('gsClear').style.display='none';
  document.getElementById('gsResults').classList.remove('open');
  gsIdx=-1;
}

document.addEventListener('click',e=>{
  if(!document.getElementById('gsWrap')?.contains(e.target)) document.getElementById('gsResults')?.classList.remove('open');
});

document.addEventListener('keydown',e=>{
  if((e.key==='/' || (e.ctrlKey&&e.key==='k')) && document.getElementById('pH').classList.contains('active')){
    const inp=document.getElementById('gsInput');
    if(document.activeElement!==inp){e.preventDefault();inp.focus();inp.select();}
  }
});
