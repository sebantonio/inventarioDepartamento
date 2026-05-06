---
name: QR Scanner — Escaneo con cámara en tiempo real
description: Escaneo QR live con getUserMedia + jsQR v1.4.0, botones en topbar y buscador
type: project
---

Escaneo QR en tiempo real implementado 2026-05-06. Detecta códigos QR con la cámara y muestra acciones rápidas del ítem escaneado.

## Stack
- **Librería**: `jsQR` v1.4.0 desde CDN (index.html, sin `defer` para carga síncrona)
- **Archivo principal**: `js/qr-scanner.js`
  - `openQrScanner()` — abre modal y activa cámara con `getUserMedia()`
  - `_startQrProcessing(video)` — loop en `requestAnimationFrame` que procesa frames con canvas + jsQR
  - `closeQrScanner()` — para stream, cierra modal
- **Modal**: `#mQrScanner` en index.html
  - Abierto con `classList.add('open')` (CSS controla `opacity:1; pointer-events:all`)
  - Video: `#qrVideo` (autoplay, playsinline)
  - Resultado: `#qrResult` (texto "Apunta la cámara...")
  - Errores: `#qrError` (visible si librería no carga o getUserMedia falla)
- **Botones**: 
  - Topbar `#btnQr` (`onclick="openQrScanner()"`)
  - Buscador `#gsQr` (derecha del input de búsqueda)
  - Mostrados por `applyRoleUI()` en `roles.js` (permitido para todos logueados)

## Flujo actual
1. Usuario hace clic en botón QR (topbar o buscador)
2. `openQrScanner()` → `modal.classList.add('open')`
3. `getUserMedia({ video: { facingMode: 'environment' } })` inicia cámara trasera
4. `video.onloadedmetadata` → `video.play()` → `_startQrProcessing(video)`
5. Loop en `requestAnimationFrame()` dibuja frames en canvas + jsQR detecta
6. Si detecta patrón `item/[id]`: detiene la cámara y muestra acciones rápidas
7. Si error: muestra en `#qrError` (librería no cargó, cámara denegada, etc.)

## Detalles técnicos
- Canvas context: `{ willReadFrequently: true }` (optimización para lectura frecuente)
- jsQR opciones: `{ inversionAttempts: 'attemptBoth' }` (detecta QR en luz clara/oscura)
- Patrón QR: regex `item/([a-zA-Z0-9_-]+)` busca en datos QR
- Acciones rápidas: abrir ficha, prestar/devolver, mantenimiento, documentos y baja
- Modal abierto: requiere `classList.add('open')` NO `display:flex` (cambio reciente CSS)
- Cierre modal: `classList.remove('open')` + parar tracks de stream

## Compatibilidad
- **Android/tablets**: getUserMedia suele funcionar si se concede permiso
- **iOS/iPad**: restricciones strictas, getUserMedia puede no funcionar (requeriría fallback con input file capture)
- **Escritorio**: funciona con cámara integrada

## Service Worker
- Incluido en CACHE_SHELL (`sw.js`)
- VERSION actual: v62
- Cambios en `qr-scanner.js` requieren subir VERSION para forzar caché actualizado

## Gotchas solucionados (2026-05-06)
- Botón QR "Prestar / Devolver": no deshabilitar en el panel QR. Debe cerrar el escáner y abrir `openPresDevModal(itemId)` con pequeño retardo; el modal decide si permite nuevo préstamo o solo devoluciones.
- ❌ qr-scanner.min.js lanzaba "Unexpected token 'export'" (ES module incompatible)
- ❌ qr-scanner.umd.min.js fallaba con "Failed to resolve module specifier './qr-scanner-worker.min.js'" (CORS)
- ✅ Cambiar a jsQR (sin workers, sin CORS)
- ❌ Modal con `display:flex` no se veía (opacity:0 por CSS)
- ✅ Cambiar a `classList.add('open')` (aplica `opacity:1; pointer-events:all`)

## Cambio crítico en CSS
El modal `.mbg` tiene estado `display:flex` pero `opacity:0; pointer-events:none` por defecto. La clase `.open` activa `opacity:1; pointer-events:all`. Si algo más intenta usar `display:flex` en `.mbg`, el modal seguirá invisible. Solución: siempre usar `classList.add('open')` / `classList.remove('open')` para abrir/cerrar.
