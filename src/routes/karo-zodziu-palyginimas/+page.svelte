<script lang="ts">
  import RateBars from '../../components/RateBars.svelte';
  import {
    contrastPair,
    loadWarContrastProfile,
    logRatioForPair,
    lookupWarContrastWord,
    type WarContrastLookupResult,
    type WarContrastProfile
  } from '$lib/war-contrast';

  let profile = $state<WarContrastProfile | null>(null);
  let loading = $state(true);
  let loadError = $state<string | null>(null);
  let query = $state('');
  let result = $state<WarContrastLookupResult | null>(null);
  let lookupError = $state<string | null>(null);
  let lookupLoading = $state(false);
  let searched = $state(false);
  let selectedPairId = $state('');
  let requestNumber = 0;

  let selectedPair = $derived(profile ? contrastPair(profile, selectedPairId) : null);
  let logRatio = $derived(profile && result && selectedPair ? logRatioForPair(profile, result, selectedPair.id) : null);

  function formatNumber(value: number) {
    return value.toLocaleString('lt-LT');
  }

  function formatRate(value: number | null) {
    return value === null ? 'Neaptikta' : formatNumber(value);
  }

  function formatLogRatio(value: number) {
    return `${value >= 0 ? '+' : ''}${value.toLocaleString('lt-LT', { maximumFractionDigits: 2 })}`;
  }

  function formatMultiplier(value: number) {
    return Math.pow(2, Math.abs(value)).toLocaleString('lt-LT', { maximumFractionDigits: 1 });
  }

  async function search() {
    if (!profile || !query.trim()) return;
    searched = true;
    result = null;
    lookupError = null;
    lookupLoading = true;
    const request = ++requestNumber;
    try {
      const loaded = await lookupWarContrastWord(profile, query);
      if (request !== requestNumber) return;
      result = loaded;
    } catch (cause) {
      if (request !== requestNumber) return;
      lookupError = cause instanceof Error ? cause.message : String(cause);
    } finally {
      if (request === requestNumber) lookupLoading = false;
    }
  }

  function submitSearch(event: SubmitEvent) {
    event.preventDefault();
    void search();
  }

  $effect(() => {
    let cancelled = false;
    loadWarContrastProfile().then((loaded) => {
      if (cancelled) return;
      profile = loaded;
      selectedPairId = loaded.contrast.pairs[0]?.id ?? '';
      loading = false;
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

<svelte:head>
  <title>karo laikotarpio žodžių palyginimas</title>
  <meta name="description" content="Paieška ir skaidrus CCLL2, karo meto žiniasklaidos bei socialinių tinklų žodžių formų dažnumo palyginimas." />
</svelte:head>

<main>
  <header>
  <h2>karo laikotarpio žodžių palyginimas</h2>
  <p class="intro">Žodžio vartosena CCLL2, karo meto žiniasklaidoje ir socialiniuose tinkluose. Rodikliai perskaičiuoti 100 mln. kiekvieno šaltinio žodžių.</p>
  </header>

  {#if loading}
    <p class="status" role="status" aria-live="polite">Kraunama paieškos suvestinė…</p>
  {:else if loadError}
    <section class="error" role="alert" aria-labelledby="profile-load-error">
      <h2 id="profile-load-error">Nepavyko įkelti palyginimo duomenų</h2>
      <p>{loadError}</p>
    </section>
  {:else if profile}
    <form class="lookup" onsubmit={submitSearch}>
      <label for="word-query">Žodžio forma</label>
      <div class="lookup-controls">
        <input id="word-query" bind:value={query} autocomplete="off" spellcheck="false" placeholder="pvz., karas" required />
        <button type="submit" class="primary-button" disabled={lookupLoading}>{lookupLoading ? 'Ieškoma…' : 'Palyginti'}</button>
      </div>
    </form>


    {#if lookupLoading}
      <p class="status" role="status" aria-live="polite">Ieškoma pasirinktos žodžio formos…</p>
    {:else if lookupError}
      <p class="error-message" role="alert">{lookupError}</p>
    {:else if searched && !result}
      <section class="empty" aria-live="polite">
        <h2>Forma nerasta</h2>
        <p>Forma neaptikta šiuose šaltiniuose. Tai nereiškia, kad žodžio nėra lietuvių kalboje ar kad jo dažnis yra nulis.</p>
      </section>
    {:else if result}
      <section class="result" aria-labelledby="result-title" aria-live="polite">
        <div class="result-heading">
          <div>
            <h2 id="result-title">{result.word}</h2>
            {#if result.word !== result.normalizedWord}<p>Normalizuota forma: {result.normalizedWord}</p>{/if}
          </div>
          {#if result.sourceRows.length > 1}
            <p class="merge-note">Sujungtos {result.sourceRows.length} to paties įvedimo šaltinio eilutės; nesutampančios reikšmės nebūtų sujungiamos.</p>
          {/if}
        </div>

        <h3>Pavartojimai / 100 mln. žodžių</h3>
        <RateBars rows={profile.sources.map(source => ({ label: source.label, value: result!.metrics[source.id]?.tokenCount ?? null }))} unit="Pavartojimai / 100 mln. žodžių" />
        <details><summary>Lentelė</summary><div class="table-scroll"><table>
          <thead>
            <tr>
              <th scope="col">Matas</th>
              {#each profile.sources as source}
                <th scope="col">{source.label}<span>{formatNumber(source.tokenField.normalization.sourceTokens)} šaltinio žodžių</span></th>
              {/each}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Žetonai / 100 mln.</th>
              {#each profile.sources as source}
                {@const value = result.metrics[source.id]?.tokenCount ?? null}
                <td class:absent={value === null}>{formatRate(value)}</td>
              {/each}
            </tr>
            <tr>
              <th scope="row">Dokumentai / 100 mln.</th>
              {#each profile.sources as source}
                {@const value = result.metrics[source.id]?.documentCount ?? null}
                <td class:absent={value === null}>{formatRate(value)}</td>
              {/each}
            </tr>
          </tbody>
        </table></div></details>
      </section>

      <section class="contrast" aria-labelledby="contrast-title">
        <h2 id="contrast-title">Santykinis kontrastas</h2>
        <label for="contrast-pair">Lyginama pora</label>
        <select id="contrast-pair" bind:value={selectedPairId}>
          {#each profile.contrast.pairs as pair}
            <option value={pair.id}>{pair.label}</option>
          {/each}
        </select>
        {#if selectedPair && logRatio !== null}
          <p><strong>{formatLogRatio(logRatio)} log₂</strong> <span class="inline-separator" aria-hidden="true">//</span> {selectedPair.label} rodiklis yra maždaug {formatMultiplier(logRatio)} karto {logRatio >= 0 ? 'didesnis' : 'mažesnis'} pagal normalizuotą žetonų dažnį.</p>
        {:else if selectedPair}
          <p>Kontrastas nerodomas: abiejų šaltinių žetonų rodikliai turi būti aptikti ir siekti bent {formatNumber(profile.contrast.minimumRate)} / 100 mln.</p>
        {/if}
        <p class="method-note">Formulė: log₂(skaitiklio normalizuotas žetonų rodiklis / vardiklio normalizuotas žetonų rodiklis). Tai palyginimo priemonė, ne statistinio reikšmingumo testas.</p>
      </section>
    {/if}

    <details class="reading-notes">
      <summary>Kaip skaityti palyginimą</summary><div class="details-content">
    <dl class="source-facts">
      <div>
        <dt>Duomenų vienetas</dt>
        <dd>Žodžio forma</dd>
      </div>
      <div>
        <dt>Normalizavimo tikslas</dt>
        <dd>{formatNumber(profile.contrast.targetTokens)} šaltinio žodžių</dd>
      </div>
      <div>
        <dt>Paieškos formos</dt>
        <dd>{formatNumber(profile.summary.uniqueNormalizedWordForms)}</dd>
      </div>
      <div>
        <dt>Licencija</dt>
        <dd>{profile.provenance.licence}</dd>
      </div>
    </dl>


      <ul>
        <li>„Neaptikta“ reiškia šaltinio <code>null</code>, o ne nulinį dažnį.</li>
        <li>Žetonų ir dokumentų rodikliai yra skirtingi ir čia nėra sudedami į vieną bendrą balą.</li>
        <li>Skirtingi šaltinių laikotarpiai, žanrai ir apimtys gali paaiškinti kontrastą; jis nėra kalbinis ar socialinis vertinimas.</li>
      </ul>
      <p><a href={profile.provenance.sourceUrl} target="_blank" rel="noreferrer">Atverti pirminį CLARIN-LT šaltinio įrašą</a> <span class="inline-separator" aria-hidden="true">//</span> {profile.provenance.citation}</p>
    </div></details>
  {/if}
</main>

<style>
  main,
  .lookup,
  .result,
  .contrast,
    .empty,
  .error,
  .status {
    display: grid;
    gap: var(--md);
  }

  main {
    min-width: 0;
    gap: 2rem;
  }


  .intro,
  .result-heading > div > p,
  .merge-note,
  .method-note,
  .reading-notes p {
    color: color-mix(in srgb, var(--text-color) 78%, transparent);
  }

  .lookup,
  .source-facts,
  .result,
  .contrast,
    .empty,
  .error,
  .status {
    border: 0;
    padding: 0;
  }

  .lookup label { font-weight: 700; }
  .lookup-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .lookup-controls { align-items: stretch; gap: 1rem; }

  input {
    flex: 1 1 18ch;
    max-width: 100%;
    min-width: 0;
  }

  .source-facts {
    display: grid;
    gap: var(--sm);
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .source-facts > div { min-width: 0; border: 0; padding-left: 0; }

  dt {
    color: color-mix(in srgb, var(--text-color) 68%, transparent);
    font-size: 0.875em;
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  .result-heading {
    align-items: start;
    display: flex;
    flex-wrap: wrap;
    gap: var(--md);
    justify-content: space-between;
  }

  .merge-note {
    flex: 0 1 26ch;
    font-size: 0.875em;
  }

  table {
    min-width: 42rem;
  }

  th,
  td {
    overflow-wrap: anywhere;
    text-align: left;
    vertical-align: top;
  }

  thead th span {
    color: color-mix(in srgb, var(--text-color) 68%, transparent);
    display: block;
    font-size: 0.8em;
    font-weight: normal;
    margin-top: var(--xs);
  }

  .absent {
    color: color-mix(in srgb, var(--text-color) 65%, transparent);
    font-style: italic;
  }

  .result h3 { margin: 0; }
  .lookup, .intro, .source-facts, .reading-notes { max-width: 75ch; }
  .contrast label {
    margin-top: var(--xs);
  }

  .contrast select {
    max-width: 100%;
    width: 100%;
    min-width: 0;
  }

  .error {
    border-color: var(--border-strong);
  }

  .error-message {
    border: 1px solid var(--border-strong);
    color: var(--text-color);
    padding: var(--md);
  }

  @media (max-width: 639px) {
    .source-facts {
      grid-template-columns: minmax(0, 1fr);
    }

    .result-heading {
      display: grid;
    }
  }
</style>
