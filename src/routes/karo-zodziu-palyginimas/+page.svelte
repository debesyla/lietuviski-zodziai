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
    loadWarContrastProfile,
    logRatioForPair,
    lookupWarContrastWord,
    type WarContrastLookupResult,
    type WarContrastProfile
  } from '$lib/war-contrast';
  import { saveCsv, saveJson } from '$lib/download';
  import { site } from '$lib/site';
  import { researchTool } from '$lib/research-tools';
  import { readWordQuery, writeWordQuery } from '$lib/word-query';
  import { pairReadout, timesPhrase, unobservedReferenceReadout } from '$lib/readout';
  import { formatNumber } from '$lib/utils';

  const tool = researchTool('karo-zodziu-palyginimas');

  let profile = $state<WarContrastProfile | null>(null);
  let loading = $state(true);
  let loadError = $state<string | null>(null);
  let query = $state('');
  let result = $state<WarContrastLookupResult | null>(null);
  let lookupError = $state<string | null>(null);
  let lookupLoading = $state(false);
  let searched = $state(false);
  let requestNumber = 0;

  let contrasts = $derived(profile && result
    ? profile.contrast.pairs.map((pair) => ({ pair, logRatio: logRatioForPair(profile!, result!, pair.id) }))
    : []);

  // The ordinary corpus is the source the wartime ones are measured against.
  let referenceId = $derived.by(() => {
    if (!profile) return null;
    const counts = new Map<string, number>();
    for (const pair of profile.contrast.pairs) counts.set(pair.denominatorSource, (counts.get(pair.denominatorSource) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  });

  // The headline answers the page's question: the largest contrast against the
  // ordinary corpus first. If the form was not observed there, it says so
  // rather than stating a ratio; only then does a wartime-only pair stand in.
  let readout = $derived.by(() => {
    if (!profile || !result) return null;
    const word = result.word.toLocaleLowerCase('lt-LT');
    const label = (id: string) => profile!.sources.find((source) => source.id === id)?.label ?? id;
    const computed = contrasts
      .filter((contrast): contrast is { pair: typeof contrast.pair; logRatio: number } => contrast.logRatio !== null)
      .sort((a, b) => Math.abs(b.logRatio) - Math.abs(a.logRatio));
    const strongest = computed.find((contrast) => contrast.pair.denominatorSource === referenceId) ?? null;
    if (strongest) return pairReadout(word, label(strongest.pair.numeratorSource), label(strongest.pair.denominatorSource), strongest.logRatio);
    if (referenceId && (result.metrics[referenceId]?.tokenCount ?? null) === null) {
      const others = profile.sources.filter((source) => source.id !== referenceId)
        .map((source) => ({ label: source.label, value: result!.metrics[source.id]?.tokenCount ?? null }));
      const unobserved = unobservedReferenceReadout(word, label(referenceId), others, '100 mln. žodžių');
      if (unobserved) return unobserved;
    }
    const fallback = computed[0];
    return fallback ? pairReadout(word, label(fallback.pair.numeratorSource), label(fallback.pair.denominatorSource), fallback.logRatio) : null;
  });

  function formatRate(value: number | null) {
    return value === null ? 'Neaptikta' : formatNumber(value);
  }

  function formatLogRatio(value: number) {
    return `${value >= 0 ? '+' : ''}${formatNumber(value, { maximumFractionDigits: 2 })} log₂`;
  }

  function describeRatio(value: number) {
    const multiplier = Math.pow(2, Math.abs(value));
    if (multiplier < 1.05) return 'maždaug tiek pat';
    return `${timesPhrase(multiplier)} ${value >= 0 ? 'dažniau' : 'rečiau'}`;
  }

  function downloadCsv() {
    const activeProfile = profile;
    const activeResult = result;
    if (!activeProfile || !activeResult) return;
    const word = activeResult.word.toLocaleLowerCase('lt-LT');
    saveCsv(
      [`Šaltinis: ${activeProfile.provenance.citation}`, `Licencija: ${activeProfile.provenance.licence}`, `Pirminis įrašas: ${activeProfile.provenance.sourceUrl}`, `Žodžio forma: ${word}`, `Perskaičiuota: ${activeProfile.contrast.targetTokens} šaltinio žodžių`],
      ['Šaltinis', 'Pavartojimai', 'Dokumentai', 'Šaltinio žodžiai'],
      activeProfile.sources.map((source) => [
        source.label,
        activeResult.metrics[source.id]?.tokenCount ?? null,
        activeResult.metrics[source.id]?.documentCount ?? null,
        source.tokenField.normalization.sourceTokens
      ]),
      `karo-meto-vartosena-${encodeURIComponent(word)}.csv`
    );
  }

  function downloadJson() {
    const activeProfile = profile;
    const activeResult = result;
    if (!activeProfile || !activeResult) return;
    saveJson({
      schemaVersion: 1,
      productId: activeProfile.productId,
      profileId: activeProfile.profileId,
      query: activeResult.word,
      normalizedWord: activeResult.normalizedWord,
      targetTokens: activeProfile.contrast.targetTokens,
      sources: activeProfile.sources.map((source) => ({
        id: source.id,
        label: source.label,
        sourceTokens: source.tokenField.normalization.sourceTokens,
        tokenCount: activeResult.metrics[source.id]?.tokenCount ?? null,
        documentCount: activeResult.metrics[source.id]?.documentCount ?? null
      })),
      contrast: {
        formula: activeProfile.contrast.formula,
        minimumRate: activeProfile.contrast.minimumRate,
        pairs: contrasts.map(({ pair, logRatio }) => ({ ...pair, logRatio }))
      },
      provenance: activeProfile.provenance
    }, `karo-meto-vartosena-${encodeURIComponent(activeResult.word.toLocaleLowerCase('lt-LT'))}.json`);
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
      const loaded = await lookupWarContrastWord(profile, value);
      if (request !== requestNumber) return;
      result = loaded;
    } catch (cause) {
      if (request !== requestNumber) return;
      lookupError = cause instanceof Error ? cause.message : String(cause);
    } finally {
      if (request === requestNumber) lookupLoading = false;
    }
  }

  $effect(() => {
    let cancelled = false;
    loadWarContrastProfile().then((loaded) => {
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
  description="Žodžio formos dažnis CCLL2 tekstyne, karo meto žiniasklaidoje ir socialiniuose tinkluose, perskaičiuotas 100 mln. žodžių."
  url={site.wartimeContrastUrl}
/>

<main>
  <header class="stack">
    <SectionHeading>{tool.question}</SectionHeading>
    <p>Kaip dažnai žodžio forma vartojama CCLL2 tekstyne, karo meto žiniasklaidoje ir socialiniuose tinkluose. Skaičiai perskaičiuoti 100 mln. kiekvieno šaltinio žodžių.</p>
  </header>

  {#if loading}
    <p class="note" role="status" aria-live="polite">Kraunama paieškos suvestinė…</p>
  {:else if loadError}
    <div class="notice error" role="alert">
      <p><strong>Nepavyko įkelti palyginimo duomenų.</strong></p>
      <p>{loadError}</p>
    </div>
  {:else if profile}
    <WordLookup
      id="word-query"
      label="Žodžio forma"
      placeholder="pvz., karas"
      submitLabel="Palyginti"
      busy={lookupLoading}
      examples={['karas', 'taika', 'dronas', 'okupantai']}
      bind:value={query}
      onsearch={search}
    />

    {#if lookupLoading}
      <p class="note" role="status" aria-live="polite">Ieškoma žodžio formos…</p>
    {:else if lookupError}
      <p class="notice error" role="alert">{lookupError}</p>
    {:else if searched && !result}
      <p class="notice" role="status"><strong>Forma nerasta.</strong> Ji neaptikta šiuose šaltiniuose. Tai nereiškia, kad žodžio nėra lietuvių kalboje ar kad jo dažnis yra nulis.</p>
    {/if}
    <!-- One short sentence for screen readers instead of announcing the whole result. -->
    <p class="sr-only" role="status" aria-live="polite">{result ? (readout?.text ?? result.word.toLocaleLowerCase('lt-LT')) : ''}</p>

    <div class="sections">
      {#if result}
        <section class="sections" aria-labelledby="result-title">
          <div class="stack">
            <div>
              <div class="section-head">
                <!-- The source stores forms in capitals; show them like the other research pages. -->
                <h2 id="result-title">{result.word.toLocaleLowerCase('lt-LT')}</h2>
                <ResultDownloads oncsv={downloadCsv} onjson={downloadJson} />
              </div>
              {#if result.word !== result.normalizedWord}<p class="note">Normalizuota forma: {result.normalizedWord}</p>{/if}
            </div>
            {#if readout}<Headline figure={readout.figure} text={readout.text} />{/if}
            <WordElsewhere word={result.word.toLocaleLowerCase('lt-LT')} current="karo-zodziu-palyginimas" />
          </div>

          <section class="stack" aria-labelledby="rates-title">
            <SectionHeading level={3} id="rates-title">Pavartojimai 100 mln. žodžių</SectionHeading>
            <RateBars rows={profile.sources.map(source => ({ label: source.label, value: result!.metrics[source.id]?.tokenCount ?? null }))} unit="Pavartojimai 100 mln. žodžių" />
            <details>
              <summary>Lentelė</summary>
              <TableScroll label="Rezultatai pagal šaltinį">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">100 mln. žodžių</th>
                      {#each profile.sources as source}
                        <th scope="col" class="number">{source.label}</th>
                      {/each}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Pavartojimai</th>
                      {#each profile.sources as source}
                        <td class="number">{formatRate(result.metrics[source.id]?.tokenCount ?? null)}</td>
                      {/each}
                    </tr>
                    <tr>
                      <th scope="row">Dokumentai</th>
                      {#each profile.sources as source}
                        <td class="number">{formatRate(result.metrics[source.id]?.documentCount ?? null)}</td>
                      {/each}
                    </tr>
                    <tr>
                      <th scope="row">Šaltinio žodžiai</th>
                      {#each profile.sources as source}
                        <td class="number">{formatNumber(source.tokenField.normalization.sourceTokens)}</td>
                      {/each}
                    </tr>
                  </tbody>
                </table>
              </TableScroll>
            </details>
          </section>

          <section class="stack" aria-labelledby="contrast-title">
            <SectionHeading level={3} id="contrast-title">Santykinis skirtumas</SectionHeading>
            <dl class="facts">
              {#each contrasts as { pair, logRatio } (pair.id)}
                <div>
                  <dt>{pair.label}</dt>
                  {#if logRatio === null}
                    <dd class="note">Per mažai duomenų</dd>
                  {:else}
                    <dd><strong>{describeRatio(logRatio)}</strong> <span class="note">({formatLogRatio(logRatio)})</span></dd>
                  {/if}
                </div>
              {/each}
            </dl>
            {#if contrasts.some(({ logRatio }) => logRatio === null)}
              <p class="note">Skirtumas skaičiuojamas, kai abiejuose šaltiniuose forma aptikta bent {formatNumber(profile.contrast.minimumRate)} kartų 100 mln. žodžių.</p>
            {/if}
            {#if result.sourceRows.length > 1}
              <p class="note">Sujungtos {result.sourceRows.length} to paties įvedimo šaltinio eilutės.</p>
            {/if}
          </section>
        </section>
      {/if}

      <div>
        <details>
          <summary>Kaip skaityti</summary>
          <div class="details-body">
            <dl class="facts">
              <div><dt>Duomenų vienetas</dt><dd>Žodžio forma</dd></div>
              <div><dt>Perskaičiuota</dt><dd>{formatNumber(profile.contrast.targetTokens)} šaltinio žodžių</dd></div>
              <div><dt>Paieškos formų</dt><dd>{formatNumber(profile.summary.uniqueNormalizedWordForms)}</dd></div>
            </dl>
            <ul>
              <li>„Neaptikta“ reiškia, kad šaltinyje formos nėra, o ne nulinį dažnį.</li>
              <li>Santykinis skirtumas = log₂(vieno šaltinio rodiklis / kito šaltinio rodiklis). Tai palyginimo priemonė, ne statistinio reikšmingumo testas.</li>
              <li>Pavartojimų ir dokumentų rodikliai nesudedami į vieną balą.</li>
              <li>Šaltinių laikotarpiai, žanrai ir apimtys skiriasi, todėl skirtumas nėra kalbinis ar socialinis vertinimas.</li>
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
