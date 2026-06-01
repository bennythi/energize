<script lang="ts">
  interface Link {
    label: string;
    href: string;
  }

  interface Props {
    links?: Link[];
    socials?: Link[];
    copyright?: string;
  }

  let {
    links = [],
    socials = [],
    copyright = `© ${new Date().getFullYear()} ENERGIZE Festival`,
  }: Props = $props();
</script>

<footer class="border-t border-border bg-bg py-12 text-fg-muted">
  <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
    <div class="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
      {#if socials.length}
        <ul class="flex items-center gap-6">
          {#each socials as social}
            <li>
              <a
                href={social.href}
                target="_blank"
                rel="noopener"
                class="text-fg transition-colors hover:text-fg-muted"
              >
                {social.label}
              </a>
            </li>
          {/each}
        </ul>
      {/if}

      {#if links.length}
        <ul class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          {#each links as link}
            <li>
              <a href={link.href} class="transition-colors hover:text-fg">
                {link.label}
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <p class="mt-8 text-center text-xs uppercase tracking-[var(--tracking-claim)]">
      {copyright}
    </p>
  </div>
</footer>
