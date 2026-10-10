import { render, waitFor } from '@testing-library/svelte/svelte5';
import { vi } from 'vitest';

vi.mock('../../../src/lib/publication', () => ({ loadPublicDataProducts: vi.fn(() => Promise.reject(new Error('Nepavyko atsisiųsti duomenų.'))) }));
vi.mock('../../../src/lib/dml6-coverage', () => ({ coverageCategoryDefinitions: vi.fn(), loadDml6CoverageDrilldown: vi.fn(), loadDml6CoverageProfile: vi.fn(() => Promise.reject(new Error('Nepavyko atsisiųsti duomenų.'))) }));
vi.mock('../../../src/lib/war-contrast', () => ({ contrastPair: vi.fn(), logRatioForPair: vi.fn(), lookupWarContrastWord: vi.fn(), loadWarContrastProfile: vi.fn(() => Promise.reject(new Error('Nepavyko atsisiųsti duomenų.'))) }));
vi.mock('../../../src/lib/ccll-genre-profile', () => ({ lookupCcllGenreWord: vi.fn(), ratePerMillion: vi.fn(), loadCcllGenreProfile: vi.fn(() => Promise.reject(new Error('Nepavyko atsisiųsti duomenų.'))) }));
vi.mock('../../../src/lib/blkt-wordform-profile', () => ({ loadBlktLicenceTexts: vi.fn(), lookupBlktWordform: vi.fn(), loadBlktWordformProfile: vi.fn(() => Promise.reject(new Error('Nepavyko atsisiųsti duomenų.'))) }));
vi.mock('../../../src/lib/syntax-context', () => ({ loadSyntaxContexts: vi.fn(), searchSyntaxLemmas: vi.fn(), loadSyntaxOverview: vi.fn(() => Promise.reject(new Error('Nepavyko atsisiųsti duomenų.'))) }));

import Catalogue from '../../../src/routes/duomenu-katalogas/+page.svelte';
import Coverage from '../../../src/routes/zodyno-apreptis/+page.svelte';
import War from '../../../src/routes/karo-zodziu-palyginimas/+page.svelte';
import Genre from '../../../src/routes/zanru-profilis/+page.svelte';
import Blkt from '../../../src/routes/blkt-profilis/+page.svelte';
import Syntax from '../../../src/routes/sintakse/+page.svelte';

it.each([
  ['katalogas', Catalogue], ['aprėptis', Coverage], ['karo palyginimas', War], ['žanrai', Genre], ['BLKT', Blkt], ['sintaksė', Syntax]
])('%s retains visible failure feedback instead of an empty interface', async (_name, component) => {
  const { getByRole, getByText } = render(component);
  await waitFor(() => expect(getByRole('alert')).toBeInTheDocument());
  expect(getByText('Nepavyko atsisiųsti duomenų.')).toBeInTheDocument();
});
