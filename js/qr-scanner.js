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
      const context = canvas.getContext('2d');

      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      if (typeof jsQR === 'undefined') {
        toast('jsQR no está disponible');
        return;
      }

      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        const data = code.data;
        const itemMatch = data.match(/#item\/([^\/?]+)/);

        if (itemMatch) {
          const itemId = itemMatch[1];
          toast('✅ QR detectado: ' + itemId);
          setTimeout(() => openItemRoute(itemId), 300);
          return;
        }
      }

      toast('❌ No se detectó un código QR válido. Intenta de nuevo.');
    };

    img.onerror = () => {
      toast('Error al procesar la imagen');
    };

    img.src = e.target.result;
  };

  reader.onerror = () => {
    toast('Error al leer la imagen');
  };

  reader.readAsDataURL(file);
}
