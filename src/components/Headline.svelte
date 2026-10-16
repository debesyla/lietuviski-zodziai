<script lang="ts">
  // A large figure with one plain sentence under it, like the generated code on dago.lt/irankiai/asmens-kodai.
  let { figure, text, note = '' }: { figure: string; text: string; note?: string } = $props();
</script>

<div class="headline">
  <p class="headline-figure">{figure}</p>
  <p class="headline-text">{text}</p>
  {#if note}<p class="note">{note}</p>{/if}
</div>

<style>
  .headline { display: grid; gap: .25rem; grid-template-columns: minmax(0, 1fr); }
  .headline > * { margin: 0; }
  .headline-figure { font-size: clamp(2.5rem, 9vw, 3.5rem); font-variant-numeric: tabular-nums; font-weight: 700; line-height: 1; }
  .headline-text { font-size: 1.125rem; font-weight: 700; }
</style>
