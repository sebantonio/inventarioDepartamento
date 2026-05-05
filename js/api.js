// ═════════════════════════════════════════════════════════
// API
// ═════════════════════════════════════════════════════════

// Construye URL con credenciales para GET
function urlWithAuth(action){
  const u = encodeURIComponent(SESSION?.usuario||'');
  const p = encodeURIComponent(SESSION?.password||'');
  const sep = API_URL.includes('?') ? '&' : '?';
  return `${API_URL}${sep}u=${u}&p=${p}${action?'&action='+action:''}`;
}

async function apiGet(action){
  const r = await fetch(urlWithAuth(action));
  if(!r.ok) throw new Error('HTTP '+r.status);
  return await r.json();
}

async function apiPost(payload){
  if(payload?.action && typeof canAction === 'function' && !canAction(payload.action)){
    return {ok:false, error:'No tienes permisos para realizar esta acci\u00f3n'};
  }
  const fullPayload = {...payload, u: SESSION?.usuario, p: SESSION?.password};
  const r = await fetch(API_URL,{method:'POST',body:JSON.stringify(fullPayload),headers:{'Content-Type':'text/plain;charset=utf-8'},redirect:'follow'});
  if(!r.ok) throw new Error('HTTP '+r.status);
  return await r.json();
}
