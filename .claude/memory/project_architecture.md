---
name: Arquitectura técnica
description: Stack, estructura de archivos JS, patrones de código y restricciones conocidas
type: project
originSessionId: 97fd2f19-db29-4e74-997b-cfdd7054b186
---
**Stack:**
- Frontend: HTML/CSS/JS puro (sin frameworks, sin build tools)
- Backend: Google Apps Script como Web App (URL en `js/state.js` → `API_URL`)
- BD: Google Sheets via `SpreadsheetApp`
- Almacenamiento: Google Drive via `DriveApp`
- Tokens reset contraseña: `PropertiesService.getScriptProperties()`
- Email: `MailApp.sendEmail()` — requiere scope `https://www.googleapis.com/auth/script.send_mail` en `appsscript.json`

**Estructura JS (todos en `js/`):**
- `config.js` — AULAS_DEFAULT, CICLOS, CATS_DEFAULT, ESTC, findModulo()
- `state.js` — API_URL, SESSION, items, view, sk, sa, etc. + show(), setConn()
- `api.js` — apiGet(), apiPost(), urlWithAuth()
- `auth.js` — doLogin(), logout(), showUserChip(), loadData(), DOMContentLoaded init
- `nav.js` — goHome(), goAula(), goCat(), openCiclo(), goMod(), openSub(), hash routing, toggleMobMenu(), closeMobMenu()
- `inventory.js` — renderInv(), rTable(), rCards(), sv(), sort(), openExportModal(), exportCSV(), exportAllItemsCSV(), exportFullBackup(), printInv()
- `home.js` — renderHome()
- `search.js` — búsqueda global
- `modal-item.js` — openModal(), saveItem(), closeM(), togglePedido() (envía email al añadir)
- `modal-aulas.js` — gestión aulas
- `modal-cats.js` — gestión categorías
- `prestamos.js` — goPrestamos(), openPrestar(), confirmPrestar(), devolver; pres incluye moduloCod+moduloNombre
- `import.js` — importación CSV masiva y restauración selectiva de backup JSON (`restoreBackupJson()`)
- `docs.js` — documentos adjuntos a ítems + modal independiente openDocsModal()/closeDocsModal()/saveDocsModal()
- `docs-dpto.js` — página documentación departamento
- `pwa.js` — service worker, instalación PWA
- `profile.js` — goProfile(), saveProfile(), doChangePassword()
- `reset.js` — showRecovery(), requestReset(), showResetPage(), doResetPassword(), goBackToLogin()
- `qr-scanner.js` — openQrScanner(), closeQrScanner(), escaneo con jsQR

**Páginas (divs .page en index.html):**
- `pLogin` — login (con vista recoveryForm para recuperar contraseña)
- `pReset` — formulario nueva contraseña (desde enlace email)
- `pProfile` — perfil de usuario
- `pH` — home
- `pCiclo` — vista ciclo formativo
- `pS` — subpage inventario filtrado (tiene botón "Nuevo préstamo" en subheader)
- `pDocsDpto` — documentación departamento

**Modales relevantes:**
- `mItem` — editar/crear ítem (ciclo y módulo obligatorios)
- `mDocs` — modal independiente de documentación (`openDocsModal(itemId)`)
- `mPrestar` — prestar material
- `mDevolver` — devolver material
- `mPedidos` — lista de solicitud de compra

**Hoja Usuarios — columnas (en orden):**
1. usuario | 2. password | 3. nombre | 4. rol | 5. email
- Rol `Jefe Departamento` → recibe CC en emails de préstamo, devolución y pedido

**Hoja Modulos — columnas:**
- col A: código numérico (ej: 1058) — se compara con `Number()` para evitar problema con ceros
- col B: nombre del módulo
- col C: nombre del profesor responsable (debe coincidir EXACTAMENTE con col 3 de Usuarios)

**Hoja Profesores — columnas:**
1. id | 2. nombre | 3. departamento | 4. email

**Notificaciones email — flujo backend (acción `prestar`):**
1. `pres.moduloCod` → buscar en Modulos col A (Number) → obtener col C (responsableNombre)
2. Buscar responsableNombre en Usuarios col 3 → obtener email
3. Buscar rol `Jefe Departamento` en Usuarios col 4 → obtener jefeEmail para CC
4. `MailApp.sendEmail({to, cc, subject, htmlBody})` — envuelto en try-catch no fatal
5. `emailDebug` devuelto en respuesta → logueado en consola con `console.log('[EMAIL DEBUG]', res.emailDebug)`

**Acciones GAS (doPost):**
- `add`, `update`, `delete` — CRUD inventario
- `bulkImport` — importación masiva
- `profAdd`, `profUpdate`, `profDelete` — CRUD profesores
- `aulasSync`, `catsSync` — sync completo aulas/categorías
- `prestar` — registrar préstamo + email responsable módulo
- `devolver` — registrar devolución + email responsable + profesor + CC jefe
- `getDocs`, `uploadDoc`, `deleteDoc` — documentos Drive
- `updateProfile`, `changePassword` — perfil usuario
- `notificarPedido` — email al Jefe Departamento al añadir ítem a lista de compra
- `restoreBackup` — restaura secciones seleccionadas de backup JSON
- `getItemLog` — historial visual del ítem
- `stockAlert` — registro de alerta de stock bajo
- `resetPassword` — sin autenticación (antes de verificarLogin)

**Restricciones del Workspace educativo:**
- `DriveApp.Access.ANYONE_WITH_LINK` bloqueado → envolver `setSharing()` en try-catch no fatal
- Scopes OAuth deben declararse en `appsscript.json` explícitamente
- Redesplegar siempre como nueva versión tras cambios en el script

**Responsive móvil (<640px):**
- Topbar: solo logo + botón ⋮ (`.mob-menu-btn`) → dropdown `.topbar-btns`
- Inventario: siempre tarjetas (`rCards`), nunca tabla. Condición en `renderInv()`: `window.innerWidth > 640`
- Toggle de vista (`.vtog`) oculto en móvil

**Patrones clave backend:**
- `rowsToObjects(sheet, headers)` — IDs numéricos se convierten, string se dejan (fix para 'aula35')
- `nextId(sheet)` — siguiente ID numérico
- `getOrCreateFolder(parent, name)` — helper Drive
- `resetPassword` y `requestReset` NO requieren autenticación (van antes del verificarLogin)
- Tokens reset: clave `reset_TOKEN` en PropertiesService, expiran en 1 hora
- Comparación códigos Modulos: `Number(modRows[i][0]) === Number(pres.moduloCod)` (evita problema ceros iniciales)

**Decisiones CSS importantes:**
- Tabla scroll: `.tw-scroll{overflow-x:auto}` + `table{min-width:1400px;width:max-content}`
- NO `position:sticky` en columnas (incompatible con overflow en padres)
- NO gradiente `::after` en `.tw-scroll` (ocultaba botón eliminar)
