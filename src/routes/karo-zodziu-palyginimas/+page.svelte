<script lang="ts">
  import SectionHeading from '../../components/SectionHeading.svelte';
  import RateBars from '../../components/RateBars.svelte';
  import WordLookup from '../../components/WordLookup.svelte';
  import PageMeta from '../../components/PageMeta.svelte';
  import WordElsewhere from '../../components/WordElsewhere.svelte';
  import Headline from '../../components/Headline.svelte';
  import TableScroll from '../../components/TableScroll.svelte';
  import {
    loadWarContrastProfile,
    logRatioForPair,
    lookupWarContrastWord,
    type WarContrastLookupResult,
    type WarContrastProfile
  } from '$lib/war-contrast';
  import { site } from '$lib/site';
  import { researchTool } from '$lib/research-tools';
  import { readWordQuery, writeWordQuery } from '$lib/word-query';
  import { pairReadout, timesPhrase } from '$lib/readout';

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

  // The headline restates the largest of the contrasts shown below.
  let readout = $derived.by(() => {
    if (!profile || !result) return null;
    const strongest = contrasts
      .filter((contrast): contrast is { pair: typeof contrast.pair; logRatio: number } => contrast.logRatio !== null)
      .sort((a, b) => Math.abs(b.logRatio) - Math.abs(a.logRatio))[0];
    if (!strongest) return null;
    const label = (id: string) => profile!.sources.find((source) => source.id === id)?.label ?? id;
    return pairReadout(result.word.toLocaleLowerCase('lt-LT'), label(strongest.pair.numeratorSource), label(strongest.pair.denominatorSource), strongest.logRatio);
  });

  function formatNumber(value: number) {
    return value.toLocaleString('lt-LT');
  }

  function formatRate(value: number | null) {
    return value === null ? 'Neaptikta' : formatNumber(value);
  }

  function formatLogRatio(value: number) {
    return `${value >= 0 ? '+' : ''}${value.toLocaleString('lt-LT', { maximumFractionDigits: 2 })} log₂`;
  }

  function describeRatio(value: number) {
    const multiplier = Math.pow(2, Math.abs(value));
    if (multiplier < 1.05) return 'maždaug tiek pat';
    return `${timesPhrase(multiplier)} ${value >= 0 ? 'dažniau' : 'rečiau'}`;
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
    {:else if result}
      <section class="stack" aria-labelledby="result-title" aria-live="polite">
        <div>
          <!-- The source stores forms in capitals; show them like the other research pages. -->
          <h2 id="result-title">{result.word.toLocaleLowerCase('lt-LT')}</h2>
          {#if result.word !== result.normalizedWord}<p class="note">Normalizuota forma: {result.normalizedWord}</p>{/if}
        </div>
        {#if readout}<Headline figure={readout.figure} text={readout.text} />{/if}
        <WordElsewhere word={result.word.toLocaleLowerCase('lt-LT')} current="karo-zodziu-palyginimas" />

        <SectionHeading level={3}>Pavartojimai 100 mln. žodžių</SectionHeading>
        <RateBars rows={profile.sources.map(source => ({ label: source.label, value: result!.metrics[source.id]?.tokenCount ?? null }))} unit="Pavartojimai 100 mln. žodžių" />

        <SectionHeading level={3}>Santykinis skirtumas</SectionHeading>
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
  {/if}
</main>
