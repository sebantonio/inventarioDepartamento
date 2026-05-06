let _qrStream = null;
let _qrScanning = false;

function openQrScanner() {
  const modal = document.getElementById('mQrScanner');
  const content = document.getElementById('qrScannerContent');
  const error = document.getElementById('qrError');

  modal.style.display = 'flex';
  content.style.display = 'block';
  error.style.display = 'none';

  const video = document.getElementById('qrVideo');
  _qrScanning = true;

  navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }
  }).then(stream => {
    _qrStream = stream;
    video.srcObject = stream;
    video.play().catch(e => console.error('play error:', e));
    setTimeout(() => _startQrScan(video), 500);
  }).catch(err => {
    _qrScanning = false;
    error.style.display = 'block';
    content.style.display = 'none';
    error.textContent = 'Error: ' + (err.name === 'NotAllowedError' ? 'Permiso denegado' : err.message);
  });
}

function closeQrScanner() {
  _qrScanning = false;
  if (_qrStream) {
    _qrStream.getTracks().forEach(t => t.stop());
    _qrStream = null;
  }
  document.getElementById('mQrScanner').style.display = 'none';
}

function _startQrScan(video) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  function scan() {
    if (!_qrScanning) return;

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      if (canvas.width === 0) {
        requestAnimationFrame(scan);
        return;
      }

      ctx.drawImage(video, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (typeof jsQR !== 'undefined') {
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
          const match = code.data.match(/item\/([a-zA-Z0-9_-]+)/);
          if (match) {
            _qrScanning = false;
            toast('✅ QR detectado');
            _qrStream.getTracks().forEach(t => t.stop());
            setTimeout(() => {
              closeQrScanner();
              openItemRoute(match[1]);
            }, 200);
            return;
          }
        }
      }
    } catch (e) {
      console.error('scan error:', e);
    }

    requestAnimationFrame(scan);
  }

  scan();
}
