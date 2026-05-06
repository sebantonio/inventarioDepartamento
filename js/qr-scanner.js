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
