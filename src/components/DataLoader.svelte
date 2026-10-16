<script lang="ts">
  import { loadDataset, type Dataset } from '$lib/data';
  import type { Snippet } from 'svelte';
  import { entriesToCoverage, rankWords } from '$lib/analysis';
  import { datasetDescription, datasetTitle } from '$lib/dataset-labels';
  import { filterWords, paginate, pluralLt, sortWords } from '$lib/utils';
  import type { WordSortKey } from '$lib/utils';
  import { t } from '$lib/translations';
  import SectionHeading from './SectionHeading.svelte';
  import SearchBar from './SearchBar.svelte';
  import DataTable from './DataTable.svelte';
  import DownloadButton from './DownloadButton.svelte';
  import FrequencyDashboard from './FrequencyDashboard.svelte';
  import WordElsewhere from './WordElsewhere.svelte';
  import Headline from './Headline.svelte';

  let { filename, datasets = [], selectedDatasetId = '', onselectDataset = () => {}, afterTopWords } = $props<{
    filename: string;
    datasets?: { id: string; title: string; year: number }[];
    selectedDatasetId?: string;
    onselectDataset?: (event: Event) => void;
    afterTopWords?: Snippet;
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

  let typeLabels = $derived(dataset?.provenance.partOfSpeech?.labels ?? {});

  let uniqueTypes = $derived((dataset
    ? [...new Set(dataset.words.map((word) => word.type).filter((type): type is string => type !== undefined))]
    : []).sort((a, b) => (typeLabels[a] ?? a).localeCompare(typeLabels[b] ?? b, 'lt')));

  // Ranks describe the whole dataset, so a searched word keeps its real place.
  let rankedWords = $derived(dataset ? rankWords(dataset.words) : []);

  let filteredWords = $derived(filterWords(rankedWords, appliedSearchQuery, selectedTypes));

  let sortedFilteredWords = $derived(sortWords(filteredWords, sortKey, sortAsc));

  let resultPage = $derived(paginate(sortedFilteredWords, currentPage));

  let filteredFrequency = $derived(filteredWords.reduce((sum, word) => sum + word.frequency, 0));

  // The headline describes the whole source, so searching and filtering leave it alone.
  let halfCoverageEntries = $derived(entriesToCoverage(rankedWords, 0.5));

  // A whole-word match can be carried to the research pages; a partial query cannot.
  let exactMatch = $derived.by(() => {
    const query = appliedSearchQuery.trim().toLocaleLowerCase('lt-LT');
    return query ? filteredWords.find((word) => word.word.toLocaleLowerCase('lt-LT') === query) : undefined;
  });

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

<div class="headline-slot">
  {#if dataset && halfCoverageEntries !== null}
    <Headline
      figure={halfCoverageEntries.toLocaleString('lt-LT')}
      text={`${pluralLt(halfCoverageEntries, ['dažniausias žodis', 'dažniausi žodžiai', 'dažniausių žodžių'])} sudaro pusę pavartojimų.`}
      note={`Iš ${rankedWords.length.toLocaleString('lt-LT')} žodžių šaltinyje „${datasetTitle(dataset.id, `${dataset.title} (${dataset.year})`)}“. Skaičiai aprašo tik šį šaltinį, ne visą lietuvių kalbą.`}
    />
  {/if}
</div>

<div class="controls">
  {#if datasets.length}
    <div class="source-control">
      <label for="dataset-select">Šaltinis</label>
      <select id="dataset-select" value={selectedDatasetId} onchange={onselectDataset}>
        {#each datasets as source}<option value={source.id}>{datasetTitle(source.id, `${source.title} (${source.year})`)}</option>{/each}
      </select>
    </div>
  {/if}
  <SearchBar bind:value={searchQuery} />
  {#if uniqueTypes.length > 0}
    <details class="type-filter">
      <summary>Kalbos dalis{#if selectedTypes.length > 0}{' '}({selectedTypes.length}){/if}</summary>
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
        {#if selectedTypes.length > 0}<button type="button" onclick={clearFilters} class="text-button">{t('clearFilters')}</button>{/if}
      </div>
    </details>
  {/if}
  {#if dataset}<p class="note wide">{datasetDescription(dataset.id, dataset.title)}</p>{/if}
  {#if searchPending}
    <p class="note wide" role="status" aria-live="polite">{t('updatingResults')}</p>
  {:else if dataset}
    <p class="totals wide">
      <span>{t('entries')}: <strong>{filteredWords.length.toLocaleString('lt-LT')}</strong></span>
      <span class="inline-separator" aria-hidden="true">//</span>
      <span>{t('totalFrequency')}: <strong>{filteredFrequency.toLocaleString('lt-LT')}</strong></span>
    </p>
    {#if exactMatch}<div class="wide"><WordElsewhere word={exactMatch.word} /></div>{/if}
  {/if}
</div>

{#if loading}
  <p class="note" role="status" aria-live="polite">{t('loading')}</p>
{:else if error}
  <div class="notice error" role="alert">
    <p><strong>{t('errorLoadingData')}</strong></p>
    <p>{error}</p>
  </div>
  {@render afterTopWords?.()}
{:else if dataset}
  {#if sortedFilteredWords.length > 0}
    <FrequencyDashboard words={filteredWords} {typeLabels} {afterTopWords} />
  {:else}
    {@render afterTopWords?.()}
  {/if}

  <section class="table-container stack" aria-labelledby="word-list-title">
    <div class="section-head">
      <SectionHeading id="word-list-title">{t('wordList')}</SectionHeading>
      {#if sortedFilteredWords.length > 0}
        <DownloadButton
          words={sortedFilteredWords}
          metadata={{ id: dataset.id, title: dataset.title, author: dataset.author, year: dataset.year }}
          exploration={{ query: appliedSearchQuery, types: selectedTypes, sortKey, sortAsc }}
        />
      {/if}
    </div>
    {#if sortedFilteredWords.length === 0}
      <p class="notice empty-state" role="status" aria-live="polite">{t('noMatchingWords')}</p>
    {:else}
      <p class="note" role="status" aria-live="polite">{t('showingResults', { start: resultPage.start.toLocaleString('lt-LT'), end: resultPage.end.toLocaleString('lt-LT'), total: sortedFilteredWords.length.toLocaleString('lt-LT') })}</p>
      {#key filename}
        <DataTable words={resultPage.items} {typeLabels} bind:sortKey bind:sortAsc />
      {/key}
      {#if resultPage.totalPages > 1}
        <nav class="pagination" aria-label={t('pagination')}>
          <button type="button" class="text-button" onclick={previousPage} disabled={resultPage.currentPage === 1}>{t('previousPage')}</button>
          <span>{t('pageOf', { page: resultPage.currentPage, total: resultPage.totalPages })}</span>
          <button type="button" class="text-button" onclick={nextPage} disabled={resultPage.currentPage === resultPage.totalPages}>{t('nextPage')}</button>
        </nav>
      {/if}
    {/if}
  </section>

  <details>
    <summary>{t('aboutSource')}</summary>
    <div class="details-body">
      <dl class="facts">
        <div><dt>{t('author')}</dt><dd>{dataset.author}</dd></div>
        <div><dt>{t('year')}</dt><dd>{dataset.year}</dd></div>
        <div><dt>{t('entryKind')}</dt><dd>{dataset.entryKind === 'lemma' ? t('lemma') : t('wordform')}</dd></div>
        {#if dataset.provenance.licence}
          <div><dt>{t('licence')}</dt><dd>{dataset.provenance.licence}</dd></div>
        {/if}
        {#if dataset.provenance.partOfSpeech}
          <div><dt>{t('posScheme')}</dt><dd>{dataset.provenance.partOfSpeech.name}</dd></div>
        {/if}
      </dl>
      {#if dataset.provenance.citation}<p>{dataset.provenance.citation}</p>{/if}
      {#if dataset.provenance.sourceUrl}<p><a href={dataset.provenance.sourceUrl} target="_blank" rel="noreferrer">{t('openSource')}</a></p>{/if}
    </div>
  </details>
{/if}

<style>
  /* Reserved height keeps the controls still while the dataset loads. */
  .headline-slot { min-height: 8.5rem; }
  .controls { align-items: end; display: grid; gap: 1rem; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr) auto; }
  .source-control label { display: block; font-size: .875rem; margin-bottom: .5rem; }
  .source-control select { width: 100%; }
  .wide { grid-column: 1 / -1; }
  .totals { display: flex; flex-wrap: wrap; gap: .25rem .75rem; }
  .type-filter { position: relative; }
  .type-filter summary { padding-block: .65rem; white-space: nowrap; }
  .type-filter[open] summary { border-bottom: 0; }
  .type-options { display: flex; flex-wrap: wrap; gap: 0 1.5rem; padding: .5rem .85rem; }
  .type-filter[open] .type-options { background: hsl(var(--black)); border: 1px solid hsl(var(--theme) / .35); position: absolute; right: -1px; top: 100%; width: min(32rem, 80vw); z-index: 2; }
  .type-options label { align-items: center; display: flex; gap: .5rem; min-height: 2.75rem; }
  .pagination { align-items: center; display: flex; flex-wrap: wrap; gap: .75rem 1.5rem; }
  @media (max-width: 40rem) {
    .controls { grid-template-columns: minmax(0, 1fr); }
    .type-filter[open] .type-options { border: 0; position: static; width: auto; }
  }
</style>
