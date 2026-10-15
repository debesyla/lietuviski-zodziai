// Short Lithuanian names shared by the source picker and the data catalogue.
// Source metadata keeps the full original titles.
export const datasetCopy: Record<string, { title: string; description: string }> = {
  'utka-2018-lemmatized-totals': { title: '1 mln. tekstyno lemos (2018)', description: 'Lemų dažniai ir kalbos dalių žymos.' },
  'dadurkevicius-2020-jcl-lemmas': { title: 'JCL lemos (2020)', description: 'Jungtinio lietuvių kalbos tekstyno lemų dažniai ir kalbos dalys.' },
  'petkevicius-2025-ccll-lemmas': { title: 'CCLL lemos (2025)', description: 'Dabartinės lietuvių kalbos tekstyno lemų dažnumo sąrašas.' },
  'utka-ccll-wordforms': { title: 'CCLL žanrų profilis', description: 'Žodžio formos dažnis penkiuose tekstų žanruose.' },
  'dadurkevicius-dml6-vs-jcl-comparison': { title: 'DML6 žodyno aprėptis', description: 'Kurios JCL žodžių formos aptinkamos žodyne?' },
  'utka-ccll2-war-ukraine-comparison': { title: 'Karo meto vartosena', description: 'Žodžio forma CCLL2, karo meto žiniasklaidoje ir socialiniuose tinkluose.' },
  'vssa-2026-blkt-wordform-profile': { title: 'BLKT žodžio profilis', description: 'Dažnis pagal teksto tipą ir laikotarpį; tik paskelbti suvestiniai duomenys.' },
  'rimkute-2019-alksnis-syntactic-context': { title: 'ALKSNIS sintaksė', description: 'Lemų ryšiai ir sakinių pavyzdžiai.' },
  'bielinskiene-2019-delfi-1grams': { title: 'Delfi.lt viengramiai', description: 'Atskirų tekstyno žetonų dažnumo sąrašas.' },
  'rimkute-2024-matas-v3-frequencies': { title: 'MATAS v3.0 dažniai', description: 'Lemų ir žodžių formų dažniai iš anotuoto tekstyno.' },
  'kapociute-dzikiene-2017-parliament-frequency-aggregates': { title: 'Parlamento kalbų dažniai', description: 'Viso tekstyno lemų ir žodžių formų suvestinės.' },
  'zemriete-2025-lithuanian-homoforms': { title: 'Lietuvių homoformos', description: 'Vienodai rašomų formų analizės.' },
  'raskinis-2025-foreign-name-transliterations': { title: 'Užsienio vardų atitikmenys', description: 'Vardų perteikimo poros ir atitikčių skaičiai.' },
  'birvinskaite-2026-lithuanian-basketball-slang': { title: 'Krepšinio žargonas', description: 'Lietuviški krepšinio žargono įrašai.' },
  'rimkute-morphemic-dictionary': { title: 'Morfemikos žodynas', description: '72 325 įrašai iš trijų 2011 m. žodyno tomų.' }
};

export function datasetTitle(id: string, fallback: string) {
  return datasetCopy[id]?.title ?? fallback;
}

export function datasetDescription(id: string, fallback: string) {
  return datasetCopy[id]?.description ?? fallback;
}
