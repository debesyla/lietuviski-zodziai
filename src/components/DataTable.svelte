<script lang="ts">
  import { t } from '$lib/translations';
  import TableScroll from './TableScroll.svelte';
  import { formatNumber, sortWords } from '$lib/utils';
  import type { WordSortKey } from '$lib/utils';
  interface Word {
    word: string;
    type?: string;
    frequency: number;
    rank?: number;
  }

  let {
    words = [],
    typeLabels = {},
    sortKey = $bindable<WordSortKey>('frequency'),
    sortAsc = $bindable(false)
  } = $props<{
    words?: Word[];
    typeLabels?: Record<string, string>;
    sortKey?: WordSortKey;
    sortAsc?: boolean;
  }>();

  function sortBy(key: WordSortKey) {
    if (sortKey === key) {
      sortAsc = !sortAsc;
    } else {
      sortKey = key;
      sortAsc = true;
    }
  }

  function sortState(key: WordSortKey) {
    if (sortKey !== key) return 'none';
    return sortAsc ? 'ascending' : 'descending';
  }

  function sortControlLabel(key: WordSortKey) {
    const column = key === 'word' ? t('word') : key === 'frequency' ? t('frequencyColumn') : t('typeColumn');
    const direction = sortKey === key ? (sortAsc ? t('ascending') : t('descending')) : t('unsorted');
    return `${t('sortBy')} ${column}: ${direction}`;
  }

  let sortedWords = $derived<Word[]>(sortWords(words, sortKey, sortAsc));

  function displayType(type?: string) {
    if (!type) return '';
    return typeLabels[type] ? `${typeLabels[type]} (${type})` : type;
  }
</script>

<TableScroll label="Žodžių lentelė">
  <table>
    <thead>
      <tr>
        <th scope="col" class="number">{t('rank')}</th>
        <th scope="col" aria-sort={sortState('word')}>
          <button type="button" class="sort-button" onclick={() => sortBy('word')} aria-label={sortControlLabel('word')}>
            {t('word')} {#if sortKey === 'word'}<span aria-hidden="true">{sortAsc ? '↑' : '↓'}</span>{/if}
          </button>
        </th>
        <th scope="col" class="number" aria-sort={sortState('frequency')}>
          <button type="button" class="sort-button" onclick={() => sortBy('frequency')} aria-label={sortControlLabel('frequency')}>
            {t('frequencyColumn')} {#if sortKey === 'frequency'}<span aria-hidden="true">{sortAsc ? '↑' : '↓'}</span>{/if}
          </button>
        </th>
        <th scope="col" aria-sort={sortState('type')}>
          <button type="button" class="sort-button" onclick={() => sortBy('type')} aria-label={sortControlLabel('type')}>
            {t('typeColumn')} {#if sortKey === 'type'}<span aria-hidden="true">{sortAsc ? '↑' : '↓'}</span>{/if}
          </button>
        </th>
      </tr>
    </thead>
    <tbody>
      {#each sortedWords as word}
        <tr>
          <td class="number">{word.rank === undefined ? '' : formatNumber(word.rank)}</td>
          <td>{word.word}</td>
          <td class="number">{formatNumber(word.frequency)}</td>
          <td>{displayType(word.type)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</TableScroll>

<style>
  tbody tr:hover { background: hsl(var(--theme) / .06); }
  .sort-button { background: transparent; font-weight: inherit; padding: 0; text-align: inherit; width: 100%; }
  .sort-button:is(:hover, :focus-visible) { text-decoration: underline dashed; text-decoration-color: hsl(var(--theme) / .5); text-underline-offset: .125em; }
  @media (max-width: 40rem) {
    table { min-width: 31rem; white-space: nowrap; }
  }
</style>
