<script lang="ts">
  import SectionHeading from '../../components/SectionHeading.svelte';
  import RateBars from '../../components/RateBars.svelte';
  import PageMeta from '../../components/PageMeta.svelte';
  import TableScroll from '../../components/TableScroll.svelte';
  import {
    coverageCategoryDefinitions,
    loadDml6CoverageDrilldown,
    loadDml6CoverageProfile,
    type CoverageCategoryDefinition,
    type Dml6CoverageDrilldown,
    type Dml6CoverageProfile
  } from '$lib/dml6-coverage';
  import { saveFile } from '$lib/download';
  import { site } from '$lib/site';

  type Band = Dml6CoverageProfile['summary']['bands'][number];
  type Measure = 'types' | 'tokens';

  const categoryNames: Record<string, string> = {
    'not in DML6': 'Nerasta DML6',
    'main entry': 'Pagrindinis įrašas',
    'geographic name': 'Vietovardis',
    abbreviation: 'Santrumpa'
  };
  const notFoundCode = 0;

  let profile = $state<Dml6CoverageProfile | null>(null);
  let error = $state<string | null>(null);
  let loading = $state(true);
  let measure = $state<Measure>('types');
  let selection = $state<{ bandId: string; coverageCode: number } | null>(null);
  let drilldown = $state<Dml6CoverageDrilldown | null>(null);
  let drilldownLoading = $state(false);
  let drilldownError = $state<string | null>(null);
  let requestNumber = 0;

  let categories = $derived<CoverageCategoryDefinition[]>(profile
    ? coverageCategoryDefinitions(profile).map((category) => ({ ...category, label: categoryNames[category.label] ?? category.label }))
    : []);
  let selectedBand = $derived(profile?.summary.bands.find((band) => band.id === selection?.bandId) ?? null);
  let selectedCategory = $derived(selectedBand?.categories.find((category) => category.coverageCode === selection?.coverageCode) ?? null);
  let selectedCategoryLabel = $derived(categories.find((category) => category.code === selection?.coverageCode)?.label ?? '');
  let examplesStatus = $derived(drilldownLoading ? 'Kraunami pavyzdžiai…'
    : drilldown && selectedBand ? `Įkelta pavyzdžių: ${drilldown.records.length}. ${selectedCategoryLabel}, dažnumas ${bandLabel(selectedBand)}.`
    : '');

  function formatNumber(value: number) {
    return value.toLocaleString('lt-LT');
  }

  function formatPercent(value: number) {
    if (value > 0 && value < 0.0005) return '<0,1 %';
    return new Intl.NumberFormat('lt-LT', { style: 'percent', maximumFractionDigits: 1 }).format(value);
  }

  function bandLabel(band: Band) {
    return band.maximum === null ? `${formatNumber(band.minimum)}+` : band.minimum === band.maximum ? formatNumber(band.minimum) : `${formatNumber(band.minimum)}–${formatNumber(band.maximum)}`;
  }

  function count(item: { typeCount: number; tokenCount: number }, activeMeasure: Measure) {
    return activeMeasure === 'types' ? item.typeCount : item.tokenCount;
  }

  function share(part: number, total: number) {
    return total === 0 ? 0 : part / total;
  }

  function foundShare(band: Band, activeMeasure: Measure) {
    const found = band.categories
      .filter((category) => category.coverageCode !== notFoundCode)
      .reduce((sum, category) => sum + count(category, activeMeasure), 0);
    return share(found, count(band, activeMeasure));
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
          share(summary?.typeCount ?? 0, band.typeCount),
          summary?.tokenCount ?? 0,
          share(summary?.tokenCount ?? 0, band.tokenCount)
        ];
      }))
    ];
    saveFile(`﻿${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`, 'dml6-jcl-zodyno-apreptis-pagal-daznuma.csv', 'text/csv;charset=utf-8');
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

<PageMeta
  title="dml6 žodyno aprėptis // dažniausi žodžiai"
  description="Kuri Jungtinio lietuvių kalbos tekstyno žodžių formų dalis aptinkama Dabartinės lietuvių kalbos žodyne (DML6), pagal dažnumą."
  url={site.coverageProfileUrl}
/>

<main>
  <header class="stack">
    <SectionHeading>Žodyno aprėptis pagal dažnumą</SectionHeading>
    <p>Kurios Jungtinio lietuvių kalbos tekstyno (JCL) žodžių formos yra Dabartinės lietuvių kalbos žodyne (DML6)? Kuo forma dažnesnė, tuo dažniau ji žodyne randama.</p>
  </header>

  {#if loading}
    <p class="note" role="status" aria-live="polite">Kraunama aprėpties suvestinė…</p>
  {:else if error}
    <div class="notice error" role="alert">
      <p><strong>Nepavyko įkelti aprėpties duomenų.</strong></p>
      <p>{error}</p>
    </div>
  {:else if profile}
    <fieldset class="measure">
      <legend>Skaičiuoti</legend>
      <label><input type="radio" name="measure" value="types" bind:group={measure} /> skirtingas formas</label>
      <label><input type="radio" name="measure" value="tokens" bind:group={measure} /> visus pavartojimus</label>
    </fieldset>

    <section class="stack" aria-labelledby="found-title">
      <SectionHeading id="found-title">Rasta DML6 pagal dažnumą</SectionHeading>
      <p class="note">Kiek {measure === 'types' ? 'formų' : 'pavartojimų'} kiekviename dažnumo intervale turi DML6 įrašą: pagrindinį, vietovardžio ar santrumpos.</p>
      <RateBars
        rows={profile.summary.bands.map((band) => ({ label: bandLabel(band), value: foundShare(band, measure) }))}
        unit="Rasta DML6 pagal dažnumą"
        max={1}
        format={(value) => formatPercent(value ?? 0)}
      />
    </section>

    <section class="stack" aria-labelledby="bands-title">
      <div class="section-head">
        <SectionHeading id="bands-title">Aprėptis dažnumo intervaluose</SectionHeading>
        <button type="button" class="text-button" onclick={downloadSummary}>Atsisiųsti CSV</button>
      </div>
      <p class="note">Spustelėkite skaičių ir pamatysite dažniausias tos grupės formas.</p>
      <TableScroll label="Aprėpties lentelė">
        <table>
          <thead>
            <tr>
              <th scope="col">Dažnumas</th>
              {#each categories as category}
                <th scope="col" class="number">{category.label}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each profile.summary.bands as band (band.id)}
              <tr>
                <th scope="row">{bandLabel(band)}<span class="cell-note">{formatNumber(count(band, measure))}</span></th>
                {#each categories as category}
                  {@const summary = band.categories.find((item) => item.coverageCode === category.code)}
                  <td class="number">
                    {#if summary}
                      <button
                        type="button"
                        class="text-button"
                        aria-pressed={selection?.bandId === band.id && selection?.coverageCode === category.code}
                        disabled={summary.drilldown.records === 0}
                        onclick={() => showExamples(band.id, category.code)}
                      >{formatNumber(count(summary, measure))}<span class="sr-only"> – {category.label}, dažnumas {bandLabel(band)}: pavyzdžiai</span></button>
                      <span class="cell-note">{formatPercent(share(count(summary, measure), count(band, measure)))}</span>
                    {:else}
                      <span class="cell-note">–</span>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </TableScroll>
    </section>

    <p class="sr-only" role="status" aria-live="polite">{examplesStatus}</p>
    {#if selectedBand && selectedCategory}
      <section class="stack" aria-labelledby="examples-title">
        <SectionHeading id="examples-title">Pavyzdžiai: {selectedCategoryLabel}, dažnumas {bandLabel(selectedBand)}</SectionHeading>
        <p class="note">Iki {formatNumber(selectedCategory.drilldown.records)} formų nuo dažniausios; ne visa grupė. Skaičius – pavartojimai JCL.</p>
        {#if drilldownLoading}
          <p class="note" role="status">Kraunami pavyzdžiai…</p>
        {:else if drilldownError}
          <p class="notice error" role="alert">{drilldownError}</p>
        {:else if drilldown}
          <ol class="examples">
            {#each drilldown.records as record}
              <li>{record[0]} <span class="note">{formatNumber(record[1])}</span></li>
            {/each}
          </ol>
        {/if}
      </section>
    {/if}

    <div>
      <details>
        <summary>Kaip skaityti</summary>
        <div class="details-body">
          <p>{formatNumber(profile.summary.totalTypeCount)} žodžių formų ir {formatNumber(profile.summary.totalTokenCount)} JCL pavartojimų, suskirstytų į {profile.summary.bands.length} dažnumo intervalus.</p>
          <ul>
            <li>Formų dalis ir pavartojimų dalis skiriasi: daug retų formų gali sudaryti mažą tekstyno dalį.</li>
            <li>Aprėpties kodas yra kategorija: jo negalima vidurkinti ar sudėti kaip balo.</li>
            <li>Žodyne nerasta forma nebūtinai yra klaida, naujadaras ar nelietuviškas žodis.</li>
            <li>Lyginamos vieno tekstyno žodžių formos; tai nėra visos lietuvių kalbos reitingas.</li>
          </ul>
        </div>
      </details>
      <details>
        <summary>Šaltinis ir licencija</summary>
        <div class="details-body">
          <p>{profile.provenance.citation}</p>
          <p>Licencija: {profile.provenance.licence}</p>
          <p><a href={profile.provenance.sourceUrl} target="_blank" rel="noreferrer">Pirminis CLARIN-LT įrašas</a></p>
        </div>
      </details>
    </div>
  {/if}
</main>

<style>
  .measure { border: 0; display: flex; flex-wrap: wrap; gap: .5rem 1.5rem; margin: 0; padding: 0; }
  .measure legend { float: left; font-weight: 700; margin-right: .5rem; padding: 0; }
  .measure label { align-items: center; display: inline-flex; gap: .5rem; }
  td, th { vertical-align: top; }
  tbody th { background: hsl(var(--black)); left: 0; position: sticky; }
  td .text-button { text-align: right; }
  .cell-note { color: hsl(var(--theme) / .7); display: block; font-size: .875rem; font-weight: normal; }
  .examples { column-gap: 2rem; column-width: 12rem; overflow-wrap: anywhere; }
  .examples li { break-inside: avoid; }
  .examples li + li { margin-top: .25rem; }
</style>
