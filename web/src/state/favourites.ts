import type { Complex } from '../fractal/core';

const STORAGE_KEY = 'fractal-explorer:favourites';

export const DEFAULT_FAVOURITES: readonly Complex[] = [
  { re: -0.5, im: 0.5 },
  { re: -0.8, im: 0.156 },
  { re: 0.285, im: 0.01 },
  { re: -0.4, im: 0.6 },
  { re: -0.7269, im: 0.1889 },
  { re: -0.835, im: -0.2321 },
  { re: 0.355, im: 0.355 },
];

function isComplex(value: unknown): value is Complex {
  if (typeof value !== 'object' || value === null) return false;
  const { re, im } = value as Record<string, unknown>;
  return typeof re === 'number' && typeof im === 'number' && Number.isFinite(re) && Number.isFinite(im);
}

/** Parses the 2014 `savedFavourites.txt` format (`re:im` per line). Malformed lines are skipped rather than crashing. */
export function parseLegacyFavourites(text: string): Complex[] {
  const result: Complex[] = [];
  for (const line of text.split(/\r?\n/)) {
    const parts = line.trim().split(':');
    if (parts.length !== 2 || parts[0] === '' || parts[1] === '') continue;
    const re = Number(parts[0]);
    const im = Number(parts[1]);
    if (Number.isFinite(re) && Number.isFinite(im)) result.push({ re, im });
  }
  return result;
}

export function formatLegacyFavourites(favourites: readonly Complex[]): string {
  return favourites.map((f) => `${f.re}:${f.im}`).join('\n') + '\n';
}

export function parseStoredFavourites(raw: string | null): Complex[] | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isComplex) : null;
  } catch {
    return null;
  }
}

export function sameComplex(a: Complex, b: Complex): boolean {
  return Math.abs(a.re - b.re) < 1e-12 && Math.abs(a.im - b.im) < 1e-12;
}

export function addFavourite(list: readonly Complex[], value: Complex): Complex[] {
  return list.some((f) => sameComplex(f, value)) ? [...list] : [...list, { re: value.re, im: value.im }];
}

export function removeFavourite(list: readonly Complex[], value: Complex): Complex[] {
  return list.filter((f) => !sameComplex(f, value));
}

export function loadFavourites(storage: Pick<Storage, 'getItem'> = localStorage): Complex[] {
  return parseStoredFavourites(storage.getItem(STORAGE_KEY)) ?? [...DEFAULT_FAVOURITES];
}

export function saveFavourites(list: readonly Complex[], storage: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage can be unavailable (private mode / quota); favourites then only last for the session.
  }
}
