import { render, waitFor } from '@testing-library/svelte/svelte5';
import { vi } from 'vitest';

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
    expect(getByRole('link', { name: 'DML6 žodyno aprėptis' })).toHaveAttribute('href', '/zodyno-apreptis');
    expect(getByRole('link', { name: 'Karo meto vartosena' })).toHaveAttribute('href', '/karo-zodziu-palyginimas');
    expect(getByRole('link', { name: 'CCLL žanrų profilis' })).toHaveAttribute('href', '/zanru-profilis');
  });

  it('publishes a specific, canonical Lithuanian discovery preview', () => {
    render(Page);

    expect(document.title).toBe('dažniausi žodžiai // dago');
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
      'content',
      'Naršykite viešus lietuvių kalbos lemų ir žodžių formų dažnumo sąrašus: ieškokite, filtruokite, analizuokite rodiklius ir atsisiųskite duomenis su jų šaltiniais.'
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
      'http://127.0.0.1:4173/social-preview-v2.png'
    );
    expect(document.head.querySelector('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  });
});
