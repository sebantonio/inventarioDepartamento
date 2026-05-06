---
name: Resumen del proyecto
description: Qué es la app, para qué sirve y estado actual de funcionalidades (actualizado 2026-05-06)
type: project
originSessionId: 97fd2f19-db29-4e74-997b-cfdd7054b186
---
App web de inventario para el departamento del IES El Bosco. Permite gestionar ítems de material (ordenadores, herramientas, componentes...) organizados por aulas y categorías, con préstamos a profesores, subida de documentación adjunta y gestión de usuarios.

**Archivos principales:**
- `index.html` — app SPA: todas las páginas/modales en HTML, scripts enlazados externamente
- `appscript.txt` — código Google Apps Script (backend REST), se despliega como Web App
- `css/styles.css` — estilos completos
- `js/` — módulos JS separados (ver arquitectura)
- `deploy.ps1` — script PowerShell para commit+push a GitHub con mensaje descriptivo

**Google Sheets (base de datos):**
- `Inventario` — ítems del inventario (col D = `mod` en formato `cicloId__cod`)
- `Usuarios` — usuario | password | nombre | rol | email (rol `Jefe Departamento` recibe CC en emails)
- `Aulas` — aulas/espacios configurables
- `Categorias` — categorías de ítems configurables
- `Documentos` — metadatos de archivos subidos a Drive
- `Prestamos` — registro de préstamos
- `Profesores` — lista de profesores para préstamos (id | nombre | departamento | email)
- `Modulos` — col A: código numérico | col B: nombre módulo | col C: profesor responsable

**Google Drive:** carpeta `Inventario Departamento` → subcarpetas por aula → archivos

**Funcionalidades implementadas (2026-05-06):**
- **Alertas automáticas de stock bajo**: función `notifyStockAlert(ss, it, oldItem, user)` en GAS. Solo envía email cuando qty *cruza* el umbral (oldQty > min → newQty <= min), evitando spam. Email al responsable del módulo (hoja Modulos col C) + CC Jefes de Departamento. Se registra en auditoría como `accion='stockAlert'`.
- **Historial visual por ítem**: botón "📋 Historial" en modal de edición (solo para ítems existentes). Modal `#mHistorial` muestra tabla: fecha | usuario | acción | detalle. Nueva acción GAS `getItemLog` devuelve registros filtrados por itemId. Se carga vía `apiGet({ action: 'getItemLog', itemId })` que ahora soporta parámetros adicionales. Escape cierra modal.
- Búsqueda mejorada: fuzzy matching con normalización Unicode (sin acentos). Busca en campos ref|item|loc, excluyendo categoría/estado/utilidad para evitar falsos positivos.

**Funcionalidades implementadas (2026-05-06):**
- Escaneo QR con cámara: librería `jsQR` v1.4.0 desde CDN. Botones QR en topbar y buscador global. Try-catch captura errores de inicialización (librería no carga, cámara no disponible). Detección de patrones `item/<id>` abre modal del ítem. Modal muestra video en vivo y error elegante si falla. Funciona en tablets/móviles con acceso a cámara.
- Exportación y restauración: exporta backup JSON completo y `#mImport` permite restaurar selectivamente inventario, aulas, categorías, ciclos y profesores mediante `action=restoreBackup`.

**Funcionalidades implementadas (2026-05-04):**
- Gestión de ciclos y módulos (modal `#mCiclos`): accordion, añadir/editar/eliminar ciclos y módulos, persistido en hoja Ciclos vía `action=ciclosSync`. `CICLOS` pasa de `const` a `let` en config.js. Botón "⚙️ Gestionar ciclos" en home.

**Funcionalidades implementadas (2026-05-03):**
- Inventario completo: tabla + tarjetas, filtros, búsqueda global, exportar CSV, imprimir
- Gestión de aulas y categorías (modal)
- Préstamos y devoluciones
- Importación masiva desde CSV
- Documentos adjuntos a ítems (Drive) — modal propio `mDocs` con `openDocsModal(id)`
- Documentación del departamento (página pDocsDpto)
- Login con sesión en localStorage
- Vista responsive móvil: topbar con menú ⋮, tarjetas automáticas en móvil (<640px)
- Página de perfil de usuario (pProfile): editar nombre, email; cambiar contraseña
- Recuperación de contraseña por email (MailApp): enlace con token, página pReset
- Ciclo y módulo obligatorios al crear/editar ítem
- Botón "Nuevo préstamo" en subheader de aulas/categorías/módulos
- Columna tabla renombrada a "Acciones", botón 📌 abre modal de docs independiente

**Notificaciones email implementadas:**
- **Préstamo**: email al responsable del módulo (hoja Modulos col C) + CC al Jefe Departamento
- **Devolución**: email al responsable del módulo + profesor que tomó prestado + CC Jefe Departamento
- **Pedido (🛒)**: email al Jefe Departamento al añadir ítem a lista de compra
- Todas no fatales (try-catch silencioso, el registro se guarda siempre)
- Debug de email: `res.emailDebug` logueado en consola del navegador tras cada préstamo

**Why:** El centro necesita controlar el material técnico del departamento de FP.

**How to apply:** Cambios en el backend (appscript.txt) requieren redesplegar el Apps Script manualmente. La URL del endpoint está en `js/state.js` → variable `API_URL`.
