import { render, waitFor } from '@testing-library/svelte/svelte5';
import { afterEach, vi } from 'vitest';

const catalog = {
  schemaVersion: 1,
  defaultDatasetId: 'second',
  datasets: [
    {
      id: 'first', title: 'First dataset', author: 'First author', year: 2024,
      entryKind: 'lemma', file: 'first.json', records: 2, totalFrequency: 10,
      hasPartOfSpeech: true, licence: null, citation: null
    },
    {
      id: 'second', title: 'Second dataset', author: 'Second author', year: 2023,
      entryKind: 'wordform', file: 'second.json', records: 3, totalFrequency: 20,
      hasPartOfSpeech: false, licence: null, citation: null
    }
  ]
};

vi.mock('../../../src/lib/translations', () => ({
  t: vi.fn((key) => key)
}));

vi.mock('../../../src/lib/data', () => ({
  loadCatalog: vi.fn(() => Promise.resolve(catalog))
}));

vi.mock('../../../src/components/DataLoader.svelte', () => ({
  default: vi.fn(() => ({ render: () => ({ html: '<div>DataLoader</div>', css: '' }) }))
}));

import Page from '../../../src/routes/+page.svelte';
import DataLoader from '../../../src/components/DataLoader.svelte';
import { loadCatalog } from '../../../src/lib/data';

afterEach(() => window.history.replaceState(null, '', '/'));

describe('Page', () => {
  it('loads catalog metadata before rendering the dataset selector', async () => {
    const { getByText, getByRole, queryByText } = render(Page);

    expect(getByText('loadingCatalog')).toBeInTheDocument();
    await waitFor(() => {
      expect(queryByText('loadingCatalog')).not.toBeInTheDocument();
    });

    expect(DataLoader).toHaveBeenCalled();
    const explorerProps = vi.mocked(DataLoader).mock.calls.at(-1)[1];
    expect(explorerProps.selectedDatasetId).toBe('second');
    expect(explorerProps.datasets).toHaveLength(2);
    expect(explorerProps.datasets[0].title).toBe('First dataset');
    // The explorer places the research cards right after its top-words bars.
    expect(explorerProps.afterTopWords).toEqual(expect.any(Function));
  });

  it('keeps the research cards reachable when the catalogue fails', async () => {
    vi.mocked(loadCatalog).mockRejectedValueOnce(new Error('offline'));
    const { getByRole } = render(Page);

    await waitFor(() => expect(getByRole('alert')).toHaveTextContent('offline'));
    expect(getByRole('link', { name: 'Ar visi dažni žodžiai yra žodyne?' })).toHaveAttribute('href', '/zodyno-apreptis');
    expect(getByRole('link', { name: 'Ar žodis dažnesnis karo meto tekstuose?' })).toHaveAttribute('href', '/karo-zodziu-palyginimas');
    expect(getByRole('link', { name: 'Kur žodis dažnesnis: romanuose ar laikraščiuose?' })).toHaveAttribute('href', '/zanru-profilis');
    expect(getByRole('link', { name: 'okupantai' })).toHaveAttribute('href', '/karo-zodziu-palyginimas?q=okupantai');
    expect(getByRole('link', { name: 'Kokie duomenys čia yra?' })).toHaveAttribute('href', '/duomenu-katalogas');
  });

  it.each([['first', 'first'], ['unknown', 'second']])('uses a catalogue source link with a valid default fallback (%s)', async (requested, expected) => {
    window.history.replaceState(null, '', `/?source=${requested}`);
    render(Page);
    await waitFor(() => expect(vi.mocked(DataLoader).mock.calls.at(-1)[1].selectedDatasetId).toBe(expected));
  });

  it('publishes a specific, canonical Lithuanian discovery preview', () => {
    render(Page);

    expect(document.title).toBe('dažniausi lietuviški žodžiai // dago');
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      'Kurie lietuvių kalbos žodžiai vartojami dažniausiai, kaip jie keitėsi nuo 1922 m. ir kur jie dažnesni – romanuose ar spaudoje? Vieši tekstynų duomenys ir CSV.'
    );
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'http://127.0.0.1:4173/'
    );
    expect(document.head.querySelector('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'http://127.0.0.1:4173/'
    );
    expect(document.head.querySelector('meta[property="og:image"]')).toHaveAttribute(
      'content',
      'http://127.0.0.1:4173/social-preview-v3.png'
    );
    expect(document.head.querySelector('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  });
});
