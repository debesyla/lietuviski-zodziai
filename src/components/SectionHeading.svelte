<script lang="ts">
  import type { Snippet } from 'svelte';

  let { level = 2, id, children }: { level?: 2 | 3; id?: string; children: Snippet } = $props();
</script>

<svelte:element this={`h${level}`} {id} class="dago-section-heading"><span class="slashes" aria-hidden="true">//</span>{' '}{@render children()}</svelte:element>

<style>
  /* Heading text stays at full contrast; only the decorative // keeps the dimmed dago.lt look.
     Spacing belongs to the container. */
  .dago-section-heading { margin: 0; }
  .slashes { opacity: .35; }
</style>
