export type FractalKind = 'mandelbrot' | 'julia';

export interface Complex {
  re: number;
  im: number;
}

export interface EscapeResult {
  /** Iterations performed before |z| exceeded the bailout radius (equals maxIterations if it never did). */
  iterations: number;
  zRe: number;
  zIm: number;
  escaped: boolean;
}

export const MIN_ITERATIONS = 1;
export const MAX_ITERATIONS = 10_000;
export const DEFAULT_ITERATIONS = 200;

/** Large bailout radius so the smooth-colouring estimate is continuous across iteration bands. */
export const SMOOTH_BAILOUT = 256;
/** Bailout radius used by the original Java implementation. */
export const CLASSIC_BAILOUT = 2;

/**
 * Iterates z -> z^2 + c from z0 until |z| > bailout or maxIterations is reached.
 * Mandelbrot: z0 = 0, c = pixel. Julia: z0 = pixel, c = constant.
 * Iterative (not recursive) so large iteration counts cannot overflow the stack.
 */
export function escape(
  z0Re: number,
  z0Im: number,
  cRe: number,
  cIm: number,
  maxIterations: number,
  bailout = SMOOTH_BAILOUT,
): EscapeResult {
  const bailoutSquared = bailout * bailout;
  let zRe = z0Re;
  let zIm = z0Im;
  let n = 0;
  while (n < maxIterations) {
    const reSq = zRe * zRe;
    const imSq = zIm * zIm;
    if (reSq + imSq > bailoutSquared) {
      return { iterations: n, zRe, zIm, escaped: true };
    }
    zIm = 2 * zRe * zIm + cIm;
    zRe = reSq - imSq + cRe;
    n++;
  }
  return { iterations: n, zRe, zIm, escaped: zRe * zRe + zIm * zIm > bailoutSquared };
}

export function mandelbrot(c: Complex, maxIterations: number, bailout = SMOOTH_BAILOUT): EscapeResult {
  return escape(0, 0, c.re, c.im, maxIterations, bailout);
}

export function julia(z: Complex, c: Complex, maxIterations: number, bailout = SMOOTH_BAILOUT): EscapeResult {
  return escape(z.re, z.im, c.re, c.im, maxIterations, bailout);
}

/**
 * Continuous ("normalised") iteration count: n + 1 - log2(ln|z|).
 * The 2014 version computed n + 1 - ln(log2|z|), which leaves visible banding.
 */
export function smoothIterations(result: EscapeResult): number {
  const modulus = Math.hypot(result.zRe, result.zIm);
  return result.iterations + 1 - Math.log2(Math.log(modulus));
}

export function clampIterations(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_ITERATIONS;
  return Math.min(MAX_ITERATIONS, Math.max(MIN_ITERATIONS, Math.round(value)));
}
