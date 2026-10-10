<script lang="ts">
  let { rows, unit }: { rows: { label: string; value: number | null }[]; unit: string } = $props();
  const maximum = $derived(Math.max(1, ...rows.map((row) => row.value ?? 0)));
  function format(value: number | null) {
    if (value === null) return 'Neaptikta';
    if (value > 0 && value < 0.01) return '<0,01';
    return value.toLocaleString('lt-LT', { maximumFractionDigits: 2 });
  }
</script>

<div class="rates" role="list" aria-label={unit}>
  {#each rows as row}
    <div class="rate" role="listitem" aria-label={`${row.label}: ${format(row.value)}`}>
      <span class="label">{row.label}</span>
      <span class="track" aria-hidden="true"><span class="bar" style:width={`${(row.value ?? 0) / maximum * 100}%`}></span></span>
      <span class="value">{format(row.value)}</span>
    </div>
  {/each}
</div>

<style>
  .rates { display: grid; gap: .75rem; min-width: 0; }
  .rate { display: grid; grid-template-columns: minmax(10ch, 22ch) minmax(0, 1fr) 10ch; align-items: center; gap: 1rem; }
  .label { overflow-wrap: anywhere; }
  .track { background: hsl(var(--theme) / .12); height: .875rem; }
  .bar { display: block; height: 100%; background: hsl(var(--theme)); }
  .value { text-align: right; font-variant-numeric: tabular-nums; }
  @media (max-width: 36rem) {
    .rate { grid-template-columns: minmax(0, 1fr) 10ch; gap: .375rem 1rem; }
    .label { grid-column: 1; }
    .value { grid-column: 2; grid-row: 1; }
    .track { grid-column: 1 / -1; grid-row: 2; }
  }
</style>
