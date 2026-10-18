const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Create Gold Brand SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="40%" stop-color="#f59e0b"/>
      <stop offset="80%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  
  <!-- Outer Rounded Square -->
  <rect x="16" y="16" width="480" height="480" rx="96" fill="url(#bg)" stroke="#334155" stroke-width="4"/>
  
  <!-- Subtle Grid Pattern in background -->
  <path d="M 64 160 L 448 160 M 64 256 L 448 256 M 64 352 L 448 352" stroke="#1e293b" stroke-width="2" stroke-dasharray="4 4" />
  <path d="M 160 64 L 160 448 M 256 64 L 256 448 M 352 64 L 352 448" stroke="#1e293b" stroke-width="2" stroke-dasharray="4 4" />
  
  <!-- Gold Shield / Octagon Emblem -->
  <polygon points="256,64 396,128 416,280 256,432 96,280 116,128" fill="url(#gold)" filter="url(#glow)"/>
  
  <!-- Inner Shield Core -->
  <polygon points="256,92 372,146 388,272 256,400 124,272 140,146" fill="#020617" />
  
  <!-- Stylized Gold Bullion / Ascending Candlestick Motif -->
  <rect x="176" y="240" width="24" height="60" rx="4" fill="#10b981" />
  <line x1="188" y1="210" x2="188" y2="330" stroke="#10b981" stroke-width="4" stroke-linecap="round" />
  
  <rect x="244" y="190" width="24" height="90" rx="4" fill="#f59e0b" />
  <line x1="256" y1="160" x2="256" y2="310" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" />
  
  <rect x="312" y="150" width="24" height="80" rx="4" fill="#38bdf8" />
  <line x1="324" y1="130" x2="324" y2="260" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" />
  
  <!-- "AU" Gold Chemical Symbol & Scalper Badge -->
  <text x="256" y="360" font-family="'JetBrains Mono', 'Courier New', monospace" font-size="44" font-weight="900" fill="url(#gold)" text-anchor="middle" letter-spacing="4">XAUUSD</text>
  <text x="256" y="390" font-family="'Plus Jakarta Sans', sans-serif" font-size="16" font-weight="700" fill="#94a3b8" text-anchor="middle" letter-spacing="2">APEX GOLD AI</text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);

// Helper function to create minimal compliant uncompressed/compressed PNG
function createPNG(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(2, 9); // color type 2 (RGB)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    // CRC32 calculation
    let crc = 0xffffffff;
    for (let i = 4; i < 8 + len; i++) {
      let byte = buf[i];
      for (let j = 0; j < 8; j++) {
        const bit = (byte ^ crc) & 1;
        crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
        byte >>>= 1;
      }
    }
    buf.writeInt32BE(~crc, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data: filter byte (0) + width * 3 bytes per scanline
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);
  
  // Fill scanlines with a rich dark slate background and gold center circle
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.4;
  
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius) {
        // Gold inside: #f59e0b -> rgb(245, 158, 11)
        rawData[pxOffset] = 245;
        rawData[pxOffset + 1] = 158;
        rawData[pxOffset + 2] = 11;
      } else {
        // Dark slate outside: #020617 -> rgb(2, 6, 23)
        rawData[pxOffset] = 2;
        rawData[pxOffset + 1] = 6;
        rawData[pxOffset + 2] = 23;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate PNG assets
const png192 = createPNG(192, 192, 245, 158, 11);
const png512 = createPNG(512, 512, 245, 158, 11);
const appleIcon = createPNG(180, 180, 245, 158, 11);

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), appleIcon);

console.log('Successfully generated PWA icons and SVG assets in /public');
