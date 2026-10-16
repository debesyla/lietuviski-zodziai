<script lang="ts">
  import SectionHeading from '../../components/SectionHeading.svelte';
  import RateBars from '../../components/RateBars.svelte';
  import WordLookup from '../../components/WordLookup.svelte';
  import PageMeta from '../../components/PageMeta.svelte';
  import WordElsewhere from '../../components/WordElsewhere.svelte';
  import Headline from '../../components/Headline.svelte';
  import TableScroll from '../../components/TableScroll.svelte';
  import ResultDownloads from '../../components/ResultDownloads.svelte';
  import {
    loadCcllGenreProfile,
    lookupCcllGenreWord,
    ratePerMillion,
    type CcllGenreProfile,
    type GenreProfileLookupResult
  } from '$lib/ccll-genre-profile';
  import { saveCsv, saveJson } from '$lib/download';
  import { site } from '$lib/site';
  import { researchTool } from '$lib/research-tools';
  import { readWordQuery, writeWordQuery } from '$lib/word-query';
  import { namedPairSentence, spreadReadout } from '$lib/readout';
  import { formatNumber } from '$lib/utils';

  const tool = researchTool('zanru-profilis');

  let profile = $state<CcllGenreProfile | null>(null);
  let loading = $state(true);
  let loadError = $state<string | null>(null);
  let query = $state('');
  let result = $state<GenreProfileLookupResult | null>(null);
  let lookupError = $state<string | null>(null);
  let lookupLoading = $state(false);
  let searched = $state(false);
  let requestNumber = 0;

  // The page asks "romanuose ar laikraščiuose?", so those two genres get their own sentence.
  const QUESTION_GENRES = ['fiction', 'periodicals'];

  let readout = $derived.by(() => {
    if (!profile || !result) return null;
    const place = (label: string) => `žanre „${label}“`;
    const rows = profile.sources.map((source) => ({ label: source.label, value: ratePerMillion(profile!, result!, source.id) }));
    const spread = spreadReadout(result.word, rows, place, 'vartojama');
    const [first, second] = QUESTION_GENRES.map((id) => profile!.sources.find((source) => source.id === id)?.label ?? '');
    const pair = namedPairSentence(rows, first, second, place);
    return spread && pair ? { ...spread, text: `${spread.text} ${pair}` } : spread;
  });

  function formatRate(value: number | null) {
    return value === null ? 'Neaptikta' : formatNumber(value, { maximumFractionDigits: 2 });
  }

  async function search(value: string) {
    if (!profile || !value.trim()) return;
    writeWordQuery(value);
    searched = true;
    result = null;
    lookupError = null;
    lookupLoading = true;
    const request = ++requestNumber;
    try {
      const loaded = await lookupCcllGenreWord(profile, value);
      if (request !== requestNumber) return;
      result = loaded;
    } catch (cause) {
      if (request !== requestNumber) return;
      lookupError = cause instanceof Error ? cause.message : String(cause);
    } finally {
      if (request === requestNumber) lookupLoading = false;
    }
  }

  function downloadCsv() {
    const activeProfile = profile;
    const activeResult = result;
    if (!activeProfile || !activeResult) return;
    saveCsv(
      [`Šaltinis: ${activeProfile.provenance.citation}`, `Licencija: ${activeProfile.provenance.licence}`, `Pirminis įrašas: ${activeProfile.provenance.sourceUrl}`, `Žodžio forma: ${activeResult.word}`],
      ['Žanras', 'Pavartojimai', 'Milijonui žodžių', 'Žanro žodžiai'],
      activeProfile.sources.map((source) => [source.label, activeResult.rawCounts[source.id], ratePerMillion(activeProfile, activeResult, source.id), source.sourceTokens]),
      `ccll-zanru-profilis-${encodeURIComponent(activeResult.word)}.csv`
    );
  }

  function downloadResult() {
    const activeProfile = profile;
    const activeResult = result;
    if (!activeProfile || !activeResult) return;
    saveJson({
      schemaVersion: 1,
      productId: activeProfile.productId,
      profileId: activeProfile.profileId,
      query: activeResult.word,
      rate: activeProfile.rate,
      sources: activeProfile.sources.map((source) => ({
        id: source.id,
        label: source.label,
        sourceTokens: source.sourceTokens,
        rawCount: activeResult.rawCounts[source.id],
        ratePerMillion: ratePerMillion(activeProfile, activeResult, source.id)
      })),
      observedGenres: activeResult.observedGenres,
      provenance: activeProfile.provenance
    }, `ccll-zanru-profilis-${encodeURIComponent(activeResult.word)}.json`);
  }

  $effect(() => {
    let cancelled = false;
    loadCcllGenreProfile().then((loaded) => {
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
    return () => {
      cancelled = true;
    };
  });
</script>

<PageMeta
  title={`${tool.pageTitle} // dažniausi lietuviški žodžiai`}
  description="Tikslios žodžio formos dažnis penkiuose CCLL žanruose: grožinėje ir negrožinėje literatūroje, administraciniuose tekstuose, periodikoje ir sakytinėje kalboje."
  url={site.genreProfileUrl}
/>

<main>
  <header class="stack">
    <SectionHeading>{tool.question}</SectionHeading>
    <p>Kaip dažnai tiksli žodžio forma vartojama penkiuose Dabartinės lietuvių kalbos tekstyno (CCLL) žanruose. Skaičiai perskaičiuoti milijonui žodžių.</p>
  </header>

  {#if loading}
    <p class="note" role="status" aria-live="polite">Kraunama žanrų profilio suvestinė…</p>
  {:else if loadError}
    <div class="notice error" role="alert">
      <p><strong>Nepavyko įkelti žanrų profilio.</strong></p>
      <p>{loadError}</p>
    </div>
  {:else if profile}
    <WordLookup
      id="word-query"
      label="Tiksli žodžio forma"
      placeholder="pvz., mama"
      busy={lookupLoading}
      examples={['mama', 'straipsnis', 'sakė', 'meilė']}
      bind:value={query}
      onsearch={search}
    />

    {#if lookupLoading}
      <p class="note" role="status" aria-live="polite">Ieškoma žodžio formos…</p>
    {:else if lookupError}
      <p class="notice error" role="alert">{lookupError}</p>
    {:else if searched && !result}
      <p class="notice" role="status"><strong>Forma nerasta.</strong> Ji neaptikta šiuose žanruose. Tai nereiškia, kad jos nėra lietuvių kalboje ar kad jos dažnis lygus nuliui.</p>
    {/if}
    <!-- One short sentence for screen readers instead of announcing the whole result. -->
    <p class="sr-only" role="status" aria-live="polite">{result ? (readout?.text ?? result.word) : ''}</p>

    <div class="sections">
      {#if result}
        <section class="sections" aria-labelledby="result-title">
          <div class="stack">
            <div class="section-head">
              <h2 id="result-title">{result.word}</h2>
              <ResultDownloads oncsv={downloadCsv} onjson={downloadResult} />
            </div>
            {#if readout}<Headline figure={readout.figure} text={readout.text} />{/if}
            <WordElsewhere word={result.word} current="zanru-profilis" />
          </div>

          <section class="stack" aria-labelledby="rates-title">
            <SectionHeading level={3} id="rates-title">Pavartojimai milijonui žodžių</SectionHeading>
            <RateBars rows={profile.sources.map(source => ({ label: source.label, value: ratePerMillion(profile!, result!, source.id) }))} unit="Pavartojimai milijonui žodžių" />
            <details>
              <summary>Lentelė</summary>
              <TableScroll label="Rezultatai pagal žanrą">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Žanras</th>
                      <th scope="col" class="number">Pavartojimai</th>
                      <th scope="col" class="number">Milijonui žodžių</th>
                      <th scope="col" class="number">Žanro žodžiai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each profile.sources as source}
                      {@const rawCount = result.rawCounts[source.id]}
                      <tr>
                        <th scope="row">{source.label}</th>
                        <td class="number">{rawCount === null ? 'Neaptikta' : formatNumber(rawCount)}</td>
                        <td class="number">{formatRate(ratePerMillion(profile, result, source.id))}</td>
                        <td class="number">{formatNumber(source.sourceTokens)}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </TableScroll>
            </details>
          </section>
        </section>
      {/if}

      <div>
        <details>
          <summary>Kaip skaityti</summary>
          <div class="details-body">
            <dl class="facts">
              <div><dt>Paieškos formų</dt><dd>{formatNumber(profile.summary.joinedWordforms)}</dd></div>
              <div><dt>Žanrų</dt><dd>{formatNumber(profile.sources.length)}</dd></div>
              <div><dt>Rodiklis</dt><dd>Pavartojimai milijonui žodžių</dd></div>
            </dl>
            <ul>
              <li>Rodomi tik penki pavadinti subkorpusai; bendras CCLL sąrašas ir jo abėcėlinis indeksas nėra žanrai.</li>
              <li>„Neaptikta“ reiškia, kad žanre formos nėra, o ne nulinį dažnį.</li>
              <li>Kiekvieno žanro rodiklis skaičiuojamas pagal to žanro žodžių skaičių. Tai nėra bendras žodžių populiarumo reitingas.</li>
              <li>Skyrybos ženklai, didžiosios ir mažosios raidės išlaikomi taip, kaip šaltinio sąrašuose.</li>
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
    </div>
  {/if}
</main>
