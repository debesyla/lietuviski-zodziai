// Lithuanian interface copy for the word-frequency explorer.
export const translations = {
  lt: {
    siteNavigation: 'Pagrindinė navigacija',

    // Homepage and source picker
    loadingCatalog: 'Kraunama…',
    noDatasets: 'Duomenų kataloge nėra rinkinių.',
    loading: 'Kraunama…',
    errorLoadingData: 'Nepavyko įkelti duomenų',
    updatingResults: 'Ieškoma…',

    // Search and filters
    searchWords: 'Ieškoti žodžių',
    clearSearch: 'Išvalyti paiešką',
    clearFilters: 'Išvalyti filtrus',
    noMatchingWords: 'Žodžių nerasta.',

    // Word list
    wordList: 'Visas sąrašas',
    rank: 'Rangas',
    word: 'Žodis',
    type: 'Tipas',
    frequency: 'Dažnumas',
    // On-screen column names. CSV exports keep `frequency` and `type`.
    frequencyColumn: 'Pavartojimai',
    typeColumn: 'Kalbos dalis',
    sortBy: 'Rikiuoti pagal',
    unsorted: 'nerikiuota',
    ascending: 'didėjančia tvarka',
    descending: 'mažėjančia tvarka',
    showingResults: 'Rodomi {start}–{end} iš {total}',
    pagination: 'Rezultatų puslapiai',
    previousPage: 'Ankstesnis',
    nextPage: 'Kitas',
    pageOf: '{page} iš {total}',

    // CSV export
    downloadData: 'Atsisiųsti CSV',
    exported: 'Eksportuota',
    query: 'Paieška',
    types: 'Tipai',
    all: 'visi',
    sortOrder: 'Rikiavimas',

    // Source details
    aboutSource: 'Apie šaltinį',
    source: 'Šaltinis',
    author: 'Autorius',
    year: 'Metai',
    entryKind: 'Duomenų vienetas',
    lemma: 'Lema',
    wordform: 'Žodžio forma',
    licence: 'Licencija',
    posScheme: 'Kalbos dalių žymėjimas',
    openSource: 'Atverti pirminį šaltinį',

    // Charts
    entries: 'Įrašai',
    totalFrequency: 'Pavartojimai',
    topWords: 'Dažniausi žodžiai',
    showTop: 'Rodyti',
    tableEquivalent: 'Lentelė',
    rankFrequency: 'Dažnumo pasiskirstymas',
    rankFrequencyDescription: 'Žodžiai nuo dažniausio (kairėje) iki rečiausio (dešinėje). Abi ašys logaritminės: vienodas tarpas reiškia dešimteriopą skirtumą.',
    rankFrequencyText: 'Iš {count} atrinktų įrašų pirmo rango dažnumas yra {first}, o paskutinio – {last}.',
    rankLogScale: 'Rangas (log skalė)',
    frequencyLogScale: 'Dažnumas (log skalė)',
    cumulativeCoverage: 'Aprėptis',
    coverageDescription: 'Kokią visų pavartojimų dalį sudaro dažniausi žodžiai kartu. Taškai žymi, kiek žodžių sudaro pusę ir 90 % pavartojimų.',
    coverageText: 'Pirmi dešimt įrašų sudaro {topTen} atrinktų pavartojimų.',
    cumulativeFrequency: 'Sukauptas dažnumas',
    tokenCoverage: 'Pavartojimų dalis',
    leadingEntryShare: 'Dažniausias žodis',
    halfCoverage: 'Pusė pavartojimų',
    ninetyCoverage: '90 % pavartojimų',
    singletonTail: 'Pavartoti tik kartą',
    posComposition: 'Kalbos dalys',
    posCompositionDescription: 'Kiek visų pavartojimų tenka kiekvienai kalbos daliai.'
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
