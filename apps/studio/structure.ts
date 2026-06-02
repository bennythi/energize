import type { StructureBuilder, StructureResolver } from 'sanity/structure';

/**
 * Custom Studio Structure:
 * - `siteSettings` ist Singleton (nur ein Dokument, direkt aufrufbar)
 * - Andere Document-Types als Listen
 */
export const structure: StructureResolver = (S: StructureBuilder) =>
  S.list()
    .title('Inhalte')
    .items([
      S.listItem()
        .title('Website-Einstellungen')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),

      S.divider(),

      S.documentTypeListItem('artist').title('Künstler / Line-Up'),
      S.documentTypeListItem('poi').title('Karten-POIs'),

      S.divider(),

      S.documentTypeListItem('faqEntry').title('FAQ'),
      S.documentTypeListItem('page').title('Seiten'),
      S.documentTypeListItem('mediaItem').title('Media'),
      S.documentTypeListItem('sponsor').title('Sponsoren / Partner'),
    ]);
