/**
 * Sanity-Cloud-Verbindung. Project-ID + Dataset sind public und dürfen ins Bundle.
 * API-Token (write) gehört NICHT hier rein — wird nur in Server-Build-Schritten
 * via env-Var injected.
 *
 * useCdn: false — wir betreiben eine Live-Demo wo Editoren Lineup-Updates
 * vornehmen und User direkt sehen sollen, was sich ändert. Der CDN liefert
 * sonst bis zu 60s alte Daten.
 */
export const sanityConfig = {
  projectId: 'oxliq7rf',
  dataset: 'production',
  apiVersion: '2024-12-01',
  useCdn: false,
  stega: false,
} as const;
