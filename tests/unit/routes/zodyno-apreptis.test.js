import { render, waitFor } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';
import axe from 'axe-core';

const profile = {
  schemaVersion: 1,
  productId: 'dadurkevicius-dml6-vs-jcl-comparison',
  profileId: 'dml6-jcl-coverage-by-frequency-band',
  profileType: 'frequency-band-coverage',
  title: 'Coverage',
  description: 'Fixture profile',
  sourceView: {
    id: 'jcl-types-dml6-coverage', sourceRole: 'types-coverage',
    wordField: { id: 'word', label: 'Word form' },
    frequencyField: { id: 'jclTokenCount', label: 'JCL token count', unit: 'tokens' },
    coverageField: { id: 'dml6CoverageCode', label: 'DML6 coverage', values: { 0: 'not in DML6', 1: 'main entry' } }
  },
  provenance: { sourceUrl: 'https://example.test/source', licence: 'CC BY 4.0', citation: 'Fixture citation', sourceFile: { artifactId: 'fixture-types', bytes: 42, rows: 3, sha256: 'a'.repeat(64) } },
  delivery: { summaryMaxBytes: 4096 },
  drilldown: {
    limit: 50, maxBytes: 4096, recordEncoding: 'array',
    fields: [{ id: 'word', label: 'Word form', type: 'string' }, { id: 'jclTokenCount', label: 'JCL token count', type: 'raw-token-count', unit: 'tokens' }],
    ordering: { field: 'jclTokenCount', direction: 'descending', tieBreak: 'word-ascending' }
  },
  summary: {
    sourceRows: 3, totalTypeCount: 3, totalTokenCount: 21,
    bands: [{
      id: 'one-plus', label: '1+', minimum: 1, maximum: null, typeCount: 3, tokenCount: 21,
      categories: [
        { coverageCode: 0, typeCount: 1, tokenCount: 1, drilldown: { file: 'drilldowns/one-plus-0.json', records: 1, bytes: 100, sha256: 'b'.repeat(64) } },
        { coverageCode: 1, typeCount: 2, tokenCount: 20, drilldown: { file: 'drilldowns/one-plus-1.json', records: 2, bytes: 100, sha256: 'c'.repeat(64) } }
      ]
    }]
  }
};

vi.mock('../../../src/lib/dml6-coverage', () => ({
  coverageCategoryDefinitions: (loaded) => Object.entries(loaded.sourceView.coverageField.values).map(([code, label]) => ({ code: Number(code), label })),
  loadDml6CoverageProfile: vi.fn(),
  loadDml6CoverageDrilldown: vi.fn()
}));

import { loadDml6CoverageDrilldown, loadDml6CoverageProfile } from '../../../src/lib/dml6-coverage';
import Page from '../../../src/routes/zodyno-apreptis/+page.svelte';

beforeEach(() => {
  vi.mocked(loadDml6CoverageProfile).mockResolvedValue(profile);
  vi.mocked(loadDml6CoverageDrilldown).mockResolvedValue({
    schemaVersion: 1,
    productId: profile.productId,
    profileId: profile.profileId,
    bandId: 'one-plus',
    coverageCode: 1,
    recordEncoding: 'array',
    fields: profile.drilldown.fields,
    ordering: profile.drilldown.ordering,
    records: [['pavyzdys', 15], ['kitas', 5]]
  });
});

it('loads the compact profile before requesting examples and exposes a native table', async () => {
  const user = userEvent.setup();
  const { container, getByText, getAllByRole, getByRole } = render(Page);

  expect(getByText('Kraunama aprėpties suvestinė…')).toBeInTheDocument();
  await waitFor(() => expect(getByText('Aprėptis dažnumo intervaluose')).toBeInTheDocument());

  expect(loadDml6CoverageProfile).toHaveBeenCalledTimes(1);
  expect(loadDml6CoverageDrilldown).not.toHaveBeenCalled();
  expect(getAllByRole('table')).toHaveLength(1);
  expect(getByRole('listitem', { name: /^1\+: 66,7\s%$/ })).toBeInTheDocument();
  expect((await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })).violations).toEqual([]);

  const examplesButton = getByRole('button', { name: /^2 – Pagrindinis įrašas, dažnumas 1\+: pavyzdžiai$/ });
  await user.click(examplesButton);

  await waitFor(() => expect(getByText('pavyzdys')).toBeInTheDocument());
  expect(loadDml6CoverageDrilldown).toHaveBeenCalledWith(profile, 'one-plus', 1);
  expect(getByRole('heading', { name: 'Pavyzdžiai: Pagrindinis įrašas, dažnumas 1+' })).toBeInTheDocument();
  expect(container.querySelectorAll('.examples li')).toHaveLength(2);
  expect(examplesButton).toHaveAttribute('aria-pressed', 'true');
});

it('switches every share between word forms and running words', async () => {
  const user = userEvent.setup();
  const { getByRole, getByLabelText } = render(Page);
  await waitFor(() => expect(getByLabelText('visus pavartojimus')).toBeInTheDocument());

  await user.click(getByLabelText('visus pavartojimus'));

  expect(getByRole('listitem', { name: /^1\+: 95,2\s%$/ })).toBeInTheDocument();
  expect(getByRole('button', { name: /^20 – Pagrindinis įrašas/ })).toBeInTheDocument();
});

it('keeps failed example feedback inside the selected examples', async () => {
  vi.mocked(loadDml6CoverageDrilldown).mockRejectedValueOnce(new Error('Nepavyko įkelti pavyzdžių.'));
  const user = userEvent.setup();
  const { getByRole, getByText } = render(Page);
  await waitFor(() => expect(getByText('Aprėptis dažnumo intervaluose')).toBeInTheDocument());
  await user.click(getByRole('button', { name: /^2 – Pagrindinis įrašas, dažnumas 1\+: pavyzdžiai$/ }));
  await waitFor(() => expect(getByRole('alert')).toHaveTextContent('Nepavyko įkelti pavyzdžių.'));
  expect(getByRole('alert').closest('section')).toHaveAttribute('aria-labelledby', 'examples-title');
});
