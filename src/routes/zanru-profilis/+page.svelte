<script lang="ts">
  import RateBars from '../../components/RateBars.svelte';
  import {
    loadCcllGenreProfile,
    lookupCcllGenreWord,
    ratePerMillion,
    type CcllGenreProfile,
    type GenreProfileLookupResult
  } from '$lib/ccll-genre-profile';
  import { site } from '$lib/site';

  let profile = $state<CcllGenreProfile | null>(null);
  let loading = $state(true);
  let loadError = $state<string | null>(null);
  let query = $state('');
  let result = $state<GenreProfileLookupResult | null>(null);
  let lookupError = $state<string | null>(null);
  let lookupLoading = $state(false);
  let searched = $state(false);
  let requestNumber = 0;

  function formatNumber(value: number) {
    return value.toLocaleString('lt-LT');
  }

  function formatRate(value: number | null) {
    return value === null ? 'Neaptikta' : value.toLocaleString('lt-LT', { maximumFractionDigits: 2 });
  }

  async function search() {
    if (!profile || !query.trim()) return;
    searched = true;
    result = null;
    lookupError = null;
    lookupLoading = true;
    const request = ++requestNumber;
    try {
      const loaded = await lookupCcllGenreWord(profile, query);
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

  function downloadResult() {
    const activeProfile = profile;
    const activeResult = result;
    if (!activeProfile || !activeResult) return;
    const payload = {
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
    };
    const url = URL.createObjectURL(new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ccll-zanru-profilis-${encodeURIComponent(activeResult.word)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  $effect(() => {
    let cancelled = false;
    loadCcllGenreProfile().then((loaded) => {
      if (cancelled) return;
      profile = loaded;
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
  <title>ccll žanrų profilis pagal žodžio formą</title>
  <meta name="description" content="Tiksli žodžio formos paieška penkiuose pavadintuose CCLL subkorpusuose, su atskirais dažniais ir vardikliais." />
  <link rel="canonical" href={site.genreProfileUrl} />
  <meta property="og:title" content="CCLL žanrų profilis pagal žodžio formą" />
  <meta property="og:description" content="Tiksli žodžio formos paieška penkiuose pavadintuose CCLL subkorpusuose." />
  <meta property="og:url" content={site.genreProfileUrl} />
</svelte:head>

<main>
  <header>
  <h1>ccll žanrų profilis</h1>
  <p class="intro">Tikslios žodžio formos dažnumas penkiuose CCLL žanruose. Rodikliai skaičiuojami milijonui žetonų.</p>
  </header>

  {#if loading}
    <p class="status" role="status" aria-live="polite">Kraunama žanrų profilio suvestinė…</p>
  {:else if loadError}
    <section class="error" role="alert" aria-labelledby="profile-load-error">
      <h2 id="profile-load-error">Nepavyko įkelti žanrų profilio</h2>
      <p>{loadError}</p>
    </section>
  {:else if profile}
    <form class="lookup" onsubmit={submitSearch}>
      <label for="word-query">Tiksli žodžio forma</label>
      <div class="lookup-controls">
        <input id="word-query" bind:value={query} autocomplete="off" spellcheck="false" placeholder="pvz., karas" required />
        <button type="submit" class="primary-button" disabled={lookupLoading}>{lookupLoading ? 'Ieškoma…' : 'Ieškoti'}</button>
      </div>
    </form>


    {#if lookupLoading}
      <p class="status" role="status" aria-live="polite">Ieškoma pasirinktos žodžio formos…</p>
    {:else if lookupError}
      <p class="error-message" role="alert">{lookupError}</p>
    {:else if searched && !result}
      <section class="empty" aria-live="polite">
        <h2>Forma nerasta</h2>
        <p>Forma neaptikta šiuose žanruose. Tai nereiškia, kad jos nėra lietuvių kalboje ar kad jos dažnis lygus nuliui.</p>
      </section>
    {:else if result}
      <section class="result" aria-labelledby="result-title" aria-live="polite">
        <div class="result-heading">
          <div>
            <h2 id="result-title">{result.word}</h2>
          </div>
          <button type="button" class="text-button" onclick={downloadResult}>Atsisiųsti JSON</button>
        </div>

        <h3>Pavartojimai milijonui žetonų</h3>
        <RateBars rows={profile.sources.map(source => ({ label: source.label, value: ratePerMillion(profile!, result!, source.id) }))} unit="Pavartojimai milijonui žetonų" />
        <details><summary>Lentelė</summary><div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Subkorpusas</th>
                <th scope="col">Pirminis žetonų skaičius</th>
                <th scope="col">/ 1 mln. šaltinio žetonų</th>
                <th scope="col">Šaltinio vardiklis</th>
              </tr>
            </thead>
            <tbody>
              {#each profile.sources as source}
                {@const rawCount = result.rawCounts[source.id]}
                {@const rate = ratePerMillion(profile, result, source.id)}
                <tr>
                  <th scope="row">{source.label}</th>
                  <td class:absent={rawCount === null}>{rawCount === null ? 'Neaptikta' : formatNumber(rawCount)}</td>
                  <td class:absent={rate === null}>{formatRate(rate)}</td>
                  <td>{formatNumber(source.sourceTokens)}</td>

                </tr>
              {/each}
            </tbody>
          </table>
        </div></details>
      </section>
    {/if}

    <details class="reading-notes">
      <summary>Kaip skaityti palyginimą</summary>
      <div class="reading-notes-content">
    <dl class="source-facts">
      <div>
        <dt>Paieškos formų</dt>
        <dd>{formatNumber(profile.summary.joinedWordforms)}</dd>
      </div>
      <div>
        <dt>Pavadintų subkorpusų</dt>
        <dd>{formatNumber(profile.sources.length)}</dd>
      </div>
      <div>
        <dt>Rodiklio vienetas</dt>
        <dd>Pavartojimai milijonui žetonų</dd>
      </div>
      <div>
        <dt>Licencija</dt>
        <dd>{profile.provenance.licence}</dd>
      </div>
    </dl>


      <ul>
        <li>Rodomi tik penki pavadinti subkorpusai; bendras CCLL sąrašas ir jo abėcėlinis indeksas nėra žanrai ir čia neįtraukiami.</li>
        <li>„Neaptikta“ yra šaltinio <code>null</code>, o ne nulinis dažnis.</li>
        <li>Rodiklis milijonui žetonų apskaičiuojamas atskirai iš kiekvieno subkorpuso vardiklio. Tai nėra bendras žodžių populiarumo reitingas ar „būdingiausių žodžių“ lentelė.</li>
        <li>Skyrybos ženklai, didžiosios ir mažosios raidės išlaikomi taip, kaip pateikta šaltinio žodžių formų sąrašuose.</li>
      </ul>
      <p><a href={profile.provenance.sourceUrl} target="_blank" rel="noreferrer">Atverti pirminį CLARIN-LT šaltinio įrašą</a> <span class="inline-separator" aria-hidden="true">//</span> {profile.provenance.citation}</p>
      </div>
    </details>
  {/if}
</main>

<style>
  main,
  .lookup,
  .result,
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
  .reading-notes p {
    color: color-mix(in srgb, var(--text-color) 78%, transparent);
  }

  .lookup,
  .source-facts,
  .result,
  .empty,
  .error,
  .status {
    border: 0;
    padding: 0;
  }

  .lookup,
  .source-facts,
  .result,
  .empty,
  .error,
  .status,
  .table-scroll {
    min-width: 0;
  }

  .lookup label { font-weight: 700; }
  .lookup-controls,
  .result-heading {
    align-items: start;
    display: flex;
    flex-wrap: wrap;
    gap: var(--sm);
  }

  .result-heading {
    justify-content: space-between;
  }

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

  .table-scroll {
    max-width: 100%;
    overflow-x: auto;
    width: 100%;
  }

  table { min-width: 48rem; }

  .absent {
    color: color-mix(in srgb, var(--text-color) 65%, transparent);
    font-style: italic;
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


    table { min-width: 48rem; }

  }
  main { max-width: 100ch; }
  .lookup, .intro, .source-facts, .reading-notes { max-width: 75ch; }
  .result h3 { margin: 0; }
  .reading-notes-content { padding: 1rem; }
</style>
