import { describe, expect, it } from 'vitest';
import golden from './__fixtures__/java-golden.json';
import { CLASSIC_BAILOUT, clampIterations, escape, mandelbrot, MAX_ITERATIONS, smoothIterations } from './core';

describe('parity with the 2014 Java Calculator', () => {
  it('matches Mandelbrot iteration counts exactly', () => {
    expect(golden.mandelbrot.length).toBeGreaterThan(1000);
    for (const [re, im, limit, expected] of golden.mandelbrot) {
      expect(escape(0, 0, re, im, limit, CLASSIC_BAILOUT).iterations, `c=${re}+${im}i N=${limit}`).toBe(expected);
    }
  });

  it('matches Julia counts once the Java off-by-one is accounted for', () => {
    // Java started Julia's counter at 1, so it performed N-1 iterations and reported one extra.
    for (const [cRe, cIm, re, im, limit, expected] of golden.julia) {
      const port = escape(re, im, cRe, cIm, limit - 1, CLASSIC_BAILOUT).iterations + 1;
      expect(port, `c=${cRe}+${cIm}i z0=${re}+${im}i N=${limit}`).toBe(expected);
    }
  });
});

describe('escape', () => {
  it('classifies known points', () => {
    expect(mandelbrot({ re: 0, im: 0 }, 100).escaped).toBe(false);
    expect(mandelbrot({ re: -1, im: 0 }, 100).escaped).toBe(false);
    expect(mandelbrot({ re: 0, im: 1 }, 100).escaped).toBe(false);
    expect(mandelbrot({ re: 1, im: 0 }, 100, CLASSIC_BAILOUT).iterations).toBe(3);
  });

  it('handles the maximum iteration count without recursion limits', () => {
    expect(escape(0, 0, 0, 0, MAX_ITERATIONS).iterations).toBe(MAX_ITERATIONS);
  });
});

describe('smoothIterations', () => {
  it('is continuous across iteration bands', () => {
    let previous: { n: number; smooth: number } | null = null;
    let worstJump = 0;
    let boundaries = 0;
    for (let i = 0; i <= 200_000; i++) {
      const result = mandelbrot({ re: 0.3 + (0.7 * i) / 200_000, im: 0 }, 500);
      const smooth = smoothIterations(result);
      if (previous && previous.n !== result.iterations) {
        worstJump = Math.max(worstJump, Math.abs(smooth - previous.smooth));
        boundaries++;
      }
      previous = { n: result.iterations, smooth };
    }
    expect(boundaries).toBeGreaterThan(5);
    expect(worstJump).toBeLessThan(0.01);
  });
});

describe('clampIterations', () => {
  it('bounds user input', () => {
    expect(clampIterations(0)).toBe(1);
    expect(clampIterations(1e9)).toBe(MAX_ITERATIONS);
    expect(clampIterations(Number.NaN)).toBe(200);
    expect(clampIterations(99.6)).toBe(100);
  });
});
