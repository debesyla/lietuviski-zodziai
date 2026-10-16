import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, waitFor } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Page from '../../src/routes/+page.svelte';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function provenance(labels) {
  return {
    licence: 'CC BY 4.0',
    citation: 'Test citation',
    sourceUrl: 'https://example.test/source',
    sourceSnapshot: {
      artifactId: 'test-source',
      bytes: 42,
      encoding: 'utf-8',
      sha256: 'a'.repeat(64)
    },
    partOfSpeech: {
      name: 'Test POS',
      labels
    }
  };
}

const firstDataset = {
  schemaVersion: 1,
  id: 'first',
  title: 'Pirmas rinkinys',
  author: 'Pirmas autorius',
  year: 2024,
  entryKind: 'lemma',
  duplicatePolicy: 'keep',
  provenance: provenance({ noun: 'Noun', verb: 'Verb' }),
  summary: { sourceRows: 2, entryCount: 2, totalFrequency: 15, duplicateEntries: 0 },
  words: [
    { word: 'beta', type: 'noun', frequency: 10 },
    { word: 'alfa', type: 'verb', frequency: 5 }
  ]
};

const secondDataset = {
  schemaVersion: 1,
  id: 'second',
  title: 'Antras rinkinys',
  author: 'Antras autorius',
  year: 2023,
  entryKind: 'wordform',
  duplicatePolicy: 'keep',
  provenance: provenance({ adjective: 'Adjective' }),
  summary: { sourceRows: 1, entryCount: 1, totalFrequency: 20, duplicateEntries: 0 },
  words: [{ word: 'kitas', type: 'adjective', frequency: 20 }]
};

const workflowCatalog = {
  schemaVersion: 1,
  datasets: [
    { id: 'first', title: firstDataset.title, author: firstDataset.author, year: firstDataset.year, entryKind: firstDataset.entryKind, file: 'first.json', records: 2, totalFrequency: 15, hasPartOfSpeech: true, licence: null, citation: null },
    { id: 'second', title: secondDataset.title, author: secondDataset.author, year: secondDataset.year, entryKind: secondDataset.entryKind, file: 'second.json', records: 1, totalFrequency: 20, hasPartOfSpeech: true, licence: null, citation: null }
  ]
};

function jsonResponse(data) {
  return { ok: true, status: 200, statusText: 'OK', json: vi.fn().mockResolvedValue(data) };
}

function installDatasetFetch(resources) {
  vi.stubGlobal('fetch', vi.fn((url) => {
    const resource = Object.entries(resources).find(([suffix]) => String(url).endsWith(suffix));
    if (!resource) return Promise.resolve({ ok: false, status: 404, statusText: 'Not found', json: vi.fn() });
    return Promise.resolve(jsonResponse(resource[1]));
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('dataset workflow integration', () => {
  it('uses actual components for selection, sorting, filter reset, export, and an empty search', async () => {
    installDatasetFetch({ 'catalog.json': workflowCatalog, 'first.json': firstDataset, 'second.json': secondDataset });
    const createObjectURL = vi.fn(() => 'blob:download');
    const revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const user = userEvent.setup();
    const { container, getByRole, getByText, queryByRole, queryByText } = render(Page);

    await waitFor(() => expect(container.querySelector('.table-container tbody tr')).toHaveTextContent('beta'));
    expect(container.querySelector('.table-container tbody tr')).toHaveTextContent('beta');
    expect(container.querySelector('.coverage-facts')).toHaveTextContent(/66,7\s*%/);

    await user.click(getByRole('button', { name: 'Rikiuoti pagal Žodis: nerikiuota' }));
    await waitFor(() => expect(container.querySelector('.table-container tbody tr')).toHaveTextContent('alfa'));

    await user.click(getByText('Kalbos dalis', { selector: 'summary' }));
    await user.click(getByRole('checkbox', { name: /Noun/ }));
    await waitFor(() => {
      expect(getByRole('button', { name: 'Išvalyti filtrus' })).toBeInTheDocument();
      expect(container.querySelector('.coverage-facts')).toHaveTextContent(/„beta“ – 100\s%/);
    });

    await user.selectOptions(getByRole('combobox', { name: 'Šaltinis' }), 'second');
    await waitFor(() => expect(container.querySelector('.table-container tbody tr')).toHaveTextContent('kitas'));
    expect(container.querySelector('.table-container tbody tr')).toHaveTextContent('kitas');
    expect(queryByRole('button', { name: 'Išvalyti filtrus' })).not.toBeInTheDocument();

    await user.click(getByRole('button', { name: 'Atsisiųsti CSV' }));
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).not.toHaveBeenCalled();

    await user.type(getByRole('textbox'), 'nėra-tokio-žodžio');
    await waitFor(() => expect(getByText('Žodžių nerasta.')).toBeInTheDocument());
    expect(queryByText('kitas')).not.toBeInTheDocument();
  });

  it('keeps each word\'s dataset rank when a search narrows the list', async () => {
    installDatasetFetch({ 'catalog.json': workflowCatalog, 'first.json': firstDataset, 'second.json': secondDataset });
    const user = userEvent.setup();
    const { container, getByRole } = render(Page);

    await waitFor(() => expect(container.querySelector('.table-container tbody tr')).toHaveTextContent('beta'));
    await user.type(getByRole('textbox'), 'alf');

    await waitFor(() => expect(container.querySelectorAll('.table-container tbody tr')).toHaveLength(1));
    const cells = container.querySelectorAll('.table-container tbody tr td');
    expect(cells[0]).toHaveTextContent('2');
    expect(cells[1]).toHaveTextContent('alfa');
  });

  it('renders the actual published Utka dataset through the catalog-selected path', async () => {
    const catalog = JSON.parse(await readFile(path.join(repositoryRoot, 'static/datasets/catalog.json'), 'utf8'));
    const utka = JSON.parse(await readFile(path.join(repositoryRoot, 'static/datasets/utka-2018-lemmatized-totals.json'), 'utf8'));
    installDatasetFetch({ 'catalog.json': catalog, 'utka-2018-lemmatized-totals.json': utka });

    const { container, getByRole, getByText } = render(Page);

    await waitFor(() => expect(container.querySelectorAll('.table-container tbody tr')).toHaveLength(20), { timeout: 5_000 });
    expect(getByRole('combobox', { name: 'Šaltinis' })).toHaveValue(utka.id);
    expect(container.querySelectorAll('.table-container tbody tr')).toHaveLength(20);
    // The headline note gives the whole source; the totals line appears only for a search or filter.
    expect(getByText(/^Iš 41977 žodžių ir 922949 pavartojimų\. Šaltinis – 1 mln\. žodžių dabartinės lietuvių kalbos tekstynas/)).toBeInTheDocument();
    expect(container.querySelector('.totals')).toBeNull();
  });

  it('says where an exactly matched word ranks and labels what the other pages search', async () => {
    const catalog = JSON.parse(await readFile(path.join(repositoryRoot, 'static/datasets/catalog.json'), 'utf8'));
    const utka = JSON.parse(await readFile(path.join(repositoryRoot, 'static/datasets/utka-2018-lemmatized-totals.json'), 'utf8'));
    installDatasetFetch({ 'catalog.json': catalog, 'utka-2018-lemmatized-totals.json': utka });
    const user = userEvent.setup();
    const { container, getByRole, getByText } = render(Page);

    await waitFor(() => expect(container.querySelectorAll('.table-container tbody tr')).toHaveLength(20), { timeout: 5_000 });
    await user.type(getByRole('textbox'), 'meilė');

    // "meilė" shares its 281 uses with one other word, so it holds places 484–485.
    await waitFor(() => expect(getByText('„meilė“ – vieta pagal dažnumą: 484–485 iš 41977. Į pusę pavartojimų sudarančių žodžių sąrašą nepatenka.')).toBeInTheDocument());
    expect(container.querySelector('.totals')).toHaveTextContent('Pavartojimai: 289');

    const elsewhere = getByRole('navigation', { name: '„meilė“ kituose šaltiniuose' });
    expect(elsewhere).toHaveTextContent(/kaip žodžio forma:.*žanrai.*laikotarpiai.*karo metas.*kaip lema:.*sintaksė/);
  });

  it('gives a tied frequency as a range of places', async () => {
    installDatasetFetch({ 'catalog.json': workflowCatalog, 'first.json': { ...firstDataset, summary: { sourceRows: 3, entryCount: 3, totalFrequency: 20, duplicateEntries: 0 }, words: [
      { word: 'beta', type: 'noun', frequency: 10 },
      { word: 'alfa', type: 'verb', frequency: 5 },
      { word: 'gama', type: 'verb', frequency: 5 }
    ] }, 'second.json': secondDataset });
    const user = userEvent.setup();
    const { container, getByRole, getByText } = render(Page);

    await waitFor(() => expect(container.querySelector('.table-container tbody tr')).toHaveTextContent('beta'));
    await user.type(getByRole('textbox'), 'gama');
    await waitFor(() => expect(getByText(/^„gama“ – vieta pagal dažnumą: 2–3 iš 3\./)).toBeInTheDocument());

    await user.clear(getByRole('textbox'));
    await user.type(getByRole('textbox'), 'beta');
    await waitFor(() => expect(getByText('„beta“ – vieta pagal dažnumą: 1 iš 3. Patenka į pusę pavartojimų sudarančių žodžių sąrašą.')).toBeInTheDocument());
  });
});
