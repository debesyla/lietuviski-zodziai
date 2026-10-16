import { describe, it, expect } from 'vitest';
import { formatNumber, paginate, RESULTS_PER_PAGE, sortWords } from '../../../src/lib/utils.ts';

describe('sortWords', () => {
  const words = [
    { word: 'zebra', frequency: 10 },
    { word: 'apple', frequency: 5 },
    { word: 'banana', frequency: 20 }
  ];

  it('sorts by word ascending by default', () => {
    const result = sortWords(words, 'word');
    expect(result).toEqual([
      { word: 'apple', frequency: 5 },
      { word: 'banana', frequency: 20 },
      { word: 'zebra', frequency: 10 }
    ]);
  });

  it('sorts by word descending', () => {
    const result = sortWords(words, 'word', false);
    expect(result).toEqual([
      { word: 'zebra', frequency: 10 },
      { word: 'banana', frequency: 20 },
      { word: 'apple', frequency: 5 }
    ]);
  });

  it('sorts by frequency ascending', () => {
    const result = sortWords(words, 'frequency');
    expect(result).toEqual([
      { word: 'apple', frequency: 5 },
      { word: 'zebra', frequency: 10 },
      { word: 'banana', frequency: 20 }
    ]);
  });

  it('sorts by frequency descending', () => {
    const result = sortWords(words, 'frequency', false);
    expect(result).toEqual([
      { word: 'banana', frequency: 20 },
      { word: 'zebra', frequency: 10 },
      { word: 'apple', frequency: 5 }
    ]);
  });

  it('sorts by optional type without changing the source array', () => {
    const typedWords = [
      { word: 'žodis', type: 'vksm', frequency: 10 },
      { word: 'ir', type: 'jng', frequency: 20 },
      { word: 'be tipo', frequency: 5 }
    ];

    expect(sortWords(typedWords, 'type')).toEqual([
      { word: 'be tipo', frequency: 5 },
      { word: 'ir', type: 'jng', frequency: 20 },
      { word: 'žodis', type: 'vksm', frequency: 10 }
    ]);
    expect(typedWords[0]).toEqual({ word: 'žodis', type: 'vksm', frequency: 10 });
  });

  it('returns a new array without modifying original', () => {
    const original = [...words];
    sortWords(words, 'word');
    expect(words).toEqual(original);
  });
});

describe('paginate', () => {
  it('keeps rendering bounded to one page of records even when many results match', () => {
    const matches = Array.from({ length: 50_001 }, (_, index) => `word-${index + 1}`);
    const page = paginate(matches, 1);

    expect(RESULTS_PER_PAGE).toBe(20);
    expect(page).toMatchObject({ start: 1, end: 20, currentPage: 1, totalPages: 2501 });
    expect(page.items).toHaveLength(20);
    expect(page.items[0]).toBe('word-1');
    expect(page.items[19]).toBe('word-20');
  });

  it('clamps out-of-range pages and represents an empty result set', () => {
    expect(paginate(['a', 'b'], 99)).toMatchObject({ currentPage: 1, totalPages: 1, start: 1, end: 2 });
    expect(paginate([], 4)).toMatchObject({ currentPage: 1, totalPages: 1, start: 0, end: 0, items: [] });
  });
});

describe('formatNumber', () => {
  it('keeps whole numbers ungrouped and Lithuanian decimals and percentages', () => {
    expect(formatNumber(41977)).toBe('41977');
    expect(formatNumber(1266854554)).toBe('1266854554');
    expect(formatNumber(111111.114, { maximumFractionDigits: 2 })).toBe('111111,11');
    expect(formatNumber(0.395, { style: 'percent', maximumFractionDigits: 1 })).toMatch(/^39,5\s%$/);
    expect(formatNumber(12.5, { useGrouping: true })).toBe('12,5');
  });
});
