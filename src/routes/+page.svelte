<script lang="ts">
  import SectionHeading from '../components/SectionHeading.svelte';
  import DataLoader from '../components/DataLoader.svelte';
  import PageMeta from '../components/PageMeta.svelte';
  import { base } from '$app/paths';
  import { t } from '$lib/translations';
  import { loadCatalog, type DatasetCatalog } from '$lib/data';
  import { site } from '$lib/site';
  import { researchTools, toolUrl } from '$lib/research-tools';

  const catalogueUrl = `${base}/duomenu-katalogas`;

  let catalog = $state<DatasetCatalog | null>(null);
  let catalogLoading = $state(true);
  let catalogError = $state<string | null>(null);
  let selectedDatasetId = $state('');

  let selectedDataset = $derived(catalog?.datasets.find((dataset) => dataset.id === selectedDatasetId));

  function selectDataset(event: Event) {
    selectedDatasetId = (event.currentTarget as HTMLSelectElement).value;
  }

  $effect(() => {
    let cancelled = false;
    catalogLoading = true;
    catalogError = null;
    loadCatalog().then((loadedCatalog) => {
      if (cancelled) return;
      catalog = loadedCatalog;
      const requestedSource = new URLSearchParams(window.location.search).get('source');
      selectedDatasetId = loadedCatalog.datasets.find(dataset => dataset.id === requestedSource)?.id
        ?? loadedCatalog.defaultDatasetId ?? loadedCatalog.datasets[0]?.id ?? '';
      catalogLoading = false;
    }).catch((error) => {
      if (cancelled) return;
      catalogError = error instanceof Error ? error.message : String(error);
      catalogLoading = false;
    });

    return () => {
      cancelled = true;
    };
  });
</script>

<PageMeta title="dažniausi lietuviški žodžiai // dago" url={site.homeUrl} />

{#snippet researchCards()}
  <section class="stack" aria-labelledby="research-tools-title">
    <SectionHeading id="research-tools-title">Ką dar galima ištirti</SectionHeading>
    <ul class="research-tools" aria-labelledby="research-tools-title">
      {#each researchTools as tool (tool.id)}
        <li class="tool-card">
          <h3><a href={toolUrl(tool)}>{tool.question}</a></h3>
          <p class="note">{tool.description}</p>
          <p class="note">{tool.source}{#if tool.unit}{' '}· ieškoma: {tool.unit}{/if}</p>
          {#if tool.example}<p>Pabandykite: <a href={toolUrl(tool, tool.example)}>{tool.example}</a></p>{/if}
        </li>
      {/each}
      <li class="tool-card">
        <h3><a href={catalogueUrl}>Kokie duomenys čia yra?</a></h3>
        <p class="note">Visi rinkiniai su šaltiniais, licencijomis ir naudojimo ribomis. Dalį jų galima atsisiųsti JSON formatu.</p>
      </li>
    </ul>
  </section>
{/snippet}

<main>
  <header class="intro">
    <p class="lead">Kurie žodžiai kartojasi dažniausiai?</p>
    <p>Vieši tekstynų duomenys iš knygų, spaudos, teisės dokumentų ir interneto. Patikrinkite savo lietuvių kalbos žinias.</p>
  </header>

  <section class="explorer" aria-label="Dažnumo sąrašai">
    {#if catalogLoading}
      <p class="note" role="status">{t('loadingCatalog')}</p>
    {:else if catalogError}
      <p class="notice error" role="alert">{catalogError}</p>
      {@render researchCards()}
    {:else if catalog && catalog.datasets.length > 0}
      {#if selectedDataset}<DataLoader filename={selectedDataset.file} datasets={catalog.datasets} {selectedDatasetId} onselectDataset={selectDataset} afterTopWords={researchCards} />{/if}
    {:else}
      <p role="status">{t('noDatasets')}</p>
      {@render researchCards()}
    {/if}
  </section>
</main>

<style>
  .intro { display: grid; gap: .75rem; grid-template-columns: minmax(0, 1fr); }
  .intro > * { margin: 0; }
  .lead { font-weight: 700; }
  .explorer { display: grid; gap: 3rem; grid-template-columns: minmax(0, 1fr); }
  /* Cards follow the dago.lt/irankiai tool list: a 1px amber frame, no radius or shadow. */
  .research-tools { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); list-style: none; margin: 0; padding: 0; }
  .research-tools li + li { margin-top: 0; }
  .tool-card { align-content: start; border: 1px solid hsl(var(--theme) / .35); display: grid; gap: .5rem; padding: clamp(1rem, 4vw, 1.25rem); }
  .tool-card > * { margin: 0; }
  .tool-card h3 { font-size: 1em; }
</style>
