import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outPath = path.resolve(__dirname, "..", "public", "og-image.png");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1220"/>
      <stop offset="55%" stop-color="#0f1d5c"/>
      <stop offset="100%" stop-color="#3366ff"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#00d9ff" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#6c5ce7" stop-opacity="0.95"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="24" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>

  <g opacity="0.14">
    <circle cx="220" cy="140" r="140" fill="#00d9ff"/>
    <circle cx="980" cy="520" r="220" fill="#6c5ce7"/>
  </g>

  <g filter="url(#shadow)">
    <rect x="96" y="120" width="1008" height="390" rx="28" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)"/>
  </g>

  <g transform="translate(140, 200)">
    <rect x="0" y="0" width="84" height="84" rx="20" fill="url(#accent)"/>
    <text x="112" y="40" font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif" font-size="44" font-weight="700" fill="#ffffff">
      PocketBase.cn
    </text>
    <text x="112" y="90" font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif" font-size="26" font-weight="500" fill="rgba(255,255,255,0.86)">
      中文文档 · 插件市场 · 案例展示 · 下载镜像
    </text>
  </g>

  <g transform="translate(140, 360)">
    <text x="0" y="0" font-family="Inter, system-ui, -apple-system, Segoe UI, sans-serif" font-size="22" font-weight="500" fill="rgba(255,255,255,0.78)">
      Production-ready PocketBase ecosystem hub for China.
    </text>
  </g>
</svg>
`;

await fs.mkdir(path.dirname(outPath), { recursive: true });

const png = await sharp(Buffer.from(svg)).png({ quality: 90 }).toBuffer();
await fs.writeFile(outPath, png);

console.log(`Generated: ${outPath}`);
