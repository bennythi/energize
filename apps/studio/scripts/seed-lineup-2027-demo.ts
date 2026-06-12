/**
 * Demo-Seed: 10 Artists aus dem 2026er Lineup ins Sanity-Studio einspielen,
 * damit die 2027-Demo-Site etwas zum Anzeigen hat.
 *
 * VOR DEM AUSFÜHREN:
 *   1. Im Sanity-Dashboard (https://www.sanity.io/manage/personal/project/oxliq7rf/api)
 *      einen "Editor"- oder "Deploy Studio"-Token erstellen.
 *   2. Token in `apps/studio/.env.local` als `SANITY_AUTH_TOKEN=...` ablegen.
 *   3. `pnpm --filter @energize/studio seed:lineup` ausführen.
 *
 * Idempotent: re-runs überschreiben die existierenden Demo-Dokumente per stable _id.
 */

import { createClient } from '@sanity/client';

const PROJECT_ID = 'oxliq7rf';
const DATASET = 'production';
const API_VERSION = '2025-01-01';

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

const DEMO_BIO = {
  _type: 'localizedText',
  de: 'Demo-Daten — finales Lineup für 2027 wird im Herbst 2026 bekanntgegeben.',
  en: 'Demo placeholder — final 2027 lineup will be announced in autumn 2026.',
};

const ARTISTS = [
  'Brennan Heart',
  'Beatfighterz',
  'Da Tweekaz',
  'Evil Activities',
  'Max Enforcer',
  'Pan&Tilt',
  'Sk1pp',
  'Ruffian',
  'Zatox',
  'Zelecter',
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log(`Seede ${ARTISTS.length} Demo-Artists in Sanity ...`);

  const tx = client.transaction();

  ARTISTS.forEach((name, idx) => {
    const slug = slugify(name);
    const id = `artist-demo-${slug}`;
    tx.createOrReplace({
      _id: id,
      _type: 'artist',
      name,
      slug: { _type: 'slug', current: slug },
      bio: DEMO_BIO,
      featured: true,
      isLive: false,
      order: idx,
    });
  });

  const result = await tx.commit();
  console.log(`✓ ${result.results.length} Dokumente upserted.`);
  result.results.forEach((r) => console.log(`  - ${r.id}`));
}

main().catch((err) => {
  console.error('Seed fehlgeschlagen:', err);
  process.exit(1);
});
