<script lang="ts">
  import { toolUrl, wordLookupTools } from '$lib/research-tools';

  // Links the same word to the other research pages through their `?q=`.
  let { word, current }: { word: string; current?: string } = $props();

  const tools = $derived(wordLookupTools.filter((tool) => tool.id !== current));
</script>

{#if word.trim()}
  <nav class="note elsewhere" aria-label={`„${word}“ kituose šaltiniuose`}>
    <span>„{word}“ kitur:</span>
    {#each tools as tool, index}
      {#if index > 0}<span class="inline-separator" aria-hidden="true">//</span>{/if}
      <a href={toolUrl(tool, word)}>{tool.shortLabel}</a>
    {/each}
  </nav>
{/if}

<style>
  .elsewhere { align-items: baseline; display: flex; flex-wrap: wrap; gap: .25rem .5rem; }
</style>
