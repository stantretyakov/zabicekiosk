import React, { RefObject } from 'react';
import styles from './CameraViewport.module.css';

export type CameraViewportProps = {
  videoRef: RefObject<HTMLVideoElement>;
  size?: number;
  overlayText?: string;
};

export default function CameraViewport({ 
  videoRef, 
  size = 360, 
  overlayText = 'Поднесите QR‑код к камере' 
}: CameraViewportProps) {
  return (
    <div 
      className={styles.viewport} 
      style={{ width: size, height: size }}
    >
      <video
        ref={videoRef}
        className={styles.video}
        playsInline
        muted
        autoPlay
      />
      <div className={styles.overlay}>
        <div className={styles.scanFrame} />
        {overlayText && (
          <div className={styles.overlayText}>
            {overlayText}
          </div>
        )}
      </div>
    </div>
  );
}