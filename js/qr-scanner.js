let _scanner = null;

function openQrScanner() {
  const modal = document.getElementById('mQrScanner');
  const video = document.getElementById('qrVideo');
  const content = document.getElementById('qrScannerContent');
  const error = document.getElementById('qrError');

  modal.style.display = 'flex';
  content.style.display = 'block';
  error.style.display = 'none';

  if (_scanner) {
    _scanner.start();
    return;
  }

  _scanner = new QrScanner(
    video,
    result => {
      const match = result.data.match(/item\/([a-zA-Z0-9_-]+)/);
      if (match) {
        toast('✅ QR detectado');
        _scanner.stop();
        setTimeout(() => {
          closeQrScanner();
          openItemRoute(match[1]);
        }, 200);
      }
    },
    { onDecodeError: () => {}, returnDetailedScanResult: true }
  );

  _scanner.start().catch(err => {
    _scanner = null;
    error.style.display = 'block';
    content.style.display = 'none';
    error.textContent = 'Error: ' + err.message;
  });
}

function closeQrScanner() {
  if (_scanner) {
    _scanner.stop();
  }
  document.getElementById('mQrScanner').style.display = 'none';
}
