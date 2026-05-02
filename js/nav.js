// ═════════════════════════════════════════════════════════
// NAVEGACIÓN
// ═════════════════════════════════════════════════════════
function goHome(){
  cf=null; currentCiclo=null;
  document.getElementById('bc').innerHTML='';
  document.getElementById('btnN').style.display='flex';
  document.getElementById('btnE').style.display='none';
  gsClear();
  show('pH'); renderHome();
}

function goAula(id){
  cf={type:'aula',id,label:AULAS.find(a=>a.id===id)?.name,icon:AULAS.find(a=>a.id===id)?.icon};
  openSub();
}

function goCat(name){
  const c=CATS[name]||{c:'#6b7280',bg:'#f9fafb',i:'🔧'};
  cf={type:'cat',id:name,label:name,icon:c.i,catColor:c.c,catBg:c.bg};
  openSub();
}

function openCiclo(cicloId){
  currentCiclo = CICLOS.find(c=>c.id===cicloId);
  if(!currentCiclo) return;
  cf=null;
  document.getElementById('btnN').style.display='flex';
  document.getElementById('btnE').style.display='none';
  document.getElementById('cicloTag').textContent = `${currentCiclo.icon} ${currentCiclo.nivel}`;
  document.getElementById('cicloTitle').textContent = currentCiclo.name;
  document.getElementById('cicloMeta').textContent = currentCiclo.desc;
  document.getElementById('bc').innerHTML = `<span class="bc-link" onclick="goHome()">Inicio</span><span class="sep">›</span><strong>${currentCiclo.icon} ${currentCiclo.name}</strong>`;
  // Render módulos
  document.getElementById('modGrid').innerHTML = currentCiclo.modulos.map(m=>{
    const modId = `${currentCiclo.id}__${m.cod}`;
    const n = items.filter(x=>x.mod===modId).length;
    return `<div class="mod-card" onclick="goMod('${modId}')">
      <div class="mod-code">${m.cod}</div>
      <div class="mod-info">
        <div class="mod-name">${m.name}</div>
        <div class="mod-hours">${m.horas?m.horas+' horas':'—'}</div>
      </div>
      <div class="mod-count">${n||''}</div>
    </div>`;
  }).join('');
  show('pCiclo');
}

function goMod(modId){
  const m = findModulo(modId);
  if(!m) return;
  cf={type:'mod',id:modId,label:m.name,icon:m.ciclo.icon,ciclo:m.ciclo};
  openSub();
}

function openSub(){
  const all=getBase();
  const low=all.filter(x=>Number(x.qty)<=Number(x.min)).length;
  let tagC, typeLabel;
  if(cf.type==='aula'){tagC='background:#eff6ff;color:#2563eb';typeLabel='Aula';}
  else if(cf.type==='cat'){tagC=`background:${cf.catBg};color:${cf.catColor}`;typeLabel='Categoría';}
  else{tagC='background:#f5f3ff;color:#7c3aed';typeLabel='Módulo';}
  document.getElementById('sTag').textContent=`${cf.icon} ${typeLabel}`;
  document.getElementById('sTag').style.cssText=tagC;
  document.getElementById('sTitle').textContent=cf.label;
  if(cf.type==='aula'){
    const a = AULAS.find(x=>x.id===cf.id);
    document.getElementById('sMeta').textContent = `${a?.desc||''} · ${all.length} tipos · ${all.reduce((a2,x)=>a2+(Number(x.qty)||0),0)} unidades`;
  } else if(cf.type==='cat'){
    document.getElementById('sMeta').textContent = `${all.length} tipos · ${all.reduce((a2,x)=>a2+(Number(x.qty)||0),0)} unidades`;
  } else {
    document.getElementById('sMeta').textContent = `${cf.ciclo.name} · ${all.length} tipos · ${all.reduce((a2,x)=>a2+(Number(x.qty)||0),0)} unidades`;
  }

  // Breadcrumb
  if(cf.type==='aula'){
    document.getElementById('bc').innerHTML=`<span class="bc-link" onclick="goHome()">Inicio</span><span class="sep">›</span><strong>${cf.icon} ${cf.label}</strong>`;
  } else if(cf.type==='cat'){
    document.getElementById('bc').innerHTML=`<span class="bc-link" onclick="goHome()">Inicio</span><span class="sep">›</span><strong>${cf.icon} ${cf.label}</strong>`;
  } else {
    document.getElementById('bc').innerHTML=`<span class="bc-link" onclick="goHome()">Inicio</span><span class="sep">›</span><span class="bc-link" onclick="openCiclo('${cf.ciclo.id}')">${cf.ciclo.icon} ${cf.ciclo.name}</span><span class="sep">›</span><strong>${cf.label}</strong>`;
  }

  document.getElementById('btnN').style.display='flex';
  document.getElementById('btnE').style.display='flex';
  document.getElementById('srch').value='';
  document.getElementById('fEst').value='';
  const cats=[...new Set(all.map(x=>x.cat).filter(Boolean))].sort();
  document.getElementById('fCat').innerHTML='<option value="">Todas las categorías</option>'+cats.map(c=>`<option>${c}</option>`).join('');
  show('pS'); renderInv(); renderSubStats(all,low);
}
