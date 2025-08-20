import React, { useEffect, useRef } from 'react';
import { scanStream } from '../lib/barcode';
import styles from './CameraScanner.module.css';

interface Props {
  onToken(token: string): void;
}

export default function CameraScanner({ onToken }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stop = () => {};
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
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

  return (
    <div className={styles.cameraWrap}>
      <video ref={videoRef} />
      <div className={styles.scanBox} />
    </div>
  );
}
