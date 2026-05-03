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
- **Modulos** (creada 2026-05-03): col A = nombre módulo | col B = profesor/a responsable

## Reglas importantes
- NUNCA usar `const show` como nombre de variable en ningún JS — shadowing de show() en state.js rompe toda la navegación
- Los módulos se guardan en ítems como `cicloId__cod` (ej: `gm_telecom__0237`) — usar findModulo() para resolverlos
- Barra de progreso #loadBar: se activa en loadData() antes del await apiGet(), se cierra en finally

## EN CURSO — Notificación email al crear préstamo (NO implementado aún)

Al crear un préstamo, enviar email al profesor responsable del módulo del ítem.

**Flujo diseñado:**
1. Frontend: al confirmar préstamo, pasar el nombre del módulo (resuelto con findModulo()) al GAS
2. GAS: buscar en hoja "Modulos" col A el nombre del módulo → obtener nombre profesor col B
3. GAS: buscar email del profesor en hoja "Usuarios" por campo `nombre`
4. GAS: `MailApp.sendEmail(email, asunto, cuerpo)`

**Pendiente antes de implementar:**
- Verificar que los nombres en hoja "Modulos" col A coinciden EXACTAMENTE con los `name` de CICLOS en config.js (tildes, mayúsculas, puntuación)
- Decidir si el email va solo al responsable del módulo o también al prestatario como confirmación
- Implementar en GAS (acción nueva, ej: `action=notificarPrestamo`) y en js/prestamos.js (llamar al GAS tras confirmPrestar)

**Nombres de módulos en config.js (para verificar contra GSheet):**
GM Telecom: Infraestructuras comunes de telecomunicación, Instalaciones domóticas, Electrónica aplicada, Equipos microinformáticos, Infraestructuras de redes de datos y telefonía, Instalaciones eléctricas básicas, Megafonía y sonorización, CCTV y seguridad electrónica, Instalaciones de radiocomunicaciones, Inglés profesional GM, Digitalización (GM), Sostenibilidad aplicada, Empleabilidad I, Empleabilidad II, Proyecto intermodular telecom.
GM Eléctricas: Automatismos industriales, Electrónica, Electrotecnia, Instalaciones eléctricas interiores, Instalaciones de distribución, Infraestructuras comunes de telecomunicación, Instalaciones domóticas, Instalaciones solares fotovoltaicas, Máquinas eléctricas, Inglés profesional GM, Digitalización (GM), Sostenibilidad aplicada, Empleabilidad I, Empleabilidad II, Proyecto intermodular eléctricas
GS Mant. Electrónico: Circuitos electrónicos analógicos, Equipos microprogramables, Mantenimiento eq. radiocomunicaciones, Mantenimiento eq. voz y datos, Mantenimiento eq. electrónica industrial, Mantenimiento eq. de audio, Mantenimiento eq. de video, Montaje y mantenimiento eq. electrónicos, Infraestructuras y desarrollo del mant., Inglés profesional GS, Digitalización (GS), Sostenibilidad aplicada, Empleabilidad I, Empleabilidad II, Proyecto intermodular mant. electrónico
GS SEA: Procesos en ICT, Técnicas en instalaciones eléctricas, Documentación técnica eléctrica, Sistemas y circuitos eléctricos, Inst. domóticas y automáticas, Redes eléctricas y centros de transformación, Configuración inst. domóticas, Configuración inst. eléctricas, Gestión del montaje y mantenimiento, Inglés profesional GS, Digitalización (GS), Sostenibilidad aplicada, Empleabilidad I, Empleabilidad II, Proyecto intermodular SEA
