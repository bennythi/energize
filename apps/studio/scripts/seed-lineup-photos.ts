/**
 * Upload-Script: liest alle Bilder aus apps/studio/seed-assets/, lädt sie
 * als Sanity-Assets hoch und verknüpft sie als `photo`-Feld mit dem
 * passenden artist-Demo-Dokument.
 *
 * Dateiname-Konvention:
 *   <vorname>_<artist-name>.<ext>   z.B. 2026_brennan heart.avif
 * Der Prefix vor dem ersten Unterstrich wird abgeschnitten, der Rest
 * (Leerzeichen, &, etc.) wird in den Sanity-Slug überführt.
 *
 * Ausführen:
 *   pnpm --filter @energize/studio seed:photos
 *
 * Idempotent: existierende Assets werden re-uploaded, das artist-Dokument
 * bekommt die neue Reference. Alte Assets bleiben in Sanity liegen
 * (manuell aufräumen falls nötig).
 */

import { createClient } from '@sanity/client';
import { readdir, readFile } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

const PROJECT_ID = 'oxliq7rf';
const DATASET = 'production';
const API_VERSION = '2025-01-01';
const ASSETS_DIR = new URL('../seed-assets/', import.meta.url).pathname.replace(
  /^\/([A-Z]:)/,
  '$1',
);

const token = process.env.SANITY_AUTH_TOKEN;
if (!token) {
  console.error('SANITY_AUTH_TOKEN fehlt — bitte in apps/studio/.env.local setzen.');
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: API_VERSION,
  token,
  useCdn: false,
});

const MIME: Record<string, string> = {
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fileToSlug(filename: string): string {
  // 2026_brennan heart.avif → "brennan heart" → "brennan-heart"
  const stem = basename(filename, extname(filename));
  const underscoreIdx = stem.indexOf('_');
  const rest = underscoreIdx >= 0 ? stem.slice(underscoreIdx + 1) : stem;
  return slugify(rest);
}

async function main() {
  console.log(`Lese Bilder aus ${ASSETS_DIR}`);

  const entries = await readdir(ASSETS_DIR);
  const images = entries.filter((f) => MIME[extname(f).toLowerCase()]);

  if (images.length === 0) {
    console.log('Keine Bilder gefunden.');
    return;
  }

  console.log(`Gefunden: ${images.length} Bilder.\n`);

  for (const filename of images) {
    const slug = fileToSlug(filename);
    const artistId = `artist-demo-${slug}`;

    const ext = extname(filename).toLowerCase();
    const mime = MIME[ext];
    const filepath = join(ASSETS_DIR, filename);

    process.stdout.write(`  ${filename}  →  ${artistId}  ...`);

    try {
      // 1. Asset hochladen
      const buffer = await readFile(filepath);
      const asset = await client.assets.upload('image', buffer, {
        filename,
        contentType: mime,
      });

      // 2. Artist-Dokument patchen
      await client
        .patch(artistId)
        .set({
          photo: {
            _type: 'image',
            asset: { _type: 'reference', _ref: asset._id },
            alt: filename.replace(extname(filename), ''),
          },
        })
        .commit();

      console.log(' ✓');
    } catch (err) {
      console.log(' ✗');
      console.error('   ', err instanceof Error ? err.message : err);
    }
  }

  console.log('\nFertig.');
}

main().catch((err) => {
  console.error('Seed fehlgeschlagen:', err);
  process.exit(1);
});
