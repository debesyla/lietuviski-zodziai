<script lang="ts">
  import DataLoader from '../components/DataLoader.svelte';
  import { base } from '$app/paths';
  import { t } from '$lib/translations';
  import { loadCatalog, type DatasetCatalog } from '$lib/data';
  import { site } from '$lib/site';

  let catalog = $state<DatasetCatalog | null>(null);
  let catalogLoading = $state(true);
  let catalogError = $state<string | null>(null);
  let selectedDatasetId = $state('');
  const coverageProfile = `${base}/zodyno-apreptis`;
  const wartimeContrast = `${base}/karo-zodziu-palyginimas`;
  const genreProfile = `${base}/zanru-profilis`;
  const blktProfile = `${base}/blkt-profilis`;
  const syntaxExplorerUrl = `${base}/sintakse`;

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
      selectedDatasetId = loadedCatalog.defaultDatasetId ?? loadedCatalog.datasets[0]?.id ?? '';
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

<svelte:head>
  <title>dažniausi žodžiai // dago</title>
  <meta name="description" content={site.description} />
  <link rel="canonical" href={site.homeUrl} />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="lt_LT" />
  <meta property="og:site_name" content={site.name} />
  <meta property="og:title" content="dažniausi žodžiai // dago" />
  <meta property="og:description" content={site.description} />
  <meta property="og:url" content={site.homeUrl} />
  <meta property="og:image" content={site.socialImageUrl} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Lietuviški žodžiai – viešų lietuvių kalbos dažnumo sąrašų tyrinėjimas" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="dažniausi žodžiai // dago" />
  <meta name="twitter:description" content={site.description} />
  <meta name="twitter:image" content={site.socialImageUrl} />
  <meta name="twitter:image:alt" content="Lietuviški žodžiai – viešų lietuvių kalbos dažnumo sąrašų tyrinėjimas" />
</svelte:head>

<main class="home-page">
  <p class="intro">Dažnumo sąrašai iš lietuvių kalbos tekstynų.</p>
  <section class="primary-explorer" aria-label="Žodžių paieška">
    {#if catalogLoading}
      <p class="loading" role="status">{t('loadingCatalog')}</p>
    {:else if catalogError}
      <p class="error" role="alert">{catalogError}</p>
    {:else if catalog && catalog.datasets.length > 0}
      {#if selectedDataset}<DataLoader filename={selectedDataset.file} datasets={catalog.datasets} {selectedDatasetId} onselectDataset={selectDataset} />{/if}
    {:else}<p role="status">{t('noDatasets')}</p>{/if}
  </section>
  <section class="research-tools">
    <h2>Kiti tyrinėjimo būdai</h2>
    <ul>
      <li><a href={coverageProfile}><strong>DML6 žodyno aprėptis</strong></a><p>Kurios dažnos formos patenka į žodyną?</p></li>
      <li><a href={wartimeContrast}><strong>Karo meto vartosena</strong></a><p>Žodžio forma trijuose laikotarpių šaltiniuose.</p></li>
      <li><a href={genreProfile}><strong>CCLL žanrų profilis</strong></a><p>Žodžio dažnis pagal tekstų žanrą.</p></li>
      <li><a href={blktProfile}><strong>BLKT profilis</strong></a><p>Žodžio forma pagal teksto tipą ir laikotarpį.</p></li>
      <li><a href={syntaxExplorerUrl}><strong>ALKSNIS sintaksė</strong></a><p>Lemų ryšiai ir sakinių kontekstai.</p></li>
    </ul>
  </section>
</main>
<style>
.home-page { display: grid; gap: 2rem; max-width: 100ch; }
.intro, .research-tools { max-width: 75ch; }
.research-tools { margin-top: 1rem; }
.research-tools h2 { margin: 0 0 1rem; }
.research-tools li + li { margin-top: 1.5rem; }
.research-tools li p { margin-top: .25rem; }
</style>
