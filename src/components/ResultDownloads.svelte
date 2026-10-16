<script lang="ts">
  // CSV first, as on the homepage list; JSON keeps the full provenance for reuse.
  let { oncsv, onjson, busy = false }: { oncsv: () => void; onjson: () => void; busy?: boolean } = $props();
</script>

<span class="result-downloads">
  <button type="button" class="text-button" disabled={busy} onclick={oncsv}>Atsisiųsti CSV</button>
  <span class="inline-separator" aria-hidden="true">//</span>
  <button type="button" class="text-button" disabled={busy} aria-label="Atsisiųsti JSON" onclick={onjson}>JSON</button>
  {#if busy}<span class="note" role="status">Ruošiamas atsisiuntimas…</span>{/if}
</span>

<style>
  .result-downloads { align-items: baseline; display: inline-flex; flex-wrap: wrap; gap: .5rem; }
</style>
