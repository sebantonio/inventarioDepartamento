# Inventario Taller FP — IES Juan Bosco

SPA de inventario para el departamento de Electricidad y Electrónica. Vanilla JS sin framework, backend Google Apps Script, hosting Cloudflare Pages.

## Stack
- Frontend: HTML/CSS/JS vanilla, sin ES modules (compatible file://)
- Backend: Google Apps Script (REST API GET/POST), URL en `js/state.js`
- Auth: localStorage `inv_session`
- Hosting: Cloudflare Pages — auto-deploy desde GitHub (rama `main`)
- URL producción: https://inventariodepartamento.pages.dev/
- Repo: https://github.com/sebantonio/inventarioDepartamento.git

## Estructura de archivos JS (orden de carga en index.html)
config → state → api → docs → search → home → inventory → modal-item → modal-aulas → modal-cats → prestamos → import → nav → docs-dpto → pwa → profile → reset → auth

- `js/config.js` — AULAS_DEFAULT, CICLOS (5 ciclos con módulos, incl. Departamento), CATS_DEFAULT (11), findModulo()
- `js/state.js` — API_URL, SESSION, items, cf, view, show(), setConn()
- `js/api.js` — urlWithAuth(), apiGet(), apiPost()
- `js/auth.js` — doLogin(), logout(), loadData() (con barra de progreso #loadBar), DOMContentLoaded
- `js/nav.js` — goHome(), goAula(), goCat(), openCiclo(), goMod(), openSub()
- `js/search.js` — globalSearch(), gsKey(), gsGo(), gsClear()
- `js/home.js` — renderHome(), renderLoanBanner()
- `js/inventory.js` — renderInv(), rTable(), rCards(), exportCSV(), toast()
- `js/modal-item.js` — openModal(), saveItem(), pedidos
- `js/modal-aulas.js` — openAulasModal(), saveAulas()
- `js/modal-cats.js` — openCatsModal(), saveCats()
- `js/prestamos.js` — renderPrestamos(), openPrestar(), openDevolver(), saveProfesores(), openPresDevModal(), closePresDevModal()
- `js/import.js` — openImportModal(), parseCSV(), impDoImport()
- `js/docs.js` — loadItemDocs(), addDocFiles(), uploadPendingDocs(), openDocsModal(itemId), closeDocsModal(), saveDocsModal()
- `js/docs-dpto.js` — goDocsDpto(), DOCS_DPTO_URL (SharePoint)
- `js/pwa.js` — SW registration, beforeinstallprompt, installPWA()
- `js/profile.js` — goProfile(), saveProfile(), doChangePassword()
- `js/reset.js` — showRecovery(), requestReset(), showResetPage(), doResetPassword()

## PWA
- manifest.json: start_url "./" (NO "./index.html" — Cloudflare redirige esa URL)
- sw.js: VERSION='v6', dos cachés CACHE_SHELL + CACHE_RUNTIME, stale-while-revalidate para fonts
- Para forzar actualización en clientes: subir VERSION en sw.js

## Google Sheet — hojas relevantes
- **Usuarios**: usuario | password | nombre | rol | Email — login de la app; rol='Jefe Departamento' recibe CC en todos los emails
- **Profesores**: id | nombre | departamento | email — prestatarios (quién pide prestado)
- **Modulos**: col A = código numérico (ej: 237) | col B = nombre módulo | col C = nombre profesor/a responsable
  - GAS busca por código: `Number(modRows[i][0]) === Number(pres.moduloCod)`
  - `pres.moduloCod` = parte tras `__` en el modId del ítem (ej: `gm_telecom__0237` → `0237`)
  - Nombre en col C debe coincidir EXACTAMENTE con campo `nombre` en hoja Usuarios

## Reglas importantes
- NUNCA usar `const show` como nombre de variable en ningún JS — shadowing de show() en state.js rompe toda la navegación
- Los módulos se guardan en ítems como `cicloId__cod` (ej: `gm_telecom__0237`, `departamento__dpto`) — usar findModulo() para resolverlos
- Barra de progreso #loadBar: se activa en loadData() antes del await apiGet(), se cierra en finally
- loadData() hace `show('pH')` ANTES del await apiGet() para evitar pantalla en blanco
- El Departamento como módulo genérico: `id:'departamento'`, módulo `cod:'dpto'` → se guarda como `departamento__dpto`
- `Number('dpto')` = NaN → la búsqueda en hoja Modulos no encuentra nada → no se envía email de préstamo (comportamiento correcto, no tiene responsable de módulo)

## Botón combinado Prestar/Devolver (implementado 2026-05-03)
En rTable y rCards de inventory.js, el botón 🔁 llama a `openPresDevModal(itemId)` (en prestamos.js).
El modal `#mPresDevPicker` muestra:
- Botón "📤 Nuevo préstamo" → llama `openPrestar(itemId)`
- Lista de préstamos activos del ítem con botón "Devolver" por préstamo → llama `openDevolver(presId)`
Variables globales en prestamos.js: `let _pickerItemId = null;`
Bug fix: `openDevolver()` resetea `btnDevolverSave.disabled = false` al inicio (antes quedaba bloqueado tras primera devolución).

## Emails al Jefe de Departamento (implementado 2026-05-03)
GAS: TODOS los usuarios con `rol === 'Jefe Departamento'` reciben email (antes solo el primero encontrado).
Patrón correcto en las 3 acciones (prestar, devolver, notificarPedido):
```javascript
const jefeEmails = [];
for(let i=1;i<usersData.length;i++){
  if(usersData[i][3]==='Jefe Departamento' && usersData[i][4]) jefeEmails.push(usersData[i][4]);
}
// Luego: jefeEmails.join(',') para CC, o jefeEmails.join(',') para TO en pedidos
```
NO usar `break` tras encontrar el primero. Colectar en array y usar `.join(',')`.

## Modal de documentación independiente (implementado 2026-05-03)
- `#mDocs` en index.html — modal propio para ver/subir/eliminar docs de un ítem
- Botón 📌 en tabla y tarjetas llama a `openDocsModal(itemId)`
- Estado propio: `_dmItem`, `_dmActuales`, `_dmPendientes` (no comparte estado con modal de edición)
- `saveDocsModal()` sube pendientes vía `action=uploadDoc` y refresca la lista

## Otras mejoras (implementadas 2026-05-03)
- Ciclo y módulo **obligatorios** en `saveItem()` — toast de error si no están seleccionados
- Botón "Nuevo préstamo" en subheader de `pS` (aulas/categorías/módulos)
- Cabecera tabla "Acciones" (antes "Acc.")
- `deploy.ps1` — script PowerShell para commit+push a GitHub con mensaje descriptivo interactivo
- `action=notificarPedido` en GAS — email al Jefe Departamento al añadir ítem al carrito 🛒
- `action=devolver` — email al responsable del módulo + profesor que tomó prestado + CC todos los Jefes

## Funcionalidades implementadas (estado 2026-05-03)
- Login / logout / recuperación de contraseña por email (reset.js)
- Perfil de usuario: editar nombre, email, cambiar contraseña (profile.js)
- Inventario por aula, categoría y módulo con tabla y tarjetas
- Buscador global en topbar (atajo / o Ctrl+K)
- Añadir/editar ítems con documentos adjuntos (base64 → GAS → Drive)
- Bajas y pedidos (localStorage inv_pedidos); pedido notifica por email a TODOS los Jefes de Departamento
- Préstamos: botón 🔁 combinado prestar/devolver desde inventario; ver activos/vencidos/histórico
- **Email automático al prestar**: GAS busca responsable del módulo en hoja Modulos (col A=código, col B=nombre módulo, col C=nombre profesor) → email al responsable + CC a todos los Jefes de Departamento
- **Email automático al devolver**: mismo flujo, notifica la devolución
- Módulo genérico "Departamento" disponible en todos los ítems (config.js CICLOS[4])
- Importar CSV con mapeo de columnas
- Documentación del departamento: iframe SharePoint + botón externo
- PWA instalable, funciona offline (cache-first sw v4)
- Barra de progreso animada #loadBar durante carga inicial

## appscript.txt
Contiene el código completo del backend GAS. Para actualizar el backend hay que copiar el contenido en el editor de Google Apps Script y redesplegar como aplicación web.

Acciones GAS relevantes:
- `action=prestar` — registra préstamo + envía email al responsable del módulo + CC todos los Jefes
- `action=devolver` — registra devolución + envía email de notificación + CC todos los Jefes
- `action=notificarPedido` — email a TODOS los Jefes de Departamento con lista de pedidos
- `action=profAdd/profUpdate/profDelete` — CRUD de profesores prestatarios

