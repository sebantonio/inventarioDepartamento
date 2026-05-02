// ═════════════════════════════════════════════════════════
// PWA — Service Worker + Install prompt
// ═════════════════════════════════════════════════════════
let deferredInstallPrompt = null;

if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('[PWA] Service worker registrado:', reg.scope);
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          newSW.addEventListener('statechange', () => {
            if(newSW.state === 'installed' && navigator.serviceWorker.controller){
              toast('Nueva versión disponible — recarga para actualizar', 'ok');
            }
          });
        });
      })
      .catch(err => console.warn('[PWA] Error al registrar SW:', err));
  });
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
  toast('¡App instalada correctamente!', 'ok');
});

function installPWA(){
  if(!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then(result => {
    if(result.outcome === 'accepted') toast('Instalando la app…', 'ok');
    deferredInstallPrompt = null;
    const btn = document.getElementById('btnInstall');
    if(btn) btn.style.display = 'none';
  });
}
