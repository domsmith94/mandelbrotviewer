import { describe, expect, it } from 'vitest';
import {
  addFavourite,
  DEFAULT_FAVOURITES,
  formatLegacyFavourites,
  loadFavourites,
  parseLegacyFavourites,
  parseStoredFavourites,
  removeFavourite,
} from './favourites';

describe('legacy savedFavourites.txt format', () => {
  it('skips malformed lines instead of crashing like the Java loader', () => {
    const text = '-0.5:0.5\n0.3\n\nabc:def\n0.285:0.01\r\n1:2:3\n';
    expect(parseLegacyFavourites(text)).toEqual([
      { re: -0.5, im: 0.5 },
      { re: 0.285, im: 0.01 },
    ]);
  });

  it('round-trips through the export format', () => {
    const list = [
      { re: -0.8, im: 0.156 },
      { re: 0.355, im: -0.355 },
    ];
    expect(parseLegacyFavourites(formatLegacyFavourites(list))).toEqual(list);
  });
});

describe('stored favourites', () => {
  it('seeds defaults when nothing is stored and ignores corrupt storage', () => {
    expect(loadFavourites({ getItem: () => null })).toEqual(DEFAULT_FAVOURITES);
    expect(loadFavourites({ getItem: () => '{not json' })).toEqual(DEFAULT_FAVOURITES);
    expect(parseStoredFavourites('[{"re":1,"im":2},{"re":"x"},null]')).toEqual([{ re: 1, im: 2 }]);
  });

  it('adds without duplicates and removes', () => {
    const one = addFavourite([], { re: 1, im: 2 });
    expect(addFavourite(one, { re: 1, im: 2 })).toHaveLength(1);
    expect(removeFavourite(one, { re: 1, im: 2 })).toEqual([]);
  });
});
