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
  const dataProductsCatalogue = `${base}/duomenu-katalogas`;
  const dataProductsCatalog = `${base}/data-products/catalog.json`;
  const methodologyUrl = `${base}/apie`;
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
  <title>{site.name} · lietuvių kalbos dažnumo duomenys</title>
  <meta name="description" content={site.description} />
  <link rel="canonical" href={site.homeUrl} />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="lt_LT" />
  <meta property="og:site_name" content={site.name} />
  <meta property="og:title" content={`${site.name} · lietuvių kalbos dažnumo duomenys`} />
  <meta property="og:description" content={site.description} />
  <meta property="og:url" content={site.homeUrl} />
  <meta property="og:image" content={site.socialImageUrl} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Dažniausi lietuviški žodžiai – viešų lietuvių kalbos dažnumo sąrašų tyrinėjimas" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={`${site.name} · lietuvių kalbos dažnumo duomenys`} />
  <meta name="twitter:description" content={site.description} />
  <meta name="twitter:image" content={site.socialImageUrl} />
  <meta name="twitter:image:alt" content="Dažniausi lietuviški žodžiai – viešų lietuvių kalbos dažnumo sąrašų tyrinėjimas" />
</svelte:head>

<main class="home-page">
  <section class="hero" aria-labelledby="home-title">
    <p class="eyebrow">Lietuvių kalbos duomenys</p>
    <h1 id="home-title">{t('pageTitle')}</h1>
    <p class="lead">{t('siteIntroduction')}</p>
    <a class="method-link" href={methodologyUrl}>{t('openMethodology')} <span aria-hidden="true">→</span></a>
  </section>

  <section class="primary-explorer" aria-labelledby="explorer-title">
    <div class="section-heading">
      <div>
        <p class="step">01</p>
        <h2 id="explorer-title">Pasirinkite šaltinį</h2>
      </div>
      <p>Skaičiai visada aprašo pasirinktą duomenų rinkinį.</p>
    </div>

    {#if catalogLoading}
      <div class="loading" role="status" aria-live="polite">{t('loadingCatalog')}</div>
    {:else if catalogError}
      <div class="error" role="alert">
        <h2>{t('errorLoadingCatalog')}</h2>
        <p>{catalogError}</p>
      </div>
    {:else if catalog && catalog.datasets.length > 0}
      <div class="dataset-selector">
        <label for="dataset-select">{t('selectDataset')}</label>
        <select id="dataset-select" aria-label={`${t('selectDataset')}:`} value={selectedDatasetId} onchange={selectDataset}>
          {#each catalog.datasets as dataset}
            <option value={dataset.id}>{dataset.title} ({dataset.year})</option>
          {/each}
        </select>
      </div>

      {#if selectedDataset}
        <DataLoader filename={selectedDataset.file} />
      {/if}
    {:else}
      <p class="empty-catalog" role="status">{t('noDatasets')}</p>
    {/if}
  </section>

  <section class="research-tools" aria-labelledby="data-products-title">
    <div class="section-heading">
      <div>
        <p class="step">02</p>
        <h2 id="data-products-title">Kiti tyrinėjimo būdai</h2>
      </div>
      <p>{t('dataProductsDescription')}</p>
    </div>

    <div class="tool-grid">
      <article>
        <p class="eyebrow">Žodynas</p>
        <h3>DML6 aprėptis</h3>
        <p>Kurios dažnos formos patenka į žodyną?</p>
        <a href={coverageProfile}>Tyrinėti DML6 žodyno aprėptį pagal dažnumą <span aria-hidden="true">→</span></a>
      </article>
      <article>
        <p class="eyebrow">Laikotarpiai</p>
        <h3>Karo meto vartosena</h3>
        <p>Palyginkite tą pačią formą trijuose šaltiniuose.</p>
        <a href={wartimeContrast}>Palyginti CCLL2 ir karo laikotarpio žodžių formas <span aria-hidden="true">→</span></a>
      </article>
      <article>
        <p class="eyebrow">Žanrai</p>
        <h3>CCLL profilis</h3>
        <p>Kaip žodžio dažnis skiriasi tarp tekstų žanrų?</p>
        <a href={genreProfile}>Palyginti CCLL žanrus pagal žodžio formą <span aria-hidden="true">→</span></a>
      </article>
      <article>
        <p class="eyebrow">Tekstynas</p>
        <h3>BLKT profilis</h3>
        <p>Palyginkite formą pagal teksto tipą ir laikotarpį.</p>
        <a href={blktProfile}>Tyrinėti BLKT žodžio profilį pagal teksto tipą ir laikotarpį <span aria-hidden="true">→</span></a>
      </article>
      <article>
        <p class="eyebrow">Sintaksė</p>
        <h3>ALKSNIS kontekstai</h3>
        <p>Raskite lemos ryšius ir trumpus sakinių kontekstus.</p>
        <a href={syntaxExplorerUrl}>Atverti sintaksės kontekstų tyrinėjimą <span aria-hidden="true">→</span></a>
      </article>
      <article class="catalogue-card">
        <p class="eyebrow">Visi duomenys</p>
        <h3>Viešas katalogas</h3>
        <p>Apimtis, licencijos ir interpretavimo ribos vienoje vietoje.</p>
        <a href={dataProductsCatalogue}>{t('openDataProducts')} <span aria-hidden="true">→</span></a>
        <a class="secondary-link" href={dataProductsCatalog}>{t('openDataProductsJson')}</a>
      </article>
    </div>
  </section>
</main>

<style>
  .home-page {
    display: grid;
    gap: clamp(3rem, 8vw, 6rem);
  }

  .hero {
    max-width: 58rem;
  }

  .hero h1 {
    font-size: clamp(2rem, 6vw, 4.75rem);
    letter-spacing: -0.055em;
    line-height: 0.98;
    margin: var(--sm) 0 var(--lg);
    max-width: 13ch;
  }

  .hero .lead {
    color: var(--muted-color);
    margin-bottom: var(--md);
    max-width: 54ch;
  }

  .method-link {
    font-size: 0.875rem;
  }

  .primary-explorer {
    border-top: 1px solid var(--border-color);
    padding-top: var(--xl);
  }

  .section-heading {
    align-items: end;
    display: flex;
    gap: var(--md) var(--xl);
    justify-content: space-between;
    margin-bottom: var(--xl);
  }

  .section-heading h2,
  .section-heading p {
    margin: 0;
  }

  .section-heading > p {
    color: var(--muted-color);
    font-size: 0.875rem;
    max-width: 42ch;
  }

  .step {
    color: var(--muted-color);
    font-size: 0.75rem;
    margin-bottom: var(--xs) !important;
  }

  .dataset-selector {
    display: grid;
    gap: var(--sm);
    margin-bottom: var(--xl);
  }

  .dataset-selector label {
    font-size: 0.875rem;
    font-weight: bold;
  }

  .dataset-selector select {
    font-weight: bold;
    max-width: 58rem;
    width: 100%;
  }

  .loading,
  .error,
  .empty-catalog {
    border: 1px solid var(--border-color);
    padding: var(--md);
  }

  .research-tools {
    border-top: 1px solid var(--border-color);
    padding-top: var(--xl);
  }

  .tool-grid {
    display: grid;
    gap: var(--md);
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .tool-grid article {
    background: var(--surface-color);
    border: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    min-height: 15rem;
    padding: var(--lg);
  }

  .tool-grid article:hover {
    border-color: var(--border-strong);
  }

  .tool-grid h3 {
    margin: var(--sm) 0;
  }

  .tool-grid article > p:not(.eyebrow) {
    color: var(--muted-color);
    margin-bottom: var(--lg);
  }

  .tool-grid article > a:not(.secondary-link) {
    margin-top: auto;
  }

  .secondary-link {
    font-size: 0.75rem;
    margin-top: var(--md);
  }

  @media (max-width: 56rem) {
    .tool-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 40rem) {
    .section-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .tool-grid {
      grid-template-columns: 1fr;
    }

    .tool-grid article {
      min-height: 0;
    }
  }
</style>
