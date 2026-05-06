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
config → state → roles → api → docs → search → home → inventory → modal-item → modal-aulas → modal-cats → modal-ciclos → prestamos → import → nav → docs-dpto → pwa → profile → reset → auth

- `js/config.js` — AULAS_DEFAULT, CICLOS (5 ciclos con módulos, incl. Departamento; `let` reemplazable desde backend), CATS_DEFAULT (11), findModulo()
- `js/state.js` — API_URL, SESSION, items, cf, view, show(), setConn(), needsMaintenance()
- `js/roles.js` — permisos frontend, ACTION_PERMISSIONS, can(), applyRoleUI()
- `js/api.js` — urlWithAuth(), apiGet(), apiPost()
- `js/auth.js` — doLogin(), logout(), loadData() (con barra de progreso #loadBar), DOMContentLoaded
- `js/nav.js` — goHome(), goAula(), goCat(), goLowStock(), goMaintenance(), openCiclo(), goMod(), openSub()
- `js/search.js` — globalSearch(), gsKey(), gsGo(), gsClear()
- `js/home.js` — renderHome(), renderLoanBanner()
- `js/inventory.js` — renderInv(), rTable(), rCards(), exportCSV(), toast()
- `js/modal-item.js` — openModal(), saveItem(), pedidos
- `js/modal-aulas.js` — openAulasModal(), saveAulas()
- `js/modal-cats.js` — openCatsModal(), saveCats()
- `js/modal-ciclos.js` — openCiclosModal(), saveCiclos(), showNewCicloForm(), confirmAddCiclo(), addModuloRow(), removeModuloRow()
- `js/prestamos.js` — renderPrestamos(), openPrestar(), openDevolver(), saveProfesores(), openPresDevModal(), closePresDevModal()
- `js/import.js` — openImportModal(), parseCSV(), impDoImport()
- `js/docs.js` — loadItemDocs(), addDocFiles(), uploadPendingDocs(), openDocsModal(itemId), closeDocsModal(), saveDocsModal()
- `js/docs-dpto.js` — goDocsDpto(), DOCS_DPTO_URL (SharePoint)
- `js/pwa.js` — SW registration, beforeinstallprompt, installPWA()
- `js/profile.js` — goProfile(), saveProfile(), doChangePassword()
- `js/reset.js` — showRecovery(), requestReset(), showResetPage(), doResetPassword()

## PWA
- manifest.json: start_url "./" (NO "./index.html" — Cloudflare redirige esa URL)
- sw.js: VERSION='v20', dos cachés CACHE_SHELL + CACHE_RUNTIME, stale-while-revalidate para fonts
- Para forzar actualización en clientes: subir VERSION en sw.js
- `.gitignore` en raíz del repo excluye *.zip y otros archivos grandes

## Cloudflare Pages — reglas de despliegue
- Auto-deploy desde GitHub rama `main`
- **Límite por archivo: 25 MB** — archivos mayores rompen el deploy con "failed in 0s"
- NUNCA commitear ZIPs, RARs ni archivos binarios grandes al repo
- Si el deploy falla en 0 segundos: comprobar si hay archivos >25 MB en git (`git ls-files | xargs ls -la`)

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

## Sistema de roles (implementado 2026-05-05)
Fuente de verdad: columna `rol` de hoja **Usuarios**. Frontend en `js/roles.js`; backend en `appscript.txt` con `requireAction(user, action)`.
- `Jefe Departamento` / `Jefe de Departamento` / `Administrador` / `admin`: acceso completo.
- `profesor`: añadir/editar ítems, bajas, documentos, préstamos/devoluciones, pedidos y perfil. No puede eliminar definitivamente, importar CSV, gestionar aulas/categorías/ciclos ni gestionar profesores.
- `consulta` / `lector`: lectura + perfil/contraseña.
La ocultación de botones es solo UX; la protección real está en Apps Script. Si se añade una acción nueva en GAS, añadirla también a `ACTION_PERMISSIONS` en `js/roles.js` y `appscript.txt`.
Memoria complementaria: `.claude/memory.md`.

## Rendimiento móvil/tablet (ajustado 2026-05-06)
- `js/inventory.js`: el handler de `resize` solo vuelve a renderizar si cambia el modo tabla/tarjetas. En móviles, el navegador dispara `resize` al enseñar/ocultar la barra superior durante el scroll; renderizar todas las tarjetas en cada evento provoca lags y bloqueos de desplazamiento.
- `js/inventory.js`: listado de inventario paginado en tabla y tarjetas. Valor inicial 25 ítems/página; selector disponible 10, 25, 30 y 50. No usar render por tandas con `requestAnimationFrame`, porque empeoró el pintado en Chrome/Edge/Firefox.
- `css/styles.css`: en pantallas <=900px las tarjetas y botones desactivan animaciones/transiciones/transform hover costosos y reducen sombra para mejorar scroll en móviles/tablets. No usar `contain: layout paint` en `.icard`: en Chrome/Edge/Firefox móvil puede provocar tarjetas en blanco que aparecen al desplazar.
- `css/styles.css`: tablets táctiles y pantallas <=1200px usan modo ligero (`hover:none`, `pointer:coarse`, `max-width:1200px`) sin animaciones/transforms en tarjetas, botones y cards. `topbar` usa `min-height` en vez de `height` para no cortar contenido si la barra se adapta. Login alineado arriba para no quedar cortado por barras del navegador.
- Tablets/dispositivos táctiles: forzar vista tarjetas. `getInvRenderMode()` devuelve `cards` si `(hover:none)` o `(pointer:coarse)`; CSS oculta `.vtog` y `.tw` en dispositivos táctiles.
- Modo táctil compacto: una columna de tarjetas, `topbar` sin `sticky`, páginas sin `min-height`, cards sin sombra, home grids a 2 columnas, primera carga de inventario a 10 ítems/página salvo que el usuario elija otra cantidad.
- En táctiles se eliminan efectos visuales secundarios: animaciones/transiciones globales, sombras, filtros, `backdrop-filter`, transforms indirectos y degradados pesados en elementos principales.
- Excepción táctil permitida: solo animación inicial de `#loadOverlay` con `lo-pulse-lite` (transform/opacidad, sin animar sombras). No reactivar animaciones de tarjetas/listados del inventario en tablet.
- Tras cambios de CSS/JS de rendimiento, subir `VERSION` en `sw.js` para que la PWA no sirva recursos antiguos desde caché.

## Auditoría de acciones (implementado 2026-05-05)
GAS crea automáticamente hoja **Log** con columnas `fecha | usuario | nombre | rol | accion | itemId | resumen`.
Helper principal: `auditLog(ss, user, accion, itemId, resumen)` en `appscript.txt`.
Se registran altas/ediciones/eliminaciones de ítems, importación CSV, profesores, aulas/categorías/ciclos, préstamos/devoluciones, documentos, perfil, cambio de contraseña y notificación de pedidos.

## Botón combinado Prestar/Devolver (implementado 2026-05-03)
En rTable y rCards de inventory.js, el botón ⌛ llama a `openPresDevModal(itemId)` (en prestamos.js).
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

## Botón combinado Baja/Eliminar — modal picker (implementado 2026-05-04)
En rTable y rCards de inventory.js, los botones ⛔ (baja) y 🗑 (eliminar) se reemplazaron por un único botón **🗑️** que abre el modal `#mDelPicker`.
El modal tiene **dos pasos**:
- **Paso 1** (`#delPickerStep1`): buscador de ítem — visible cuando se abre sin ID (botón rápido de página). `delPickerFilter()` filtra por nombre/ref; muestra ítems del contexto actual si hay `cf` activo. `delPickerSelect(id)` pasa al paso 2.
- **Paso 2** (`#delPickerStep2`): opciones **🚮 Dar de baja** (oculto si ya está en Baja) + **⛔ Eliminar definitivamente**. Visible directamente cuando se llama con ID desde la fila/tarjeta.
- `openDelModal(itemId?)` — acepta ID (directo a paso 2) o sin args (muestra paso 1 con buscador)
- `closeDelModal()` cierra el modal; añadido al handler de Escape en auth.js
- **NO usar `.del-wrap` / `.del-menu`** — ese CSS fue eliminado (el dropdown quedaba cortado por overflow de tabla)
- Botón 🗑️ Dar de baja añadido como **acción rápida** en home hero y en el toolbar del subheader de pS
- Icono de préstamos: **⌛** en todos los botones (antes 🔁 — conflicto visual con 🔄 de recargar)

## Pantalla de carga animada (implementada 2026-05-04)
`#loadOverlay` en index.html — overlay de pantalla completa que cubre todo mientras loadData() espera la API.
- Muestra: logo (favicon.svg con pulso CSS), título, subtítulo, tres puntos rebotando
- `_hideOverlay()` en auth.js: añade clase `lo-hide` (opacity:0) y tras 480ms pone `display:none`
- Se oculta en el `finally` de loadData(), también si sesión inválida o sin sesión → login
- NO se muestra en recargas tras login (overlay ya está `display:none`)
- Icono ⌛ uniforme en TODOS los botones de préstamo: filas inventario Y botones "Nuevo préstamo" independientes (home hero, subpágina pS, página préstamos pPres)

## Mantenimiento / reparación (implementado 2026-05-06)
- Campo persistente `mant` en inventario. `HEADERS_INV` en `appscript.txt`: `id|ref|aula|mod|item|qty|min|cat|loc|est|util|fecha|mant|obs`.
- Backend: `ensureHeaders(sheet, headers)` migra hojas existentes e inserta la columna `mant` sin perder datos. Tras modificar `appscript.txt`, copiarlo al editor de Apps Script y redesplegar.
- Frontend: `needsMaintenance(item)` en `js/state.js` devuelve true si `mant` es `1`/true o si `est === 'Avería'`.
- Modal de ítem: checkbox `#f_mant` "Necesita mantenimiento o reparación"; `saveItem()` guarda `mant:'1'` o vacío.
- Home: la tarjeta "espacios" fue eliminada. En su lugar hay tarjeta "mantenimiento" junto a "stock bajo" y botón rápido `🛠️ Mantenimiento`.
- Navegación: `goMaintenance()` usa ruta `#maintenance` y `cf.type === 'maintenance'`; `getBase()` filtra con `needsMaintenance()`.
- Listados: tarjetas muestran píldora `🛠️ Mantenimiento`; tabla antepone `🛠️` en Utilidad.
- CSV: importación/exportación incluyen columna `Mantenimiento`; import acepta valores afirmativos como `1`, `si/sí`, `true`, `x`, `ok`, `reparacion`, `mantenimiento`, `averia`.

## QR por ítem (actualizado 2026-05-06)
- Modal de ítem muestra QR solo para ítems existentes; usa URL `#item/<id>`.
- `openItemRoute(id)` carga el contexto del aula del ítem y abre su modal. Si el usuario no tiene `items.write`, el modal queda en lectura.
- Tabla y tarjetas muestran un botón compacto `▦` junto al nombre del ítem; llama a `openModal(id)` para acceso rápido al QR grande y a copiar/imprimir.

## Funcionalidades implementadas (estado 2026-05-06)
- Login / logout / recuperación de contraseña por email (reset.js)
- Perfil de usuario: editar nombre, email, cambiar contraseña (profile.js)
- Inventario por aula, categoría y módulo con tabla y tarjetas
- Buscador global en topbar (atajo / o Ctrl+K)
- Añadir/editar ítems con documentos adjuntos (base64 → GAS → Drive)
- Bajas y pedidos (localStorage inv_pedidos); pedido notifica por email a TODOS los Jefes de Departamento
- Préstamos: botón ⌛ combinado prestar/devolver desde inventario; ver activos/vencidos/histórico
- **Email automático al prestar**: GAS busca responsable del módulo en hoja Modulos (col A=código, col B=nombre módulo, col C=nombre profesor) → email al responsable + CC a todos los Jefes de Departamento
- **Email automático al devolver**: mismo flujo, notifica la devolución
- Módulo genérico "Departamento" disponible en todos los ítems (config.js CICLOS[4])
- Importar CSV con mapeo de columnas
- Documentación del departamento: iframe SharePoint + botón externo
- PWA instalable, funciona offline (cache-first sw v20)
- Pantalla de carga animada (#loadOverlay) con logo + puntos rebotando
- Barra de progreso animada #loadBar durante carga inicial
- **Botón 🗑️ Dar de baja** como acción rápida en home hero y subheader pS (abre modal con buscador si no hay ítem previo)
- QR por ítem en el modal de edición/ver y botón compacto `▦` junto al nombre en tabla/tarjetas.
- Mantenimiento/reparación por ítem: checkbox en modal, tarjeta y botón rápido en home, ruta `#maintenance`, CSV y backend con columna `mant`.

## appscript.txt
Contiene el código completo del backend GAS. Para actualizar el backend hay que copiar el contenido en el editor de Google Apps Script y redesplegar como aplicación web.

Acciones GAS relevantes:
- `action=prestar` — registra préstamo + envía email al responsable del módulo + CC todos los Jefes
- `action=devolver` — registra devolución + envía email de notificación + CC todos los Jefes
- `action=ciclosSync` — sync completo hoja Ciclos (una fila por módulo: cicloId|cicloNombre|nivel|icon|th|desc|modCod|modNombre|modHoras|cicloOrden|modOrden)
- `action=notificarPedido` — email a TODOS los Jefes de Departamento con lista de pedidos
- `action=profAdd/profUpdate/profDelete` — CRUD de profesores prestatarios
