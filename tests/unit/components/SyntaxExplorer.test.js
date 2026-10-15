import { render, waitFor } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import { vi, beforeEach } from 'vitest';

vi.mock('../../../src/lib/syntax-context', () => ({ loadSyntaxOverview: vi.fn(), loadSyntaxContexts: vi.fn(), searchSyntaxLemmas: vi.fn() }));
import { loadSyntaxOverview, loadSyntaxContexts, searchSyntaxLemmas } from '../../../src/lib/syntax-context';
import SyntaxExplorer from '../../../src/components/SyntaxExplorer.svelte';
const lemma = name => ({ lemma: name, tokenCount: 2 });
const context = text => ({ relation: 'Atr', direction: 'head', dependentForm: 'a', dependentLemma: 'a', headForm: 'b', headLemma: 'b', sentenceText: text, genre: 'Periodika', document: 'fixture.conllu', sourceSentenceId: 's1' });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(loadSyntaxOverview).mockResolvedValue({
    manifest: { provenance: { sourceUrl: 'https://example.test', licence: 'CC BY 4.0', citation: 'Citata' }, syntaxContext: {
      overview: { documents: 2, deliveredSentenceIds: 3, nonPunctuationRows: 10, nonPunctuationRelationLabels: 1, repositorySentenceClaim: 3 },
      exampleSelection: { maxExamplesPerLemma: 12, omittedRows: 0 }, exclusions: []
    } }, relations: [{ relation: 'Atr', count: 2 }], genres: [{ genre: 'Periodika', documents: 2, sentences: 3 }]
  });
  vi.mocked(searchSyntaxLemmas).mockResolvedValue({ matches: [lemma('kalba'), lemma('kalbėti')], total: 2 });
});

it('keeps the initial page quiet, then searches and shows only the selected lemma contexts', async () => {
  const user = userEvent.setup();
  const { getByRole, getByLabelText, queryByText } = render(SyntaxExplorer);
  await waitFor(() => expect(getByRole('button', { name: 'Ieškoti' })).toBeInTheDocument());
  expect(queryByText('Atitikmenų nerasta.')).not.toBeInTheDocument();
  await user.type(getByLabelText('Lemos pradžia'), 'kalb');
  await user.click(getByRole('button', { name: 'Ieškoti' }));
  await waitFor(() => expect(getByRole('button', { name: 'kalba Pavartojimai: 2' })).toBeInTheDocument());
  expect(loadSyntaxContexts).not.toHaveBeenCalled();
  let resolveFirst;
  vi.mocked(loadSyntaxContexts).mockReturnValueOnce(new Promise(resolve => { resolveFirst = resolve; })).mockResolvedValueOnce([context('Naujas sakinys.')]);
  await user.click(getByRole('button', { name: 'kalba Pavartojimai: 2' }));
  await user.click(getByRole('button', { name: 'kalbėti Pavartojimai: 2' }));
  await waitFor(() => expect(queryByText('Naujas sakinys.')).toBeInTheDocument());
  resolveFirst([context('Pasenęs sakinys.')]);
  await waitFor(() => expect(getByRole('heading', { name: 'Sakinių kontekstai: kalbėti' })).toBeInTheDocument());
  expect(queryByText('Pasenęs sakinys.')).not.toBeInTheDocument();
});

it('reports empty searches and context failures without inventing examples', async () => {
  const user = userEvent.setup();
  vi.mocked(searchSyntaxLemmas).mockResolvedValueOnce({ matches: [], total: 0 });
  const { getByRole, getByLabelText, getByText } = render(SyntaxExplorer);
  await waitFor(() => expect(getByRole('button', { name: 'Ieškoti' })).toBeInTheDocument());
  await user.click(getByRole('button', { name: 'Ieškoti' }));
  expect(getByRole('alert')).toHaveTextContent('Įveskite bent vieną lemos raidę.');
  await user.type(getByLabelText('Lemos pradžia'), 'kalb');
  await user.click(getByRole('button', { name: 'Ieškoti' }));
  await waitFor(() => expect(getByText('Atitikmenų nerasta.')).toBeInTheDocument());
  await user.click(getByRole('button', { name: 'Ieškoti' }));
  await waitFor(() => expect(getByRole('button', { name: 'kalba Pavartojimai: 2' })).toBeInTheDocument());
  vi.mocked(loadSyntaxContexts).mockRejectedValueOnce(new Error('Nepavyko įkelti sakinių.'));
  await user.click(getByRole('button', { name: 'kalba Pavartojimai: 2' }));
  await waitFor(() => expect(getByRole('alert')).toHaveTextContent('Nepavyko įkelti sakinių.'));
});
