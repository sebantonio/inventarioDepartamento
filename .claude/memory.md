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
- `sw.js` subido a `VERSION='v11'` para forzar cache nueva de PWA.

## Iconos y acciones combinadas - actualizado 2026-05-06

- Icono uniforme de prestamos: `⌛` en filas de inventario, tarjetas y botones "Nuevo prestamo" independientes.
- No recuperar `🔁` para prestamos; se cambio para evitar conflicto visual con `🔄` de recargar.
- Baja/eliminar usa el picker `#mDelPicker` y `openDelModal(itemId?)`; no recuperar `.del-wrap` / `.del-menu`.

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
