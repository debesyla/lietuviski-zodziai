<script lang="ts">
  import { analyseFrequency, sampleByRank } from '$lib/analysis';
  import { t } from '$lib/translations';
  import type { Word } from '$lib/data';

  let dashboardWidth = $state(640);
  const chartWidth = $derived(Math.max(300, dashboardWidth));
  const chartHeight = 250;
  const chartLeft = 56;
  const chartRight = 18;
  const chartTop = 18;
  const chartBottom = 46;
  const chartInnerWidth = $derived(chartWidth - chartLeft - chartRight);
  const chartInnerHeight = chartHeight - chartTop - chartBottom;
  const topNOptions = [10, 20, 50];

  let { words, typeLabels = {} }: { words: Word[]; typeLabels?: Record<string, string> } = $props();
  let topN = $state(10);
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
  let coverageTicks = [0, 0.25, 0.5, 0.75, 1];

  function formatNumber(value: number) {
    return value.toLocaleString('lt-LT');
  }

  function formatPercent(value: number) {
    if (value > 0 && value < 0.0005) return '<0,1 %';
    return new Intl.NumberFormat('lt-LT', { style: 'percent', maximumFractionDigits: 1 }).format(value);
  }

  function formatFactPercent(value: number) {
    return new Intl.NumberFormat('lt-LT', { style: 'percent', maximumFractionDigits: 3 }).format(value);
  }

  function displayType(type: string) {
    return typeLabels[type] ? `${typeLabels[type]} (${type})` : type;
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

  function barWidth(frequency: number) {
    return `${(frequency / maximumFrequency) * 100}%`;
  }

  function percentWidth(value: number) {
    return `${value * 100}%`;
  }

  function selectTopN(event: Event) {
    topN = Number((event.currentTarget as HTMLSelectElement).value);
  }
</script>

<section class="dashboard" aria-label="Žodžių dažnumo grafikai" bind:clientWidth={dashboardWidth}>

  {#if analysis.entryCount === 0}
    <p class="empty-analysis" role="status">{t('noMatchingWords')}</p>
  {:else}
    <div class="advanced-analysis">
      <div class="analysis-content">
      <section class="chart-section" aria-labelledby="top-words-title">
      <div class="chart-heading">
        <div>
          <h2 id="top-words-title">{t('topWords')}</h2>
        </div>
        <label>
          {t('showTop')}
          <select value={topN} onchange={selectTopN} aria-label={t('showTop')}>
            {#each topNOptions as count}
              <option value={count}>{count}</option>
            {/each}
          </select>
        </label>
      </div>
      <div class="bar-chart" role="img" aria-label={`${t('topWords')}: ${topWords.map((word) => `${word.word} ${formatNumber(word.frequency)}`).join(', ')}`}>
        {#each topWords as word}
          <div class="bar-row">
            <span class="bar-label">{word.word}</span>
            <div class="bar-track" aria-hidden="true"><div class="bar-fill" style={`width: ${barWidth(word.frequency)}`}></div></div>
            <span class="bar-value">{formatNumber(word.frequency)}</span>
          </div>
        {/each}
      </div>

      </section>

      <section class="chart-section" aria-labelledby="rank-frequency-title">
      <h2 id="rank-frequency-title">{t('rankFrequency')}</h2>
      <p>{t('rankFrequencyDescription')}</p>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-labelledby="rank-frequency-title rank-frequency-description" class="line-chart">
        <desc id="rank-frequency-description">{t('rankFrequencyText', { first: formatNumber(analysis.topWord?.frequency ?? 0), last: formatNumber(minimumFrequency), count: formatNumber(analysis.entryCount) })}</desc>
        {#each frequencyTicks as tick}
          <line class="grid-line" x1={chartLeft} x2={chartWidth - chartRight} y1={logFrequencyY(tick)} y2={logFrequencyY(tick)} />
          <text class="axis-label" x={chartLeft - 8} y={logFrequencyY(tick) + 4} text-anchor="end">{formatNumber(tick)}</text>
        {/each}
        {#each rankTicks as tick}
          <line class="grid-line" x1={logRankX(tick)} x2={logRankX(tick)} y1={chartTop} y2={chartHeight - chartBottom} />
          <text class="axis-label" x={logRankX(tick)} y={chartHeight - 26} text-anchor="middle">{formatNumber(tick)}</text>
        {/each}
        <line class="axis-line" x1={chartLeft} x2={chartWidth - chartRight} y1={chartHeight - chartBottom} y2={chartHeight - chartBottom} />
        <line class="axis-line" x1={chartLeft} x2={chartLeft} y1={chartTop} y2={chartHeight - chartBottom} />
        <path class="series-line" d={rankFrequencyPath} />
        {#if rankFrequencySeries.length === 1}<circle class="series-point" cx={logRankX(1)} cy={logFrequencyY(maximumFrequency)} r="3" />{/if}
        <text class="axis-title" x={chartWidth / 2} y={chartHeight - 8} text-anchor="middle">{t('rankLogScale')}</text>
        <text class="axis-title" transform={`translate(13 ${chartHeight / 2}) rotate(-90)`} text-anchor="middle">{t('frequencyLogScale')}</text>
      </svg>
      <details>
        <summary>{t('tableEquivalent')}</summary>
        <table>
          <thead><tr><th>{t('rank')}</th><th>{t('word')}</th><th>{t('frequency')}</th></tr></thead>
          <tbody>
            {#each rankFrequencySeries as word}
              <tr><td>{formatNumber(word.rank)}</td><td>{word.word}</td><td>{formatNumber(word.frequency)}</td></tr>
            {/each}
          </tbody>
        </table>
      </details>
      </section>

      <section class="chart-section" aria-labelledby="coverage-title">
      <h2 id="coverage-title">{t('cumulativeCoverage')}</h2>
      <p>{t('coverageDescription')}</p>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-labelledby="coverage-title coverage-description" class="line-chart">
        <desc id="coverage-description">{t('coverageText', { topTen: formatPercent(analysis.coverage[Math.min(9, analysis.coverage.length - 1)]?.coverage ?? 0) })}</desc>
        {#each coverageTicks as tick}
          <line class="grid-line" x1={chartLeft} x2={chartWidth - chartRight} y1={coverageY(tick)} y2={coverageY(tick)} />
          <text class="axis-label" x={chartLeft - 8} y={coverageY(tick) + 4} text-anchor="end">{formatPercent(tick)}</text>
        {/each}
        {#each rankTicks as tick}
          <line class="grid-line" x1={logRankX(tick)} x2={logRankX(tick)} y1={chartTop} y2={chartHeight - chartBottom} />
          <text class="axis-label" x={logRankX(tick)} y={chartHeight - 26} text-anchor="middle">{formatNumber(tick)}</text>
        {/each}
        <line class="axis-line" x1={chartLeft} x2={chartWidth - chartRight} y1={chartHeight - chartBottom} y2={chartHeight - chartBottom} />
        <line class="axis-line" x1={chartLeft} x2={chartLeft} y1={chartTop} y2={chartHeight - chartBottom} />
        <path class="series-line" d={coveragePath} />
        {#if coverageSeries.length === 1}<circle class="series-point" cx={logRankX(1)} cy={coverageY(1)} r="3" />{/if}
        <text class="axis-title" x={chartWidth / 2} y={chartHeight - 8} text-anchor="middle">{t('rankLogScale')}</text>
        <text class="axis-title" transform={`translate(13 ${chartHeight / 2}) rotate(-90)`} text-anchor="middle">{t('tokenCoverage')}</text>
      </svg>
      <details>
        <summary>{t('tableEquivalent')}</summary>
        <table>
          <thead><tr><th>{t('rank')}</th><th>{t('cumulativeFrequency')}</th><th>{t('tokenCoverage')}</th></tr></thead>
          <tbody>
            {#each coverageSeries as point}
              <tr><td>{formatNumber(point.rank)}</td><td>{formatNumber(point.cumulativeFrequency)}</td><td>{formatPercent(point.coverage)}</td></tr>
            {/each}
          </tbody>
        </table>
      </details>
      </section>

    {#if analysis.partOfSpeech.length > 0}
        <section class="chart-section" aria-labelledby="pos-title">
        <h2 id="pos-title">{t('posComposition')}</h2>
        <div class="bar-chart" role="img" aria-label={`${t('posComposition')}: ${analysis.partOfSpeech.map((part) => `${displayType(part.type)} ${formatPercent(part.share)}`).join(', ')}`}>
          {#each analysis.partOfSpeech as part}
            <div class="bar-row">
              <span class="bar-label">{displayType(part.type)}</span>
              <div class="bar-track" aria-hidden="true"><div class="bar-fill" style={`width: ${percentWidth(part.share)}`}></div></div>
              <span class="bar-value">{formatPercent(part.share)}</span>
            </div>
          {/each}
        </div>
        <details>
          <summary>{t('tableEquivalent')}</summary>
          <table>
            <thead><tr><th>{t('type')}</th><th>{t('frequency')}</th><th>{t('entries')}</th><th>{t('tokenCoverage')}</th></tr></thead>
            <tbody>
              {#each analysis.partOfSpeech as part}
                <tr><td>{displayType(part.type)}</td><td>{formatNumber(part.frequency)}</td><td>{formatNumber(part.entries)}</td><td>{formatPercent(part.share)}</td></tr>
              {/each}
            </tbody>
          </table>
        </details>
        </section>
    {/if}
    <dl class="headline-metrics" aria-label={t('headlineMetrics')}>
      <div>
        <dt>{t('entries')}</dt>
        <dd>{formatNumber(analysis.entryCount)}</dd>
      </div>
      <div>
        <dt>{t('totalFrequency')}</dt>
        <dd>{formatNumber(analysis.totalFrequency)}</dd>
      </div>
      <div>
        <dt>{t('mostFrequent')}</dt>
        <dd>{analysis.topWord?.word} <span>({formatNumber(analysis.topWord?.frequency ?? 0)})</span></dd>
      </div>

    </dl>

      <section class="facts-section" aria-labelledby="frequency-facts-title">
      <h2 id="frequency-facts-title">{t('frequencyFacts')}</h2>
      <dl class="fact-grid">
        <div>
          <dt>{t('leadingEntryShare')}</dt>
          <dd>{t('leadingEntryFact', {
            word: analysis.topWord?.word ?? '',
            share: formatFactPercent(analysis.facts.topEntryShare)
          })}</dd>
        </div>
        {#if analysis.facts.halfCoverage}
          <div>
            <dt>{t('halfCoverage')}</dt>
            <dd>{t('coverageMilestoneFact', {
              entries: formatNumber(analysis.facts.halfCoverage.entries),
              coverage: formatPercent(analysis.facts.halfCoverage.threshold),
              entryShare: formatFactPercent(analysis.facts.halfCoverage.entryShare)
            })}</dd>
          </div>
        {/if}
        {#if analysis.facts.ninetyCoverage}
          <div>
            <dt>{t('ninetyCoverage')}</dt>
            <dd>{t('coverageMilestoneFact', {
              entries: formatNumber(analysis.facts.ninetyCoverage.entries),
              coverage: formatPercent(analysis.facts.ninetyCoverage.threshold),
              entryShare: formatFactPercent(analysis.facts.ninetyCoverage.entryShare)
            })}</dd>
          </div>
        {/if}
        <div>
          <dt>{t('singletonTail')}</dt>
          <dd>{t('singletonFact', {
            entries: formatNumber(analysis.facts.singletonEntries),
            entryShare: formatFactPercent(analysis.facts.singletonEntryShare),
            tokenShare: formatFactPercent(analysis.facts.singletonTokenShare)
          })}</dd>
        </div>
      </dl>
      </section>

      </div>
    </div>
  {/if}
</section>

<style>
  .dashboard {
    contain: inline-size;
    min-width: 0;
    padding-top: 0;
  }

  .chart-heading {
    display: flex;
    align-items: baseline;
    gap: var(--sm);
    justify-content: space-between;
  }

  .chart-section > p {
    color: color-mix(in srgb, var(--text-color) 72%, transparent);
  }

  .headline-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem 2rem;
    margin: 0;
  }

  .headline-metrics > div { border: 0; padding: 0; }

  .advanced-analysis {
    max-width: 100%;
    min-width: 0;
    margin: 0;
  }

  .analysis-content {
    display: grid;
    gap: 3rem;
    margin-top: 0;
  }

  .chart-section, .facts-section {
    display: grid;
    gap: 0.75rem;
    min-width: 0;
  }

  .chart-section h2,
  .facts-section h2 {
    margin: 0;
  }


  .fact-grid {
    display: grid;
    gap: 1.5rem 2rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin: 0;
  }

  .fact-grid > div { min-width: 0; }

  .fact-grid dd {
    font-size: 1em;
    line-height: 1.5;
  }

  dt {
    color: color-mix(in srgb, var(--text-color) 72%, transparent);
  }

  dd {
    font-size: 1em;
    margin: var(--xs) 0 0;
  }

  dd span {
    font-size: .85em;
  }


  .chart-heading label {
    display: flex;
    align-items: center;
    gap: .75rem;
    white-space: nowrap;
  }

  .chart-heading select { width: 4.5rem; height: 36px; min-height: 36px; padding: .25rem .5rem; }

  .series-point { fill: var(--text-color); }

  .bar-chart {
    display: grid;
    gap: var(--xs);
    margin: 0;
  }

  .bar-row {
    align-items: center;
    display: grid;
    gap: var(--sm);
    grid-template-columns: minmax(10em, 1.25fr) minmax(4em, 3fr) 10ch;
  }

  .bar-label {
    overflow-wrap: anywhere;
  }

  .bar-track {
    background: color-mix(in srgb, var(--text-color) 12%, transparent);
    height: .9em;
  }

  .bar-fill {
    background: var(--text-color);
    height: 100%;
  }

  .bar-value {
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  .line-chart {
    height: auto;
    margin: 0;
    overflow: visible;
    width: 100%;
  }

  .grid-line {
    stroke: color-mix(in srgb, var(--text-color) 18%, transparent);
    stroke-width: 1;
  }

  .axis-line {
    stroke: var(--text-color);
    stroke-width: 1;
  }

  .series-line {
    fill: none;
    stroke: var(--text-color);
    stroke-width: 2;
  }

  .axis-label,
  .axis-title {
    fill: var(--text-color);
    font-family: inherit;
    font-size: 12px;
  }

  .axis-title {
    font-size: 13px;
  }

  details {
    contain: inline-size;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
  }

  details table {
    margin-top: var(--sm);
  }


  @media (max-width: 639px) {
      .chart-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .chart-heading select { height: 44px; min-height: 44px; }

    .headline-metrics,
    .fact-grid {
      grid-template-columns: 1fr;
    }

    .bar-row {
      grid-template-columns: minmax(0, 1fr) minmax(3em, 1.2fr) 10ch;
    }
  }
</style>
