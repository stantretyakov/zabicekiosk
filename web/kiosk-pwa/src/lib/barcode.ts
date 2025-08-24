import jsQR from 'jsqr';

let lastScanTime = 0;
const SCAN_COOLDOWN = 2000; // 2 seconds between scans

export function scanStream(
  video: HTMLVideoElement,
  onScan: (data: string) => void
): () => void {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  let animationId: number;
  let isScanning = true;

  const scan = () => {
    if (!isScanning || !video.videoWidth || !video.videoHeight) {
      animationId = requestAnimationFrame(scan);
      return;
    }

    // Check if video is ready for processing
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      animationId = requestAnimationFrame(scan);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    try {
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      
      if (code && code.data) {
        const now = Date.now();
        if (now - lastScanTime > SCAN_COOLDOWN) {
          lastScanTime = now;
          onScan(code.data);
        }
      }
    } catch (error) {
      console.error('QR scan error:', error);
    }
    
    animationId = requestAnimationFrame(scan);
  };

  scan();

  return () => {
    isScanning = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };
}