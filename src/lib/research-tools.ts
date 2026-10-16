import { base } from '$app/paths';

// One inventory of the research pages, shared by the homepage cards and the
// "same word elsewhere" links. `unit` says what the page searches, because
// the homepage lists lemmas while most research pages expect an exact form.
export type ResearchTool = {
  id: string;
  path: string;
  /** The published data product the page explores, as listed in the data catalogue. */
  productId: string;
  question: string;
  /** Short lowercase name for the page <title>. */
  pageTitle: string;
  description: string;
  source: string;
  unit: 'žodžio forma' | 'lema' | null;
  /** One or two lowercase words, used in the section menu and the "kitur" links. */
  shortLabel: string;
  example?: string;
};

export const researchTools: ResearchTool[] = [
  {
    id: 'zanru-profilis',
    path: '/zanru-profilis',
    productId: 'utka-ccll-wordforms',
    question: 'Kur žodis dažnesnis: romanuose ar laikraščiuose?',
    pageTitle: 'žodis pagal žanrą',
    description: 'Grožinė ir negrožinė literatūra, periodika, administraciniai tekstai ir sakytinė kalba.',
    source: 'CCLL',
    unit: 'žodžio forma',
    shortLabel: 'žanrai',
    example: 'meilė'
  },
  {
    id: 'blkt-profilis',
    path: '/blkt-profilis',
    productId: 'vssa-2026-blkt-wordform-profile',
    question: 'Kaip žodžio vartosena keitėsi nuo 1922 metų?',
    pageTitle: 'žodis nuo 1922 metų',
    description: 'Keturi laikotarpiai nuo tarpukario iki šių dienų ir penki teksto tipai.',
    source: 'BLKT',
    unit: 'žodžio forma',
    shortLabel: 'laikotarpiai',
    example: 'ponas'
  },
  {
    id: 'karo-zodziu-palyginimas',
    path: '/karo-zodziu-palyginimas',
    productId: 'utka-ccll2-war-ukraine-comparison',
    question: 'Ar žodis dažnesnis karo meto tekstuose?',
    pageTitle: 'karo meto vartosena',
    description: 'Įprastas tekstynas, karo meto žiniasklaida ir socialiniai tinklai, perskaičiuoti tam pačiam žodžių kiekiui.',
    source: 'CCLL2',
    unit: 'žodžio forma',
    shortLabel: 'karo metas',
    // CCLL2 has no "dronas", so that example could only compare the two wartime sources.
    example: 'okupantai'
  },
  {
    id: 'sintakse',
    path: '/sintakse',
    productId: 'rimkute-2019-alksnis-syntactic-context',
    question: 'Su kuo žodis jungiasi sakinyje?',
    pageTitle: 'žodžio ryšiai sakinyje',
    description: 'Ranka tikrinti sakiniai: kuris žodis kurį pažymi, papildo ar valdo.',
    source: 'ALKSNIS',
    unit: 'lema',
    shortLabel: 'sintaksė',
    example: 'žmogus'
  },
  {
    id: 'zodyno-apreptis',
    path: '/zodyno-apreptis',
    productId: 'dadurkevicius-dml6-vs-jcl-comparison',
    question: 'Ar visi dažni žodžiai yra žodyne?',
    pageTitle: 'ar dažni žodžiai yra žodyne',
    description: 'Jungtinio tekstyno formos, sutikrintos su Dabartinės lietuvių kalbos žodynu, pagal dažnumą.',
    source: 'JCL + DML6',
    unit: null,
    shortLabel: 'žodynas'
  }
];

export function researchTool(id: string) {
  const tool = researchTools.find((candidate) => candidate.id === id);
  if (!tool) throw new Error(`Unknown research tool: ${id}`);
  return tool;
}

/** "karo metas" → "Karo metas" for the menu. */
export function menuLabel(tool: ResearchTool) {
  return tool.shortLabel.charAt(0).toLocaleUpperCase('lt-LT') + tool.shortLabel.slice(1);
}

export function toolUrl(tool: ResearchTool, word?: string) {
  const url = `${base}${tool.path}`;
  return word ? `${url}?q=${encodeURIComponent(word.trim())}` : url;
}

/** Research pages that take a one-word `?q=` lookup. */
export const wordLookupTools = researchTools.filter((tool) => tool.unit !== null);
