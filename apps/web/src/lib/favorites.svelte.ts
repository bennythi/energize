import { browser } from '$app/environment';

// Favoriten (gemerkte Kuenstler) sind bewusst lokal (localStorage), kein
// Backend noetig. Bei Bedarf kann ein spaeteres Modul sie an den Account
// koppeln. API bleibt kompatibel zur bisherigen Nutzung (has/toggle/load).
const STORAGE_KEY = 'platform.favorites';

class FavoritesStore {
  ids = $state<Set<string>>(new Set());
  loading = $state(false);
  initialized = false;

  async load(): Promise<void> {
    if (!browser) {
      this.ids = new Set();
      this.initialized = true;
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      this.ids = new Set(Array.isArray(arr) ? arr : []);
    } catch {
      this.ids = new Set();
    } finally {
      this.initialized = true;
    }
  }

  has(artistId: string): boolean {
    return this.ids.has(artistId);
  }

  async toggle(artistId: string): Promise<void> {
    const next = new Set(this.ids);
    if (next.has(artistId)) next.delete(artistId);
    else next.add(artistId);
    this.ids = next;
    if (browser) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // localStorage nicht verfuegbar, nur In-Memory.
      }
    }
  }

  clear(): void {
    this.ids = new Set();
    this.initialized = false;
  }
}

export const favorites = new FavoritesStore();
