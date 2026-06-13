<script lang="ts">
  import { Container } from '@energize/ui';

  interface Tool {
    name: string;
    href: string;
    purpose: string;
    notes: string;
    access: 'team' | 'individual';
  }

  const tools: Tool[] = [
    {
      name: 'Supabase Dashboard',
      href: 'https://supabase.com/dashboard/project/zmazyriysvintuwlyzfm',
      purpose: 'Datenbank, Auth-User, Storage-Bucket "posts", RLS-Policies',
      notes:
        'Account muss vom Project-Owner per E-Mail eingeladen werden. Free-Tier reicht für 1–5 Team-Mitglieder.',
      access: 'individual',
    },
    {
      name: 'Sanity Studio',
      href: 'https://oxliq7rf.sanity.studio',
      purpose: 'Lineup, Artist-Schemas, FAQ, POIs, Site-Settings',
      notes:
        'Sanity-Account nötig — Login mit Google/GitHub/E-Mail. Project-Admin muss als Editor einladen.',
      access: 'individual',
    },
    {
      name: 'Sanity Manage',
      href: 'https://www.sanity.io/manage/project/oxliq7rf',
      purpose: 'CORS, API-Tokens, Mitglieder verwalten',
      notes: 'Nur für Project-Admin sichtbar — Mitarbeiter brauchen das nicht.',
      access: 'individual',
    },
    {
      name: 'Tickee Shop',
      href: 'https://shop.tickee.de/shop/84/',
      purpose: 'Ticketverkauf (Loyalty | Festivalticket 2027)',
      notes:
        'Veranstalter-Backend bei tickee mit eigenem Login. Wenn Tickee-Partner-API kommt: später hier verlinken.',
      access: 'team',
    },
    {
      name: 'GitHub Repo',
      href: 'https://github.com/bennythi/energize',
      purpose: 'Source-Code, Issues, PRs, Deploy-Workflows',
      notes:
        'GitHub-Account nötig. Push-Rechte nur für Maintainer (bennythi). Lesezugriff ist public.',
      access: 'individual',
    },
    {
      name: 'Sentry / Logs',
      href: '#',
      purpose: 'Error-Tracking, Performance-Monitoring',
      notes: 'Noch nicht eingerichtet — kommt vor Festival 2027.',
      access: 'team',
    },
  ];
</script>

<Container>
  <section class="py-12 md:py-16">
    <p class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-accent">
      Externe Tools
    </p>
    <h1
      class="mt-3 font-display font-black uppercase leading-[0.9] tracking-[-0.02em] text-fg"
      style="font-size: clamp(2rem, 5vw, 3rem);"
    >
      Admin-Werkzeuge
    </h1>
    <p class="mt-4 max-w-2xl text-sm text-fg-muted md:text-base">
      Alle externen Dienste, die dieser Live-Site zugrunde liegen. Jeder Service braucht einen
      <strong class="text-fg">eigenen Account</strong> — die Energize-Account-Logins funktionieren
      <strong class="text-fg">nicht</strong> für diese externen Tools.
    </p>

    <ul class="stagger-list mt-10 grid gap-4 md:grid-cols-2">
      {#each tools as tool (tool.name)}
        <li>
          <a
            href={tool.href}
            target="_blank"
            rel="noopener"
            class="card-press flex h-full flex-col border-2 border-border bg-surface p-5"
          >
            <div class="flex items-start justify-between gap-3">
              <h2
                class="font-display text-xl font-black uppercase tracking-[var(--tracking-claim)] text-fg"
              >
                {tool.name}
              </h2>
              <span
                class="shrink-0 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[var(--tracking-claim)]"
                class:bg-accent={tool.access === 'team'}
                class:text-fg-inverse={tool.access === 'team'}
                class:border-2={tool.access === 'individual'}
                class:border-fg-muted={tool.access === 'individual'}
                class:text-fg-muted={tool.access === 'individual'}
              >
                {tool.access === 'team' ? 'Team-Login' : 'Individual'}
              </span>
            </div>

            <p class="mt-3 text-sm text-fg-muted">{tool.purpose}</p>

            <p class="mt-auto pt-4 border-t border-border text-xs leading-relaxed text-fg-muted">
              {tool.notes}
            </p>

            <p
              class="mt-3 truncate font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-accent"
            >
              {tool.href.replace(/^https?:\/\//, '')} ↗
            </p>
          </a>
        </li>
      {/each}
    </ul>

    <div class="mt-12 border-l-4 border-accent bg-surface p-5">
      <p class="font-mono text-[10px] uppercase tracking-[var(--tracking-claim)] text-accent">
        Wer kümmert sich um Zugänge?
      </p>
      <p class="mt-2 text-sm leading-relaxed text-fg">
        Schreib an <a href="mailto:benjamin.thiel@outlook.com" class="text-accent hover:underline"
          >benjamin.thiel@outlook.com</a
        > — Founder bringt dich zu den Services, die du brauchst. Bei Sanity kann er dich direkt als Editor
        einladen.
      </p>
    </div>
  </section>
</Container>
