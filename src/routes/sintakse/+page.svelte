<script lang="ts">
  import SectionHeading from '../../components/SectionHeading.svelte';
  import SyntaxExplorer from '../../components/SyntaxExplorer.svelte';
  import PageMeta from '../../components/PageMeta.svelte';
  import { site } from '$lib/site';
</script>

<PageMeta
  title="alksnis sintaksė // dažniausi žodžiai"
  description="Lemų sintaksiniai ryšiai ir sakinių pavyzdžiai iš ranka tikrinto ALKSNIS medyno."
  url={site.syntaxExplorerUrl}
/>

<main>
  <header class="stack">
    <SectionHeading>ALKSNIS sintaksės kontekstai</SectionHeading>
    <p>Su kokiais žodžiais lema susijusi sakinyje: ryšiai ir sakinių pavyzdžiai iš ranka tikrinto ALKSNIS medyno.</p>
  </header>
  <SyntaxExplorer />
</main>
