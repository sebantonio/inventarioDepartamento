function openQrScanner() {
  document.getElementById('qr_cam_input').click();
}

async function processQrCapture(files) {
  const file = files && files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = async () => {
    URL.revokeObjectURL(url);
    let qrData = null;

    // 1. BarcodeDetector — API nativa del navegador (Chrome/Android, mucho más robusto)
    if ('BarcodeDetector' in window) {
      try {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        const codes = await detector.detect(img);
        if (codes.length > 0) qrData = codes[0].rawValue;
      } catch (e) { /* fallback a jsQR */ }
    }

    // 2. Fallback: jsQR con varios tamaños
    if (!qrData && typeof jsQR !== 'undefined') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      for (const MAX of [1600, 2048, 1024, 640]) {
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
        if (code) { qrData = code.data; break; }
      }
    }

    if (qrData) {
      const match = qrData.match(/item\/([a-zA-Z0-9_-]+)/);
      if (match) {
        toast('✅ QR detectado');
        setTimeout(() => openItemRoute(match[1]), 200);
      } else {
        toast('⚠️ QR no reconocido: ' + qrData);
      }
    } else {
      toast('❌ No se detectó QR. Intenta más cerca o con mejor luz.');
    }
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast('❌ Error al leer la imagen.'); };
  img.src = url;
}

function closeQrScanner() {}
