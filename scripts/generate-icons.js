// Genera los íconos PWA placeholder (icon-192.png, icon-512.png).
// Usa `sharp` para rasterizar SVG en vez de `canvas` (canvas requiere
// node-gyp/toolchain nativo; sharp trae binarios precompilados).
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function svgIcon(size) {
  const strokeWidth = Math.round(size * 0.03);
  const radius = Math.round(size * 0.42);
  const fontSize = Math.round(size * 0.32);
  const center = size / 2;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#0A0A0B" />
      <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#E8C97A" stroke-width="${strokeWidth}" />
      <text
        x="${center}"
        y="${center}"
        fill="#E8C97A"
        font-family="Georgia, 'Times New Roman', serif"
        font-weight="bold"
        font-size="${fontSize}"
        text-anchor="middle"
        dominant-baseline="central"
      >AC</text>
    </svg>
  `;
}

async function generateIcon(size, filename) {
  const outPath = path.join(__dirname, "..", "public", filename);
  await sharp(Buffer.from(svgIcon(size))).png().toFile(outPath);
  console.log(`Generated ${filename}`);
}

async function main() {
  await generateIcon(192, "icon-192.png");
  await generateIcon(512, "icon-512.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
