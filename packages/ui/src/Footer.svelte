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

<!-- Plakat-Strip: Schwarz auf Gelb, animated marquee feel -->
{#if plakat}
  <div class="overflow-hidden bg-accent text-fg-inverse">
    <div class="flex animate-[marquee_30s_linear_infinite] whitespace-nowrap py-4">
      {#each Array(8) as _, i (i)}
        <span
          class="mx-6 font-display font-black uppercase leading-none tracking-[var(--tracking-claim)]"
          style="font-size: clamp(1.5rem, 4vw, 3rem);"
        >
          {plakat} ·
        </span>
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
  @keyframes marquee {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }
</style>
