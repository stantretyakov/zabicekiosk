import React from 'react';

interface Props {
  src: string; // data URL or image URL
  size?: number;
}

export default function QRRender({ src, size = 256 }: Props) {
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <img src={src} width={size} height={size} alt="QR code" />
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: size * 0.2,
        }}
      >
        🐸
      </span>
    </div>
  );
}
