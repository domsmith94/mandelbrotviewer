import { describe, expect, it } from 'vitest';
import { MAX_ITERATIONS } from '../fractal/core';
import { decodeState, defaultState, encodeState, formatComplex } from './appState';

describe('URL state', () => {
  it('round-trips the full view exactly, including deep zoom precision', () => {
    const state = {
      ...defaultState(),
      mandelbrot: { centerRe: -0.743643887037151, centerIm: 0.13182590420533, span: 1.7e-11 },
      juliaC: { re: -0.7269, im: 0.1889 },
      iterations: 2500,
      palette: 'ember' as const,
    };
    expect(decodeState(encodeState(state))).toEqual(state);
  });

  it('falls back to defaults for missing or invalid values', () => {
    const decoded = decodeState('#m=abc&c=1&it=-5&p=neon&j=0,0,-1');
    const defaults = defaultState();
    expect(decoded.mandelbrot).toEqual(defaults.mandelbrot);
    expect(decoded.juliaC).toEqual(defaults.juliaC);
    expect(decoded.iterations).toBe(1);
    expect(decoded.palette).toBe(defaults.palette);
    expect(decoded.julia.span).toBeGreaterThan(0);
    expect(decodeState('#it=999999').iterations).toBe(MAX_ITERATIONS);
    expect(decodeState('')).toEqual(defaults);
  });
});

describe('formatComplex', () => {
  it('formats the sign consistently', () => {
    expect(formatComplex({ re: 0.5, im: -0.5 }, 2)).toBe('0.50 − 0.50i');
    expect(formatComplex({ re: -0.5, im: 0.5 }, 2)).toBe('-0.50 + 0.50i');
  });
});
