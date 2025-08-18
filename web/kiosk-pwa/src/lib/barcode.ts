export function scanStream(video: HTMLVideoElement, onToken: (token: string) => void) {
  let active = true;
  const detector = 'BarcodeDetector' in window ? new (window as any).BarcodeDetector({ formats: ['qr_code'] }) : null;

  const scan = async () => {
    if (!active || !detector) return;
    try {
      const codes = await detector.detect(video);
      if (codes.length) {
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
