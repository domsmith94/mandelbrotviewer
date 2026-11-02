import { clampIterations, DEFAULT_ITERATIONS, type Complex } from '../fractal/core';
import { isPaletteId, type PaletteId } from '../fractal/palette';
import { clampSpan, DEFAULT_VIEWPORTS, type Viewport } from '../fractal/viewport';

export interface AppState {
  mandelbrot: Viewport;
  julia: Viewport;
  juliaC: Complex;
  iterations: number;
  palette: PaletteId;
}

export function defaultState(): AppState {
  return {
    mandelbrot: { ...DEFAULT_VIEWPORTS.mandelbrot },
    julia: { ...DEFAULT_VIEWPORTS.julia },
    juliaC: { re: -0.5, im: 0.5 },
    iterations: DEFAULT_ITERATIONS,
    palette: 'aurora',
  };
}

function numbers(value: string | null, count: number): number[] | null {
  if (value === null) return null;
  const parts = value.split(',').map(Number);
  return parts.length === count && parts.every(Number.isFinite) ? parts : null;
}

function viewport(value: string | null, fallback: Viewport): Viewport {
  const n = numbers(value, 3);
  return n ? { centerRe: n[0], centerIm: n[1], span: clampSpan(n[2]) } : { ...fallback };
}

/** Serialises the full view into a URL hash so any view can be shared as a link. */
export function encodeState(state: AppState): string {
  const v = (view: Viewport) => [view.centerRe, view.centerIm, view.span].join(',');
  const params = new URLSearchParams({
    m: v(state.mandelbrot),
    j: v(state.julia),
    c: `${state.juliaC.re},${state.juliaC.im}`,
    it: String(state.iterations),
    p: state.palette,
  });
  return `#${params.toString()}`;
}

/** Parses a URL hash; any missing or invalid field falls back to its default. */
export function decodeState(hash: string): AppState {
  const defaults = defaultState();
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const c = numbers(params.get('c'), 2);
  const iterations = params.get('it');
  const palette = params.get('p');
  return {
    mandelbrot: viewport(params.get('m'), defaults.mandelbrot),
    julia: viewport(params.get('j'), defaults.julia),
    juliaC: c ? { re: c[0], im: c[1] } : defaults.juliaC,
    iterations: iterations === null ? defaults.iterations : clampIterations(Number(iterations)),
    palette: isPaletteId(palette) ? palette : defaults.palette,
  };
}

export function formatComplex(value: Complex, digits = 4): string {
  const sign = value.im < 0 ? '−' : '+';
  return `${value.re.toFixed(digits)} ${sign} ${Math.abs(value.im).toFixed(digits)}i`;
}
