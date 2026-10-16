<script lang="ts">
  import SectionHeading from '../../components/SectionHeading.svelte';
  import PageMeta from '../../components/PageMeta.svelte';
  import { base } from '$app/paths';
  import { site } from '$lib/site';

  const catalogueUrl = `${base}/duomenu-katalogas`;
</script>

<PageMeta
  title="metodika ir šaltiniai // dažniausi žodžiai"
  description="Kaip skaityti lietuvių kalbos tekstynų dažnius, kur rasti šaltinius ir kaip naudoti rinkinius."
  url={site.methodologyUrl}
/>

<main>
  <p>Lietuvių kalbos tekstynų duomenys, jų palyginimai ir sakinių pavyzdžiai.</p>

  <section class="stack" aria-labelledby="reading-title">
    <SectionHeading id="reading-title">Kaip skaityti duomenis</SectionHeading>
    <ul>
      <li><strong>Dažnumas</strong> – pavartojimų skaičius pasirinktame šaltinyje.</li>
      <li><strong>Lema</strong> – pagrindinė žodžio forma, pavyzdžiui, „namas“.</li>
      <li><strong>Žodžio forma</strong> – konkretus užrašas, pavyzdžiui, „namuose“.</li>
    </ul>
    <p>Grafikai ir eksportas atitinka pasirinktą rinkinį bei filtrus. Lygindami tekstynus atsižvelkite į jų apimtį, laikotarpį ir dažnių skaičiavimo būdą.</p>
    <p>Dažnumas nepaaiškina žodžio reikšmės ar jo ryšių su kitais žodžiais. Tam reikia sakinių kontekstų.</p>
  </section>

  <section class="stack" aria-labelledby="sources-title">
    <SectionHeading id="sources-title">Šaltiniai ir naudojimas</SectionHeading>
    <p><a href={catalogueUrl}>Duomenų kataloge</a> rasite šaltinius, citatas, licencijas ir naudojimo ribas. Naudodami rinkinį laikykitės jo licencijos ir nurodykite šaltinį.</p>
    <p>Rinkiniai atnaujinami retai, patikrinus šaltinį, licenciją ir duomenis.</p>
  </section>

  <section class="stack" aria-labelledby="privacy-title">
    <SectionHeading id="privacy-title">Privatumas</SectionHeading>
    <p>Paieška vyksta jūsų naršyklėje. Svetainėje nėra analitikos ar sekimo scenarijų. Prieglobos paslauga gali saugoti techninius veikimo žurnalus.</p>
  </section>
</main>
