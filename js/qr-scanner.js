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
  result.textContent = 'Inicializando cámara...';
  result.style.color = 'var(--muted)';

  const video = document.getElementById('qrVideo');
  _qrScanning = true;

  const constraints = {
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  };

  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    _qrStream = stream;
    video.srcObject = stream;

    video.onloadedmetadata = () => {
      video.play().then(() => {
        result.textContent = 'Apunta la cámara a un código QR...';
        _startQrProcessing(video);
      }).catch(e => {
        console.error('Error al reproducir video:', e);
        _showQrError('No se pudo reproducir el video de la cámara.');
      });
    };

    video.onerror = (e) => {
      console.error('Error en video element:', e);
      _showQrError('Error al cargar la cámara.');
    };

  }).catch(err => {
    _qrScanning = false;
    console.error('getUserMedia error:', err);
    if (err.name === 'NotAllowedError') {
      _showQrError('Acceso denegado a la cámara. Verifica los permisos en los ajustes del dispositivo.');
    } else if (err.name === 'NotFoundError') {
      _showQrError('No se encontró cámara en tu dispositivo.');
    } else if (err.name === 'NotReadableError') {
      _showQrError('La cámara está siendo usada por otra aplicación.');
    } else {
      _showQrError('Error al acceder a la cámara: ' + err.message);
    }
  });
}

function _showQrError(msg) {
  document.getElementById('qrError').textContent = msg;
  document.getElementById('qrError').style.display = 'block';
  document.getElementById('qrScannerContent').style.display = 'none';
  _qrScanning = false;
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
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    setTimeout(() => _startQrProcessing(video), 100);
    return;
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    _showQrError('No se pudo acceder al contexto del canvas. Intenta en otro navegador.');
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  function processFrame() {
    if (!_qrScanning) return;

    if (_qrProcessingFrame) {
      requestAnimationFrame(processFrame);
      return;
    }

    _qrProcessingFrame = true;

    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      if (typeof jsQR === 'undefined') {
        _qrProcessingFrame = false;
        requestAnimationFrame(processFrame);
        return;
      }

      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
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
    } catch (e) {
      console.error('Error procesando frame:', e);
    }

    _qrProcessingFrame = false;
    requestAnimationFrame(processFrame);
  }

  processFrame();
}
