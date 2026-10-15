<script lang="ts">
  import SectionHeading from '../../components/SectionHeading.svelte';
  import {
    coverageCategoryDefinitions,
    loadDml6CoverageDrilldown,
    loadDml6CoverageProfile,
    type CoverageCategoryDefinition,
    type Dml6CoverageDrilldown,
    type Dml6CoverageProfile
  } from '$lib/dml6-coverage';

  let profile = $state<Dml6CoverageProfile | null>(null);
  let error = $state<string | null>(null);
  let loading = $state(true);
  let selection = $state<{ bandId: string; coverageCode: number } | null>(null);
  let drilldown = $state<Dml6CoverageDrilldown | null>(null);
  let drilldownLoading = $state(false);
  let drilldownError = $state<string | null>(null);
  let requestNumber = 0;

  let categories = $derived<CoverageCategoryDefinition[]>(profile ? coverageCategoryDefinitions(profile).map(category => ({ ...category, label: ({ 'not in DML6': 'Nerasta DML6', 'main entry': 'Pagrindinis įrašas', 'geographic name': 'Vietovardis', 'abbreviation': 'Santrumpa' } as Record<string, string>)[category.label] ?? category.label })) : []);
  let selectedBand = $derived(profile?.summary.bands.find((band) => band.id === selection?.bandId) ?? null);
  let selectedCategory = $derived(selectedBand?.categories.find((category) => category.coverageCode === selection?.coverageCode) ?? null);
  let selectedCategoryLabel = $derived(categories.find((category) => category.code === selection?.coverageCode)?.label ?? '');

  function formatNumber(value: number) {
    return value.toLocaleString('lt-LT');
  }

  function bandLabel(band: Dml6CoverageProfile['summary']['bands'][number]) {
    return band.maximum === null ? `${formatNumber(band.minimum)}+` : band.minimum === band.maximum ? formatNumber(band.minimum) : `${formatNumber(band.minimum)}–${formatNumber(band.maximum)}`;
  }

  function formatPercent(value: number) {
    if (value > 0 && value < 0.0005) return '<0,1 %';
    return new Intl.NumberFormat('lt-LT', { style: 'percent', maximumFractionDigits: 1 }).format(value);
  }

  function typeShare(typeCount: number, bandTypeCount: number) {
    return bandTypeCount === 0 ? 0 : typeCount / bandTypeCount;
  }

  function tokenShare(tokenCount: number, bandTokenCount: number) {
    return bandTokenCount === 0 ? 0 : tokenCount / bandTokenCount;
  }

  async function showExamples(bandId: string, coverageCode: number) {
    if (!profile) return;
    selection = { bandId, coverageCode };
    drilldown = null;
    drilldownError = null;
    drilldownLoading = true;
    const request = ++requestNumber;
    try {
      const loaded = await loadDml6CoverageDrilldown(profile, bandId, coverageCode);
      if (request !== requestNumber) return;
      drilldown = loaded;
    } catch (cause) {
      if (request !== requestNumber) return;
      drilldownError = cause instanceof Error ? cause.message : String(cause);
    } finally {
      if (request === requestNumber) drilldownLoading = false;
    }
  }

  function csvCell(value: string | number) {
    return `"${String(value).replaceAll('"', '""')}"`;
  }

  function downloadSummary() {
    if (!profile) return;
    const rows = [
      ['Dažnumo intervalas', 'DML6 aprėptis', 'Žodžių formų skaičius', 'Žodžių formų dalis intervale', 'JCL žetonų skaičius', 'JCL žetonų dalis intervale'],
      ...profile.summary.bands.flatMap((band) => categories.map((category) => {
        const summary = band.categories.find((item) => item.coverageCode === category.code);
        return [
          band.label,
          category.label,
          summary?.typeCount ?? 0,
          typeShare(summary?.typeCount ?? 0, band.typeCount),
          summary?.tokenCount ?? 0,
          tokenShare(summary?.tokenCount ?? 0, band.tokenCount)
        ];
      }))
    ];
    const csv = `\ufeff${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dml6-jcl-zodyno-apreptis-pagal-daznuma.csv';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  $effect(() => {
    let cancelled = false;
    loadDml6CoverageProfile().then((loaded) => {
      if (cancelled) return;
      profile = loaded;
      loading = false;
    }).catch((cause) => {
      if (cancelled) return;
      error = cause instanceof Error ? cause.message : String(cause);
      loading = false;
    });

    return () => {
      cancelled = true;
    };
  });
</script>

<svelte:head>
  <title>žodyno aprėptis pagal dažnumą</title>
  <meta name="description" content="Jungtinio lietuvių kalbos tekstyno žodžių formų aprėptis Dabartinės lietuvių kalbos žodyne pagal skaidrius dažnumo intervalus." />
</svelte:head>

<main>
  <header>
  <SectionHeading>Žodyno aprėptis pagal dažnumą</SectionHeading>
  <p class="intro">Kurios Jungtinio lietuvių kalbos tekstyno formos aptinkamos DML6 žodyne?</p>
  </header>

  {#if loading}
    <p class="status" role="status" aria-live="polite">Kraunama aprėpties suvestinė…</p>
  {:else if error}
    <section class="error" role="alert" aria-labelledby="coverage-load-error">
      <h2 id="coverage-load-error">Nepavyko įkelti aprėpties duomenų</h2>
      <p>{error}</p>
    </section>
  {:else if profile}
    <section aria-labelledby="bands-title">
      <div class="section-heading">
        <div>
          <SectionHeading id="bands-title">Aprėptis dažnumo intervaluose</SectionHeading>
        </div>
        <button type="button" class="text-button" onclick={downloadSummary}>Atsisiųsti CSV</button>
      </div>

      <div class="bands">
        {#each profile.summary.bands as band}
          <article class="band" aria-labelledby={`band-${band.id}`}>
            <header>
              <SectionHeading level={3} id={`band-${band.id}`}>Dažnumas {bandLabel(band)}</SectionHeading>
              <p>{formatNumber(band.typeCount)} formų <span class="inline-separator" aria-hidden="true">//</span> {formatNumber(band.tokenCount)} žetonų</p>
            </header>
            <div class="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th scope="col">DML6 aprėptis</th>
                    <th scope="col">Žodžių formos</th>
                    <th scope="col">JCL žetonai</th>
                  </tr>
                </thead>
                <tbody>
                  {#each categories as category}
                    {@const summary = band.categories.find((item) => item.coverageCode === category.code)}
                    {#if summary}
                      <tr>
                        <th scope="row"><span>{category.label}</span><button type="button" class="text-button" aria-expanded={selection?.bandId === band.id && selection?.coverageCode === category.code} aria-controls={`examples-${band.id}`} disabled={summary.drilldown.records === 0} onclick={() => showExamples(band.id, category.code)}>Pavyzdžiai ({summary.drilldown.records})</button></th>
                        <td>
                          <strong>{formatNumber(summary.typeCount)}</strong>
                          <span>{formatPercent(typeShare(summary.typeCount, band.typeCount))} intervalo formų</span>
                        </td>
                        <td>
                          <strong>{formatNumber(summary.tokenCount)}</strong>
                          <span>{formatPercent(tokenShare(summary.tokenCount, band.tokenCount))} intervalo žetonų</span>
                        </td>
                      </tr>
                    {/if}
                  {/each}
                </tbody>
              </table>
            </div>
    {#if selection?.bandId === band.id && selectedBand && selectedCategory}
      <section class="examples" id={`examples-${band.id}`} aria-labelledby="examples-title" aria-live="polite">
        <SectionHeading level={3} id="examples-title">Pavyzdžiai: {selectedCategoryLabel}, dažnumas {bandLabel(selectedBand)}</SectionHeading>
        <p>Iki {formatNumber(selectedCategory.drilldown.records)} formų nuo dažniausios iki rečiausios; ne visa kategorija.</p>
        {#if drilldownLoading}
          <p role="status">Kraunami pasirinktos kategorijos pavyzdžiai…</p>
        {:else if drilldownError}
          <p class="error-message" role="alert">{drilldownError}</p>
        {:else if drilldown}
          <div class="table-scroll">
            <table>
              <thead><tr><th scope="col">Rangas</th><th scope="col">Žodžio forma</th><th scope="col">JCL žetonų skaičius</th></tr></thead>
              <tbody>
                {#each drilldown.records as record, index}
                  <tr><td>{index + 1}</td><td>{record[0]}</td><td>{formatNumber(record[1])}</td></tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </section>
    {/if}

          </article>
        {/each}
      </div>
    </section>

    <details class="reading-notes"><summary>Kaip skaityti aprėptį</summary><div class="details-content">
<p>{formatNumber(profile.summary.totalTypeCount)} formų ir {formatNumber(profile.summary.totalTokenCount)} JCL pavartojimų; šeši dažnumo intervalai.</p>
      <p>Formų dalis ir pavartojimų dalis skiriasi: daug retų formų gali sudaryti mažą tekstyno dalį.</p>
    <dl class="source-facts">
      <div>
        <dt>Duomenų vienetas</dt>
        <dd>Žodžio forma</dd>
      </div>
      <div>
        <dt>Dažnumo matas</dt>
        <dd>JCL žetonų skaičius</dd>
      </div>
      <div>
        <dt>Aprėpties šaltinis</dt>
        <dd>Dabartinės lietuvių kalbos žodynas (DML6)</dd>
      </div>
      <div>
        <dt>Licencija</dt>
        <dd>{profile.provenance.licence}</dd>
      </div>
    </dl>


      <ul>
        <li>Aprėpties kodas yra kategorija: jo negalima vidurkinti ar sudėti kaip skaitinio balo.</li>
        <li>Žodyne nerasta forma nebūtinai yra klaida, neologizmas ar nelietuviškas žodis.</li>
        <li>Čia lyginamos žodžių formos ir vieno tekstyno žetonų skaičiai; rezultatas nėra bendras visų lietuvių kalbos tekstynų reitingas.</li>
      </ul>
      <p><a href={profile.provenance.sourceUrl} target="_blank" rel="noreferrer">Atverti pirminį CLARIN-LT šaltinio įrašą</a> <span class="inline-separator" aria-hidden="true">//</span> {profile.provenance.citation}</p>
    </div></details>
  {/if}
</main>

<style>
  main {
    display: grid;
    gap: 2rem;
  }


  .intro,
  .band header p,
  .examples > p,
  .reading-notes p {
    color: color-mix(in srgb, var(--text-color) 78%, transparent);
  }

  .source-facts,
  .band,
  .examples,
  .error,
  .status {
    border: 0;
    padding: 0;
  }

  .band header p,
  .examples > p,
  .reading-notes p {
    margin-top: var(--xs);
  }

  .source-facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sm);
  }

  .source-facts > div { min-width: 0; border: 0; padding-left: 0; }

  dt {
    color: color-mix(in srgb, var(--text-color) 68%, transparent);
    font-size: 0.875em;
  }

  dd {
    margin: 0;
  }

  .section-heading { display: flex; align-items: baseline; flex-wrap: wrap; justify-content: space-between; gap: 1rem; }
  .section-heading :global(.dago-section-heading) { margin: 0; }
  .section-heading button { flex-shrink: 0; }
  .bands {
    display: grid;
    gap: 2rem;
    margin-top: 1.5rem;
  }

  .band {
    overflow: hidden;
  }

  .band header {
    display: flex;
    align-items: baseline;
    gap: var(--sm);
    justify-content: space-between;
    margin-bottom: var(--sm);
  }

  .table-scroll {
    overflow-x: auto;
  }

  table {
    min-width: 32rem;
  }

  th,
  td {
    text-align: left;
    vertical-align: top;
  }

  th .text-button { display: block; margin-top: .5rem; }
  td strong,
  td span {
    display: block;
  }

  td span {
    color: color-mix(in srgb, var(--text-color) 72%, transparent);
    font-size: 0.875em;
    margin-top: var(--xs);
  }

  .examples {
    margin-top: 1.5rem;
    display: grid;
    gap: var(--sm);
  }

  .error {
    border-color: var(--border-strong);
  }

  .error-message {
    color: var(--text-color);
  }

  @media (max-width: 639px) {
      .band header {
      align-items: stretch;
      flex-direction: column;
    }

    .source-facts {
      grid-template-columns: minmax(0, 1fr);
    }

    table {
      min-width: 32rem;
    }
  }
</style>
