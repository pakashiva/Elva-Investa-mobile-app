/**
 * Converts business logo JPGs to PNG assets for the app.
 * Run: node scripts/generate-brand-assets.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const assetsDir = resolve(root, 'assets');

const sourceCandidates = [
  resolve(assetsDir, 'brand-source.jpg'),
  resolve(
    process.env.USERPROFILE ?? '',
    '.cursor/projects/c-Users-pakas-OneDrive-Documents-mern-mobile-app/assets/c__Users_pakas_AppData_Roaming_Cursor_User_workspaceStorage_5c54f0bb651c1987e329c088611f885b_images_WhatsApp_Image_2026-09-02_at_2.56.31_PM-38b3277e-b842-4728-a6c4-2f853e693d08.jpg'
  ),
];

function findSource() {
  for (const candidate of sourceCandidates) {
    try {
      readFileSync(candidate);
      return candidate;
    } catch {
      /* try next */
    }
  }
  throw new Error('Business logo source JPG not found.');
}

async function main() {
  const sharp = (await import('sharp')).default;
  const source = findSource();

  mkdirSync(assetsDir, { recursive: true });

  const logo = sharp(source).rotate().png();
  await logo.clone().toFile(resolve(assetsDir, 'logo.png'));

  const iconCanvas = async (size, paddingRatio = 0.12) => {
    const meta = await sharp(source).metadata();
    const maxSide = Math.max(meta.width ?? size, meta.height ?? size);
    const inner = Math.round(size * (1 - paddingRatio * 2));
    const resized = await sharp(source)
      .rotate()
      .resize({
        width: inner,
        height: inner,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toBuffer();

    return sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: resized, gravity: 'centre' }])
      .png()
      .toBuffer();
  };

  const icon1024 = await iconCanvas(1024);
  writeFileSync(resolve(assetsDir, 'icon.png'), icon1024);
  writeFileSync(resolve(assetsDir, 'adaptive-icon.png'), icon1024);

  const splashIcon = await iconCanvas(512, 0.08);
  writeFileSync(resolve(assetsDir, 'splash-icon.png'), splashIcon);

  const favicon = await iconCanvas(48, 0.1);
  writeFileSync(resolve(assetsDir, 'favicon.png'), favicon);

  const logoMark = await sharp(source)
    .rotate()
    .resize(128, 128, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();
  writeFileSync(resolve(assetsDir, 'logo-mark.png'), logoMark);

  console.log('Brand assets generated in assets/');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
