<script lang="ts">
  import { toolUrl, wordLookupTools } from '$lib/research-tools';

  // Links the same word to the other research pages through their `?q=`,
  // grouped by what each page searches, so a lemma is never passed off as a form.
  let { word, current }: { word: string; current?: string } = $props();

  const units = ['žodžio forma', 'lema'] as const;
  const groups = $derived(units
    .map((unit) => ({ unit, tools: wordLookupTools.filter((tool) => tool.unit === unit && tool.id !== current) }))
    .filter((group) => group.tools.length > 0));
</script>

{#if word.trim()}
  <nav class="note elsewhere" aria-label={`„${word}“ kituose šaltiniuose`}>
    <span>„{word}“ kitur</span>
    {#each groups as group, groupIndex (group.unit)}
      <span class="group">
        <span>kaip {group.unit}:</span>
        {#each group.tools as tool, index (tool.id)}
          {#if index > 0}<span class="inline-separator" aria-hidden="true">//</span>{/if}
          <span><a href={toolUrl(tool, word)}>{tool.shortLabel}</a>{#if index === group.tools.length - 1 && groupIndex < groups.length - 1}<span aria-hidden="true">;</span>{/if}</span>
        {/each}
      </span>
    {/each}
  </nav>
{/if}

<style>
  .elsewhere, .group { align-items: baseline; display: flex; flex-wrap: wrap; gap: .25rem .5rem; }
</style>
