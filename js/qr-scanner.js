function openQrScanner() {
  document.getElementById('qr_cam_input').click();
}

function processQrCapture(files) {
  if (!files || !files.length) return;

  const file = files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Redimensionar si es muy grande
      let w = img.width, h = img.height;
      if (w > 1200) {
        h = Math.round(h * 1200 / w);
        w = 1200;
      }

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      if (typeof jsQR === 'undefined') {
        toast('Error: jsQR no disponible');
        return;
      }

      // Intentar detección
      const imgData = ctx.getImageData(0, 0, w, h);
      const code = jsQR(imgData.data, w, h);

      if (code && code.data) {
        const match = code.data.match(/item\/([a-zA-Z0-9_-]+)/);
        if (match) {
          toast('✅ QR detectado');
          setTimeout(() => openItemRoute(match[1]), 300);
          return;
        }
        toast('⚠️ QR detectado pero no es de ítem: ' + code.data.substring(0, 30));
        return;
      }

      // Si no detecta, intentar con escala de grises
      const gray = ctx.createImageData(w, h);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const r = imgData.data[i];
        const g = imgData.data[i + 1];
        const b = imgData.data[i + 2];
        const v = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        gray.data[i] = gray.data[i + 1] = gray.data[i + 2] = v;
        gray.data[i + 3] = 255;
      }

      const code2 = jsQR(gray.data, w, h);
      if (code2 && code2.data) {
        const match = code2.data.match(/item\/([a-zA-Z0-9_-]+)/);
        if (match) {
          toast('✅ QR detectado');
          setTimeout(() => openItemRoute(match[1]), 300);
          return;
        }
      }

      toast('❌ No se detectó QR. Asegúrate de que esté claro y bien enfocado.');
    };

    img.onerror = () => {
      toast('Error al procesar imagen');
    };

    img.src = e.target.result;
  };

  reader.onerror = () => {
    toast('Error al leer imagen');
  };

  reader.readAsDataURL(file);
}
