<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { homePath } from '$lib/modules';

  // Start fuehrt in den Ticketshop bzw. (ohne Shop) in den Crew-Bereich.
  onMount(() => void goto(homePath(), { replaceState: true }));
</script>

<svelte:head>
  <title>…</title>
</svelte:head>

<div class="flex min-h-[60vh] items-center justify-center">
  <p class="text-fg-muted">…</p>
</div>
