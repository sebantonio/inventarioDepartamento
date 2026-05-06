let _qrScanInterval = null;
let _qrFrameCount = 0;

function _qrDebug(msg) {
  const el = document.getElementById('qrResult');
  if (el) el.textContent = msg;
  console.log('[QR]', msg);
}

function openQrScanner() {
  try {
    const modal = document.getElementById('mQrScanner');
    const video = document.getElementById('qrVideo');
    const content = document.getElementById('qrScannerContent');
    const errorEl = document.getElementById('qrError');

    modal.style.display = 'flex';
    _qrDebug('Abriendo…');

    if (typeof jsQR === 'undefined') {
      content.style.display = 'none';
      errorEl.style.display = 'block';
      errorEl.textContent = '❌ jsQR no cargó del CDN';
      return;
    }
    _qrDebug('jsQR OK. Comprobando mediaDevices…');

    content.style.display = 'block';
    errorEl.style.display = 'none';

    if (_qrScanInterval) {
      _qrDebug('Ya activo, esperando QR…');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      errorEl.style.display = 'block';
      content.style.display = 'none';
      errorEl.textContent = '❌ Sin acceso a cámara (requiere HTTPS)';
      return;
    }

    _qrDebug('Pidiendo permiso de cámara…');

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        _qrDebug('Cámara OK. Iniciando video…');
        video.srcObject = stream;
        video._qrStream = stream;

        video.onloadedmetadata = () => {
          _qrDebug('Video listo (' + video.videoWidth + 'x' + video.videoHeight + '). Escaneando…');
        };

        video.play().then(() => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          _qrFrameCount = 0;

          _qrScanInterval = setInterval(() => {
            _qrFrameCount++;
            if (video.readyState !== video.HAVE_ENOUGH_DATA) {
              _qrDebug('Esperando video… (frame ' + _qrFrameCount + ', readyState=' + video.readyState + ')');
              return;
            }
            if (_qrFrameCount % 10 === 0) {
              _qrDebug('Escaneando… (frame ' + _qrFrameCount + ', ' + video.videoWidth + 'x' + video.videoHeight + ')');
            }
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              _qrDebug('QR leído: ' + code.data);
              const match = code.data.match(/item\/([a-zA-Z0-9_-]+)/);
              if (match) {
                toast('✅ QR detectado');
                closeQrScanner();
                setTimeout(() => openItemRoute(match[1]), 200);
              } else {
                _qrDebug('QR detectado pero no es un ítem: ' + code.data);
              }
            }
          }, 200);
        }).catch(err => {
          _qrDebug('Error en video.play(): ' + err.message);
        });
      })
      .catch(err => {
        errorEl.style.display = 'block';
        content.style.display = 'none';
        errorEl.textContent = '❌ Cámara denegada: ' + err.name + ' — ' + err.message;
      });
  } catch (e) {
    const errorEl = document.getElementById('qrError');
    if (errorEl) {
      errorEl.style.display = 'block';
      errorEl.textContent = '❌ Excepción: ' + e.message;
    }
    document.getElementById('qrScannerContent').style.display = 'none';
    console.error('[QR] excepción', e);
  }
}

function closeQrScanner() {
  if (_qrScanInterval) {
    clearInterval(_qrScanInterval);
    _qrScanInterval = null;
  }
  const video = document.getElementById('qrVideo');
  if (video && video._qrStream) {
    video._qrStream.getTracks().forEach(t => t.stop());
    video._qrStream = null;
    video.srcObject = null;
  }
  document.getElementById('mQrScanner').style.display = 'none';
}
