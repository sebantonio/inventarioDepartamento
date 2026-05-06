let _qrScanInterval = null;

function openQrScanner() {
  try {
    const modal = document.getElementById('mQrScanner');
    const video = document.getElementById('qrVideo');
    const content = document.getElementById('qrScannerContent');
    const error = document.getElementById('qrError');

    modal.style.display = 'flex';

    if (typeof jsQR === 'undefined') {
      content.style.display = 'none';
      error.style.display = 'block';
      error.textContent = 'Error: librería jsQR no cargó del CDN';
      return;
    }

    content.style.display = 'block';
    error.style.display = 'none';

    if (_qrScanInterval) return;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        video.srcObject = stream;
        video._qrStream = stream;
        video.play();

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        _qrScanInterval = setInterval(() => {
          if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            const match = code.data.match(/item\/([a-zA-Z0-9_-]+)/);
            if (match) {
              toast('✅ QR detectado');
              closeQrScanner();
              setTimeout(() => openItemRoute(match[1]), 200);
            }
          }
        }, 200);
      })
      .catch(err => {
        error.style.display = 'block';
        content.style.display = 'none';
        error.textContent = 'Error al acceder a la cámara: ' + err.message;
      });
  } catch (e) {
    const error = document.getElementById('qrError');
    error.style.display = 'block';
    document.getElementById('qrScannerContent').style.display = 'none';
    error.textContent = 'Error: ' + e.message;
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
