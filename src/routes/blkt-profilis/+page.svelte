<script lang="ts">
  import SectionHeading from '../../components/SectionHeading.svelte';
  import RateBars from '../../components/RateBars.svelte';
  import WordLookup from '../../components/WordLookup.svelte';
  import PageMeta from '../../components/PageMeta.svelte';
  import WordElsewhere from '../../components/WordElsewhere.svelte';
  import Headline from '../../components/Headline.svelte';
  import TableScroll from '../../components/TableScroll.svelte';
  import ResultDownloads from '../../components/ResultDownloads.svelte';
  import { base } from '$app/paths';
  import {
    loadBlktWordformProfile,
    loadBlktLicenceTexts,
    lookupBlktWordform,
    type BlktScopeResult,
    type BlktWordformResult,
    type LoadedBlktWordformProfile
  } from '$lib/blkt-wordform-profile';
  import { saveCsv, saveJson, type CsvCell } from '$lib/download';
  import { site } from '$lib/site';
  import { researchTool } from '$lib/research-tools';
  import { readWordQuery, writeWordQuery } from '$lib/word-query';
  import { spreadReadout } from '$lib/readout';
  import { formatNumber } from '$lib/utils';

  const tool = researchTool('blkt-profilis');

  let profile = $state<LoadedBlktWordformProfile | null>(null);
  let loading = $state(true);
  let loadError = $state<string | null>(null);
  let query = $state('');
  let result = $state<BlktWordformResult | null>(null);
  let searched = $state(false);
  let lookupLoading = $state(false);
  let lookupError = $state<string | null>(null);
  let downloadLoading = $state(false);
  let downloadError = $state<string | null>(null);
  let requestNumber = 0;

  const slices = $derived(result ? [
    { id: 'types', title: 'Pagal teksto tipą', column: 'Teksto tipas', items: result.documentTypes, withheld: 'Šio žodžio teksto tipų pjūvis neskelbiamas. Atskiros saugos ribos nepasiekusios reikšmės neatskleidžiamos.' },
    { id: 'periods', title: 'Pagal laikotarpį', column: 'Laikotarpis', items: result.periods, withheld: 'Šio žodžio laikotarpių pjūvis neskelbiamas. Atskiros saugos ribos nepasiekusios reikšmės neatskleidžiamos.' }
  ] : []);

  // Periods answer this page's question; text types stand in when periods are withheld.
  const readout = $derived.by(() => {
    if (!result) return null;
    const rows = (items: { label: string; ratePerMillion: number }[]) => items.map((item) => ({ label: item.label, value: item.ratePerMillion }));
    if (result.periods) {
      const byPeriod = spreadReadout(result.word, rows(result.periods), (label) => `${label} m.`, 'vartota');
      if (byPeriod) return { ...byPeriod, note: 'Laikotarpių tekstų rinkiniai skiriasi, todėl skirtumas nebūtinai rodo kalbos pokytį.' };
    }
    if (result.documentTypes) {
      const byType = spreadReadout(result.word, rows(result.documentTypes), (label) => `teksto tipe „${label}“`, 'vartojama');
      if (byType) return { ...byType, note: '' };
    }
    return null;
  });

  function formatInteger(value: number) {
    return formatNumber(value);
  }

  function formatRate(value: number) {
    return formatNumber(value, { maximumFractionDigits: 2 });
  }

  async function search(value: string) {
    if (!profile || !value.trim()) return;
    writeWordQuery(value);
    const request = ++requestNumber;
    searched = true;
    result = null;
    lookupError = null;
    lookupLoading = true;
    try {
      const loaded = await lookupBlktWordform(profile, value);
      if (request === requestNumber) result = loaded;
    } catch (cause) {
      if (request === requestNumber) lookupError = cause instanceof Error ? cause.message : String(cause);
    } finally {
      if (request === requestNumber) lookupLoading = false;
    }
  }

  // Only the published aggregates on screen; a withheld slice family is named, not filled in.
  function downloadCsv() {
    if (!result || !profile) return;
    const { metadata, manifest } = profile;
    const row = (slice: string, label: string, item: BlktScopeResult): CsvCell[] =>
      [slice, label, item.tokenCount, item.documentCount, item.ratePerMillion, item.documents, item.derivedTokens];
    const rows = [row('Visas tekstynas', '', result.corpus)];
    for (const slice of slices) {
      for (const item of slice.items ?? []) rows.push(row(slice.column, item.label, item));
    }
    const licenceFile = (file: string) => `${window.location.origin}${base}/data-products/${manifest.id}/${file}`;
    saveCsv(
      [
        `Šaltinis: ${manifest.provenance.citation}`,
        `Pirminis įrašas: ${manifest.provenance.sourceUrl}`,
        ...metadata.rights.licences.map((licence) => `Licencija: ${licence.name} (${licence.url}; pilnas tekstas ${licenceFile(licence.file)})`),
        metadata.rights.modificationNotice,
        ...metadata.rights.attributionNotices,
        ...metadata.rights.downstreamRequirements,
        `Žodžio forma: ${result.word}`,
        ...slices.filter((slice) => !slice.items).map((slice) => slice.withheld)
      ],
      ['Pjūvis', 'Reikšmė', 'Pavartojimai', 'Dokumentai su žodžiu', 'Milijonui žodžių', 'Visi dokumentai', 'Visi žodžiai'],
      rows,
      `blkt-${result.word}.csv`
    );
  }

  async function downloadResult() {
    if (!result || !profile || downloadLoading) return;
    downloadLoading = true;
    downloadError = null;
    try {
      const licences = await loadBlktLicenceTexts(profile);
      saveJson({
        schemaVersion: 1,
        productId: profile.manifest.id,
        word: result.word,
        sourceScopeCaveat: profile.metadata.sourceScopeCaveat,
        sourceLicences: profile.metadata.sourceLicences,
        corpus: result.corpus,
        documentTypes: result.documentTypes,
        periods: result.periods,
        rate: profile.metadata.rate,
        tokenizer: profile.metadata.tokenizer,
        disclosure: profile.metadata.disclosure,
        permission: profile.metadata.permission,
        exclusions: profile.metadata.exclusions,
        source: {
          url: profile.manifest.provenance.sourceUrl,
          licence: profile.manifest.provenance.licence,
          citation: profile.manifest.provenance.citation,
          rights: { ...profile.metadata.rights, licences }
        }
      }, `blkt-${result.word}.json`);
    } catch (cause) {
      downloadError = cause instanceof Error ? cause.message : String(cause);
    } finally {
      downloadLoading = false;
    }
  }

  $effect(() => {
    let cancelled = false;
    loading = true;
    loadError = null;
    loadBlktWordformProfile().then((loaded) => {
      if (cancelled) return;
      profile = loaded;
      loading = false;
      query = readWordQuery();
      if (query) void search(query);
    }).catch((cause) => {
      if (cancelled) return;
      loadError = cause instanceof Error ? cause.message : String(cause);
      loading = false;
    });
    return () => { cancelled = true; };
  });
</script>

<PageMeta
  title={`${tool.pageTitle} // dažniausi lietuviški žodžiai`}
  description="Žodžio formos dažnis Bendrajame lietuvių kalbos tekstyne pagal teksto tipą ir laikotarpį; skelbiami tik saugos slenksčius praėję suvestiniai duomenys."
  url={site.blktProfileUrl}
/>

<main>
  <header class="stack">
    <SectionHeading>{tool.question}</SectionHeading>
    <p>Kaip dažnai žodžio forma vartojama Bendrajame lietuvių kalbos tekstyne (BLKT) pagal teksto tipą ir laikotarpį nuo 1922 m. iki dabar.</p>
  </header>

  {#if loading}
    <p class="note" role="status" aria-live="polite">Kraunama BLKT profilio suvestinė…</p>
  {:else if loadError}
    <div class="notice error" role="alert">
      <p><strong>Nepavyko įkelti profilio.</strong></p>
      <p>{loadError}</p>
    </div>
  {:else if profile}
    <WordLookup
      id="blkt-word"
      label="Viena žodžio forma"
      placeholder="pvz., ponas"
      hint="Iki 64 raidžių; didžiosios ir mažosios raidės nesiskiria."
      busy={lookupLoading}
      examples={['ponas', 'europos', 'tauta', 'kalba']}
      bind:value={query}
      onsearch={search}
    />

    {#if lookupLoading}
      <p class="note" role="status" aria-live="polite">Ieškoma paskelbtame profilyje…</p>
    {:else if lookupError}
      <p class="notice error" role="alert">{lookupError}</p>
    {:else if searched && !result}
      <p class="notice" role="status"><strong>Žodis paskelbtame profilyje nerastas.</strong> Jis galėjo būti neaptiktas arba nepraeiti saugos slenksčio. Tai nereiškia, kad tokios raidžių sekos nėra BLKT.</p>
    {/if}

    <div class="sections">
      {#if result}
        <article class="sections" aria-labelledby="result-title">
          <p class="sr-only" role="status" aria-live="polite">Rastas žodžio „{result.word}“ BLKT profilis.</p>
          <div class="stack">
            <div class="section-head">
              <h2 id="result-title">{result.word}</h2>
              <ResultDownloads oncsv={downloadCsv} onjson={() => void downloadResult()} busy={downloadLoading} />
            </div>
            {#if downloadError}<p class="notice error" role="alert">{downloadError}</p>{/if}
            {#if readout}<Headline figure={readout.figure} text={readout.text} note={readout.note} />{/if}
            <WordElsewhere word={result.word} current="blkt-profilis" />
          </div>

          <section class="stack" aria-labelledby="corpus-title">
            <SectionHeading level={3} id="corpus-title">Visas tekstynas</SectionHeading>
            <dl class="facts">
              <div><dt>Pavartojimai</dt><dd>{formatInteger(result.corpus.tokenCount)}</dd></div>
              <div><dt>Dokumentai su žodžiu</dt><dd>{formatInteger(result.corpus.documentCount)}</dd></div>
              <div><dt>Milijonui žodžių</dt><dd>{formatRate(result.corpus.ratePerMillion)}</dd></div>
            </dl>
          </section>

          {#each slices as slice (slice.id)}
            <section class="stack" aria-labelledby={`${slice.id}-title`}>
              <SectionHeading level={3} id={`${slice.id}-title`}>{slice.title}</SectionHeading>
              {#if slice.items}
                <p class="note">Pavartojimai milijonui žodžių</p>
                <RateBars rows={slice.items.map(item => ({ label: item.label, value: item.ratePerMillion }))} unit="Pavartojimai milijonui žodžių" />
                <details>
                  <summary>Lentelė</summary>
                  <TableScroll label={`Rezultatai ${slice.title.toLowerCase()}`}>
                    <table>
                      <thead><tr><th scope="col">{slice.column}</th><th scope="col" class="number">Pavartojimai</th><th scope="col" class="number">Dokumentai su žodžiu</th><th scope="col" class="number">Milijonui žodžių</th><th scope="col" class="number">Visi dokumentai</th><th scope="col" class="number">Visi žodžiai</th></tr></thead>
                      <tbody>
                        {#each slice.items as item (item.id)}
                          <tr><th scope="row">{item.label}</th><td class="number">{formatInteger(item.tokenCount)}</td><td class="number">{formatInteger(item.documentCount)}</td><td class="number">{formatRate(item.ratePerMillion)}</td><td class="number">{formatInteger(item.documents)}</td><td class="number">{formatInteger(item.derivedTokens)}</td></tr>
                        {/each}
                      </tbody>
                    </table>
                  </TableScroll>
                </details>
              {:else}
                <p class="notice">{slice.withheld}</p>
              {/if}
            </section>
          {/each}
        </article>
      {/if}

      <div>
        <details>
          <summary>Kaip skaityti</summary>
          <div class="details-body">
            <p><strong>Šaltinio riba:</strong> BLKT nėra reprezentatyvus visos lietuvių kalbos portretas, nes jame vyrauja žiniasklaida ir dokumentai. Rezultatai apibūdina tik šio tekstyno sudėtį.</p>
            <p>Skaičiuojami projekto taisykle išskirti mažosiomis raidėmis sunorminti žodžiai. Dažnis milijonui skaičiuojamas pagal to paties pjūvio išvestinių žodžių vardiklį, o ne pagal šaltinio <code>alpha_word_count</code>.</p>
            <p>Įrašai yra tokenizatoriaus aptiktos raidžių sekos, o ne patvirtinti lietuviški ar taisyklingi žodžiai. Iš dažnio negalima spręsti apie kalbinį taisyklingumą.</p>
            <p>Žodis arba pjūvių šeima skelbiama tik tada, kai kiekviena teigiama reikšmė turi bent <strong>{profile.metadata.disclosure.minimumTokenCount}</strong> pavartojimų bent <strong>{profile.metadata.disclosure.minimumDocumentSupport}</strong> dokumentų. Potipiai, tekstai, pavadinimai, autoriai, nuorodos ir šaltinių identifikatoriai neskelbiami.</p>
            <dl class="facts">
              <div><dt>Dokumentų</dt><dd>{formatInteger(profile.metadata.corpus.documents)}</dd></div>
              <div><dt>Išvestinių žodžių</dt><dd>{formatInteger(profile.metadata.corpus.derivedTokens)}</dd></div>
              <div><dt>Paskelbtų žodžių formų</dt><dd>{formatInteger(profile.index.summary.recordCount)}</dd></div>
            </dl>
          </div>
        </details>

        <details>
          <summary>Šaltinis ir licencija</summary>
          <div class="details-body">
            <p>{profile.manifest.provenance.citation}</p>
            <p><a href={profile.manifest.provenance.sourceUrl}>Oficialus BLKT šaltinio įrašas</a></p>
            <p>Taikomos abi šaltinio licencijos. Projekto savininkas patvirtino leidimą skelbti šio projekto išvestinius agregatus ir duomenų rinkinius.</p>
            <ul>
              {#each profile.metadata.rights.licences as licence}
                <li><a href={licence.url}>{licence.name}</a> (<a href={`${base}/data-products/${profile.manifest.id}/${licence.file}`}>pilnas tekstas</a>)</li>
              {/each}
            </ul>
            <p>{profile.metadata.rights.modificationNotice}</p>
            <ul>
              {#each profile.metadata.rights.attributionNotices as attribution}
                <li>{attribution}</li>
              {/each}
            </ul>
            <ul>
              {#each profile.metadata.rights.downstreamRequirements as requirement}
                <li>{requirement}</li>
              {/each}
            </ul>
          </div>
        </details>
      </div>
    </div>
  {/if}
</main>

