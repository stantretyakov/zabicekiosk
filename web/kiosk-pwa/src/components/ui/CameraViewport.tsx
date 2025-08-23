import { RefObject } from 'react';
import s from './CameraViewport.module.css';

export type CameraViewportProps = {
  videoRef: RefObject<HTMLVideoElement>;
  hint?: string;
};

export default function CameraViewport({ videoRef, hint }: CameraViewportProps) {
  return (
    <div>
      <div className={s.wrap}>
        <video ref={videoRef} className={s.video} playsInline muted autoPlay />
        <div className={s.overlay} />
      </div>
      {hint && <div className={s.hint}>{hint}</div>}
    </div>
  );
}
