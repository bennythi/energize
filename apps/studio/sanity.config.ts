import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';

/**
 * Sanity Studio Konfiguration.
 *
 * ⚠️ projectId ist ein PLATZHALTER — bitte ersetzen sobald das Sanity-Projekt
 * angelegt ist (siehe docs/sanity-setup.md). Bis dahin schlägt `pnpm dev` fehl.
 */
export default defineConfig({
  name: 'energize',
  title: 'ENERGIZE Festival',
  projectId: 'REPLACE_WITH_SANITY_PROJECT_ID',
  dataset: 'production',
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
});
