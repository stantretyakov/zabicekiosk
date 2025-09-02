/*
 * Frog logo (original SVG) — designed to resemble the friendly 🐸 style
 * Copyright: CC0 / Public Domain by requestor
 * Use: as center image/logo in web QR renderers
 * Recommended overlay size: 18–25% of QR module size, enable “excavate”/clear space if available.
 */

// Raw SVG markup (512×512 viewBox). Optimized for center overlay in QR codes.
export const frogSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' role='img' aria-labelledby='title desc'>
  <title id='title'>Friendly Frog Icon</title>
  <desc id='desc'>A simple, friendly frog face with big eyes and a curved smile.</desc>
  <defs>
    <radialGradient id='gHead' cx='35%' cy='30%' r='80%'>
      <stop offset='0%' stop-color='#70e081'/>
      <stop offset='70%' stop-color='#46c564'/>
      <stop offset='100%' stop-color='#2faa55'/>
    </radialGradient>
    <radialGradient id='gEye' cx='50%' cy='45%' r='70%'>
      <stop offset='0%' stop-color='#ffffff'/>
      <stop offset='100%' stop-color='#f4f7fa'/>
    </radialGradient>
  </defs>

  <!-- head -->
  <circle cx='256' cy='256' r='220' fill='url(#gHead)' stroke='#1b1b1b' stroke-width='8'/>

  <!-- eye bulges -->
  <ellipse cx='168' cy='178' rx='70' ry='58' fill='#43c261' />
  <ellipse cx='344' cy='178' rx='70' ry='58' fill='#43c261' />

  <!-- eyes -->
  <circle cx='168' cy='178' r='44' fill='url(#gEye)' stroke='#1b1b1b' stroke-width='6'/>
  <circle cx='344' cy='178' r='44' fill='url(#gEye)' stroke='#1b1b1b' stroke-width='6'/>
  <circle cx='182' cy='184' r='16' fill='#1b1b1b'/>
  <circle cx='330' cy='184' r='16' fill='#1b1b1b'/>
  <!-- small eye highlight dots -->
  <circle cx='176' cy='174' r='6' fill='#ffffff' opacity='0.9'/>
  <circle cx='324' cy='174' r='6' fill='#ffffff' opacity='0.9'/>

  <!-- cheeks -->
  <ellipse cx='138' cy='254' rx='34' ry='20' fill='#ffb3c1' opacity='0.55'/>
  <ellipse cx='374' cy='254' rx='34' ry='20' fill='#ffb3c1' opacity='0.55'/>

  <!-- smile -->
  <path d='M146 292c34 46 86 70 110 70s76-24 110-70' fill='none' stroke='#1b1b1b' stroke-width='12' stroke-linecap='round' stroke-linejoin='round'/>
  <!-- subtle mouth shadow -->
  <path d='M160 300c30 36 78 54 96 54s66-18 96-54' fill='none' stroke='#0d5a33' stroke-opacity='0.12' stroke-width='14' stroke-linecap='round'/>

  <!-- soft bottom vignette to keep contrast inside busy QR codes -->
  <ellipse cx='256' cy='332' rx='168' ry='78' fill='#000000' opacity='0.05'/>
</svg>`;

// Data URL for use in <img src=...> or QR renderers expecting an image string
export const frogDataUrl: string = `data:image/svg+xml;utf8,${encodeURIComponent(frogSvg)}`;
export default frogDataUrl;

// Utility to build a sized HTMLImageElement (optional helper)
export function makeFrogImage(size: number = 128): HTMLImageElement {
  const img = new Image(size, size);
  img.src = frogDataUrl;
  img.alt = 'frog logo';
  img.decoding = 'async';
  img.loading = 'eager';
  img.style.width = `${size}px`;
  img.style.height = `${size}px`;
  img.crossOrigin = 'anonymous';
  return img;
}

// Optional: tweak colors by simple string replace (kept minimal to stay tiny). 
// For more advanced theming, consider parsing XML but this keeps bundle small.
export function getThemedFrogDataUrl(options?: { primary?: string; stroke?: string; blush?: string }): string {
  const { primary = '#46c564', stroke = '#1b1b1b', blush = '#ffb3c1' } = options || {};
  let svg = frogSvg
    .replace(/#46c564/g, primary)  // main green
    .replace(/#1b1b1b/g, stroke)   // outlines
    .replace(/#ffb3c1/g, blush);   // cheeks
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/*
USAGE EXAMPLES

1) react-qrcode (qrcode.react)

import { QRCode } from 'react-qrcode-logo'; // or 'qrcode.react' depending on lib
import { frogDataUrl } from './frog-logo';

<QRCode
  value="https://example.com"
  // For 'react-qrcode-logo'
  logoImage={frogDataUrl}
  logoWidth={64}
  logoHeight={64}
  removeQrCodeBehindLogo // excavate equivalent
/>

// If you use 'qrcode.react' (older lib):
// <QRCode value="..." imageSettings={{ src: frogDataUrl, height: 64, width: 64, excavate: true }} />

2) qr-code-styling

import QRCodeStyling from 'qr-code-styling';
import { frogDataUrl } from './frog-logo';

const qr = new QRCodeStyling({
  data: 'https://example.com',
  image: frogDataUrl,
  imageOptions: { margin: 4, hideBackgroundDots: true, crossOrigin: 'anonymous' }
});

// Recommended: keep logo 18–25% of QR size; ensure quiet zone around it.
*/
