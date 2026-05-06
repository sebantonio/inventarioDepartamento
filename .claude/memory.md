# Memoria del proyecto - Inventario Departamento

## Sistema de roles - 2026-05-05

Se implemento un sistema de roles basado en la columna `rol` de la hoja `Usuarios`.

Fuente de verdad:
- Google Sheet: hoja `Usuarios`, columna `rol`.
- Frontend: `js/roles.js`.
- Backend GAS: `appscript.txt`, funciones `normalizarRol()`, `userCan()`, `requireAction()`.

Nomenclatura valida de roles:
- `Jefe Departamento`: acceso completo.
- `Jefe de Departamento`: acceso completo.
- `Administrador`: acceso completo.
- `admin`: acceso completo.
- `profesor`: puede anadir/editar items, dar bajas, gestionar documentos, registrar prestamos/devoluciones, pedidos y perfil. No puede eliminar definitivamente, importar CSV, gestionar aulas/categorias/ciclos ni gestionar profesores.
- `consulta`: lectura + perfil/contrasena.
- `lector`: lectura + perfil/contrasena.

Reglas importantes:
- La UI oculta botones con `data-perm` y `applyRoleUI()`, pero esto es solo UX.
- La proteccion real esta en Apps Script con `ACTION_PERMISSIONS` y `ROLE_PERMISSIONS`.
- Si se anade una accion nueva en GAS, hay que registrarla tambien en `ACTION_PERMISSIONS` de `js/roles.js` y `appscript.txt`.
- Orden real de scripts en `index.html`: config -> state -> roles -> api -> docs -> search -> home -> inventory -> modal-item -> modal-aulas -> modal-cats -> modal-ciclos -> prestamos -> import -> nav -> docs-dpto -> pwa -> profile -> reset -> auth.
- Tras cambiar `appscript.txt`, copiar el contenido al editor de Google Apps Script y redesplegar la aplicacion web.
- `sw.js` debe incluir `js/roles.js` y los JS cargados por `index.html` para que la PWA no sirva una version incompleta.

## Rendimiento movil/tablet - 2026-05-06

- Problema detectado: en algunos moviles/tablets el inventario en tarjetas se quedaba con lag o no desplazaba bien.
- Causa principal probable: `resize` renderizaba todo el inventario mientras el navegador movil cambiaba la altura visible al ocultar/mostrar su barra durante el scroll.
- Solucion aplicada: `js/inventory.js` solo re-renderiza en `resize` si cambia el modo real tabla/tarjetas.
- Solucion adicional: listado de inventario paginado en tabla y tarjetas. Valor inicial 25 items/pagina; selector disponible 10, 25, 30 y 50. No usar render por tandas con `requestAnimationFrame`, empeoro el pintado en Chrome/Edge/Firefox.
- CSS movil/tablet: tarjetas y botones sin animaciones/transiciones/transform hover pesados en <=900px; sombras reducidas.
- No usar `contain: layout paint` en `.icard`: en Chrome/Edge/Firefox movil puede provocar tarjetas en blanco que aparecen al desplazar.
- Ajuste tablet tactil: aplicar modo ligero tambien con `hover:none`, `pointer:coarse` y `max-width:1200px`; sin animaciones/transforms en tarjetas/cards/botones. `topbar` con `min-height`, no `height`, y login alineado arriba para evitar cortes por barras del navegador.
- Tablets/dispositivos tactiles: forzar vista tarjetas. `getInvRenderMode()` devuelve `cards` si `(hover:none)` o `(pointer:coarse)`; CSS oculta `.vtog` y `.tw`.
- Modo tactil compacto: una columna de tarjetas, `topbar` sin `sticky`, paginas sin `min-height`, cards sin sombra, home grids a 2 columnas, primera carga de inventario a 10 items/pagina salvo eleccion manual del usuario.
- En tactiles se eliminan efectos visuales secundarios: animaciones/transiciones globales, sombras, filtros, `backdrop-filter`, transforms indirectos y degradados pesados en elementos principales.
- `sw.js` subido a `VERSION='v24'` para forzar cache nueva de PWA.
- 2026-05-06: en tablets/tactiles se permite solo la animacion inicial del `#loadOverlay` con version ligera (`lo-pulse-lite` por transform/opacidad). Mantener desactivadas las animaciones/transiciones de tarjetas/listados/botones del inventario para evitar lag.

## QR por item - 2026-05-06

- Modal de item muestra bloque QR solo en items existentes, porque los nuevos aun no tienen `id`.
- URL generada: `#item/<id>`. Al abrir esa ruta, `openItemRoute(id)` carga el aula del item y abre su modal.
- Si se abre con usuario sin permiso `items.write`, el modal queda en modo lectura y oculta Guardar/subida/borrado de documentos.
- En inventario, tabla y tarjetas muestran un boton compacto junto al nombre del item con `icons/qr-code.svg`. Llama a `openModal(id)` para acceder rapido al QR grande y acciones de copiar/imprimir.
- `printBulkItemQrs()` imprime etiquetas QR en A4 para los items del filtro actual (`getFiltered()`): aula, categoria, modulo, stock bajo, mantenimiento y busqueda/filtros activos.
- `sw.js` debe cachear `./icons/qr-code.svg` y subir `VERSION` cuando se cambie el icono o la impresion QR.

## Mantenimiento / reparacion - 2026-05-06

- Se anadio campo persistente `mant` al inventario. `appscript.txt` usa `HEADERS_INV = ['id','ref','aula','mod','item','qty','min','cat','loc','est','util','fecha','mant','mantFecha','mantNota','mantResp','mantEstado','mantSolicitante','mantSolicitanteEmail','foto','obs']`.
- `ensureHeaders(sheet, headers)` en `appscript.txt` migra cabeceras existentes, inserta columnas nuevas y mantiene el orden esperado. Tras cambiar `appscript.txt`, copiarlo a Google Apps Script y redesplegar.
- `js/state.js` define `needsMaintenance(item)`: true si `mant` es `1`/true o si `est === 'Avería'`. Esto hace compatibles datos antiguos marcados como averia.
- Modal de item: checkbox `#f_mant` "Necesita mantenimiento o reparacion"; detalles `mantFecha`, `mantNota`, `mantResp`, `mantEstado`.
- Estados de mantenimiento: `Pendiente`, `En reparación`, `Reparado`, `Resuelto`. `needsMaintenance()` excluye los reparados/resueltos de la cola aunque conserva los datos si `mant` sigue marcado.
- Home: la tarjeta "espacios" fue eliminada y sustituida por tarjeta "mantenimiento"; boton rapido `🛠️ Mantenimiento` llama a `goMaintenance()`.
- Navegacion: ruta `#maintenance`, `goMaintenance()` y `cf.type === 'maintenance'` filtran items mediante `needsMaintenance()`.
- Listado: tarjetas muestran pill con estado y bloque `.maint-note` con fecha/responsable/nota; tabla antepone resumen en Utilidad.
- Import/Export CSV incluyen `Mantenimiento`, `Fecha aviso mant.`, `Estado mant.`, `Responsable mant.`, `Nota mant.`. Import acepta `1`, `si/sí`, `true`, `x`, `ok`, `reparacion`, `mantenimiento`, `averia`.

- Notificaciones mantenimiento en `appscript.txt`: al activar mantenimiento se envia correo al responsable del modulo (hoja `Modulos` -> `Usuarios`) con CC al solicitante. Al cambiar estado a `En reparacion`, `Resuelto` o `Reparado`, se notifica a ambos. `mantSolicitante` y `mantSolicitanteEmail` se guardan internamente para conservar quien lo pidio.

## Foto principal por item - 2026-05-06

- Campo persistente `foto` en `HEADERS_INV`, guardado como miniatura `data:image/jpeg` en el propio item.
- La miniatura principal se genera automaticamente al hacer/subir una imagen en documentacion: `addDocFiles()` llama a `setMainPhotoFromFile()`.
- Si el item ya tiene fotos adjuntas pero `foto` esta vacia, `loadItemDocs()` llama a `syncMainPhotoFromDocs()` y usa la primera imagen de Drive con `driveThumbSrc(driveId)`.
- `setMainPhotoFromFile()` en `js/modal-item.js` reduce la imagen a max 360px y calidad 0.45 antes de guardarla. Mantener este limite para no inflar Google Sheets/API.
- Modal: `#f_foto` y `#f_foto_preview`; no usar flujo manual separado de "elegir foto principal".
- Tarjetas: `x.foto` se muestra como `.card-photo` con `aspect-ratio:16/9` y `object-fit:cover`. Tabla: miniatura `.table-photo`.
- No incluir foto en CSV: el base64 lo hace pesado y poco util.

## Iconos y acciones combinadas - actualizado 2026-05-06

- Icono uniforme de prestamos: `⌛` en filas de inventario, tarjetas y botones "Nuevo prestamo" independientes.
- No recuperar `🔁` para prestamos; se cambio para evitar conflicto visual con `🔄` de recargar.
- Baja/eliminar usa el picker `#mDelPicker` y `openDelModal(itemId?)`; no recuperar `.del-wrap` / `.del-menu`.

## Exportacion / backup - 2026-05-06

- El boton superior `btnE` abre `#mExport` con `openExportModal()`, no descarga CSV directamente.
- Opciones: CSV de vista actual (`exportCSV()`), CSV completo de items (`exportAllItemsCSV()`) y backup completo JSON (`exportFullBackup()`).
- El backup JSON incluye `inventario`, `aulas`, `categorias`, `ciclos`, `prestamos`, `profesores` y `meta` con recuentos/usuario sin guardar password.

## Auditoria de acciones - 2026-05-05

Se implemento auditoria en `appscript.txt`.

Hoja creada automaticamente:
- `Log`

Columnas:
- `fecha`
- `usuario`
- `nombre`
- `rol`
- `accion`
- `itemId`
- `resumen`

Helper:
- `auditLog(ss, user, accion, itemId, resumen)`

Acciones registradas:
- `add`, `update`, `delete`, `bulkImport`
- `profAdd`, `profUpdate`, `profDelete`
- `aulasSync`, `catsSync`, `ciclosSync`
- `prestar`, `devolver`
- `uploadDoc`, `deleteDoc`
- `updateProfile`, `changePassword`
- `notificarPedido`

La auditoria vive solo en backend para que no pueda saltarse desde el navegador. Tras modificar `appscript.txt`, copiarlo al editor de Apps Script y redesplegar.
