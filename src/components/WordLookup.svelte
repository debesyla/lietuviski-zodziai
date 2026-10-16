<script lang="ts">
  let {
    id,
    label,
    value = $bindable(''),
    placeholder = '',
    submitLabel = 'Ieškoti',
    busy = false,
    hint = '',
    examples = [],
    onsearch
  }: {
    id: string;
    label: string;
    value?: string;
    placeholder?: string;
    submitLabel?: string;
    busy?: boolean;
    hint?: string;
    examples?: string[];
    onsearch: (value: string) => void;
  } = $props();

  function submit(event: SubmitEvent) {
    event.preventDefault();
    onsearch(value);
  }

  function useExample(example: string) {
    value = example;
    onsearch(example);
  }
</script>

<form class="lookup" onsubmit={submit}>
  <label for={id}>{label}</label>
  <div class="lookup-row">
    <input {id} type="text" bind:value autocomplete="off" spellcheck="false" {placeholder} />
    <button type="submit" class="primary-button" disabled={busy}>{busy ? 'Ieškoma…' : submitLabel}</button>
  </div>
  {#if hint}<p class="note">{hint}</p>{/if}
  {#if examples.length > 0}
    <p class="note examples">
      <span>Pavyzdžiai:</span>
      {#each examples as example, index}
        {#if index > 0}<span class="inline-separator" aria-hidden="true">//</span>{/if}
        <button type="button" class="text-button" onclick={() => useExample(example)}>{example}</button>
      {/each}
    </p>
  {/if}
</form>

<style>
  .lookup { display: grid; gap: .5rem; grid-template-columns: minmax(0, 1fr); }
  .lookup > * { margin: 0; }
  label { font-weight: 700; }
  .lookup-row { align-items: stretch; display: flex; gap: 1rem; }
  .lookup-row button { flex: none; }
  .examples { align-items: baseline; display: flex; flex-wrap: wrap; gap: .25rem .5rem; }
</style>
