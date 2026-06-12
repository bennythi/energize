import { browser } from '$app/environment';
import { auth } from './auth.svelte';

class FavoritesStore {
  ids = $state<Set<string>>(new Set());
  loading = $state(false);
  initialized = false;

  async load(): Promise<void> {
    const client = auth.client;
    const user = auth.user;
    if (!browser || !client || !user) {
      this.ids = new Set();
      this.initialized = true;
      return;
    }
    this.loading = true;
    try {
      const { data, error } = await client
        .from('favorites')
        .select('artist_id')
        .eq('user_id', user.id);
      if (error) throw error;
      this.ids = new Set((data ?? []).map((r) => r.artist_id));
    } catch (err) {
      console.error('[favorites] load failed', err);
      this.ids = new Set();
    } finally {
      this.loading = false;
      this.initialized = true;
    }
  }

  has(artistId: string): boolean {
    return this.ids.has(artistId);
  }

  async toggle(artistId: string): Promise<void> {
    const client = auth.client;
    const user = auth.user;
    if (!client || !user) return;
    const userId = user.id;
    const wasActive = this.ids.has(artistId);

    const next = new Set(this.ids);
    if (wasActive) next.delete(artistId);
    else next.add(artistId);
    this.ids = next;

    try {
      if (wasActive) {
        const { error } = await client
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('artist_id', artistId);
        if (error) throw error;
      } else {
        const { error } = await client
          .from('favorites')
          .insert({ user_id: userId, artist_id: artistId });
        if (error) throw error;
      }
    } catch (err) {
      console.error('[favorites] toggle failed, rolling back', err);
      const rollback = new Set(this.ids);
      if (wasActive) rollback.add(artistId);
      else rollback.delete(artistId);
      this.ids = rollback;
    }
  }

  clear(): void {
    this.ids = new Set();
    this.initialized = false;
  }
}

export const favorites = new FavoritesStore();
