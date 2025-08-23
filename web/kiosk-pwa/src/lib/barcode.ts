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
  let lastScan = 0;

  const scan = async () => {
    if (!active || !detector) return;
    try {
      const codes = await detector.detect(video);
      const now = Date.now();
      if (codes.length && now - lastScan >= cooldownMs) {
        lastScan = now;
        onToken(codes[0].rawValue);
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
