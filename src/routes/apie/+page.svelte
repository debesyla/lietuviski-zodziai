<script lang="ts">
  import SectionHeading from '../../components/SectionHeading.svelte';
  import PageMeta from '../../components/PageMeta.svelte';
  import { base } from '$app/paths';
  import { site } from '$lib/site';

  const catalogueUrl = `${base}/duomenu-katalogas`;
</script>

<PageMeta
  title="metodika ir šaltiniai // dažniausi lietuviški žodžiai"
  description="Kaip skaityti lietuvių kalbos tekstynų dažnius, kur rasti šaltinius ir kaip naudoti rinkinius."
  url={site.methodologyUrl}
/>

<main>
  <p>Iš kur čia skaičiai, kam jie naudingi ir kaip juos skaityti.</p>

  <section class="stack" aria-labelledby="corpus-title">
    <SectionHeading id="corpus-title">Kas yra tekstynas?</SectionHeading>
    <p>Tekstynas yra didelis, aprašytas tikrų tekstų rinkinys: knygos, spauda, dokumentai, internetas, kartais ir užrašyta sakytinė kalba. Jame suskaičiuotas kiekvienas žodis, todėl galima pamatyti, kurie žodžiai kartojasi dažniausiai ir kokiuose tekstuose.</p>
    <p>Kiekvienas tekstynas sudarytas savaip, todėl čia rodomi skaičiai aprašo konkretų šaltinį, o ne visą lietuvių kalbą.</p>
  </section>

  <section class="stack" aria-labelledby="audience-title">
    <SectionHeading id="audience-title">Kam tai naudinga?</SectionHeading>
    <ul>
      <li><strong>Besimokantiems lietuvių kalbos</strong> – vos keli šimtai dažniausių žodžių sudaro pusę visų tekstų, tad nuo jų verta pradėti.</li>
      <li><strong>Mokytojams ir rašantiems</strong> – ar žodis knyginis, ar kasdienis, ir su kokiais žodžiais jis jungiasi sakinyje.</li>
      <li><strong>Žurnalistams ir tyrėjams</strong> – kaip žodžio vartosena skiriasi laikotarpiais, žanrais ir karo meto tekstuose.</li>
      <li><strong>Programuotojams ir kalbos technologijų komandoms</strong> – licencijuoti dažnumo sąrašai CSV ir JSON formatu, su šaltiniais.</li>
    </ul>
  </section>

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
