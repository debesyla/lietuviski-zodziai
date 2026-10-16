import { render } from '@testing-library/svelte/svelte5';
import WordElsewhere from '../../../src/components/WordElsewhere.svelte';

test('WordElsewhere links the word to the other lookup pages through ?q=', () => {
  const { getByRole, queryByRole } = render(WordElsewhere, { word: 'meilė', current: 'zanru-profilis' });

  const navigation = getByRole('navigation', { name: '„meilė“ kituose šaltiniuose' });
  expect(navigation).toBeInTheDocument();
  expect(getByRole('link', { name: 'laikotarpiai' })).toHaveAttribute('href', '/blkt-profilis?q=meil%C4%97');
  expect(getByRole('link', { name: 'karo metas' })).toHaveAttribute('href', '/karo-zodziu-palyginimas?q=meil%C4%97');
  expect(getByRole('link', { name: 'sintaksė' })).toHaveAttribute('href', '/sintakse?q=meil%C4%97');
  expect(queryByRole('link', { name: 'žanrai' })).not.toBeInTheDocument();
  expect(queryByRole('link', { name: 'žodynas' })).not.toBeInTheDocument();
});

test('WordElsewhere says which pages search the exact form and which the lemma', () => {
  const { getByRole } = render(WordElsewhere, { word: 'meilė' });

  const navigation = getByRole('navigation', { name: '„meilė“ kituose šaltiniuose' });
  expect(navigation).toHaveTextContent(/^„meilė“ kitur\s*kaip žodžio forma:\s*žanrai\s*\/\/\s*laikotarpiai\s*\/\/\s*karo metas;\s*kaip lema:\s*sintaksė$/);
});

test('WordElsewhere leaves out a unit with no other page', () => {
  const { getByRole } = render(WordElsewhere, { word: 'žmogus', current: 'sintakse' });

  const navigation = getByRole('navigation', { name: '„žmogus“ kituose šaltiniuose' });
  expect(navigation).toHaveTextContent('kaip žodžio forma:');
  expect(navigation).not.toHaveTextContent('kaip lema');
  expect(navigation).not.toHaveTextContent(';');
});

test('WordElsewhere renders nothing for an empty word', () => {
  const { queryByRole } = render(WordElsewhere, { word: '  ' });

  expect(queryByRole('navigation')).not.toBeInTheDocument();
});
