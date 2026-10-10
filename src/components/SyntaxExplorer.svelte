<script lang="ts">
  import {
    loadSyntaxContexts,
    loadSyntaxOverview,
    searchSyntaxLemmas,
    type SyntaxContextExample,
    type SyntaxLemma,
    type SyntaxOverviewData
  } from '$lib/syntax-context';

  let overview = $state<SyntaxOverviewData | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let query = $state('');
  let searching = $state(false);
  let searched = $state(false);
  let searchError = $state<string | null>(null);
  let results = $state<SyntaxLemma[]>([]);
  let resultTotal = $state(0);
  let selectedLemma = $state<SyntaxLemma | null>(null);
  let contextLoading = $state(false);
  let contextError = $state<string | null>(null);
  let searchRequest = 0;
  let contextRequest = 0;
  let contexts = $state<SyntaxContextExample[]>([]);

  function directionLabel(direction: SyntaxContextExample['direction']) {
    if (direction === 'head') return 'lema – pagrindinis žodis';
    if (direction === 'root') return 'lema – sakinio šaknis (HEAD=0)';
    return 'lema – priklausomasis žodis';
  }

  async function search(event: SubmitEvent) {
    event.preventDefault();
    if (!overview) return;
    const request = ++searchRequest;
    ++contextRequest;
    contextLoading = false;
    const term = query.trim();
    searchError = null;
    results = [];
    resultTotal = 0;
    selectedLemma = null;
    contexts = [];
    contextError = null;
    if (!term) {
      searching = false;
      searchError = 'Įveskite bent vieną lemos raidę.';
      return;
    }
    searched = true;
    searching = true;
    try {
      const found = await searchSyntaxLemmas(overview.manifest, term);
      if (request !== searchRequest) return;
      results = found.matches;
      resultTotal = found.total;
    } catch (cause) {
      if (request !== searchRequest) return;
      searchError = cause instanceof Error ? cause.message : String(cause);
    } finally {
      if (request === searchRequest) searching = false;
    }
  }

  async function selectLemma(lemma: SyntaxLemma) {
    if (!overview) return;
    const request = ++contextRequest;
    selectedLemma = lemma;
    contexts = [];
    contextError = null;
    contextLoading = true;
    try {
      const loaded = await loadSyntaxContexts(overview.manifest, lemma.lemma);
      if (request === contextRequest) contexts = loaded;
    } catch (cause) {
      if (request !== contextRequest) return;
      contextError = cause instanceof Error ? cause.message : String(cause);
    } finally {
      if (request === contextRequest) contextLoading = false;
    }
  }

  $effect(() => {
    let cancelled = false;
    loadSyntaxOverview().then((loaded) => {
      if (cancelled) return;
      overview = loaded;
      loading = false;
    }).catch((cause) => {
      if (cancelled) return;
      error = cause instanceof Error ? cause.message : String(cause);
      loading = false;
    });
    return () => {
      cancelled = true;
    };
  });
</script>

{#if loading}
  <p class="status" role="status" aria-live="polite">Kraunama ALKSNIS apžvalga…</p>
{:else if error}
  <section class="error" role="alert">
    <h2>Nepavyko įkelti sintaksės duomenų</h2>
    <p>{error}</p>
  </section>
{:else if overview}
  <section class="explorer" aria-label="ALKSNIS apžvalga">
    <header>
      <p>
        Lemų ryšiai ir sakinių pavyzdžiai iš ALKSNIS tekstyno.
      </p>

    </header>

    <section class="lemma-search" aria-label="Lemos paieška">
      <p>
        Pasirinkite rastą lemą, kad pamatytumėte sakinių pavyzdžius.
      </p>
      <form onsubmit={search}>
        <label for="syntax-lemma-query">Lemos pradžia</label>
        <div class="search-controls">
          <input id="syntax-lemma-query" bind:value={query} autocomplete="off" placeholder="pvz., kalba" />
          <button type="submit" class="primary-button" disabled={searching}>{searching ? 'Ieškoma…' : 'Ieškoti'}</button>
        </div>
      </form>

      {#if searchError}
        <p class="error-inline" role="alert">{searchError}</p>
      {/if}
      {#if searched && !searching && !searchError && (resultTotal === 0 || resultTotal > results.length)}
        <p class="result-count" role="status" aria-live="polite">
          {#if resultTotal === 0}
            Atitikmenų nerasta.
          {:else if resultTotal > results.length}
            Rasta {resultTotal}; rodomi pirmi {results.length}.
          {/if}
        </p>
      {/if}
      {#if results.length > 0}
        <ul class="lemma-results" aria-label="Rastos lemos">
          {#each results as lemma}
            <li>
              <button
                type="button"
                class="text-button"
                aria-pressed={selectedLemma?.lemma === lemma.lemma}
                onclick={() => selectLemma(lemma)}
              >
                <strong>{lemma.lemma}</strong>
                <span>Pavartojimai: {lemma.tokenCount}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    {#if selectedLemma}
      <section class="contexts" aria-labelledby="contexts-title">
        <h2 id="contexts-title">Sakinių kontekstai: {selectedLemma.lemma}</h2>
        <p>
          Iki {overview.manifest.syntaxContext.exampleSelection.maxExamplesPerLemma} pavyzdžių šaltinio tvarka.
        </p>
        {#if contextLoading}
          <p class="status" role="status" aria-live="polite">Kraunami pasirinktos lemos sakiniai…</p>
        {:else if contextError}
          <p class="error-inline" role="alert">{contextError}</p>
        {:else if contexts.length === 0}
          <p class="status" role="status">Šiai lemai išsaugotų kontekstų nėra.</p>
        {:else}
          <ol class="context-list">
            {#each contexts as context}
              <li>
                <p><strong>{context.relation}</strong> <span class="inline-separator" aria-hidden="true">//</span> {directionLabel(context.direction)}</p>
                <p class="relation-pair">
                  <span>priklausomasis: <strong>{context.dependentForm}</strong> ({context.dependentLemma})</span>
                  <span>pagrindinis: <strong>{context.headForm}</strong> ({context.headLemma})</span>
                </p>
                <blockquote>{context.sentenceText}</blockquote>
                <details class="context-source"><summary>Šaltinis</summary><div class="details-content">{context.genre} <span class="inline-separator" aria-hidden="true">//</span> {context.document} <span class="inline-separator" aria-hidden="true">//</span> sakinys {context.sourceSentenceId}</div></details>
              </li>
            {/each}
          </ol>
        {/if}
      </section>
    {/if}

    <details>
      <summary>Apie tekstyną ir jo ribas</summary>
      <div class="details-content">
      <p>
        <a href={overview.manifest.provenance.sourceUrl} target="_blank" rel="noreferrer">Pirminis ALKSNIS įrašas</a>
        <span class="inline-separator" aria-hidden="true">//</span> {overview.manifest.provenance.licence}
      </p>
        <p>ALKSNIS yra ranka tikrintas tekstynas. Jo ryšiai ir pavyzdžiai neaprašo visos lietuvių kalbos vartosenos.</p>
    <dl class="overview-grid">
      <div><dt>Dokumentai</dt><dd>{overview.manifest.syntaxContext.overview.documents}</dd></div>
      <div><dt>Sakiniai (pagal ID)</dt><dd>{overview.manifest.syntaxContext.overview.deliveredSentenceIds}</dd></div>
      <div><dt>Žetonai be skyrybos</dt><dd>{overview.manifest.syntaxContext.overview.nonPunctuationRows}</dd></div>
      <div><dt>Ryšių žymos</dt><dd>{overview.manifest.syntaxContext.overview.nonPunctuationRelationLabels}</dd></div>
    </dl>

    <p class="source-note">
      Šaltinyje nurodyti {overview.manifest.syntaxContext.overview.repositorySentenceClaim} sakiniai; CoNLL-U bylose – {overview.manifest.syntaxContext.overview.deliveredSentenceIds} sakinių ID.
    </p>

    <div class="summary-columns">
      <section aria-labelledby="relation-summary-title">
        <h3 id="relation-summary-title">Dažniausios ryšių žymos</h3>
        <table>
          <thead><tr><th scope="col">Žyma</th><th scope="col">Eilučių</th></tr></thead>
          <tbody>
            {#each overview.relations.slice(0, 12) as relation}
              <tr><td>{relation.relation}</td><td>{relation.count}</td></tr>
            {/each}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="genre-summary-title">
        <h3 id="genre-summary-title">Šaltinio žanrai</h3>
        <table>
          <thead><tr><th scope="col">Žanras</th><th scope="col">Dok.</th><th scope="col">Sak.</th></tr></thead>
          <tbody>
            {#each overview.genres as genre}
              <tr><td>{genre.genre}</td><td>{genre.documents}</td><td>{genre.sentences}</td></tr>
            {/each}
          </tbody>
        </table>
      </section>
    </div>



        <p>{overview.manifest.provenance.citation}</p>
        <p>Dėl pavyzdžių ribos nerodomos {overview.manifest.syntaxContext.exampleSelection.omittedRows} galimos ryšių eilutės visame rinkinyje.</p>
        <ul>
          {#each overview.manifest.syntaxContext.exclusions as exclusion}
            <li>{exclusion}</li>
          {/each}
          <li>Šaknies vaidmuo išsaugomas kaip šaltinio HEAD=0 / ROOT, be sugalvotos leksinės galvos.</li>
          <li>Žanrų lentelė aprašo šio šaltinio sandarą; ji nėra reikšmingumo ar visos kalbos palyginimas.</li>
        </ul>
      </div>
    </details>
  </section>
{/if}

<style>
  .status,
  .error {
    border: 1px solid var(--border-color);
    margin-top: var(--lg);
    padding: var(--md);
  }

  .error,
  .error-inline {
    border-color: var(--border-strong);
  }

  .source-note,
  .lemma-search > p,
  .contexts > p,
  .context-list p,
  blockquote {
    margin-top: var(--sm);
  }

  .overview-grid {
    display: grid;
    gap: var(--sm);
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-top: var(--lg);
  }

  .overview-grid div {
    border: 0;
    padding-left: 0;
  }

  .overview-grid dt {
    font-size: 0.875em;
  }

  .overview-grid dd {
    font-size: inherit;
    margin: 0;
  }

  .summary-columns {
    display: grid;
    gap: var(--lg);
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-top: var(--lg);
  }

  h3 {
    margin-bottom: var(--sm);
  }

  th,
  td {
    text-align: left;
    vertical-align: top;
  }

  .explorer { min-width: 0; }
  .explorer > header, .lemma-search { max-width: 75ch; }
  .source-note { margin-top: 1.5rem; }
  .lemma-search label { display: block; font-weight: 700; }
  .lemma-search, .contexts { margin-top: 2rem; min-width: 0; }
  .summary-columns > section { min-width: 0; }

  .search-controls {
    display: flex;
    gap: 1rem;
    margin-top: var(--sm);
  }

  .search-controls input {
    flex: 1;
    min-width: 0;
    max-width: 100%;
  }

  .result-count,
  .error-inline {
    margin-top: var(--sm);
  }

  .lemma-results {
    list-style: none;
    margin-top: var(--md);
    padding: 0;
  }

  .lemma-results li + li {
    margin-top: var(--xs);
  }

  .lemma-results button {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sm);
    justify-content: space-between;
    text-align: left;
    width: 100%;
  }

  .lemma-results span {
    display: inline-block;
    font-size: 0.875em;
  }

  .context-list {
    margin-top: var(--md);
  }

  .context-list li + li { margin-top: 2rem; }

  .relation-pair {
    display: flex;
    flex-wrap: wrap;
    gap: var(--md);
  }

  blockquote {
    border-left: 2px solid var(--text-color);
    margin-left: 0;
    padding-left: var(--sm);
  }

  .lemma-results button[aria-pressed="true"] { font-weight: 700; text-decoration: none; }
  .context-source {
    overflow-wrap: anywhere;
    font-size: 0.875em;
  }

  details { margin-top: 1.5rem; }
  .context-source { margin-top: .75rem; }

  .details-content { padding: 1rem; }

  @media (max-width: 639px) {
    .overview-grid,
    .summary-columns {
      grid-template-columns: 1fr;
    }
  }
</style>
