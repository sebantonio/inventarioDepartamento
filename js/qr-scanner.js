function openQrScanner() {
  document.getElementById('mQrScanner').style.display = 'flex';
  document.getElementById('qrResult').textContent = '';
  document.getElementById('qrError').style.display = 'none';
}

function qrHandleFile(input) {
  const file = input.files[0];
  if (!file) return;

  const resultEl = document.getElementById('qrResult');
  const errorEl = document.getElementById('qrError');
  resultEl.textContent = 'Analizando imagen…';
  errorEl.style.display = 'none';

  if (typeof jsQR === 'undefined') {
    errorEl.style.display = 'block';
    errorEl.textContent = '❌ jsQR no cargó del CDN. Comprueba tu conexión.';
    resultEl.textContent = '';
    return;
  }

  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      const match = code.data.match(/item\/([a-zA-Z0-9_-]+)/);
      if (match) {
        toast('✅ QR detectado');
        closeQrScanner();
        setTimeout(() => openItemRoute(match[1]), 200);
      } else {
        resultEl.textContent = '⚠️ QR detectado, pero no es un ítem: ' + code.data;
        input.value = '';
      }
    } else {
      resultEl.textContent = '❌ No se detectó QR. Intenta de nuevo con mejor luz o más cerca.';
      input.value = '';
    }
  };
  img.onerror = () => {
    resultEl.textContent = '';
    errorEl.style.display = 'block';
    errorEl.textContent = '❌ No se pudo leer la imagen.';
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

function closeQrScanner() {
  document.getElementById('mQrScanner').style.display = 'none';
  const input = document.getElementById('qrFileInput');
  if (input) input.value = '';
}
