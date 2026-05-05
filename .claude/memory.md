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
- Tras cambiar `appscript.txt`, copiar el contenido al editor de Google Apps Script y redesplegar la aplicacion web.
- `sw.js` debe incluir `js/roles.js` y los JS cargados por `index.html` para que la PWA no sirva una version incompleta.

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
