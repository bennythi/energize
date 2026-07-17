<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  // Neutrale Default-Instanz: Start fuehrt direkt in den Ticketshop.
  onMount(() => void goto('/shop', { replaceState: true }));
</script>

<svelte:head>
  <title>Ticketshop</title>
</svelte:head>

<div class="flex min-h-[60vh] items-center justify-center">
  <p class="text-fg-muted">…</p>
</div>
