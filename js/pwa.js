// ═════════════════════════════════════════════════════════
// PWA — Service Worker + Install prompt + Update prompt
// ═════════════════════════════════════════════════════════
let deferredInstallPrompt = null;
let _waitingSW = null;
let _refreshing = false;

if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('[PWA] Service worker registrado:', reg.scope);

        // Si ya hay uno esperando al cargar, avisamos.
        if(reg.waiting && navigator.serviceWorker.controller){
          _waitingSW = reg.waiting;
          showUpdateToast();
        }

        // Detectar nuevas versiones que entran en estado 'installed'.
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if(!newSW) return;
          newSW.addEventListener('statechange', () => {
            if(newSW.state === 'installed' && navigator.serviceWorker.controller){
              _waitingSW = newSW;
              showUpdateToast();
            }
          });
        });
      })
      .catch(err => console.warn('[PWA] Error al registrar SW:', err));

    // Cuando el SW nuevo toma el control, recargar UNA sola vez.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if(_refreshing) return;
      _refreshing = true;
      window.location.reload();
    });
  });
}

// Toast clicable que aplica la actualizacion.
function showUpdateToast(){
  if(typeof toast !== 'function') return;
  // Creamos manualmente porque queremos que sea persistente y clicable.
  const el = document.createElement('div');
  el.className = 'toast ok';
  el.style.cursor = 'pointer';
  el.style.animationDuration = '0.3s';
  el.innerHTML = `<span>🔄</span><span>Nueva versión disponible — pulsa aquí para actualizar</span>`;
  el.onclick = () => {
    if(_waitingSW){
      _waitingSW.postMessage('SKIP_WAITING');
      el.innerHTML = '<span>⏳</span><span>Actualizando…</span>';
    }
  };
  const cont = document.getElementById('toasts');
  if(cont) cont.appendChild(el);
}

// Capturar el evento de instalación para mostrarlo cuando queramos
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const btn = document.getElementById('btnInstall');
  if(btn && document.getElementById('pH').classList.contains('active')) btn.style.display = 'flex';
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const btn = document.getElementById('btnInstall');
  if(btn) btn.style.display = 'none';
  if(typeof toast === 'function') toast('¡App instalada correctamente!', 'ok');
});

function installPWA(){
  if(!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then(result => {
    if(result.outcome === 'accepted' && typeof toast === 'function') toast('Instalando la app…', 'ok');
    deferredInstallPrompt = null;
    const btn = document.getElementById('btnInstall');
    if(btn) btn.style.display = 'none';
  });
}