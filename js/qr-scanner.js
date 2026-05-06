let _scanner = null;

function openQrScanner() {
  try {
    const modal = document.getElementById('mQrScanner');
    const video = document.getElementById('qrVideo');
    const content = document.getElementById('qrScannerContent');
    const error = document.getElementById('qrError');

    modal.style.display = 'flex';

    if (typeof QrScanner === 'undefined') {
      content.style.display = 'none';
      error.style.display = 'block';
      error.textContent = 'Error: librería QrScanner no cargó del CDN';
      return;
    }

    content.style.display = 'block';
    error.style.display = 'none';

    if (_scanner) {
      _scanner.start();
      return;
    }

    _scanner = new QrScanner(
      video,
      result => {
        const qrData = result.data || result;
        const match = qrData.match(/item\/([a-zA-Z0-9_-]+)/);
        if (match) {
          toast('✅ QR detectado');
          _scanner.stop();
          setTimeout(() => {
            closeQrScanner();
            openItemRoute(match[1]);
          }, 200);
        }
      },
      err => {},
      { returnDetailedScanResult: false, maxScansPerSecond: 5 }
    );

    _scanner.start().catch(err => {
      _scanner = null;
      error.style.display = 'block';
      content.style.display = 'none';
      error.textContent = 'Error: ' + err.message;
    });
  } catch (e) {
    const error = document.getElementById('qrError');
    error.style.display = 'block';
    document.getElementById('qrScannerContent').style.display = 'none';
    error.textContent = 'Error: ' + e.message;
  }
}

function closeQrScanner() {
  if (_scanner) {
    _scanner.stop();
  }
  document.getElementById('mQrScanner').style.display = 'none';
}
