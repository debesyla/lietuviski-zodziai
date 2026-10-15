// Lithuanian translations for the application
export const translations = {
  lt: {
    // SearchBar component
    searchPlaceholder: 'Ieškoti žodžių...',
    searchWords: 'Ieškoti žodžių',
    clearSearch: 'Išvalyti paiešką',
    
    // DataTable component
    word: 'Žodis',
    type: 'Tipas',
    frequency: 'Dažnumas',
    sortBy: 'Rikiuoti pagal',
    unsorted: 'nerikiuota',
    
    // DataLoader component
    loading: 'Kraunama…',
    errorLoadingData: 'Klaida Kraunant Duomenis',
    author: 'Autorius',
    year: 'Metai',
    entryKind: 'Duomenų vienetas',
    lemma: 'Lema',
    wordform: 'Žodžio forma',
    licence: 'Licencija',
    citation: 'Citata',
    source: 'Šaltinis',
    sourceDetails: 'Šaltinis ir citata',
    openSource: 'Atverti pirminį šaltinį',
    words: 'Žodžiai',
    searchHint: 'Ieškokite viso žodžio arba jo dalies.',
    filterByType: 'Filtruoti pagal kalbos dalį',
    posScheme: 'Kalbos dalių žymėjimas',
    clearFilters: 'Išvalyti filtrus',
    updatingResults: 'Ieškoma…',
    noMatchingWords: 'Žodžių nerasta.',
    showingResults: 'Rodomi {start}–{end} iš {total}',
    pagination: 'Rezultatų puslapiai',
    previousPage: 'Ankstesnis',
    nextPage: 'Kitas',
    pageOf: '{page} iš {total}',
    
    // DownloadButton component
    downloadData: 'Atsisiųsti CSV',
    ascending: 'didėjančia tvarka',
    descending: 'mažėjančia tvarka',
    exported: 'Eksportuota',
    query: 'Paieška',
    types: 'Tipai',
    all: 'visi',
    sortOrder: 'Rikiavimas',

    // Frequency dashboard
    frequencyDashboard: 'Dažnumo vaizdas',
    analysisForActiveFilters: 'Skaičiavimai atnaujinami pagal pasirinktą rinkinį ir aktyvius filtrus.',
    showAnalysis: 'Rodyti grafikus ir įžvalgas',
    headlineMetrics: 'Pagrindiniai dažnumo rodikliai',
    entries: 'Įrašai',
    totalFrequency: 'Pavartojimų',
    mostFrequent: 'Dažniausias',
    availableDimensions: 'Turimi matmenys',
    wordAndFrequency: 'Žodis · dažnumas',
    wordFrequencyAndPos: 'Žodis · dažnumas · kalbos dalis',
    frequencyFacts: 'Aprėptis skaičiais',
    frequencyFactsDescription: 'Faktai apskaičiuoti tik iš pasirinkto šaltinio ir aktyvius filtrus atitinkančių įrašų.',
    leadingEntryShare: 'Dažniausio įrašo dalis',
    leadingEntryFact: '„{word}“: {share} pavartojimų.',
    halfCoverage: '50 % pavartojimų',
    ninetyCoverage: '90 % pavartojimų',
    coverageMilestoneFact: 'Įrašų: {entries} ({entryShare} sąrašo).',
    singletonTail: 'Vieną kartą pavartoti įrašai',
    singletonFact: 'Įrašų: {entries} ({entryShare} sąrašo); pavartojimų: {tokenShare}.',
    topWords: 'Pavartojimų skaičius',
    topWordsDescription: 'Pavartojimų skaičius.',
    showTop: 'Rodyti',
    tableEquivalent: 'Lentelė',
    rank: 'Rangas',
    rankFrequency: 'Dažnumo pasiskirstymas',
    rankFrequencyDescription: 'Žodžiai surikiuoti nuo dažniausio iki rečiausio: kairėje – dažniausi, dešinėje – reti. Abi ašys logaritminės: vienodas tarpas reiškia dešimteriopą skirtumą.',
    rankFrequencyText: 'Iš {count} atrinktų įrašų pirmo rango dažnumas yra {first}, o paskutinio — {last}.',
    rankLogScale: 'Rangas (log skalė)',
    frequencyLogScale: 'Dažnumas (log skalė)',
    cumulativeCoverage: 'Aprėptis',
    coverageDescription: 'Kokią visų pavartojimų dalį sudaro dažniausi žodžiai kartu? Pavyzdžiui, ties 100 kreivė rodo pirmųjų 100 žodžių dalį.',
    coverageText: 'Pirmi dešimt įrašų sudaro {topTen} atrinktų pavartojimų.',
    cumulativeFrequency: 'Sukauptas dažnumas',
    tokenCoverage: 'Pavartojimų dalis',
    posComposition: 'Kalbos dalys',
    posCompositionDescription: 'Dalis pagal pavartojimų skaičių.',
    
    // Main page
    pageTitle: 'Lietuviški žodžiai',
    exploreData: 'Tyrinėti duomenis',
    dataProductsCatalogue: 'Duomenų katalogas',
    methodologyAndSources: 'Metodika ir šaltiniai',
    siteNavigation: 'Pagrindinė navigacija',
    siteIntroduction: 'Pasirinkite šaltinį, įrašykite žodį ir pamatykite jo dažnį.',
    openMethodology: 'Apie metodiką ir šaltinius',
    selectDataset: 'Pasirinkite duomenis',
    loadingCatalog: 'Kraunama…',
    errorLoadingCatalog: 'Klaida kraunant duomenų katalogą',
    noDatasets: 'Duomenų kataloge nėra rinkinių.',
    dataProductsTitle: 'Vieši duomenų produktai',
    dataProductsDescription: 'Palyginimai, žanrai, sintaksė ir visi vieši rinkiniai.',
    openDataProducts: 'Naršyti viešų duomenų katalogą',
    openDataProductsJson: 'Atverti mašininiu būdu nuskaitomą katalogą (JSON)',
    footerText: 'Pastabos ar pasiūlymai? ',
    footerEmail: 'labas@dago.lt',
  }
};

export function t(key: string, parameters: Record<string, string | number> = {}): string {
  const keys = key.split('.');
  let value: any = translations.lt;
  
  for (const k of keys) {
    value = value[k];
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  return Object.entries(parameters).reduce((text, [name, parameter]) => {
    return text.replaceAll(`{${name}}`, String(parameter));
  }, value);
}
