import { browser } from '$app/environment';
import { auth } from './auth.svelte';

export interface WallPost {
  id: string;
  user_id: string;
  image_path: string;
  caption: string | null;
  created_at: string;
  // joined / computed
  author_display_name: string | null;
  author_handle: string | null;
  like_count: number;
  liked_by_me: boolean;
}

class PostsStore {
  items = $state<WallPost[]>([]);
  loading = $state(false);
  initialized = $state(false);
  errorMsg = $state<string | null>(null);

  publicUrl(image_path: string): string {
    const client = auth.client;
    if (!client) return '';
    const { data } = client.storage.from('posts').getPublicUrl(image_path);
    return data.publicUrl;
  }

  async load(): Promise<void> {
    const client = auth.client;
    if (!browser || !client) {
      this.initialized = true;
      return;
    }
    this.loading = true;
    this.errorMsg = null;
    try {
      const { data: posts, error } = await client
        .from('posts')
        .select('id, user_id, image_path, caption, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      if (!posts || posts.length === 0) {
        this.items = [];
        return;
      }

      const userIds = [...new Set(posts.map((p) => p.user_id))];
      const postIds = posts.map((p) => p.id);

      // Authors
      const { data: authors } = await client
        .from('profiles')
        .select('id, display_name, handle')
        .in('id', userIds);
      const byUser = new Map(authors?.map((a) => [a.id, a]) ?? []);

      // Like counts (all)
      const { data: allLikes } = await client
        .from('post_likes')
        .select('post_id, user_id')
        .in('post_id', postIds);
      const likeCounts = new Map<string, number>();
      const mineLikes = new Set<string>();
      const myUserId = auth.user?.id;
      for (const like of allLikes ?? []) {
        likeCounts.set(like.post_id, (likeCounts.get(like.post_id) ?? 0) + 1);
        if (myUserId && like.user_id === myUserId) mineLikes.add(like.post_id);
      }

      this.items = posts.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        image_path: p.image_path,
        caption: p.caption,
        created_at: p.created_at,
        author_display_name: byUser.get(p.user_id)?.display_name ?? null,
        author_handle: byUser.get(p.user_id)?.handle ?? null,
        like_count: likeCounts.get(p.id) ?? 0,
        liked_by_me: mineLikes.has(p.id),
      }));
    } catch (err) {
      console.error('[posts] load failed', err);
      this.errorMsg = err instanceof Error ? err.message : 'unknown';
    } finally {
      this.loading = false;
      this.initialized = true;
    }
  }

  async toggleLike(postId: string): Promise<void> {
    const client = auth.client;
    const user = auth.user;
    if (!client || !user) return;

    const idx = this.items.findIndex((p) => p.id === postId);
    if (idx < 0) return;
    const post = this.items[idx];
    const wasLiked = post.liked_by_me;

    // Optimistic
    this.items = this.items.map((p, i) =>
      i === idx
        ? { ...p, liked_by_me: !wasLiked, like_count: p.like_count + (wasLiked ? -1 : 1) }
        : p,
    );

    try {
      if (wasLiked) {
        const { error } = await client
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await client
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    } catch (err) {
      console.error('[posts] toggle like failed, rolling back', err);
      this.items = this.items.map((p, i) =>
        i === idx
          ? { ...p, liked_by_me: wasLiked, like_count: p.like_count + (wasLiked ? 1 : -1) }
          : p,
      );
    }
  }

  async report(postId: string, reason: string): Promise<boolean> {
    const client = auth.client;
    const user = auth.user;
    if (!client || !user) return false;
    try {
      const { error } = await client
        .from('reports')
        .insert({ post_id: postId, user_id: user.id, reason });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('[posts] report failed', err);
      return false;
    }
  }
}

export const posts = new PostsStore();
