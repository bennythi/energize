import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';
import { structure } from './structure';

/**
 * Sanity Studio Konfiguration.
 * Project-ID + Dataset sind die echten Werte aus dem Sanity-Cloud-Projekt.
 */
export default defineConfig({
  name: 'energize',
  title: 'ENERGIZE Festival CMS',
  projectId: 'oxliq7rf',
  dataset: 'production',
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: schemaTypes,
    // Singleton: kein "Create new" für siteSettings
    templates: (templates) => templates.filter(({ schemaType }) => schemaType !== 'siteSettings'),
  },
  document: {
    // Verstecke Actions für siteSettings-Singleton: kein Duplicate, kein Delete
    actions: (input, context) =>
      context.schemaType === 'siteSettings'
        ? input.filter(({ action }) => !['duplicate', 'delete'].includes(action ?? ''))
        : input,
  },
});
