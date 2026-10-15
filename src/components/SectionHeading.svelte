<script lang="ts">
  import type { Snippet } from 'svelte';

  let { level = 2, id, children }: { level?: 2 | 3; id?: string; children: Snippet } = $props();
</script>

<svelte:element this={`h${level}`} {id} class="dago-section-heading"><span aria-hidden="true">//</span>{' '}{@render children()}</svelte:element>

<style>
  /* The dimmed // label used on dago.lt; spacing belongs to the container. */
  .dago-section-heading { margin: 0; opacity: .2; }
</style>
