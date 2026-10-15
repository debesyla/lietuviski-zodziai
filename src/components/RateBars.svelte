<script lang="ts">
  type Row = { label: string; value: number | null };

  let {
    rows,
    unit,
    format = formatRate,
    max
  }: { rows: Row[]; unit: string; format?: (value: number | null) => string; max?: number } = $props();

  const maximum = $derived(max ?? Math.max(1, ...rows.map((row) => row.value ?? 0)));
  // Short labels keep one row per bar on phones; long labels get their own line.
  const short = $derived(rows.every((row) => row.label.length <= 14));

  function formatRate(value: number | null) {
    if (value === null) return 'Neaptikta';
    if (value > 0 && value < 0.01) return '<0,01';
    return value.toLocaleString('lt-LT', { maximumFractionDigits: 2 });
  }
</script>

<div class="rates" class:short role="list" aria-label={unit}>
  {#each rows as row}
    <div class="rate" role="listitem" aria-label={`${row.label}: ${format(row.value)}`}>
      <span class="label">{row.label}</span>
      <span class="track" aria-hidden="true"><span class="bar" style:width={`${Math.min(1, (row.value ?? 0) / maximum) * 100}%`}></span></span>
      <span class="value" class:absent={row.value === null}>{format(row.value)}</span>
    </div>
  {/each}
</div>

<style>
  .rates { display: grid; gap: .5rem; min-width: 0; }
  .rate { align-items: center; display: grid; gap: 1rem; grid-template-columns: minmax(10ch, 22ch) minmax(0, 1fr) 10ch; }
  .short .rate { grid-template-columns: minmax(6ch, 14ch) minmax(0, 1fr) 10ch; }
  .label { overflow-wrap: anywhere; }
  .track { background: hsl(var(--theme) / .12); height: .875rem; }
  .bar { background: hsl(var(--theme)); display: block; height: 100%; }
  .value { font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
  .absent { color: hsl(var(--theme) / .7); }
  @media (max-width: 36rem) {
    .rates:not(.short) .rate { gap: .25rem 1rem; grid-template-columns: minmax(0, 1fr) auto; }
    .rates:not(.short) .track { grid-column: 1 / -1; grid-row: 2; }
    .short .rate { gap: .75rem; grid-template-columns: minmax(0, 9ch) minmax(0, 1fr) 8ch; }
  }
</style>
