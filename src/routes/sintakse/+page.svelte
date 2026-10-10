<script lang="ts">
  import SectionHeading from '../../components/SectionHeading.svelte';
  import SyntaxExplorer from '../../components/SyntaxExplorer.svelte';

</script>

<svelte:head>
  <title>alksnis sintaksės kontekstai // dažniausi žodžiai</title>
</svelte:head>

<main>
  <SectionHeading>ALKSNIS sintaksės kontekstai</SectionHeading>
  <SyntaxExplorer />
</main>

<style>
  main > :global(.dago-section-heading) {
    margin: 0 0 1.5rem;
  }
</style>
