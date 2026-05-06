let _qrStream = null;
let _qrScanning = false;
let _qrProcessingFrame = false;

function openQrScanner() {
  const modal = document.getElementById('mQrScanner');
  const content = document.getElementById('qrScannerContent');
  const error = document.getElementById('qrError');
  const result = document.getElementById('qrResult');

  modal.style.display = 'flex';
  content.style.display = 'block';
  error.style.display = 'none';
  result.textContent = 'Apunta la cámara a un código QR...';
  result.style.color = 'var(--muted)';

  const video = document.getElementById('qrVideo');
  _qrScanning = true;

  navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' },
    audio: false
  }).then(stream => {
    _qrStream = stream;
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      _startQrProcessing(video);
    };
  }).catch(err => {
    _qrScanning = false;
    error.style.display = 'block';
    content.style.display = 'none';
    if (err.name === 'NotAllowedError') {
      error.textContent = 'Acceso denegado a la cámara. Por favor, verifica los permisos.';
    } else if (err.name === 'NotFoundError') {
      error.textContent = 'No se encontró cámara en tu dispositivo.';
    } else {
      error.textContent = 'Error al acceder a la cámara: ' + err.message;
    }
  });
}

function closeQrScanner() {
  _qrScanning = false;
  if (_qrStream) {
    _qrStream.getTracks().forEach(track => track.stop());
    _qrStream = null;
  }
  document.getElementById('mQrScanner').style.display = 'none';
}

function _startQrProcessing(video) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  function processFrame() {
    if (!_qrScanning) return;

    if (_qrProcessingFrame) {
      requestAnimationFrame(processFrame);
      return;
    }

    _qrProcessingFrame = true;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    if (typeof jsQR === 'undefined') {
      _qrProcessingFrame = false;
      requestAnimationFrame(processFrame);
      return;
    }

    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      const data = code.data;
      const itemMatch = data.match(/#item\/([^\/?]+)/);

      if (itemMatch) {
        const itemId = itemMatch[1];
        _qrScanning = false;

        document.getElementById('qrResult').textContent = 'QR detectado: ' + itemId;
        document.getElementById('qrResult').style.color = 'var(--green)';

        if (_qrStream) {
          _qrStream.getTracks().forEach(track => track.stop());
          _qrStream = null;
        }

        setTimeout(() => {
          closeQrScanner();
          openItemRoute(itemId);
        }, 300);

        _qrProcessingFrame = false;
        return;
      }
    }

    _qrProcessingFrame = false;
    requestAnimationFrame(processFrame);
  }

  processFrame();
}
