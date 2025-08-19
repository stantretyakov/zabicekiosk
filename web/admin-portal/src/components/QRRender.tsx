import React from 'react';

interface Props {
  src: string; // data URL or image URL
  size?: number;
}

export default function QRRender({ src, size = 256 }: Props) {
  return <img src={src} width={size} height={size} alt="QR code" />;
}
