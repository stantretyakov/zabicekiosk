import React, { useEffect, useRef, useState } from 'react';
import { scanStream } from '../lib/barcode';
import styles from './CameraScanner.module.css';

interface Props {
  onToken(token: string): void;
}

export default function CameraScanner({ onToken }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onTokenRef = useRef(onToken);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const extractToken = (raw: string): string => {
    try {
      const url = new URL(raw);
      return (
        url.searchParams.get('token') ||
        url.searchParams.get('id') ||
        url.pathname.split('/').filter(Boolean).pop() ||
        raw
      );
    } catch {
      const m = raw.match(/(?:token|id)=([^&]+)/);
      if (m) return decodeURIComponent(m[1]);
      const parts = raw.split('/');
      return parts.filter(Boolean).pop() || raw;
    }
  };

  // keep latest onToken without reinitialising scanner
  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let localStream: MediaStream | null = null;
    let stopScan = () => {};
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode } })
      .then(stream => {
        localStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          stopScan = scanStream(videoRef.current, raw => onTokenRef.current(extractToken(raw)));
        }
      })
      .catch(err => console.error(err));
    return () => {
      stopScan();
      if (localStream) localStream.getTracks().forEach(t => t.stop());
    };
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode(f => (f === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className={styles.cameraWrap}>
      <video ref={videoRef} playsInline autoPlay muted />
      <div className={styles.scanBox} />
      <div className={styles.prompt}>Поднесите QR‑код к камере</div>
      <button type="button" className={styles.switchButton} onClick={toggleCamera}>
        Сменить камеру
      </button>
    </div>
  );
}
