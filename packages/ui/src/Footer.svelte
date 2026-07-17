<script lang="ts">
  interface Link {
    label: string;
    href: string;
  }

  interface Props {
    links?: Link[];
    socials?: Link[];
    copyright?: string;
    /** Großer Plakat-Strip (NO_MAINSTREAM_SHIT) am oberen Rand */
    plakat?: string;
  }

  let {
    links = [],
    socials = [],
    copyright = `© ${new Date().getFullYear()} ENERGIZE Festival`,
    plakat = 'NO_MAINSTREAM_SHIT',
  }: Props = $props();
</script>

<!-- Plakat-Strip: Schwarz auf Gelb, animated marquee -->
{#if plakat}
  <div class="marquee-wrap bg-accent text-fg-inverse">
    <div class="marquee-track">
      <!-- Track wird zweimal gerendert für seamless -50% Loop -->
      {#each Array(2) as _, group (group)}
        <ul class="marquee-group" aria-hidden={group === 1 ? 'true' : undefined}>
          {#each Array(6) as _, i (i)}
            <li class="marquee-item">
              <span class="marquee-text">{plakat}</span>
              <span class="marquee-sep" aria-hidden="true">⚡</span>
            </li>
          {/each}
        </ul>
      {/each}
    </div>
  </div>
{/if}

<footer class="border-t border-border bg-bg py-12 text-fg-muted">
  <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
      {#if socials.length}
        <ul class="flex items-center gap-6">
          {#each socials as social (social.label)}
            <li>
              <a
                href={social.href}
                target="_blank"
                rel="noopener"
                class="font-mono text-xs uppercase tracking-[var(--tracking-claim)] text-fg transition-colors hover:text-accent"
              >
                {social.label}
              </a>
            </li>
          {/each}
        </ul>
      {/if}

      {#if links.length}
        <ul
          class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[var(--tracking-claim)]"
        >
          {#each links as link (link.label)}
            <li>
              <a href={link.href} class="transition-colors hover:text-accent">
                {link.label}
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <p class="mt-8 text-center font-mono text-[10px] uppercase tracking-[var(--tracking-claim)]">
      {copyright} · Brainchildz Event Agentur
    </p>
  </div>
</footer>

<style>
  .marquee-wrap {
    overflow: hidden;
    padding: 1rem 0;
  }
  .marquee-track {
    display: flex;
    width: max-content;
    animation: marquee 40s linear infinite;
  }
  .marquee-group {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .marquee-item {
    display: flex;
    align-items: center;
    gap: 2rem;
    padding-right: 2rem;
  }
  .marquee-text {
    font-family: var(--font-display);
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    line-height: 1;
    font-size: clamp(1.25rem, 3.5vw, 2.25rem);
  }
  .marquee-sep {
    font-size: clamp(1rem, 2.5vw, 1.5rem);
    opacity: 0.55;
  }
  @keyframes marquee {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .marquee-track {
      animation: none;
    }
  }
</style>
