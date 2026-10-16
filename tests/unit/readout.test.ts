import { describe, expect, it } from 'vitest';
import { pairReadout, spreadReadout, timesPhrase } from '../../src/lib/readout';

const genre = (label: string) => `žanre „${label}“`;

describe('pairReadout', () => {
  it('states the multiplier and direction between two named sources', () => {
    expect(pairReadout('karas', 'Karo meto socialiniai tinklai', 'CCLL2', Math.log2(83_682 / 5_201))).toEqual({
      figure: '16,1×',
      text: 'Šaltinyje „Karo meto socialiniai tinklai“ forma „karas“ pavartota 16,1 karto dažniau nei šaltinyje „CCLL2“.'
    });
    expect(pairReadout('meilė', 'Karo meto socialiniai tinklai', 'CCLL2', Math.log2(2_113 / 9_315)).text).toContain('4,4 karto rečiau');
  });

  it('calls a near-equal pair about the same', () => {
    expect(pairReadout('ir', 'A', 'B', 0.01).figure).toBe('≈1×');
  });
});

describe('spreadReadout', () => {
  it('names the most and least frequent slice and a near tie', () => {
    const readout = spreadReadout('meilė', [
      { label: 'Grožinė literatūra', value: 132.79 },
      { label: 'Negrožinė literatūra', value: 132.25 },
      { label: 'Administraciniai tekstai', value: 38.78 },
      { label: 'Sakytinė kalba', value: 36.73 }
    ], genre, 'vartojama');

    expect(readout).toEqual({
      figure: '3,6×',
      text: 'Forma „meilė“ dažniausiai vartojama žanre „Grožinė literatūra“ (132,79 milijonui žodžių) – 3,6 karto dažniau nei žanre „Sakytinė kalba“. Beveik tiek pat – žanre „Negrožinė literatūra“.'
    });
  });

  it('does not double the full stop after a place ending in "m."', () => {
    const readout = spreadReadout('meilė', [
      { label: '1922–1940', value: 140.94 },
      { label: '1990–2004', value: 17.56 }
    ], (label) => `${label} m.`, 'vartota');

    expect(readout?.text).toBe('Forma „meilė“ dažniausiai vartota 1922–1940 m. (140,94 milijonui žodžių) – 8 kartus dažniau nei 1990–2004 m.');
  });

  it('skips slices where the form was not observed instead of reading them as zero', () => {
    const readout = spreadReadout('x', [
      { label: 'A', value: 4 },
      { label: 'B', value: null },
      { label: 'C', value: 2 }
    ], genre, 'vartojama');

    expect(readout?.text).toContain('2 kartus dažniau nei žanre „C“');
    expect(spreadReadout('x', [{ label: 'A', value: 4 }, { label: 'B', value: null }], genre, 'vartojama')?.text)
      .toBe('Forma „x“ aptikta tik žanre „A“: 4 milijonui žodžių.');
    expect(spreadReadout('x', [{ label: 'A', value: null }], genre, 'vartojama')).toBeNull();
  });
});

describe('timesPhrase', () => {
  it('agrees the noun with the number', () => {
    expect(timesPhrase(16.08)).toBe('16,1 karto');
    expect(timesPhrase(2)).toBe('2 kartus');
    expect(timesPhrase(8.01)).toBe('8 kartus');
    expect(timesPhrase(10)).toBe('10 kartų');
    expect(timesPhrase(15)).toBe('15 kartų');
    expect(timesPhrase(21)).toBe('21 kartą');
    expect(timesPhrase(1068.4)).toBe(`${(1068).toLocaleString('lt-LT')} kartus`);
  });
});
