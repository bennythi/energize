<script lang="ts">
  import { onMount } from 'svelte';
  import { Container } from '@energize/ui';
  import { auth } from '$lib/auth.svelte';
  import { posts as wallPosts } from '$lib/posts.svelte';

  interface ReportRow {
    id: string;
    post_id: string;
    user_id: string;
    reason: string;
    created_at: string;
    post_image_url: string | null;
    post_status: string | null;
    post_caption: string | null;
    reporter_name: string | null;
  }

  let items = $state<ReportRow[]>([]);
  let loading = $state(true);
  let actingOn = $state<string | null>(null);

  async function load() {
    const client = auth.client;
    if (!client) return;
    loading = true;
    try {
      const { data: reports, error } = await client
        .from('reports')
        .select('id, post_id, user_id, reason, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;

      if (!reports || reports.length === 0) {
        items = [];
        return;
      }

      const postIds = [...new Set(reports.map((r) => r.post_id))];
      const userIds = [...new Set(reports.map((r) => r.user_id))];

      const [postsRes, profilesRes] = await Promise.all([
        client.from('posts').select('id, image_path, caption, status').in('id', postIds),
        client.from('profiles').select('id, display_name').in('id', userIds),
      ]);

      const byPost = new Map(postsRes.data?.map((p) => [p.id, p]) ?? []);
      const byUser = new Map(profilesRes.data?.map((p) => [p.id, p]) ?? []);

      items = reports.map((r) => {
        const p = byPost.get(r.post_id);
        return {
          ...r,
          post_image_url: p ? wallPosts.publicUrl(p.image_path) : null,
          post_status: p?.status ?? null,
          post_caption: p?.caption ?? null,
          reporter_name: byUser.get(r.user_id)?.display_name ?? null,
        };
      });
    } catch (err) {
      console.error('[admin/reports] load failed', err);
      items = [];
    } finally {
      loading = false;
    }
  }

  async function rejectPostFromReport(report: ReportRow) {
    if (!confirm('Diesen Post ablehnen UND alle Reports zu ihm löschen?')) return;
    const client = auth.client;
    if (!client) return;
    actingOn = report.id;
    try {
      await client.from('posts').update({ status: 'rejected' }).eq('id', report.post_id);
      await client.from('reports').delete().eq('post_id', report.post_id);
      items = items.filter((r) => r.post_id !== report.post_id);
    } catch (err) {
      console.error('[admin/reports] reject failed', err);
      alert('Aktion fehlgeschlagen.');
    } finally {
      actingOn = null;
    }
  }

  async function dismissReport(report: ReportRow) {
    const client = auth.client;
    if (!client) return;
    actingOn = report.id;
    try {
      const { error } = await client.from('reports').delete().eq('id', report.id);
      if (error) throw error;
      items = items.filter((r) => r.id !== report.id);
    } catch (err) {
      console.error('[admin/reports] dismiss failed', err);
      alert('Aktion fehlgeschlagen.');
    } finally {
      actingOn = null;
    }
  }

  onMount(() => {
    if (auth.adminChecked && auth.isAdmin) void load();
  });

  $effect(() => {
    if (auth.adminChecked && auth.isAdmin) void load();
  });

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
</script>

<Container>
  <section class="py-12 md:py-16">
    <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
      Foto-Wall
    </p>
    <h1
      class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
      style="font-size: clamp(2rem, 5vw, 3rem);"
    >
      Reports
    </h1>

    {#if loading}
      <p class="mt-10 text-fg-muted">…</p>
    {:else if items.length === 0}
      <div class="mt-10 border-l-4 border-success bg-surface p-6">
        <p
          class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-success"
        >
          Keine offenen Reports.
        </p>
        <p class="mt-2 text-sm text-fg-muted">Die Community ist anständig.</p>
      </div>
    {:else}
      <ul class="mt-10 space-y-4">
        {#each items as report (report.id)}
          <li
            class="grid gap-4 border-2 border-border bg-surface p-4 sm:grid-cols-[120px_1fr_auto] sm:items-start"
          >
            {#if report.post_image_url}
              <a
                href={`/wall`}
                class="block aspect-square w-full overflow-hidden border-2 border-border sm:w-[120px]"
              >
                <img
                  src={report.post_image_url}
                  alt=""
                  loading="lazy"
                  class="h-full w-full object-cover"
                />
              </a>
            {:else}
              <div
                class="flex aspect-square w-full items-center justify-center border-2 border-danger bg-bg font-mono text-xs text-danger sm:w-[120px]"
              >
                Post weg
              </div>
            {/if}

            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                {#if report.post_status}
                  <span
                    class="px-2 py-0.5 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)]"
                    class:bg-accent={report.post_status === 'approved'}
                    class:text-fg-inverse={report.post_status === 'approved' ||
                      report.post_status === 'rejected'}
                    class:bg-fg-muted={report.post_status === 'pending'}
                    class:bg-danger={report.post_status === 'rejected'}
                  >
                    Post: {report.post_status}
                  </span>
                {/if}
                <span
                  class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                >
                  gemeldet {formatDate(report.created_at)} von {report.reporter_name ?? 'Anonym'}
                </span>
              </div>
              <p class="mt-3 border-l-2 border-danger pl-3 text-sm italic text-fg">
                „{report.reason}"
              </p>
              {#if report.post_caption}
                <p
                  class="mt-3 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                >
                  Caption: {report.post_caption}
                </p>
              {/if}
            </div>

            <div class="flex flex-col gap-2 sm:items-end">
              {#if report.post_status === 'approved' || report.post_status === 'pending'}
                <button
                  type="button"
                  onclick={() => rejectPostFromReport(report)}
                  disabled={actingOn === report.id}
                  class="border-2 border-danger bg-danger px-4 py-2 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg transition-all active:scale-95 disabled:opacity-50"
                >
                  Post ablehnen
                </button>
              {/if}
              <button
                type="button"
                onclick={() => dismissReport(report)}
                disabled={actingOn === report.id}
                class="border-2 border-border bg-bg px-4 py-2 font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted transition-colors hover:border-fg hover:text-fg active:scale-95 disabled:opacity-50"
              >
                Verwerfen
              </button>
            </div>
          </li>
        {/each}
      </ul>

      <p
        class="mt-6 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
      >
        {items.length} Reports gezeigt (max. 100)
      </p>
    {/if}
  </section>
</Container>
