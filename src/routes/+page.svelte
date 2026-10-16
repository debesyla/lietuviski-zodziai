<script lang="ts">
  import SectionHeading from '../components/SectionHeading.svelte';
  import DataLoader from '../components/DataLoader.svelte';
  import PageMeta from '../components/PageMeta.svelte';
  import { base } from '$app/paths';
  import { t } from '$lib/translations';
  import { loadCatalog, type DatasetCatalog } from '$lib/data';
  import { site } from '$lib/site';

  const researchTools = [
    { href: `${base}/zodyno-apreptis`, title: 'DML6 žodyno aprėptis', description: 'Kurios dažnos formos patenka į žodyną?' },
    { href: `${base}/karo-zodziu-palyginimas`, title: 'Karo meto vartosena', description: 'Žodžio forma trijuose laikotarpių šaltiniuose.' },
    { href: `${base}/zanru-profilis`, title: 'CCLL žanrų profilis', description: 'Žodžio dažnis pagal tekstų žanrą.' },
    { href: `${base}/blkt-profilis`, title: 'BLKT profilis', description: 'Žodžio forma pagal teksto tipą ir laikotarpį.' },
    { href: `${base}/sintakse`, title: 'ALKSNIS sintaksė', description: 'Lemų ryšiai ir sakinių kontekstai.' }
  ];

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

<PageMeta title="dažniausi žodžiai // dago" url={site.homeUrl} />

<main>
  <p>Dažnumo sąrašai iš lietuvių kalbos tekstynų: ieškokite žodžio, filtruokite pagal kalbos dalį, atsisiųskite CSV.</p>

  <section class="explorer" aria-label="Žodžių paieška">
    {#if catalogLoading}
      <p class="note" role="status">{t('loadingCatalog')}</p>
    {:else if catalogError}
      <p class="notice error" role="alert">{catalogError}</p>
    {:else if catalog && catalog.datasets.length > 0}
      {#if selectedDataset}<DataLoader filename={selectedDataset.file} datasets={catalog.datasets} {selectedDatasetId} onselectDataset={selectDataset} />{/if}
    {:else}
      <p role="status">{t('noDatasets')}</p>
    {/if}
  </section>

  <section class="stack" aria-labelledby="research-tools-title">
    <SectionHeading id="research-tools-title">Kiti tyrinėjimo būdai</SectionHeading>
    <ul class="research-tools">
      {#each researchTools as tool}
        <li><a href={tool.href}><strong>{tool.title}</strong></a> <span class="note">– {tool.description}</span></li>
      {/each}
    </ul>
  </section>
</main>

<style>
  .explorer { display: grid; gap: 3rem; grid-template-columns: minmax(0, 1fr); }
  .research-tools li + li { margin-top: .75rem; }
</style>
