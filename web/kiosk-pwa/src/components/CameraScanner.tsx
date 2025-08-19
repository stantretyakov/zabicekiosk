import React, { useEffect, useRef } from 'react';
import { scanStream } from '../lib/barcode';

interface Props {
  onToken(token: string): void;
}

export default function CameraScanner({ onToken }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stop = () => {};
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          stop = scanStream(videoRef.current, onToken);
        }
      })
      .catch(err => console.error(err));
    return () => stop();
  }, [onToken]);

  return <video ref={videoRef} style={{ width: '100%' }} />;
}
