/**
 * Sanity-Cloud-Verbindung. Project-ID + Dataset sind public und dürfen ins Bundle.
 * API-Token (write) gehört NICHT hier rein — wird nur in Server-Build-Schritten
 * via env-Var injected.
 */
export const sanityConfig = {
  projectId: 'oxliq7rf',
  dataset: 'production',
  apiVersion: '2024-12-01',
  useCdn: true,
} as const;
