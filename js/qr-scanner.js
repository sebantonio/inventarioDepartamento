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
        console.log('[QR] Detectado:', data);

        let itemId = null;
        // Buscar #item/<id>
        let match = data.match(/#item\/([^\/?]+)/);
        if (match) itemId = match[1];
        // Buscar item/<id> sin #
        if (!itemId) {
          match = data.match(/item\/([^\/?]+)/);
          if (match) itemId = match[1];
        }
        // Buscar solo el ID si la URL completa contiene /item/
        if (!itemId && data.includes('/item/')) {
          match = data.match(/\/item\/([a-zA-Z0-9_-]+)/);
          if (match) itemId = match[1];
        }

        if (itemId) {
          console.log('[QR] ID extraído:', itemId);
          toast('✅ QR detectado: ' + itemId);
          setTimeout(() => openItemRoute(itemId), 300);
          return;
        } else {
          console.log('[QR] Dato detectado pero no es un QR de ítem');
          toast('⚠️ QR detectado pero no es de un ítem. Contenido: ' + data.substring(0, 50));
          return;
        }
      }

      console.log('[QR] No se detectó ningún QR');
      toast('❌ No se detectó código QR. Asegúrate de que sea un QR válido y clara la foto.');
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
