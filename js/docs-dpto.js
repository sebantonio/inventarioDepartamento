// ═════════════════════════════════════════════════════════
// DOCUMENTACIÓN DEL DEPARTAMENTO
// ═════════════════════════════════════════════════════════
const DOCS_DPTO_URL = 'https://crfpcastilla.sharepoint.com/:f:/r/sites/EPT13000220E01-Dpto.ElectricidadyElectrnica/Documentos%20compartidos/Dpto.%20Electricidad%20y%20Electr%C3%B3nica/Normativa?csf=1&web=1&e=8XRgS6';

function goDocsDpto(){
  _push({page:'docs'}, '#docs');
  cf = null; currentCiclo = null;
  document.getElementById('bc').innerHTML = `<span class="bc-link" onclick="goHome()">Inicio</span><span class="sep">›</span><strong>📂 Documentación</strong>`;
  document.getElementById('btnN').style.display = 'none';
  document.getElementById('btnE').style.display = 'none';
  _hideHomeButtons();

  // Intentar cargar el iframe; si falla (X-Frame-Options), mostrar fallback
  const iframe = document.getElementById('docsIframe');
  const fallback = document.getElementById('docsFallback');

  iframe.style.display = 'block';
  fallback.style.display = 'none';

  // Detectar bloqueo del iframe (el error de X-Frame-Options no es catchable,
  // pero podemos detectar si la carga tarda o si el src está vacío)
  iframe.onload = () => {
    // Si SharePoint bloquea el embedding, la carga puede "completarse"
    // con contenido vacío. No hay forma fiable de detectarlo sin same-origin.
    // Dejamos el iframe visible y el botón externo siempre disponible.
  };
  iframe.onerror = () => {
    iframe.style.display = 'none';
    fallback.style.display = 'flex';
  };

  // Cargar solo la primera vez (evita recargar si el usuario ya navegó dentro del iframe)
  if(!iframe.getAttribute('data-loaded')){
    iframe.src = DOCS_DPTO_URL;
    iframe.setAttribute('data-loaded', '1');
  }

  show('pDocsDpto');
}
