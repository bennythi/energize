import PocketBase from 'pocketbase';
import type { TypedPocketBase } from './generated/pb-types.js';

/**
 * Erstellt einen typisierten Pocketbase-Client fuer die gegebene API-URL.
 * Die Typen stammen aus generated/pb-types.ts (via `pnpm --filter
 * @platform/pb-client typegen` aus der laufenden Instanz generiert).
 */
export function createPbClient(url: string): TypedPocketBase {
  const pb = new PocketBase(url) as TypedPocketBase;
  // Auto-Cancel bricht parallele Requests auf dieselbe Collection ab (z.B.
  // Promise.all mit zwei getFullList). Die Seiten laden bewusst parallel.
  pb.autoCancellation(false);
  return pb;
}
