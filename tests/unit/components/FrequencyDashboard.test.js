import { render } from '@testing-library/svelte/svelte5';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import FrequencyDashboard from '../../../src/components/FrequencyDashboard.svelte';

const words = Array.from({ length: 25 }, (_, index) => ({
  word: `žodis-${index + 1}`,
  type: index % 2 === 0 ? 'dkt' : 'jng',
  frequency: 100 - index
}));

it('renders coverage facts, chart alternatives and source-labelled POS composition', () => {
  const { container, getByRole, getAllByRole, getByText } = render(FrequencyDashboard, {
    words,
    typeLabels: { dkt: 'Daiktavardis', jng: 'Jungtukas' }
  });

  expect(container.querySelector('.coverage-facts')).toHaveTextContent('„žodis-1“ – 4,5 % pavartojimų');
  expect(container.querySelector('.coverage-facts')).toHaveTextContent('12 dažniausių žodžių (48 % sąrašo)');
  expect(getByText('Kalbos dalys')).toBeInTheDocument();
  const conjunctionShare = getByRole('listitem', { name: /^Jungtukas \(jng\): 48\s%$/ }).querySelector('.bar');
  expect(conjunctionShare).toHaveStyle({ width: '48%' });
  expect(getAllByRole('img')).toHaveLength(2);
  expect(getAllByRole('group').length).toBeGreaterThanOrEqual(3);
});

it('changes the top-word chart deterministically when its control changes', async () => {
  const user = userEvent.setup();
  const { getByLabelText, getByRole } = render(FrequencyDashboard, { words });
  const topChart = getByRole('list', { name: 'Dažniausi žodžiai' });

  expect(topChart.querySelectorAll('[role="listitem"]')).toHaveLength(10);
  await user.selectOptions(getByLabelText('Rodyti'), '20');

  expect(topChart.querySelectorAll('[role="listitem"]')).toHaveLength(20);
  expect(getByRole('listitem', { name: 'žodis-20: 81' })).toBeInTheDocument();
});

it('updates facts from the supplied active result set and omits POS composition when no POS values exist', async () => {
  const { container, queryByText, rerender } = render(FrequencyDashboard, { words });

  expect(container.querySelector('.coverage-facts')).toHaveTextContent('žodis-1');
  await rerender({ words: [{ word: 'vienas', frequency: 7 }] });

  const facts = container.querySelector('.coverage-facts');
  expect(facts).toHaveTextContent('„vienas“ – 100 % pavartojimų');
  expect(facts).toHaveTextContent('90 % pavartojimų 1 dažniausias žodis (100 % sąrašo)');
  expect(facts).toHaveTextContent('0 žodžių (0 % sąrašo)');
  expect(queryByText('Kalbos dalys')).not.toBeInTheDocument();
});
