<script lang="ts">
  import { base } from '$app/paths';
  import { loadPublicDataProducts, type DataProductType, type PublicDataProduct } from '$lib/publication';
  import { site } from '$lib/site';

  type PrimaryAction = { href: string; label: string } | null;
  const homeUrl = `${base}/`;
  const explorerOrder = [
    'utka-2018-lemmatized-totals', 'dadurkevicius-2020-jcl-lemmas', 'petkevicius-2025-ccll-lemmas',
    'dadurkevicius-dml6-vs-jcl-comparison', 'utka-ccll2-war-ukraine-comparison',
    'utka-ccll-wordforms', 'vssa-2026-blkt-wordform-profile', 'rimkute-2019-alksnis-syntactic-context'
  ];
  const entryCopy: Record<string, { title: string; description: string }> = {
    'utka-2018-lemmatized-totals': { title: '1 mln. tekstyno lemos (2018)', description: 'Lemų dažniai ir kalbos dalių žymos.' },
    'dadurkevicius-2020-jcl-lemmas': { title: 'JCL lemos (2020)', description: 'Jungtinio lietuvių kalbos tekstyno lemų dažniai ir kalbos dalys.' },
    'petkevicius-2025-ccll-lemmas': { title: 'CCLL lemos (2025)', description: 'Dabartinės lietuvių kalbos tekstyno lemų dažnumo sąrašas.' },
    'utka-ccll-wordforms': { title: 'CCLL žanrų profilis', description: 'Žodžio formos dažnis penkiuose tekstų žanruose.' },
    'dadurkevicius-dml6-vs-jcl-comparison': { title: 'DML6 žodyno aprėptis', description: 'Kurios JCL žodžių formos aptinkamos žodyne?' },
    'utka-ccll2-war-ukraine-comparison': { title: 'Karo meto vartosena', description: 'Žodžio forma CCLL2, karo meto žiniasklaidoje ir socialiniuose tinkluose.' },
    'vssa-2026-blkt-wordform-profile': { title: 'BLKT žodžio profilis', description: 'Dažnis pagal teksto tipą ir laikotarpį; tik paskelbti suvestiniai duomenys.' },
    'rimkute-2019-alksnis-syntactic-context': { title: 'ALKSNIS sintaksė', description: 'Lemų ryšiai ir sakinių pavyzdžiai.' },
    'bielinskiene-2019-delfi-1grams': { title: 'Delfi.lt viengramiai', description: 'Atskirų tekstyno žetonų dažnumo sąrašas.' },
    'rimkute-2024-matas-v3-frequencies': { title: 'MATAS v3.0 dažniai', description: 'Lemų ir žodžių formų dažniai iš anotuoto tekstyno.' },
    'kapociute-dzikiene-2017-parliament-frequency-aggregates': { title: 'Parlamento kalbų dažniai', description: 'Viso tekstyno lemų ir žodžių formų suvestinės.' },
    'zemriete-2025-lithuanian-homoforms': { title: 'Lietuvių homoformos', description: 'Vienodai rašomų formų analizės.' },
    'raskinis-2025-foreign-name-transliterations': { title: 'Užsienio vardų atitikmenys', description: 'Vardų perteikimo poros ir atitikčių skaičiai.' },
    'birvinskaite-2026-lithuanian-basketball-slang': { title: 'Krepšinio žargonas', description: 'Lietuviški krepšinio žargono įrašai.' },
    'rimkute-morphemic-dictionary': { title: 'Morfemikos žodynas', description: '72 325 įrašai iš trijų 2011 m. žodyno tomų.' }
  };

  let products = $state<PublicDataProduct[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let groups = $derived([
    { id: 'explore', title: 'Tyrinėti naršyklėje', products: products.filter(product => explorerAction(product)).sort((a, b) => explorerRank(a) - explorerRank(b)) },
    { id: 'json', title: 'Rinkiniai JSON formatu', products: products.filter(product => product.publication.status === 'published' && !explorerAction(product)).sort((a, b) => displayTitle(a).localeCompare(displayTitle(b), 'lt')) },
    { id: 'metadata', title: 'Tik šaltinių aprašai', products: products.filter(product => product.publication.status === 'metadata-only') }
  ].filter(group => group.products.length));

  function displayTitle(product: PublicDataProduct) { return entryCopy[product.id]?.title ?? product.title; }
  function description(product: PublicDataProduct) { return entryCopy[product.id]?.description ?? product.publication.scope; }
  function explorerRank(product: PublicDataProduct) { const index = explorerOrder.indexOf(product.id); return index < 0 ? explorerOrder.length : index; }

  function limitation(product: PublicDataProduct) {
    const sourceSpecificLimits: Record<string, string> = {
      'kapociute-dzikiene-2017-parliament-frequency-aggregates': 'Pateikiamos tik viso tekstyno suvestinės; tai nėra autorystės nustatymo, politikų reitingavimo, citatų ar kalendorinės analizės priemonė.',
      'vssa-2026-blkt-wordform-profile': 'BLKT nėra reprezentatyvus visos lietuvių kalbos portretas, nes jame vyrauja žiniasklaida ir dokumentai. Tokenizatoriaus raidžių sekos nėra taisyklingumo ar lietuviškumo įvertinimas. Ieškoma tik viena tiksli forma; neskelbiami reitingai, potipiai, sankirtos ar saugos slenksčio nepasiekusios pjūvių šeimos.',
      'rimkute-morphemic-dictionary': 'Dažniai aprašo tik žodyno šaltinio tekstyną. PDF turi 61 eilute daugiau nei vėlesnei gyvai „Morfema“ bazei nurodomi 72 264 įrašai; gyvos bazės skaičius pateikiamas tik kontekstui, o ne kaip išgavimo tikslas. Tai nėra gyvos bazės eksportas.'
    };
    if (sourceSpecificLimits[product.id]) return sourceSpecificLimits[product.id];
    if (product.publication.reason) return product.publication.reason;

    const limits: Record<DataProductType, string> = {
      'generic-frequency-dataset': 'Skaičiai nėra bendras visos lietuvių kalbos populiarumo reitingas.',
      'chunked-wordform-list': 'Bendras ir subkorpusų dažnius reikia interpretuoti atskirai; tai nėra vienas bendras kalbos reitingas.',
      'chunked-frequency-list': 'Kiekvienas skaičius aprašo tik nurodytą tekstyną, o ne visą lietuvių kalbą.',
      'chunked-derived-frequency-list': 'Dažniai priklauso nuo šaltinio anotavimo ir atrankos; jie nėra bendras vartosenos matas.',
      'chunked-lexical-collection': 'Tai nėra dažnumo sąrašas: laukai ir reikšmės išlaiko konkretaus šaltinio paskirtį.',
      'chunked-syntactic-context': 'Kontekstai ir ryšiai aprašo tik šį medyną; iš jų negalima daryti bendrų kalbos vartosenos išvadų.',
      'chunked-comparison': 'Metrikos yra skirtos tik nurodytiems šaltiniams palyginti, o ne jų dažniams sudėti ar reitinguoti.',
      'metadata-only': 'Viešai pateiktas tik aprašas; žodyno eilutės, PDF puslapiai ir iš jų išgauti duomenys neskelbiami.'
    };
    return limits[product.productType];
  }

  function permissionDescription(product: PublicDataProduct) {
    if (product.id === 'rimkute-morphemic-dictionary') {
      return 'Leidžiama išgauti ir taisyti PDF duomenis, skelbti bei platinti visą išvestinį rinkinį ir statistiką, taip pat pernaudoti su įprastu priskyrimu.';
    }
    return product.provenance.permission?.scope ?? '';
  }

  function explorerAction(product: PublicDataProduct): PrimaryAction {
    if (product.publication.status === 'metadata-only') return null;

    if (product.productType === 'generic-frequency-dataset') {
      return { href: `${homeUrl}?source=${encodeURIComponent(product.id)}`, label: 'Tyrinėti' };
    }

    const explorerActions: Record<string, PrimaryAction> = {
      'utka-ccll-wordforms': {
        href: `${base}/zanru-profilis`,
        label: 'Tyrinėti žanrų profilį'
      },
      'dadurkevicius-dml6-vs-jcl-comparison': {
        href: `${base}/zodyno-apreptis`,
        label: 'Tyrinėti žodyno aprėptį'
      },
      'utka-ccll2-war-ukraine-comparison': {
        href: `${base}/karo-zodziu-palyginimas`,
        label: 'Palyginti šaltinius'
      },
      'rimkute-2019-alksnis-syntactic-context': {
        href: `${base}/sintakse`,
        label: 'Tyrinėti sintaksės kontekstus'
      },
      'vssa-2026-blkt-wordform-profile': {
        href: `${base}/blkt-profilis`,
        label: 'Tyrinėti BLKT žodžio profilį'
      }
    };

    return explorerActions[product.id] ?? null;
  }

  $effect(() => {
    let cancelled = false;
    loadPublicDataProducts().then((loadedProducts) => {
      if (cancelled) return;
      products = loadedProducts;
      loading = false;
    }).catch((loadError) => {
      if (cancelled) return;
      error = loadError instanceof Error ? loadError.message : String(loadError);
      loading = false;
    });

    return () => {
      cancelled = true;
    };
  });
</script>

<svelte:head>
  <title>viešų duomenų katalogas // dažniausi žodžiai</title>
  <meta name="description" content="Naršykite visus viešus lietuvių kalbos duomenų produktus: jų šaltinio apimtį, licenciją, prieigą ir interpretavimo ribas." />
  <link rel="canonical" href={site.catalogueUrl} />
  <meta property="og:title" content="Viešų duomenų katalogas // dažniausi žodžiai" />
  <meta property="og:description" content="Viešų lietuvių kalbos duomenų produktų apimtis, licencijos, prieiga ir ribos vienoje vietoje." />
  <meta property="og:url" content={site.catalogueUrl} />
</svelte:head>

<main class="catalogue">
  <header><h2>duomenų rinkiniai</h2></header>
  {#if loading}
    <p class="loading" role="status">Kraunami rinkiniai…</p>
  {:else if error}
    <section class="error" role="alert">
      <h3>Nepavyko įkelti katalogo</h3>
      <p>{error}</p>
    </section>
  {:else if groups.length === 0}
    <p role="status">Rinkinių nėra.</p>
  {:else}
    {#each groups as group}
      <section class="category" aria-label={group.title}>
        {#if group.id !== 'explore'}<h3>{group.title}</h3>{/if}
        <div class="entries">
          {#each group.products as product (product.id)}
            {@const action = explorerAction(product)}
            <article class="catalogue-entry" aria-labelledby={`product-${product.id}`}>
              <p class="entry-title" id={`product-${product.id}`}><strong><a href={action?.href ?? product.manifestUrl}>{displayTitle(product)}</a></strong></p>
              <p>{description(product)}</p>
              {#if product.publication.status === 'metadata-only'}<p>Tik aprašas; duomenų eilutės neskelbiamos.</p>{/if}
              <div class="entry-actions">
                {#if action}
                  <span class="resource-link"><a href={product.manifestUrl}>JSON</a><span class="inline-separator" aria-hidden="true">//</span></span>
                {/if}
                <a href={product.provenance.sourceUrl} target="_blank" rel="noreferrer">Šaltinis</a>
                <span class="inline-separator" aria-hidden="true">//</span>
                <details class="entry-details">
                  <summary class="text-button">Apie rinkinį</summary>
                  <div class="entry-details-content">
                    <dl class="entry-facts">
                      <div><dt>Šaltinio pavadinimas</dt><dd>{product.title}</dd></div>
                      <div><dt>Licencija</dt><dd>{product.provenance.licence}</dd></div>
                    </dl>
                    <p><strong>Citata:</strong> {product.provenance.citation}</p>
                    {#if product.provenance.permission}
                      <p><strong>Leidimas:</strong> {permissionDescription(product)} ({product.provenance.permission.confirmedOn})</p>
                    {/if}
                    {#if product.provenance.attributionNotice}
                      <p><strong>Priskyrimas:</strong> {product.provenance.attributionNotice}</p>
                    {/if}
                    <p><strong>Duomenų ribos:</strong> {limitation(product)}</p>
                    {#if product.provenance.modificationNotice}
                      <p><strong>Pakeitimai:</strong> {product.provenance.modificationNotice}</p>
                    {/if}
                  </div>
                </details>
              </div>
            </article>
          {/each}
        </div>
      </section>
    {/each}
  {/if}
</main>

<style>
  .catalogue { display: grid; gap: 2rem; }
  .category { display: grid; gap: 1rem; }
  .category > h3, .entry-title { margin: 0; }
  .entries { display: grid; gap: 1.5rem; }
  .catalogue-entry { display: grid; grid-template-columns: minmax(0, 1fr); gap: .5rem; min-width: 0; }
  .catalogue-entry > p { margin: 0; }
  .entry-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; }
  .resource-link { display: inline-flex; align-items: center; gap: .5rem; }
  .entry-details { display: contents; border: 0; }
  .entry-details::details-content { flex-basis: 100%; min-width: 0; }
  .entry-details:not([open])::details-content { display: none; }
  .entry-details > summary { padding: 0; border: 0; font-weight: inherit; }
  .entry-details > summary:hover, .entry-details > summary:focus-visible { text-decoration-style: dashed; }
  .entry-details-content { flex-basis: 100%; min-width: 0; padding-top: .5rem; overflow-wrap: anywhere; }
  .entry-facts { display: grid; gap: .75rem; margin-bottom: 1rem; }
  .entry-facts dd { margin: .25rem 0 0; }
</style>
