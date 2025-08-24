import React, { useRef, useEffect, useState } from 'react';
import styles from './CameraScanner.module.css';

interface CameraScannerProps {
  onScan: (data: string) => void;
  isOnline: boolean;
}

export default function CameraScanner({ onScan, isOnline }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraReady, setCameraReady] = useState(false);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraReady(false);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setCameraReady(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  return (
    <div className={styles.cameraWrap}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
      />
      
      <div className={styles.scanBox} />
      
      <div className={`${styles.statusIndicator} ${isOnline ? styles.online : styles.offline}`}>
        <div className={`${styles.statusDot} ${!isOnline ? styles.offline : ''}`} />
        {isOnline ? 'Online' : 'Offline'}
      </div>
      
      <div className={styles.controls}>
        <button 
          onClick={switchCamera}
          className={styles.switchButton}
          title="Switch camera"
        >
          🔄
        </button>
      </div>
      
      <div className={styles.prompt}>
        {cameraReady ? 'Position QR code in the frame' : 'Starting camera...'}
      </div>
    </div>
  );
}