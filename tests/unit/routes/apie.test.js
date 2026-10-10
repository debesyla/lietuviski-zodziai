import { render } from '@testing-library/svelte/svelte5';
import axe from 'axe-core';
import Page from '../../../src/routes/apie/+page.svelte';

describe('Methodology page', () => {
  it('explains the data and links to the catalogue for per-source attribution and usage terms', () => {
    const { getByRole, getByText } = render(Page);

    expect(getByRole('heading', { name: 'Kaip skaityti duomenis' })).toBeInTheDocument();
    expect(getByText(/pavartojimų skaičius pasirinktame šaltinyje/)).toBeInTheDocument();
    expect(getByText(/pagrindinė žodžio forma/)).toBeInTheDocument();
    expect(getByText(/konkretus užrašas/)).toBeInTheDocument();
    expect(getByText(/Naudodami rinkinį laikykitės jo licencijos ir nurodykite šaltinį/)).toBeInTheDocument();
    expect(getByRole('link', { name: 'Duomenų kataloge' })).toHaveAttribute('href', '/duomenu-katalogas');
    expect(getByRole('heading', { name: 'Privatumas' })).toBeInTheDocument();
  });

  it('keeps the public methodology structure accessible', async () => {
    render(Page);
    const result = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false } }
    });
    expect(result.violations).toEqual([]);
  });

  it('uses the configured methodology URL as its canonical page', () => {
    render(Page);

    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'http://127.0.0.1:4173/apie'
    );
    expect(document.head.querySelector('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'http://127.0.0.1:4173/apie'
    );
  });
});
