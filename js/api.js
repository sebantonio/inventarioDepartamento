// ═════════════════════════════════════════════════════════
// API
// ═════════════════════════════════════════════════════════

// Construye URL con credenciales para GET
function urlWithAuth(action, params={}){
  const u = encodeURIComponent(SESSION?.usuario||'');
  const p = encodeURIComponent(SESSION?.password||'');
  const sep = API_URL.includes('?') ? '&' : '?';
  let url = `${API_URL}${sep}u=${u}&p=${p}`;
  if (action) url += `&action=${encodeURIComponent(action)}`;
  for (const [key, val] of Object.entries(params)) {
    if (val != null) url += `&${encodeURIComponent(key)}=${encodeURIComponent(val)}`;
  }
  return url;
}

async function apiGet(action, params={}){
  let actionStr = action;
  let paramsObj = params;
  if (typeof action === 'object') {
    actionStr = action.action || '';
    paramsObj = { ...action };
    delete paramsObj.action;
  }
  const r = await fetch(urlWithAuth(actionStr, paramsObj));
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
