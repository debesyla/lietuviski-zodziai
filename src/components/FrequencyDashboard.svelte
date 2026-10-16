<script lang="ts">
  import SectionHeading from './SectionHeading.svelte';
  import RateBars from './RateBars.svelte';
  import TableScroll from './TableScroll.svelte';
  import { analyseFrequency, sampleByRank } from '$lib/analysis';
  import { pluralLt } from '$lib/utils';
  import { t } from '$lib/translations';
  import type { Word } from '$lib/data';
  import type { Snippet } from 'svelte';

  // `afterTopWords` lets the homepage place its research cards right below the top-words bars.
  let { words, typeLabels = {}, afterTopWords }: { words: Word[]; typeLabels?: Record<string, string>; afterTopWords?: Snippet } = $props();

  const topNOptions = [10, 20, 50];
  const chartHeight = 260;
  const chartLeft = 52;
  const chartRight = 16;
  const chartTop = 28;
  const chartBottom = 40;
  const plotBottom = chartHeight - chartBottom;
  const chartInnerHeight = plotBottom - chartTop;
  const coverageTicks = [0, 0.25, 0.5, 0.75, 1];

  let dashboardWidth = $state(640);
  let topN = $state(10);
  const chartWidth = $derived(Math.max(300, dashboardWidth));
  const chartInnerWidth = $derived(chartWidth - chartLeft - chartRight);

  let analysis = $derived(analyseFrequency(words));
  let topWords = $derived(analysis.rankedWords.slice(0, topN));
  let rankFrequencySeries = $derived(sampleByRank(analysis.rankedWords));
  let coverageSeries = $derived(sampleByRank(analysis.coverage));
  let maximumFrequency = $derived(analysis.topWord?.frequency ?? 1);
  let minimumFrequency = $derived(analysis.rankedWords[analysis.rankedWords.length - 1]?.frequency ?? 1);
  let maximumRank = $derived(analysis.rankedWords[analysis.rankedWords.length - 1]?.rank ?? 1);
  let rankFrequencyPath = $derived(linePath(rankFrequencySeries, (point) => logRankX(point.rank), (point) => logFrequencyY(point.frequency)));
  let coveragePath = $derived(linePath(coverageSeries, (point) => logRankX(point.rank), (point) => coverageY(point.coverage)));
  let rankTicks = $derived(logTicks(maximumRank));
  let frequencyTicks = $derived(logTicks(maximumFrequency, minimumFrequency));
  let milestones = $derived([analysis.facts.halfCoverage, analysis.facts.ninetyCoverage].filter((milestone) => milestone !== null));

  function formatNumber(value: number) {
    return value.toLocaleString('lt-LT');
  }

  function formatPercent(value: number) {
    if (value > 0 && value < 0.0005) return '<0,1 %';
    return new Intl.NumberFormat('lt-LT', { style: 'percent', maximumFractionDigits: 1 }).format(value);
  }

  function displayType(type: string) {
    return typeLabels[type] ? `${typeLabels[type]} (${type})` : type;
  }

  function topWordsPhrase(count: number) {
    return `${formatNumber(count)} ${pluralLt(count, ['dažniausias žodis', 'dažniausi žodžiai', 'dažniausių žodžių'])}`;
  }

  function wordsPhrase(count: number) {
    return `${formatNumber(count)} ${pluralLt(count, ['žodis', 'žodžiai', 'žodžių'])}`;
  }

  function logRankX(rank: number) {
    if (maximumRank <= 1) return chartLeft + chartInnerWidth / 2;
    return chartLeft + (Math.log10(rank) / Math.log10(maximumRank)) * chartInnerWidth;
  }

  function logFrequencyY(frequency: number) {
    if (maximumFrequency === minimumFrequency) return chartTop + chartInnerHeight / 2;
    const range = Math.log10(maximumFrequency) - Math.log10(minimumFrequency);
    return chartTop + ((Math.log10(maximumFrequency) - Math.log10(frequency)) / range) * chartInnerHeight;
  }

  function coverageY(coverage: number) {
    return chartTop + (1 - coverage) * chartInnerHeight;
  }

  function linePath<T>(points: T[], x: (point: T) => number, y: (point: T) => number) {
    return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(point).toFixed(2)},${y(point).toFixed(2)}`).join(' ');
  }

  function logTicks(maximum: number, minimum = 1) {
    if (maximum <= 1) return [1];
    if (maximum === minimum) return [maximum];
    const start = Math.floor(Math.log10(Math.max(1, minimum)));
    const end = Math.ceil(Math.log10(maximum));
    const ticks = Array.from({ length: end - start + 1 }, (_, index) => 10 ** (start + index)).filter((tick) => tick >= minimum && tick <= maximum);
    return ticks.length > 0 ? ticks : [minimum, maximum];
  }

  function selectTopN(event: Event) {
    topN = Number((event.currentTarget as HTMLSelectElement).value);
  }
</script>

<div class="dashboard" bind:clientWidth={dashboardWidth}>
  <section class="stack" aria-labelledby="top-words-title">
    <div class="section-head">
      <SectionHeading id="top-words-title">{t('topWords')}</SectionHeading>
      <label class="top-n">
        {t('showTop')}
        <select value={topN} onchange={selectTopN}>
          {#each topNOptions as count}
            <option value={count}>{count}</option>
          {/each}
        </select>
      </label>
    </div>
    <RateBars rows={topWords.map((word) => ({ label: word.word, value: word.frequency }))} unit={t('topWords')} format={(value) => formatNumber(value ?? 0)} />
  </section>

  {@render afterTopWords?.()}

  <section class="stack" aria-labelledby="rank-frequency-title">
    <SectionHeading id="rank-frequency-title">{t('rankFrequency')}</SectionHeading>
    <p class="note">{t('rankFrequencyDescription')}</p>
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-labelledby="rank-frequency-title rank-frequency-description" class="line-chart">
      <desc id="rank-frequency-description">{t('rankFrequencyText', { first: formatNumber(maximumFrequency), last: formatNumber(minimumFrequency), count: formatNumber(analysis.entryCount) })}</desc>
      <text class="axis-title" x={chartLeft} y="12">{t('frequencyLogScale')}</text>
      {#each frequencyTicks as tick}
        <line class="grid-line" x1={chartLeft} x2={chartWidth - chartRight} y1={logFrequencyY(tick)} y2={logFrequencyY(tick)} />
        <text class="axis-label" x={chartLeft - 8} y={logFrequencyY(tick) + 4} text-anchor="end">{formatNumber(tick)}</text>
      {/each}
      {#each rankTicks as tick}
        <line class="grid-line" x1={logRankX(tick)} x2={logRankX(tick)} y1={chartTop} y2={plotBottom} />
        <text class="axis-label" x={logRankX(tick)} y={plotBottom + 16} text-anchor="middle">{formatNumber(tick)}</text>
      {/each}
      <line class="axis-line" x1={chartLeft} x2={chartWidth - chartRight} y1={plotBottom} y2={plotBottom} />
      <line class="axis-line" x1={chartLeft} x2={chartLeft} y1={chartTop} y2={plotBottom} />
      <path class="series-line" d={rankFrequencyPath} />
      {#if rankFrequencySeries.length === 1}<circle class="series-point" cx={logRankX(1)} cy={logFrequencyY(maximumFrequency)} r="3" />{/if}
      <text class="axis-title" x={chartWidth - chartRight} y={chartHeight - 4} text-anchor="end">{t('rankLogScale')}</text>
    </svg>
    <details>
      <summary>{t('tableEquivalent')}</summary>
      <TableScroll label={`${t('rankFrequency')}: ${t('tableEquivalent').toLowerCase()}`}>
        <table>
          <thead><tr><th scope="col" class="number">{t('rank')}</th><th scope="col">{t('word')}</th><th scope="col" class="number">{t('frequencyColumn')}</th></tr></thead>
          <tbody>
            {#each rankFrequencySeries as word}
              <tr><td class="number">{formatNumber(word.rank)}</td><td>{word.word}</td><td class="number">{formatNumber(word.frequency)}</td></tr>
            {/each}
          </tbody>
        </table>
      </TableScroll>
    </details>
  </section>

  <section class="stack" aria-labelledby="coverage-title">
    <SectionHeading id="coverage-title">{t('cumulativeCoverage')}</SectionHeading>
    <p class="note">{t('coverageDescription')}</p>
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-labelledby="coverage-title coverage-description" class="line-chart">
      <desc id="coverage-description">{t('coverageText', { topTen: formatPercent(analysis.coverage[Math.min(9, analysis.coverage.length - 1)]?.coverage ?? 0) })}</desc>
      <text class="axis-title" x={chartLeft} y="12">{t('tokenCoverage')}</text>
      {#each coverageTicks as tick}
        <line class="grid-line" x1={chartLeft} x2={chartWidth - chartRight} y1={coverageY(tick)} y2={coverageY(tick)} />
        <text class="axis-label" x={chartLeft - 8} y={coverageY(tick) + 4} text-anchor="end">{formatPercent(tick)}</text>
      {/each}
      {#each rankTicks as tick}
        <line class="grid-line" x1={logRankX(tick)} x2={logRankX(tick)} y1={chartTop} y2={plotBottom} />
        <text class="axis-label" x={logRankX(tick)} y={plotBottom + 16} text-anchor="middle">{formatNumber(tick)}</text>
      {/each}
      <line class="axis-line" x1={chartLeft} x2={chartWidth - chartRight} y1={plotBottom} y2={plotBottom} />
      <line class="axis-line" x1={chartLeft} x2={chartLeft} y1={chartTop} y2={plotBottom} />
      {#each milestones as milestone}
        {@const x = logRankX(milestone.entries)}
        {@const y = coverageY(milestone.threshold)}
        <line class="marker-line" x1={chartLeft} x2={x} y1={y} y2={y} />
        <line class="marker-line" x1={x} x2={x} y1={y} y2={plotBottom} />
        <text class="marker-label" x={x + 6} y={y + 16}>{formatNumber(milestone.entries)}</text>
      {/each}
      <path class="series-line" d={coveragePath} />
      {#if coverageSeries.length === 1}<circle class="series-point" cx={logRankX(1)} cy={coverageY(1)} r="3" />{/if}
      {#each milestones as milestone}
        <circle class="series-point" cx={logRankX(milestone.entries)} cy={coverageY(milestone.threshold)} r="3.5" />
      {/each}
      <text class="axis-title" x={chartWidth - chartRight} y={chartHeight - 4} text-anchor="end">{t('rankLogScale')}</text>
    </svg>
    <dl class="facts coverage-facts">
      {#if analysis.topWord}
        <div><dt>{t('leadingEntryShare')}</dt><dd>„{analysis.topWord.word}“ – {formatPercent(analysis.facts.topEntryShare)} pavartojimų</dd></div>
      {/if}
      {#each milestones as milestone}
        <div>
          <dt>{milestone.threshold === 0.5 ? t('halfCoverage') : t('ninetyCoverage')}</dt>
          <dd>{topWordsPhrase(milestone.entries)} ({formatPercent(milestone.entryShare)} sąrašo)</dd>
        </div>
      {/each}
      <div><dt>{t('singletonTail')}</dt><dd>{wordsPhrase(analysis.facts.singletonEntries)} ({formatPercent(analysis.facts.singletonEntryShare)} sąrašo)</dd></div>
    </dl>
    <details>
      <summary>{t('tableEquivalent')}</summary>
      <TableScroll label={`${t('cumulativeCoverage')}: ${t('tableEquivalent').toLowerCase()}`}>
        <table>
          <thead><tr><th scope="col" class="number">{t('rank')}</th><th scope="col" class="number">{t('cumulativeFrequency')}</th><th scope="col" class="number">{t('tokenCoverage')}</th></tr></thead>
          <tbody>
            {#each coverageSeries as point}
              <tr><td class="number">{formatNumber(point.rank)}</td><td class="number">{formatNumber(point.cumulativeFrequency)}</td><td class="number">{formatPercent(point.coverage)}</td></tr>
            {/each}
          </tbody>
        </table>
      </TableScroll>
    </details>
  </section>

  {#if analysis.partOfSpeech.length > 0}
    <section class="stack" aria-labelledby="pos-title">
      <SectionHeading id="pos-title">{t('posComposition')}</SectionHeading>
      <p class="note">{t('posCompositionDescription')}</p>
      <RateBars rows={analysis.partOfSpeech.map((part) => ({ label: displayType(part.type), value: part.share }))} unit={t('posComposition')} max={1} format={(value) => formatPercent(value ?? 0)} />
      <details>
        <summary>{t('tableEquivalent')}</summary>
        <TableScroll label={`${t('posComposition')}: ${t('tableEquivalent').toLowerCase()}`}>
          <table>
            <thead><tr><th scope="col">{t('typeColumn')}</th><th scope="col" class="number">{t('frequencyColumn')}</th><th scope="col" class="number">{t('entries')}</th><th scope="col" class="number">{t('tokenCoverage')}</th></tr></thead>
            <tbody>
              {#each analysis.partOfSpeech as part}
                <tr><td>{displayType(part.type)}</td><td class="number">{formatNumber(part.frequency)}</td><td class="number">{formatNumber(part.entries)}</td><td class="number">{formatPercent(part.share)}</td></tr>
              {/each}
            </tbody>
          </table>
        </TableScroll>
      </details>
    </section>
  {/if}
</div>

<style>
  .dashboard { contain: inline-size; display: grid; gap: 3rem; grid-template-columns: minmax(0, 1fr); min-width: 0; }
  .coverage-facts { grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); }
  .top-n { align-items: center; display: flex; gap: .75rem; white-space: nowrap; }
  .line-chart { height: auto; overflow: visible; width: 100%; }
  .grid-line { stroke: hsl(var(--theme) / .15); }
  .axis-line { stroke: hsl(var(--theme) / .55); }
  .marker-line { stroke: hsl(var(--theme) / .55); stroke-dasharray: 3 4; }
  .series-line { fill: none; stroke: hsl(var(--theme)); stroke-width: 2; }
  .series-point { fill: hsl(var(--theme)); }
  .axis-label, .axis-title, .marker-label { fill: hsl(var(--theme)); font-family: inherit; font-size: 12px; }
  .axis-title { fill: hsl(var(--theme) / .7); }
  .marker-label { font-weight: 700; }
</style>
