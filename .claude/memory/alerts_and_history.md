---
name: Alertas de stock bajo + Historial visual por ítem
description: Alertas automáticas por stock bajo y modal de historial de cambios
type: project
originSessionId: da5a826b-54a5-4fb6-842d-dc5adc382f11
---
Implementadas 2026-05-07. Alertas de stock bajo envían email automático al responsable del módulo cuando qty cruza el umbral mínimo. Historial visual muestra tabla de cambios por ítem.

## Alertas de stock bajo

### Backend (GAS — appscript.txt)
- **Función `notifyStockAlert(ss, it, oldItem, user)`** (línea ~347)
  - Envía email solo cuando qty CRUZA el umbral: `oldQty > min` → `newQty <= min`
  - Evita spam: si ya estaba bajo, no reenvía
  - Email a responsable del módulo (hoja Modulos col C) + CC Jefes de Departamento
  - Registra en auditoría: `auditLog(ss, user, 'stockAlert', it.id, ...)`
- **Llamadas**: en `action=add` (línea ~558) y `action=update` (línea ~573)
  - `add`: `notifyStockAlert(ss, it, {}, user)` — compara qty nuevo vs 0 (asume ítem nuevo)
  - `update`: `notifyStockAlert(ss, it, oldItem, user)` — compara qty viejo vs nuevo
- **Email incluye**: nombre ítem, referencia, qty actual vs mínimo, módulo, responsable
- **CC automático**: recorre hoja Usuarios filtrando `rol === 'Jefe Departamento'` y añade todos a CC

### Frontend
- No hay interfaz específica — se dispara automáticamente al guardar/editar un ítem
- Se registra en auditoría (hoja Log, acción='stockAlert')

### Verificación
1. Editar ítem: qty > min → guardar → NO envía email
2. Editar ítem: qty pasa de >min a <=min → guardar → ENVÍA email a responsable
3. Editar ítem: qty sigue <=min → cambiar otra cosa → guardar → NO envía email (ya estaba bajo)

---

## Historial visual por ítem

### Backend (GAS — appscript.txt)
- **Nueva acción `getItemLog` en `doGet`** (línea ~481)
  - Lee parámetro `e.parameter.itemId`
  - Filtra hoja Log por `itemId` (columna 6 = itemId)
  - Devuelve array ordenado descendente (más recientes primero)
  - Cada registro: `{ fecha, usuario, accion, resumen }`
  - Fecha formateada: `Utilities.formatDate(fechaVal, 'Europe/Madrid', 'dd/MM/yyyy HH:mm')`
  - Maneja errores de conversión de fecha con try-catch interno
  - Si no hay registros → devuelve `{ ok: true, logs: [] }`

### Frontend
- **index.html**: 
  - Botón "📋 Historial" (oculto por defecto) en footer izquierdo modal `#mItem` (línea 443)
  - Modal `#mHistorial` (línea 471) con estructura: header + tabla en `.mb` + footer
- **js/modal-item.js**:
  - `openModal()`: muestra/oculta `#btnHistorial` según `eid` (ítem nuevo = oculto, existente = visible)
  - `openHistorial()` (línea ~542): 
    - Valida `eid`, carga item del array `items`
    - Establece título `📋 Historial — [nombre ítem]`
    - Muestra "Cargando..." mientras busca
    - Llama `apiGet({ action: 'getItemLog', itemId: eid })`
    - Renderiza tabla con registros o "Sin historial"
  - `closeHistorial()`: remove clase `.open` del modal
- **js/auth.js**: handler de Escape llama `closeHistorial()` (línea 153)
- **js/api.js**: 
  - `urlWithAuth(action, params={})` actualizada para pasar parámetros adicionales a URL
  - `apiGet(action, params={})` actualizada para aceptar objeto `{ action, itemId, ... }` y pasarlo a `urlWithAuth`

### Modal estructura
```html
<div class="mbg" id="mHistorial" onclick="if(event.target===this)closeHistorial()">
  <div class="modal">
    <div class="mh">...</div>
    <div class="mb" id="histBody">
      <table class="tw" style="width:100%">
        <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr></thead>
        <tbody>... registros ...<tbody>
      </table>
    </div>
    <div class="mf"><button>Cerrar</button></div>
  </div>
</div>
```

### Datos mostrados
Tabla con columnas:
- **Fecha**: `dd/MM/yyyy HH:mm` (ej: "06/05/2026 20:51:40")
- **Usuario**: nombre del usuario que hizo el cambio
- **Acción**: `add` | `update` | `delete` | `stockAlert` | etc.
- **Detalle**: descripción legible (ej: "Actualizado item: Árbol; qty 10 -> 3; estado Bueno -> Bueno")

### Verificación
1. Abre ítem NUEVO → botón "Historial" oculto ✅
2. Abre ítem EXISTENTE → botón "Historial" visible ✅
3. Clic botón → modal se abre con tabla ✅
4. Tabla muestra: fecha | usuario | acción | detalle ✅
5. Escape cierra modal ✅
6. Haz cambios en un ítem → abre historial → aparecen nuevos registros ✅

---

## Cambios técnicos

### Cambios GAS
- `appscript.txt` línea ~347: nueva función `notifyStockAlert`
- `appscript.txt` línea ~558, ~573: llamadas en add/update
- `appscript.txt` línea ~481: nueva acción `getItemLog` en `doGet`

### Cambios Frontend
- `index.html` línea 443: botón `#btnHistorial`
- `index.html` línea 471: modal `#mHistorial`
- `js/modal-item.js` línea ~148-152: mostrar/ocultar botón en `openModal()`
- `js/modal-item.js` línea ~542+: nuevas funciones `openHistorial()` y `closeHistorial()`
- `js/auth.js` línea 153: añadir `closeHistorial()` a handler Escape
- `js/api.js` línea 6: `urlWithAuth` ahora acepta `params` objeto
- `js/api.js` línea 13: `apiGet` ahora acepta `{ action, itemId, ... }` como objeto

### Versiones
- `sw.js` VERSION: v57 → v58 (alertas + historial) → v59 (fix apiGet)

---

## Restricciones
- Historial solo lee (no edita) — view only de los cambios
- Botón "Historial" solo visible para ítems guardados (no borradores nuevos)
- Email de alerta: solo cuando cruza umbral, no para ediciones posteriores del mismo ítem bajo stock
- Email de alerta: silencioso si falla (try-catch, sin notificación de error al usuario)
