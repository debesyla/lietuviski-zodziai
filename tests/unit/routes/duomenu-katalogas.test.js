import { render, waitFor, within } from '@testing-library/svelte/svelte5';
import axe from 'axe-core';
import { vi } from 'vitest';

const products = [
  {
    id: 'lemmas',
    title: 'Lemų bandomasis sąrašas',
    productType: 'generic-frequency-dataset',
    publication: { status: 'published', scope: 'Lemų šaltinis.', access: 'Naršyklės tyrinėjimas.' },
    provenance: { sourceUrl: 'https://example.test/lemmas', licence: 'CC BY 4.0', citation: 'Lemų citata.' },
    content: { entryKind: 'lemma' },
    views: [],
    viewCount: 1,
    manifestUrl: '/data-products/lemmas/manifest.json'
  },
  {
    id: 'utka-ccll-wordforms',
    title: 'CCLL žodžių formos',
    productType: 'chunked-wordform-list',
    publication: { status: 'published', scope: 'CCLL šaltinis.', access: 'JSON dalimis.' },
    provenance: { sourceUrl: 'https://example.test/ccll', licence: 'CC BY 4.0', citation: 'CCLL citata.' },
    views: [{ id: 'all', title: 'Visos formos' }],
    viewCount: 1,
    manifestUrl: '/data-products/ccll/manifest.json'
  },
  {
    id: 'dadurkevicius-dml6-vs-jcl-comparison',
    title: 'DML6 palyginimas',
    productType: 'chunked-comparison',
    publication: { status: 'published', scope: 'Palyginimo šaltinis.', access: 'JSON dalimis.' },
    provenance: { sourceUrl: 'https://example.test/comparison', licence: 'CC BY 4.0', citation: 'Palyginimo citata.' },
    views: [{ id: 'coverage', title: 'Aprėptis' }],
    viewCount: 1,
    manifestUrl: '/data-products/comparison/manifest.json'
  },
  {
    id: 'lexical',
    title: 'Leksinis bandomasis rinkinys',
    productType: 'chunked-lexical-collection',
    publication: { status: 'published', scope: 'Leksinis šaltinis.', access: 'JSON dalimis.' },
    provenance: { sourceUrl: 'https://example.test/lexical', licence: 'CC BY 4.0', citation: 'Leksinė citata.' },
    views: [{ id: 'entries', title: 'Įrašai' }],
    viewCount: 1,
    manifestUrl: '/data-products/lexical/manifest.json'
  },
  {
    id: 'rimkute-morphemic-dictionary',
    title: 'Dažninis lietuvių kalbos morfemikos žodynas',
    productType: 'chunked-lexical-collection',
    publication: { status: 'published', scope: 'Visi peržiūrėti įrašai.', access: 'JSON dalimis.' },
    provenance: {
      sourceUrl: 'https://hdl.handle.net/20.500.12259/249',
      licence: 'Rightsholder permission',
      citation: 'Rimkutė, Kazlauskienė ir Raškinis (2011).',
      permission: {
        status: 'rightsholder-permission-confirmed',
        confirmedOn: '2026-08-13',
        scope: 'Pilno išvestinio rinkinio skelbimas ir pernaudojimas su priskyrimu.',
        privateCorrespondencePublished: false
      },
      attributionNotice: 'Rimkutė, Erika; Kazlauskienė, Asta; Raškinis, Gailius. 2011.',
      modificationNotice: 'MODIFIED FILE: deterministiškai išgauta iš trijų PDF tomų.'
    },
    views: [{ id: 'entries-by-source-order', title: 'Įrašai' }],
    viewCount: 1,
    manifestUrl: '/data-products/rimkute-morphemic-dictionary/manifest.json'
  },
  {
    id: 'rimkute-2019-alksnis-syntactic-context',
    title: 'ALKSNIS bandomieji kontekstai',
    productType: 'chunked-syntactic-context',
    publication: { status: 'published', scope: 'Sintaksės šaltinis.', access: 'Pasirenkamos JSON dalys.' },
    provenance: { sourceUrl: 'https://example.test/syntax', licence: 'CC BY 4.0', citation: 'Sintaksės citata.' },
    views: [{ id: 'contexts', title: 'Kontekstai' }],
    viewCount: 1,
    manifestUrl: '/data-products/syntax/manifest.json'
  },
  {
    id: 'blocked',
    title: 'Ribotas bandomasis šaltinis',
    productType: 'metadata-only',
    publication: {
      status: 'metadata-only',
      scope: 'Tik metaduomenys.',
      access: 'Tik saugus aprašas.',
      reason: 'Pakartotinio naudojimo sąlygos neišspręstos.'
    },
    provenance: { sourceUrl: 'https://example.test/blocked', licence: 'unresolved', citation: 'Ribota citata.' },
    views: [],
    viewCount: 0,
    manifestUrl: '/data-products/blocked/manifest.json'
  }
];

vi.mock('../../../src/lib/publication', () => ({
  loadPublicDataProducts: vi.fn(() => Promise.resolve(products))
}));

import Page from '../../../src/routes/duomenu-katalogas/+page.svelte';
import { loadPublicDataProducts } from '../../../src/lib/publication';

describe('Public data catalogue page', () => {
  it('groups every product type and makes scope, licence, status, limits, and safe access visible', async () => {
    const { getByRole, getByText, queryByText } = render(Page);

    expect(getByText('Kraunami rinkiniai…')).toBeInTheDocument();
    await waitFor(() => expect(queryByText('Kraunami rinkiniai…')).not.toBeInTheDocument());

    for (const heading of ['Tyrinėti naršyklėje', 'Rinkiniai JSON formatu', 'Tik šaltinių aprašai']) {
      expect(getByRole('heading', { name: heading })).toBeInTheDocument();
    }

    const lexicalCard = getByRole('article', { name: 'Leksinis bandomasis rinkinys' });
    expect(within(lexicalCard).getByText('Leksinis šaltinis.')).toBeInTheDocument();
    expect(within(lexicalCard).getByText('CC BY 4.0')).toBeInTheDocument();
    expect(within(lexicalCard).getByText(/Tai nėra dažnumo sąrašas/)).toBeInTheDocument();
    expect(within(lexicalCard).getByRole('link', { name: 'Leksinis bandomasis rinkinys' })).toHaveAttribute(
      'href',
      '/data-products/lexical/manifest.json'
    );

    const morphemicCard = getByRole('article', { name: 'Morfemikos žodynas' });
    expect(within(morphemicCard).getByText('Rightsholder permission')).toBeInTheDocument();
    expect(within(morphemicCard).getByText(/Leidžiama išgauti ir taisyti PDF duomenis/)).toBeInTheDocument();
    expect(within(morphemicCard).getByText(/Rimkutė, Erika/)).toBeInTheDocument();
    expect(within(morphemicCard).getByText(/MODIFIED FILE/)).toBeInTheDocument();
    expect(within(morphemicCard).getByText(/72 325 įrašai/)).toBeInTheDocument();
    expect(within(morphemicCard).getByText(/61 eilute daugiau.*tik kontekstui.*ne kaip išgavimo tikslas/i)).toBeInTheDocument();

    const comparisonCard = getByRole('article', { name: 'DML6 žodyno aprėptis' });
    expect(within(comparisonCard).getByRole('link', { name: 'DML6 žodyno aprėptis' })).toHaveAttribute('href', '/zodyno-apreptis');

    const ccllCard = getByRole('article', { name: 'CCLL žanrų profilis' });
    expect(within(ccllCard).getByRole('link', { name: 'CCLL žanrų profilis' })).toHaveAttribute('href', '/zanru-profilis');

    const syntaxCard = getByRole('article', { name: 'ALKSNIS sintaksė' });
    expect(within(syntaxCard).getByRole('link', { name: 'ALKSNIS sintaksė' })).toHaveAttribute('href', '/sintakse');

    const blockedCard = getByRole('article', { name: 'Ribotas bandomasis šaltinis' });
    expect(within(blockedCard).getByText('Tik aprašas; duomenų eilutės neskelbiamos.')).toBeInTheDocument();
    expect(within(blockedCard).getByText('Pakartotinio naudojimo sąlygos neišspręstos.')).toBeInTheDocument();
    expect(within(blockedCard).getByRole('link', { name: 'Ribotas bandomasis šaltinis' })).toHaveAttribute(
      'href',
      '/data-products/blocked/manifest.json'
    );
    expect(within(blockedCard).queryByRole('link', { name: 'JSON' })).not.toBeInTheDocument();

    expect(document.querySelectorAll('article')).toHaveLength(products.length);
    expect(getByRole('region', { name: 'Tyrinėti naršyklėje' })).toContainElement(comparisonCard);
    expect(getByRole('region', { name: 'Rinkiniai JSON formatu' })).toContainElement(lexicalCard);
    expect(getByRole('region', { name: 'Tik šaltinių aprašai' })).toContainElement(blockedCard);
    expect(document.querySelector('table')).toBeNull();
    expect(within(morphemicCard).getByText('Rimkutė, Kazlauskienė ir Raškinis (2011).')).toBeInTheDocument();

  });

  it('shows a useful empty state when the catalogue has no published entries', async () => {
    vi.mocked(loadPublicDataProducts).mockResolvedValueOnce([]);
    const { getByRole } = render(Page);
    await waitFor(() => expect(getByRole('status')).toHaveTextContent('Rinkinių nėra.'));
    expect(document.querySelectorAll('article')).toHaveLength(0);
  });

  it('keeps the catalogue structure accessible', async () => {
    const { queryByText } = render(Page);
    await waitFor(() => expect(queryByText('Kraunami rinkiniai…')).not.toBeInTheDocument());

    const result = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false } }
    });
    expect(result.violations).toEqual([]);
  });

  it('uses the configured catalogue URL as its canonical page', () => {
    render(Page);

    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'http://127.0.0.1:4173/duomenu-katalogas'
    );
    expect(document.head.querySelector('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'http://127.0.0.1:4173/duomenu-katalogas'
    );
  });
});
