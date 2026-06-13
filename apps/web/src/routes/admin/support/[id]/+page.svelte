<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { Container, Button } from '@energize/ui';
  import { auth } from '$lib/auth.svelte';

  const ticketId = $derived(page.params.id);

  interface TicketRow {
    id: string;
    subject: string;
    category: string | null;
    status: 'open' | 'in_progress' | 'answered' | 'closed';
    created_at: string;
    updated_at: string;
    user_id: string;
  }
  interface MessageRow {
    id: string;
    author_id: string;
    body: string;
    is_staff: boolean;
    created_at: string;
  }
  interface AuthorInfo {
    email: string;
    display_name: string | null;
    phone: string | null;
  }

  let ticket = $state<TicketRow | null>(null);
  let messages = $state<MessageRow[]>([]);
  let authorInfo = $state<AuthorInfo | null>(null);
  let loading = $state(true);
  let errorMsg = $state<string | null>(null);

  let replyBody = $state('');
  let replying = $state(false);
  let replyError = $state<string | null>(null);
  let actingStatus = $state(false);

  // Antwort-Vorlagen (Energize-spezifisch). Variablen mit {{name}} werden
  // im UI ersetzt vor dem Senden.
  interface Template {
    label: string;
    body: string;
  }
  const templates: Template[] = [
    {
      label: 'Tickets · Wo finde ich meine Bestellung?',
      body: 'Hi {{name}},\n\nDeine Bestellung läuft direkt über tickee. Loginbei shop.tickee.de mit der E-Mail, mit der du gekauft hast. Falls das nicht klappt, schreib uns nochmal mit Ticket-Nr.\n\nViele Grüße,\nEnergize Crew',
    },
    {
      label: 'Cashless · Restguthaben-Auszahlung',
      body: 'Hi {{name}},\n\nRestguthaben auf dem Cashless-Wristband wird nach dem Festival automatisch innerhalb von 30 Tagen auf das Konto zurückgebucht, von dem du aufgeladen hast.\n\nViele Grüße,\nEnergize Crew',
    },
    {
      label: 'Account · Magic-Link kommt nicht an',
      body: 'Hi {{name}},\n\nbitte schau einmal im Spam- bzw. Junk-Ordner nach. Der Absender ist energize@blackout42.de. Falls dort auch nichts: schick uns deine E-Mail nochmal kurz, wir prüfen es manuell.\n\nViele Grüße,\nEnergize Crew',
    },
    {
      label: 'Foto-Wall · Beitrag wurde abgelehnt',
      body: 'Hi {{name}},\n\ndein Foto-Wall-Beitrag wurde leider abgelehnt. Häufige Gründe: andere Personen sind klar erkennbar ohne sichtbares Einverständnis, oder das Foto stammt nicht vom Energize-Festival. Du kannst jederzeit ein neues Foto hochladen.\n\nViele Grüße,\nEnergize Crew',
    },
    {
      label: 'Allgemein · Wir melden uns mit Update',
      body: 'Hi {{name}},\n\ndanke für deine Nachricht. Wir schauen uns das an und melden uns sobald wir mehr wissen.\n\nViele Grüße,\nEnergize Crew',
    },
    {
      label: 'Allgemein · Erledigt-Bestätigung',
      body: 'Hi {{name}},\n\nwir haben das in deinem Sinne gelöst. Falls noch etwas offen ist, einfach hier antworten.\n\nViele Grüße,\nEnergize Crew',
    },
  ];

  async function load() {
    const client = auth.client;
    if (!client || !ticketId) return;
    loading = true;
    errorMsg = null;
    try {
      const { data: t, error: tErr } = await client
        .from('support_tickets')
        .select('id, subject, category, status, created_at, updated_at, user_id')
        .eq('id', ticketId)
        .maybeSingle();
      if (tErr) throw tErr;
      if (!t) {
        errorMsg = 'Ticket nicht gefunden.';
        return;
      }
      ticket = t as TicketRow;

      const { data: m, error: mErr } = await client
        .from('support_messages')
        .select('id, author_id, body, is_staff, created_at')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (mErr) throw mErr;
      messages = (m ?? []) as MessageRow[];

      // Author-Info via admin_list_users() abrufen (filtert sich selbst)
      const { data: usersList } = await client.rpc('admin_list_users');
      const author = (usersList ?? []).find(
        (u: { id: string }) => u.id === (t as TicketRow).user_id,
      );
      if (author) {
        authorInfo = {
          email: author.email,
          display_name: author.display_name,
          phone: author.phone,
        };
      }
    } catch (err) {
      console.error('[admin/support/detail] load failed', err);
      errorMsg = err instanceof Error ? err.message : 'unknown';
    } finally {
      loading = false;
    }
  }

  function applyTemplate(t: Template) {
    const name = authorInfo?.display_name ?? authorInfo?.email?.split('@')[0] ?? 'Energizer';
    replyBody = t.body.replace(/\{\{name\}\}/g, name);
  }

  async function sendReply(event: SubmitEvent) {
    event.preventDefault();
    if (replying) return;
    replyError = null;
    const body = replyBody.trim();
    if (!body) {
      replyError = 'Bitte Antwort eingeben.';
      return;
    }
    const client = auth.client;
    const user = auth.user;
    if (!client || !user || !ticket) return;
    replying = true;
    try {
      const { error } = await client.from('support_messages').insert({
        ticket_id: ticket.id,
        author_id: user.id,
        body,
        is_staff: true,
      });
      if (error) throw error;
      replyBody = '';
      await load();
    } catch (err) {
      console.error('[admin/support/detail] reply failed', err);
      replyError = err instanceof Error ? err.message : 'Senden fehlgeschlagen';
    } finally {
      replying = false;
    }
  }

  async function setClosed(closed: boolean) {
    const client = auth.client;
    if (!client || !ticket) return;
    actingStatus = true;
    try {
      if (closed) {
        const { error } = await client.rpc('admin_close_ticket', {
          target_ticket_id: ticket.id,
        });
        if (error) throw error;
      } else {
        const { error } = await client.rpc('admin_reopen_ticket', {
          target_ticket_id: ticket.id,
        });
        if (error) throw error;
      }
      await load();
    } catch (err) {
      console.error('[admin/support/detail] status failed', err);
      alert(`Status-Wechsel fehlgeschlagen: ${err instanceof Error ? err.message : ''}`);
    } finally {
      actingStatus = false;
    }
  }

  onMount(() => {
    if (auth.adminChecked && auth.isAdmin && ticketId) void load();
  });
  $effect(() => {
    if (auth.adminChecked && auth.isAdmin && ticketId) void load();
  });

  function fmtDate(iso: string): string {
    return new Date(iso).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function statusClass(s: TicketRow['status']): string {
    if (s === 'answered') return 'border-accent bg-accent text-fg-inverse';
    if (s === 'open') return 'border-danger text-danger';
    if (s === 'in_progress') return 'border-fg-muted text-fg';
    return 'border-border text-fg-muted';
  }
</script>

<Container size="md">
  <section class="py-12 md:py-16">
    <a
      href="/admin/support"
      class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted transition-colors hover:text-accent"
    >
      ← Zurück zur Inbox
    </a>

    {#if loading}
      <p class="mt-8 text-fg-muted">…</p>
    {:else if errorMsg}
      <p class="mt-8 text-danger">{errorMsg}</p>
    {:else if ticket}
      <div class="mt-6 grid gap-6 md:grid-cols-[1fr_280px]">
        <!-- Hauptbereich -->
        <div>
          <div class="flex items-start justify-between gap-3">
            <h1
              class="font-display font-black uppercase leading-[0.95] tracking-[-0.02em] text-fg"
              style="font-size: clamp(1.75rem, 4vw, 2.5rem);"
            >
              {ticket.subject}
            </h1>
            <span
              class="shrink-0 border-2 px-2 py-1 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] {statusClass(
                ticket.status,
              )}"
            >
              {ticket.status}
            </span>
          </div>
          <p
            class="mt-2 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
          >
            Erstellt {fmtDate(ticket.created_at)} · Letzte Aktivität {fmtDate(ticket.updated_at)}
            {#if ticket.category}
              · {ticket.category}
            {/if}
          </p>

          <!-- Verlauf -->
          <ul class="mt-8 space-y-3">
            {#each messages as msg (msg.id)}
              <li>
                <article
                  class="border-2 p-4"
                  class:border-accent={msg.is_staff}
                  class:bg-bg={msg.is_staff}
                  class:border-border={!msg.is_staff}
                  class:bg-surface={!msg.is_staff}
                >
                  <div class="flex items-baseline justify-between gap-2">
                    <p
                      class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)]"
                      class:text-accent={msg.is_staff}
                      class:text-fg-muted={!msg.is_staff}
                    >
                      {msg.is_staff ? '⚡ Energize Crew' : (authorInfo?.display_name ?? 'User')}
                    </p>
                    <p
                      class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-fg-muted"
                    >
                      {fmtDate(msg.created_at)}
                    </p>
                  </div>
                  <p class="mt-3 whitespace-pre-line text-sm leading-relaxed text-fg">
                    {msg.body}
                  </p>
                </article>
              </li>
            {/each}
          </ul>

          <!-- Antwort-Form -->
          {#if ticket.status !== 'closed'}
            <form onsubmit={sendReply} class="mt-8 border-2 border-accent bg-surface p-5 space-y-4">
              <label class="block">
                <span
                  class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent"
                >
                  ⚡ Antwort als Energize Crew
                </span>
                <textarea
                  bind:value={replyBody}
                  rows="8"
                  maxlength="4000"
                  disabled={replying}
                  placeholder="Antwort schreiben oder Vorlage rechts wählen …"
                  class="mt-2 w-full border-2 border-border bg-bg px-4 py-3 font-mono text-base text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
                ></textarea>
              </label>
              {#if replyError}
                <p class="text-sm text-danger" role="alert">{replyError}</p>
              {/if}
              <div class="flex flex-wrap items-center gap-3">
                <Button type="submit" variant="yellow">
                  {replying ? 'Sende …' : 'Senden + Mail-Notif'}
                </Button>
                <Button variant="ghost" onclick={() => setClosed(true)} disabled={actingStatus}>
                  Ticket schließen
                </Button>
              </div>
              <p class="text-xs text-fg-muted">
                Mail an {authorInfo?.email ?? '…'} wird per Trigger in outbound_emails queued. Tatsächlicher
                SMTP-Versand kommt mit Phase 9 (Edge Function).
              </p>
            </form>
          {:else}
            <div class="mt-8 border-l-4 border-fg-muted bg-surface p-4">
              <p class="text-sm text-fg-muted">
                Ticket geschlossen am {fmtDate(ticket.updated_at)}.
              </p>
              <div class="mt-3">
                <Button variant="ghost" onclick={() => setClosed(false)} disabled={actingStatus}>
                  Wieder öffnen
                </Button>
              </div>
            </div>
          {/if}
        </div>

        <!-- Seitenleiste: Vorlagen + Author-Info -->
        <aside class="space-y-6">
          <!-- Author -->
          {#if authorInfo}
            <div class="border-2 border-border bg-surface p-4">
              <p
                class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-accent"
              >
                User
              </p>
              <p
                class="mt-2 font-display text-base font-black uppercase tracking-[var(--tracking-claim)] text-fg"
              >
                {authorInfo.display_name ?? '—'}
              </p>
              <p class="mt-1 break-all font-mono text-xs text-fg">{authorInfo.email}</p>
              {#if authorInfo.phone}
                <p class="mt-1 font-mono text-xs text-fg-muted">
                  📞
                  <a href={`tel:${authorInfo.phone}`} class="hover:text-accent"
                    >{authorInfo.phone}</a
                  >
                </p>
              {/if}
              <a
                href={`/u/${ticket.user_id}`}
                class="mt-3 inline-block font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-accent hover:underline"
              >
                Profil ansehen →
              </a>
            </div>
          {/if}

          <!-- Vorlagen -->
          {#if ticket.status !== 'closed'}
            <div class="border-2 border-border bg-surface p-4">
              <p
                class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-accent"
              >
                Vorlagen
              </p>
              <p class="mt-1 text-xs text-fg-muted">
                Klick übernimmt Text. <code>&#123;&#123;name&#125;&#125;</code> wird durch Displayname
                ersetzt.
              </p>
              <ul class="mt-3 space-y-2">
                {#each templates as tmpl (tmpl.label)}
                  <li>
                    <button
                      type="button"
                      onclick={() => applyTemplate(tmpl)}
                      class="w-full border-2 border-border bg-bg px-3 py-2 text-left font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg-muted transition-colors hover:border-accent hover:text-accent"
                    >
                      {tmpl.label}
                    </button>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </aside>
      </div>
    {/if}
  </section>
</Container>
