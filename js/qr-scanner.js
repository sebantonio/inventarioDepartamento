function openQrScanner() {
  document.getElementById('qr_cam_input').click();
}

function processQrCapture(files) {
  const file = files && files[0];
  if (!file) return;

  if (typeof jsQR === 'undefined') {
    toast('❌ Error: jsQR no cargó. Comprueba la conexión.');
    return;
  }

  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Reducir a máx 1024px para que jsQR encuentre el QR con proporción adecuada
    const MAX = 1024;
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });

    if (code) {
      const match = code.data.match(/item\/([a-zA-Z0-9_-]+)/);
      if (match) {
        toast('✅ QR detectado');
        setTimeout(() => openItemRoute(match[1]), 200);
      } else {
        toast('⚠️ QR no reconocido: ' + code.data);
      }
    } else {
      toast('❌ No se detectó QR. Intenta con mejor luz o más cerca.');
    }
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast('❌ Error al leer la imagen.'); };
  img.src = url;
}

function closeQrScanner() {}
