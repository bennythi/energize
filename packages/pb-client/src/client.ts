import PocketBase from 'pocketbase';
import type { TypedPocketBase } from './generated/pb-types.js';

/**
 * Erstellt einen typisierten Pocketbase-Client fuer die gegebene API-URL.
 * Die Typen stammen aus generated/pb-types.ts (via `pnpm --filter
 * @platform/pb-client typegen` aus der laufenden Instanz generiert).
 */
export function createPbClient(url: string): TypedPocketBase {
  return new PocketBase(url) as TypedPocketBase;
}
