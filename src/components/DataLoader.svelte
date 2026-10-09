<script lang="ts">
  import { loadDataset, type Dataset } from '$lib/data';
  import { filterWords, paginate, RESULTS_PER_PAGE, sortWords } from '$lib/utils';
  import type { WordSortKey } from '$lib/utils';
  import { t } from '$lib/translations';
  import SearchBar from './SearchBar.svelte';
  import DataTable from './DataTable.svelte';
  import DownloadButton from './DownloadButton.svelte';
  import FrequencyDashboard from './FrequencyDashboard.svelte';

  let { filename, datasets = [], selectedDatasetId = '', onselectDataset = () => {} } = $props<{
    filename: string;
    datasets?: { id: string; title: string; year: number }[];
    selectedDatasetId?: string;
    onselectDataset?: (event: Event) => void;
  }>();

  let dataset = $state<Dataset | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let searchQuery = $state('');
  let appliedSearchQuery = $state('');
  let searchPending = $state(false);
  let selectedTypes = $state<string[]>([]);
  let sortKey = $state<WordSortKey>('frequency');
  let sortAsc = $state(false);
  let currentPage = $state(1);

  let uniqueTypes = $derived((dataset
    ? [...new Set(dataset.words.map((word) => word.type).filter((type): type is string => type !== undefined))]
    : []).sort((a,b) => (dataset?.provenance.partOfSpeech?.labels[a] ?? a).localeCompare(dataset?.provenance.partOfSpeech?.labels[b] ?? b, 'lt')));

  let typeLabels = $derived(dataset?.provenance.partOfSpeech?.labels ?? {});

  let filteredWords = $derived(dataset?.words ? filterWords(dataset.words, appliedSearchQuery, selectedTypes) : []);

  let rankedFilteredWords = $derived(sortWords(filteredWords, 'frequency', false).map((word, index) => ({ ...word, rank: index + 1 })));

  let sortedFilteredWords = $derived(sortWords(rankedFilteredWords, sortKey, sortAsc));

  let resultPage = $derived(paginate(sortedFilteredWords, currentPage));

  let hasActiveFilters = $derived(selectedTypes.length > 0);

  function clearFilters() {
    selectedTypes = [];
  }

  function previousPage() {
    currentPage = Math.max(1, resultPage.currentPage - 1);
  }

  function nextPage() {
    currentPage = Math.min(resultPage.totalPages, resultPage.currentPage + 1);
  }

  $effect(() => {
    let cancelled = false;
    loading = true;
    error = null;
    dataset = null;
    loadDataset(filename).then((d) => {
      if (cancelled) return;
      dataset = d;
      loading = false;
    }).catch((err) => {
      if (cancelled) return;
      error = err instanceof Error ? err.message : String(err);
      loading = false;
    });

    return () => {
      cancelled = true;
    };
  });

  // Filters describe a dataset-specific exploration. Keeping them when the
  // source changes can make a valid dataset look empty.
  $effect(() => {
    if (!filename) return;
    searchQuery = '';
    appliedSearchQuery = '';
    searchPending = false;
    selectedTypes = [];
    sortKey = 'frequency';
    sortAsc = false;
    currentPage = 1;
  });

  $effect(() => {
    const query = searchQuery;
    searchPending = query !== appliedSearchQuery;
    const timer = window.setTimeout(() => {
      appliedSearchQuery = query;
      searchPending = false;
    }, 150);
    return () => window.clearTimeout(timer);
  });

  $effect(() => {
    appliedSearchQuery;
    selectedTypes;
    sortKey;
    sortAsc;
    dataset?.id;
    currentPage = 1;
  });
</script>

    <section class="search-panel" aria-label="Žodžių paieška">
      {#if datasets.length}
        <div class="source-control">
          <label for="dataset-select">Šaltinis</label>
          <select id="dataset-select" value={selectedDatasetId} onchange={onselectDataset}>
            {#each datasets as source}<option value={source.id}>{source.title} ({source.year})</option>{/each}
          </select>
        </div>
      {/if}
      <div class="search-and-clear">
        <SearchBar bind:value={searchQuery} />
      </div>
      {#if searchPending}
        <p class="updating-results" role="status" aria-live="polite">{t('updatingResults')}</p>
      {/if}
      {#if uniqueTypes.length > 0}
        <details class="type-filter">
          <summary>Filtrai{#if selectedTypes.length > 0}{' '}({selectedTypes.length}){/if}</summary>
          {#if dataset && dataset.provenance.partOfSpeech}
            <p class="type-note">{t('posScheme')}: {dataset.provenance.partOfSpeech.name}</p>
          {/if}
          <div class="type-options">
            {#each uniqueTypes as type}
              <label>
                <input
                  type="checkbox"
                  bind:group={selectedTypes}
                  value={type}
                  aria-label={typeLabels[type] ? `${typeLabels[type]} (${type})` : type}
                />
                <span>{typeLabels[type] ?? type}{#if typeLabels[type]}&nbsp;({type}){/if}</span>
              </label>
            {/each}
            {#if hasActiveFilters}<button onclick={clearFilters} class="clear-filters text-button">{t('clearFilters')}</button>{/if}
          </div>
        </details>
      {/if}
    </section>

{#if loading}
  <div class="loading" role="status" aria-live="polite">{t('loading')}</div>
{:else if error}
  <div class="error" role="alert">
    <h3>{t('errorLoadingData')}</h3>
    <p>{error}</p>
  </div>
{:else if dataset}
  <article class="dataset">


    {#if sortedFilteredWords.length > 0}
      <FrequencyDashboard words={filteredWords} typeLabels={typeLabels} />
    {/if}

    <div class="table-container">
      {#if sortedFilteredWords.length === 0}
        <p class="empty-state" role="status" aria-live="polite">{t('noMatchingWords')}</p>
      {:else}
        {#key filename}
          <div class="result-toolbar">
            <p class="result-count" role="status" aria-live="polite">{t('showingResults', { start: resultPage.start.toLocaleString('lt-LT'), end: resultPage.end.toLocaleString('lt-LT'), total: sortedFilteredWords.length.toLocaleString('lt-LT') })}</p>
            <DownloadButton
              words={sortedFilteredWords}
              metadata={{ id: dataset.id, title: dataset.title, author: dataset.author, year: dataset.year }}
              exploration={{ query: appliedSearchQuery, types: selectedTypes, sortKey, sortAsc }}
            />
          </div>
          <DataTable words={resultPage.items} typeLabels={typeLabels} bind:sortKey bind:sortAsc />
        {/key}
        {#if resultPage.totalPages > 1}
          <nav class="pagination" aria-label={t('pagination')}>
            <button class="text-button" onclick={previousPage} disabled={resultPage.currentPage === 1}>{t('previousPage')}</button>
            <span>{t('pageOf', { page: resultPage.currentPage, total: resultPage.totalPages })}</span>
            <button class="text-button" onclick={nextPage} disabled={resultPage.currentPage === resultPage.totalPages}>{t('nextPage')}</button>
          </nav>
        {/if}
      {/if}
    </div>
    <details class="source-metadata"><summary>Apie šaltinį</summary><div class="source-body">
      <dl class="dataset-facts">
        <div><dt>{t('author')}</dt><dd>{dataset.author}</dd></div>
        <div><dt>{t('year')}</dt><dd>{dataset.year}</dd></div>
        <div><dt>{t('entryKind')}</dt><dd>{dataset.entryKind === 'lemma' ? t('lemma') : t('wordform')}</dd></div>
        {#if dataset.provenance.licence}
          <div><dt>{t('licence')}</dt><dd>{dataset.provenance.licence}</dd></div>
        {/if}
      </dl>
      {#if dataset.provenance.citation}<p>{dataset.provenance.citation}</p>{/if}
      {#if dataset.provenance.sourceUrl}<p><a href={dataset.provenance.sourceUrl} target="_blank" rel="noreferrer">Atverti pirminį šaltinį</a></p>{/if}
    </div></details>


  </article>
{/if}

<style>
.dataset { display: grid; gap: 1.5rem; min-width: 0; width: 100%; }
.search-panel { display: grid; grid-template-columns: minmax(0,1.35fr) minmax(0,1fr) auto; gap: 1rem; align-items: end; margin-bottom: 1.5rem; }
.source-control { min-width: 0; }
.source-control label { display: block; font-size: .875rem; margin-bottom: .5rem; }
.source-control select { width: 100%; height: 44px; }
.type-filter { position: relative; min-width: 0; }
.type-filter summary { white-space: nowrap; min-height: 42px; padding: .5rem .75rem; }
.type-filter[open] .type-options { position: absolute; top: 100%; right: 0; width: min(32rem,80vw); background: hsl(var(--black)); border: 1px solid hsl(var(--theme) / .35); z-index: 2; }
.type-note { display: none; }
.updating-results { grid-column: 1 / -1; }
.search-and-clear { min-width: 0; }
.type-options { display: flex; flex-wrap: wrap; gap: 0 1.5rem; padding: .5rem 1rem; }
.type-options label { display: flex; align-items: center; gap: .25rem; min-height: 44px; }
.type-note { padding: .75rem 1rem 0; font-size: .875rem; color: var(--muted-color); }
.table-container { min-width: 0; width: 100%; }
.result-toolbar { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .5rem 1rem; margin-bottom: .75rem; }
.result-count, .updating-results { font-size: .875rem; color: var(--muted-color); }
.pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-start; gap: .75rem; margin-top: 1rem; }
.source-metadata { max-width: 75ch; }
.source-body { padding: 1rem; }
.dataset-facts { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 1rem; margin-bottom: 1rem; }
.dataset-facts dt { font-size: .875rem; color: var(--muted-color); }
.dataset-facts dd { margin: 0; overflow-wrap: anywhere; }
@media(max-width:50rem) { .search-panel { grid-template-columns: 1fr; } .type-filter[open] .type-options { position: static; width: auto; border: 0; } }
</style>
