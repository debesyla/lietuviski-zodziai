<script lang="ts">
  import SectionHeading from './SectionHeading.svelte';
  import WordLookup from './WordLookup.svelte';
  import {
    loadSyntaxContexts,
    loadSyntaxOverview,
    searchSyntaxLemmas,
    type SyntaxContextExample,
    type SyntaxLemma,
    type SyntaxOverviewData
  } from '$lib/syntax-context';

  // Plain-language names for the most common ALKSNIS relation labels.
  const relationNames: Record<string, string> = {
    Atr: 'pažyminys',
    Obj: 'papildinys',
    Adv: 'aplinkybė',
    Sub: 'veiksnys',
    Pred: 'tarinys',
    App: 'priedėlis',
    Par: 'įterpinys',
    Coord: 'sujungimas',
    AuxP: 'prielinksnis',
    AuxC: 'jungtukas'
  };
  const closingPunctuation = /^[,.;:!?…)\]»“]+$/;
  const openingPunctuation = /^[(\[«„]+$/;

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
    if (direction === 'root') return 'lema – sakinio šaknis';
    return 'lema – priklausomasis žodis';
  }

  function relationName(relation: string) {
    const [label, ...rest] = relation.split('_');
    const name = relationNames[label];
    if (!name) return '';
    return rest.includes('Co') ? `${name}, vienarūšis` : name;
  }

  // Source sentences are tokenised with spaces around punctuation.
  function sentenceTokens(context: SyntaxContextExample) {
    const tokens = context.sentenceText.split(' ').filter(Boolean);
    const related = new Set([context.dependentForm, context.headForm]);
    return tokens.map((text, index) => ({
      text,
      space: index > 0 && !closingPunctuation.test(text) && !openingPunctuation.test(tokens[index - 1]),
      related: related.has(text)
    }));
  }

  async function search(value: string) {
    if (!overview) return;
    const request = ++searchRequest;
    ++contextRequest;
    contextLoading = false;
    const term = value.trim();
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
      // An exact lemma needs no extra click.
      const exact = found.matches.find((lemma) => lemma.lemma.toLocaleLowerCase('lt') === term.toLocaleLowerCase('lt'));
      if (exact) void selectLemma(exact);
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
  <p class="note" role="status" aria-live="polite">Kraunama ALKSNIS apžvalga…</p>
{:else if error}
  <div class="notice error" role="alert">
    <p><strong>Nepavyko įkelti sintaksės duomenų.</strong></p>
    <p>{error}</p>
  </div>
{:else if overview}
  <section class="stack" aria-label="Lemos paieška">
    <WordLookup
      id="syntax-lemma-query"
      label="Lemos pradžia"
      placeholder="pvz., žmogus"
      hint="Pasirinkite rastą lemą ir pamatysite sakinių pavyzdžius."
      busy={searching}
      examples={['žmogus', 'valstybė', 'darbas']}
      bind:value={query}
      onsearch={search}
    />

    {#if searchError}
      <p class="notice error" role="alert">{searchError}</p>
    {:else if searched && !searching && resultTotal === 0}
      <p class="notice" role="status" aria-live="polite">Atitikmenų nerasta.</p>
    {/if}

    {#if results.length > 0}
      <p class="note" role="status" aria-live="polite">
        {#if resultTotal > results.length}Rasta {resultTotal}; rodomos pirmos {results.length}.{:else}Rasta lemų: {resultTotal}.{/if}
        Skaičius – pavartojimai tekstyne.
      </p>
      <ul class="lemma-results" aria-label="Rastos lemos">
        {#each results as lemma}
          <li>
            <button type="button" class="text-button" aria-pressed={selectedLemma?.lemma === lemma.lemma} onclick={() => selectLemma(lemma)}>
              {lemma.lemma} <span class="note">{lemma.tokenCount}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  {#if selectedLemma}
    <section class="stack" aria-labelledby="contexts-title">
      <SectionHeading id="contexts-title">Sakinių kontekstai: {selectedLemma.lemma}</SectionHeading>
      <p class="note">Iki {overview.manifest.syntaxContext.exampleSelection.maxExamplesPerLemma} pavyzdžių šaltinio tvarka. Pažymėti susiję žodžiai.</p>
      {#if contextLoading}
        <p class="note" role="status" aria-live="polite">Kraunami sakiniai…</p>
      {:else if contextError}
        <p class="notice error" role="alert">{contextError}</p>
      {:else if contexts.length === 0}
        <p class="notice" role="status">Šiai lemai išsaugotų kontekstų nėra.</p>
      {:else}
        <ol class="context-list">
          {#each contexts as context}
            <li>
              <p><strong>{context.relation}</strong>{#if relationName(context.relation)}{' '}({relationName(context.relation)}){/if} <span class="inline-separator" aria-hidden="true">//</span> {directionLabel(context.direction)}</p>
              <p class="note">priklausomasis: <strong>{context.dependentForm}</strong> ({context.dependentLemma}) <span class="inline-separator" aria-hidden="true">//</span> pagrindinis: <strong>{context.headForm}</strong> ({context.headLemma})</p>
              <blockquote>{#each sentenceTokens(context) as token}{#if token.space}{' '}{/if}{#if token.related}<mark>{token.text}</mark>{:else}{token.text}{/if}{/each}</blockquote>
              <p class="note">{context.genre} <span class="inline-separator" aria-hidden="true">//</span> {context.sourceSentenceId}</p>
            </li>
          {/each}
        </ol>
      {/if}
    </section>
  {/if}

  <div>
    <details>
      <summary>Kaip skaityti</summary>
      <div class="details-body">
        <p>ALKSNIS yra ranka tikrintas sintaksės medynas. Jo ryšiai ir pavyzdžiai neaprašo visos lietuvių kalbos vartosenos.</p>
        <dl class="facts">
          <div><dt>Dokumentai</dt><dd>{overview.manifest.syntaxContext.overview.documents}</dd></div>
          <div><dt>Sakiniai (pagal ID)</dt><dd>{overview.manifest.syntaxContext.overview.deliveredSentenceIds}</dd></div>
          <div><dt>Žodžiai be skyrybos</dt><dd>{overview.manifest.syntaxContext.overview.nonPunctuationRows}</dd></div>
          <div><dt>Ryšių žymos</dt><dd>{overview.manifest.syntaxContext.overview.nonPunctuationRelationLabels}</dd></div>
        </dl>
        <p class="note">Šaltinyje nurodyti {overview.manifest.syntaxContext.overview.repositorySentenceClaim} sakiniai; CoNLL-U bylose – {overview.manifest.syntaxContext.overview.deliveredSentenceIds} sakinių ID.</p>
        <div class="summary-columns">
          <section class="stack" aria-labelledby="relation-summary-title">
            <SectionHeading level={3} id="relation-summary-title">Dažniausios ryšių žymos</SectionHeading>
            <table>
              <thead><tr><th scope="col">Žyma</th><th scope="col" class="number">Žodžiai</th></tr></thead>
              <tbody>
                {#each overview.relations.slice(0, 12) as relation}
                  <tr><td>{relation.relation}{#if relationName(relation.relation)} <span class="note">{relationName(relation.relation)}</span>{/if}</td><td class="number">{relation.count}</td></tr>
                {/each}
              </tbody>
            </table>
          </section>
          <section class="stack" aria-labelledby="genre-summary-title">
            <SectionHeading level={3} id="genre-summary-title">Šaltinio žanrai</SectionHeading>
            <table>
              <thead><tr><th scope="col">Žanras</th><th scope="col" class="number">Dok.</th><th scope="col" class="number">Sak.</th></tr></thead>
              <tbody>
                {#each overview.genres as genre}
                  <tr><td>{genre.genre}</td><td class="number">{genre.documents}</td><td class="number">{genre.sentences}</td></tr>
                {/each}
              </tbody>
            </table>
          </section>
        </div>
        <ul>
          <li>Dėl pavyzdžių ribos nerodomos {overview.manifest.syntaxContext.exampleSelection.omittedRows} galimos ryšių eilutės.</li>
          {#each overview.manifest.syntaxContext.exclusions as exclusion}
            <li>{exclusion}</li>
          {/each}
          <li>Šaknies vaidmuo išsaugomas kaip šaltinio HEAD=0 / ROOT, be sugalvotos leksinės galvos.</li>
          <li>Žanrų lentelė aprašo šio šaltinio sandarą; ji nėra reikšmingumo ar visos kalbos palyginimas.</li>
        </ul>
      </div>
    </details>
    <details>
      <summary>Šaltinis ir licencija</summary>
      <div class="details-body">
        <p>{overview.manifest.provenance.citation}</p>
        <p>Licencija: {overview.manifest.provenance.licence}</p>
        <p><a href={overview.manifest.provenance.sourceUrl} target="_blank" rel="noreferrer">Pirminis ALKSNIS įrašas</a></p>
      </div>
    </details>
  </div>
{/if}

<style>
  .lemma-results { display: grid; gap: .25rem 2rem; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); list-style: none; padding: 0; }
  .lemma-results li + li { margin-top: 0; }
  .lemma-results button { text-align: left; }
  .lemma-results button[aria-pressed="true"] { font-weight: 700; text-decoration: none; }
  .context-list { display: grid; gap: 1.5rem; overflow-wrap: anywhere; }
  .context-list li + li { margin-top: 0; }
  .context-list li > * + * { margin-top: .25rem; }
  blockquote { border-left: 2px solid hsl(var(--theme) / .55); margin: .5rem 0; padding-left: .75rem; }
  mark { background: hsl(var(--theme) / .2); color: inherit; padding: 0 .15em; }
  .summary-columns { display: grid; gap: 1.5rem 2rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr)); }
</style>
