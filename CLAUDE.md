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

- `js/config.js` — AULAS_DEFAULT, CICLOS (4 ciclos con módulos), CATS_DEFAULT (11), findModulo()
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
- `js/prestamos.js` — renderPrestamos(), openPrestar(), openDevolver(), saveProfesores()
- `js/import.js` — openImportModal(), parseCSV(), impDoImport()
- `js/docs.js` — loadItemDocs(), addDocFiles(), uploadPendingDocs()
- `js/docs-dpto.js` — goDocsDpto(), DOCS_DPTO_URL (SharePoint)
- `js/pwa.js` — SW registration, beforeinstallprompt, installPWA()
- `js/profile.js` — goProfile(), saveProfile(), doChangePassword()
- `js/reset.js` — showRecovery(), requestReset(), showResetPage(), doResetPassword()

## PWA
- manifest.json: start_url "./" (NO "./index.html" — Cloudflare redirige esa URL)
- sw.js: VERSION='v4', dos cachés CACHE_SHELL + CACHE_RUNTIME, stale-while-revalidate para fonts
- Para forzar actualización en clientes: subir VERSION en sw.js

## Google Sheet — hojas relevantes
- **Usuarios**: usuario | password | nombre | rol | Email — login de la app
- **Profesores**: id | nombre | departamento | email — prestatarios (quién pide prestado)
- **Modulos**: col A = código numérico del módulo (ej: 237) | col B = nombre módulo | col C = nombre profesor/a responsable
  - El GAS busca por código numérico en col A (`Number(modRows[i][0]) === Number(pres.moduloCod)`)
  - El nombre del profesor en col C debe coincidir EXACTAMENTE con el campo `nombre` de la hoja Usuarios
  - El rol 'Jefe Departamento' en Usuarios recibe CC en todos los emails de préstamo

## Reglas importantes
- NUNCA usar `const show` como nombre de variable en ningún JS — shadowing de show() en state.js rompe toda la navegación
- Los módulos se guardan en ítems como `cicloId__cod` (ej: `gm_telecom__0237`) — usar findModulo() para resolverlos
- Barra de progreso #loadBar: se activa en loadData() antes del await apiGet(), se cierra en finally

## Funcionalidades implementadas (estado 2026-05-03)
- Login / logout / recuperación de contraseña por email (reset.js)
- Perfil de usuario: editar nombre, email, cambiar contraseña (profile.js)
- Inventario por aula, categoría y módulo con tabla y tarjetas
- Buscador global en topbar (atajo / o Ctrl+K)
- Añadir/editar ítems con documentos adjuntos (base64 → GAS → Drive)
- Bajas y pedidos (localStorage inv_pedidos); pedido notifica por email al Jefe de Departamento
- Préstamos: prestar desde inventario, categorías y aulas; devolver; ver activos/vencidos/histórico
- **Email automático al prestar**: GAS busca responsable del módulo en hoja Modulos → email al responsable + CC al Jefe de Departamento
- **Email automático al devolver**: mismo flujo, notifica la devolución
- Importar CSV con mapeo de columnas
- Documentación del departamento: iframe SharePoint + botón externo
- PWA instalable, funciona offline (cache-first sw v4)

## appscript.txt
Contiene el código completo del backend GAS. Para actualizar el backend hay que copiar el contenido en el editor de Google Apps Script y redesplegar como aplicación web.

Acciones GAS relevantes:
- `action=prestar` — registra préstamo + envía email al responsable del módulo
- `action=devolver` — registra devolución + envía email de notificación
- `action=notificarPedido` — email al Jefe de Departamento con lista de pedidos
- `action=profAdd/profUpdate/profDelete` — CRUD de profesores prestatarios
