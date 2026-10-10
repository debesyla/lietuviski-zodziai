import { render } from '@testing-library/svelte/svelte5';
import RateBars from '../../../src/components/RateBars.svelte';

it('uses comparable rates for bar lengths and keeps missing data distinct from zero', () => {
  const { container, getByRole } = render(RateBars, { rows: [
    { label: 'A', value: 20 }, { label: 'B', value: 10 }, { label: 'C', value: null }, { label: 'D', value: 0 }
  ], unit: 'Milijonui' });
  expect([...container.querySelectorAll('.bar')].map(bar => bar.style.width)).toEqual(['100%', '50%', '0%', '0%']);
  expect(getByRole('listitem', { name: 'C: Neaptikta' })).toBeInTheDocument();
  expect(getByRole('listitem', { name: 'D: 0' })).toBeInTheDocument();
});

it('does not label a positive rate as zero when it is below display precision', () => {
  const { getByRole } = render(RateBars, { rows: [{ label: 'Retas', value: .001 }], unit: 'Milijonui' });
  expect(getByRole('listitem', { name: 'Retas: <0,01' })).toBeInTheDocument();
});
