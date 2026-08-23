<script lang="ts">
  import { loadDataset, type Dataset } from '$lib/data';
  import { filterWords, paginate, RESULTS_PER_PAGE, sortWords } from '$lib/utils';
  import type { WordSortKey } from '$lib/utils';
  import { t } from '$lib/translations';
  import SearchBar from './SearchBar.svelte';
  import DataTable from './DataTable.svelte';
  import DownloadButton from './DownloadButton.svelte';
  import FrequencyDashboard from './FrequencyDashboard.svelte';

  let { filename } = $props<{ filename: string }>();

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

  let uniqueTypes = $derived(dataset
    ? [...new Set(dataset.words.map((word) => word.type).filter((type): type is string => type !== undefined))]
    : []);

  let typeLabels = $derived(dataset?.provenance.partOfSpeech?.labels ?? {});

  let filteredWords = $derived(dataset?.words ? filterWords(dataset.words, appliedSearchQuery, selectedTypes) : []);

  let rankedFilteredWords = $derived(sortWords(filteredWords, 'frequency', false).map((word, index) => ({ ...word, rank: index + 1 })));

  let sortedFilteredWords = $derived(sortWords(rankedFilteredWords, sortKey, sortAsc));

  let resultPage = $derived(paginate(sortedFilteredWords, currentPage));

  let hasActiveFilters = $derived(searchQuery.trim().length > 0 || selectedTypes.length > 0);

  function clearFilters() {
    searchQuery = '';
    appliedSearchQuery = '';
    searchPending = false;
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

{#if loading}
  <div class="loading" role="status" aria-live="polite">{t('loading')}</div>
{:else if error}
  <div class="error" role="alert">
    <h3>{t('errorLoadingData')}</h3>
    <p>{error}</p>
  </div>
{:else if dataset}
  <article class="dataset">
    <header class="dataset-header">
      <div>
        <p class="step">02</p>
        <h2>{dataset.title}</h2>
      </div>
      <dl class="dataset-facts">
        <div><dt>{t('author')}</dt><dd>{dataset.author}</dd></div>
        <div><dt>{t('year')}</dt><dd>{dataset.year}</dd></div>
        <div><dt>{t('entryKind')}</dt><dd>{dataset.entryKind === 'lemma' ? t('lemma') : t('wordform')}</dd></div>
        {#if dataset.provenance.licence}
          <div><dt>{t('licence')}</dt><dd>{dataset.provenance.licence}</dd></div>
        {/if}
      </dl>
      {#if dataset.provenance.citation || dataset.provenance.sourceUrl}
        <details class="source-details">
          <summary>{t('sourceDetails')}</summary>
          {#if dataset.provenance.citation}
            <p><strong>{t('citation')}:</strong> {dataset.provenance.citation}</p>
          {/if}
          {#if dataset.provenance.sourceUrl}
            <p><a href={dataset.provenance.sourceUrl} target="_blank" rel="noreferrer">{t('openSource')}</a></p>
          {/if}
        </details>
      {/if}
    </header>

    <section class="search-panel" aria-labelledby="word-results-title">
      <div class="search-heading">
        <div>
          <p class="step">03</p>
          <h2 id="word-results-title">{t('words')} ({sortedFilteredWords.length})</h2>
        </div>
        <p>{t('searchHint')}</p>
      </div>
      <div class="search-and-clear">
        <SearchBar bind:value={searchQuery} />
        {#if hasActiveFilters}
          <button onclick={clearFilters} class="clear-filters">{t('clearFilters')}</button>
        {/if}
      </div>
      {#if searchPending}
        <p class="updating-results" role="status" aria-live="polite">{t('updatingResults')}</p>
      {/if}
      {#if uniqueTypes.length > 0}
        <details class="type-filter">
          <summary>{t('filterByType')}{#if selectedTypes.length > 0} ({selectedTypes.length}){/if}</summary>
          {#if dataset.provenance.partOfSpeech}
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
          </div>
        </details>
      {/if}
    </section>

    {#if sortedFilteredWords.length > 0}
      <FrequencyDashboard words={filteredWords} typeLabels={typeLabels} />
    {/if}

    <div class="table-container">
      {#if sortedFilteredWords.length === 0}
        <p class="empty-state" role="status" aria-live="polite">{t('noMatchingWords')}</p>
      {:else}
        {#key filename}
          <div class="result-toolbar">
            <p class="result-count" role="status" aria-live="polite">{t('showingResults', { start: resultPage.start, end: resultPage.end, total: sortedFilteredWords.length })}</p>
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
            <button onclick={previousPage} disabled={resultPage.currentPage === 1}>{t('previousPage')}</button>
            <span>{t('pageOf', { page: resultPage.currentPage, total: resultPage.totalPages })}</span>
            <button onclick={nextPage} disabled={resultPage.currentPage === resultPage.totalPages}>{t('nextPage')}</button>
          </nav>
        {/if}
      {/if}
    </div>
  </article>
{/if}

<style>
  .loading {
    padding: var(--md);
    text-align: center;
  }

  .error {
    padding: var(--md);
    border: 1px solid var(--border-strong);
  }

  .error h3 {
    margin: 0 0 var(--sm);
  }

  .dataset {
    contain: inline-size;
    display: grid;
    gap: var(--2xl);
    min-width: 0;
    width: 100%;
  }

  .dataset-header {
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    display: grid;
    gap: var(--lg);
    padding: var(--lg);
  }

  .dataset-header h2,
  .search-heading h2 {
    margin: var(--xs) 0 0;
  }

  .step {
    color: var(--muted-color);
    font-size: 0.75rem;
  }

  .dataset-facts {
    display: grid;
    gap: var(--md);
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 10rem), 1fr));
  }

  .dataset-facts > div {
    border-left: 2px solid var(--border-color);
    padding-left: var(--sm);
  }

  .dataset-facts dt {
    color: var(--muted-color);
    font-size: 0.75rem;
  }

  .dataset-facts dd {
    margin: 0;
  }

  .source-details {
    margin: 0;
  }

  .source-details p {
    overflow-wrap: anywhere;
  }

  .search-panel {
    display: grid;
    gap: var(--md);
  }

  .search-heading {
    align-items: end;
    display: flex;
    gap: var(--md);
    justify-content: space-between;
  }

  .search-heading > p {
    color: var(--muted-color);
    font-size: 0.875rem;
    margin: 0;
    max-width: 36ch;
  }

  .table-container {
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
    width: 100%;
  }

  .empty-state {
    margin: var(--md) 0;
    padding: var(--md);
    border: 1px solid var(--border-strong);
  }

  .search-and-clear {
    align-items: center;
    display: grid;
    gap: var(--sm);
    grid-template-columns: minmax(0, 1fr) auto;
    max-width: 58rem;
  }

  .clear-filters {
    white-space: nowrap;
  }

  .updating-results {
    color: var(--muted-color);
    font-size: 0.875rem;
  }

  .type-filter {
    margin: 0;
  }

  .type-note {
    color: var(--muted-color);
    font-size: 0.8rem;
    margin-bottom: var(--sm);
  }

  .type-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0 var(--lg);
  }

  .type-options label {
    align-items: center;
    display: inline-flex;
    gap: var(--xs);
    min-height: 44px;
  }

  .result-toolbar {
    align-items: center;
    display: flex;
    gap: var(--md);
    justify-content: space-between;
    margin-bottom: var(--sm);
  }

  .result-count {
    color: var(--muted-color);
    font-size: 0.875rem;
  }

  .pagination {
    align-items: center;
    display: flex;
    gap: var(--sm);
    justify-content: center;
    margin: var(--md) 0 0;
  }

  @media (max-width: 44rem) {
    .search-heading,
    .result-toolbar {
      align-items: flex-start;
      flex-direction: column;
    }

    .search-and-clear {
      grid-template-columns: 1fr;
      width: 100%;
    }

    .clear-filters,
    .result-toolbar :global(button) {
      width: 100%;
    }
  }
</style>
