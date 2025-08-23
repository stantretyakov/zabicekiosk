import jsQR from 'jsqr';

export function scanStream(
  video: HTMLVideoElement,
  onToken: (token: string) => void,
  cooldownMs = 5000
) {
  let active = true;
  const detector =
    'BarcodeDetector' in window
      ? new (window as any).BarcodeDetector({ formats: ['qr_code'] })
      : null;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let lastScan = 0;

  const scan = async () => {
    if (!active) return;
    try {
      const now = Date.now();
      if (detector) {
        const codes = await detector.detect(video);
        if (codes.length && now - lastScan >= cooldownMs) {
          lastScan = now;
          onToken(codes[0].rawValue);
        }
      } else if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        if (code && now - lastScan >= cooldownMs) {
          lastScan = now;
          onToken(code.data);
        }
      }
    } catch (e) {
      console.error(e);
    }
    requestAnimationFrame(scan);
  };
  requestAnimationFrame(scan);
  return () => {
    active = false;
  };
}
