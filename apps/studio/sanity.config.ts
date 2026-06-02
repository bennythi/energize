import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';

/**
 * Sanity Studio Konfiguration.
 * Project-ID + Dataset sind die echten Werte aus dem Sanity-Cloud-Projekt.
 */
export default defineConfig({
  name: 'energize',
  title: 'ENERGIZE Festival',
  projectId: 'oxliq7rf',
  dataset: 'production',
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
});
