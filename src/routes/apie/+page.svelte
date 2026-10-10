<script lang="ts">
  import { base } from '$app/paths';
  import { site } from '$lib/site';

  const catalogueUrl = `${base}/duomenu-katalogas`;
</script>

<svelte:head>
  <title>metodika ir šaltiniai // dažniausi žodžiai</title>
  <meta name="description" content="Lietuvių kalbos tekstynų duomenys: kaip skaityti dažnius, rasti šaltinius ir naudoti rinkinius." />
  <link rel="canonical" href={site.methodologyUrl} />
  <meta property="og:title" content="Metodika ir šaltiniai // dažniausi žodžiai" />
  <meta property="og:description" content="Kaip skaityti dažnius, rasti šaltinius ir naudoti lietuvių kalbos tekstynų duomenis." />
  <meta property="og:url" content={site.methodologyUrl} />
</svelte:head>

<main class="methodology">
  <p>Lietuvių kalbos tekstynų duomenys, jų palyginimai ir sakinių pavyzdžiai.</p>

  <section aria-labelledby="reading-title">
    <h2 id="reading-title">Kaip skaityti duomenis</h2>
    <ul>
      <li><strong>Dažnumas</strong> – pavartojimų skaičius pasirinktame šaltinyje.</li>
      <li><strong>Lema</strong> – pagrindinė žodžio forma, pavyzdžiui, „namas“.</li>
      <li><strong>Žodžio forma</strong> – konkretus užrašas, pavyzdžiui, „namuose“.</li>
    </ul>
    <p>Grafikai ir eksportas atitinka pasirinktą rinkinį bei filtrus. Lygindami tekstynus atsižvelkite į jų apimtį, laikotarpį ir dažnių skaičiavimo būdą.</p>
    <p>Dažnumas nepaaiškina žodžio reikšmės ar jo ryšių su kitais žodžiais. Tam reikia sakinių kontekstų.</p>
  </section>

  <section aria-labelledby="sources-title">
    <h2 id="sources-title">Šaltiniai ir naudojimas</h2>
    <p><a href={catalogueUrl}>Duomenų kataloge</a> rasite šaltinius, citatas, licencijas ir naudojimo ribas. Naudodami rinkinį laikykitės jo licencijos ir nurodykite šaltinį.</p>
    <p>Rinkiniai atnaujinami retai, patikrinus šaltinį, licenciją ir duomenis.</p>
  </section>

  <section aria-labelledby="privacy-title">
    <h2 id="privacy-title">Privatumas</h2>
    <p>Paieška vyksta jūsų naršyklėje. Svetainėje nėra analitikos ar sekimo scenarijų. Prieglobos paslauga gali saugoti techninius veikimo žurnalus.</p>
  </section>
</main>

<style>
  .methodology { display: grid; grid-template-columns: minmax(0, 1fr); gap: 2rem; }
  .methodology > * { min-width: 0; }
</style>
