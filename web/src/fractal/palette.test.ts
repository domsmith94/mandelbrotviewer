import { describe, expect, it } from 'vitest';
import golden from './__fixtures__/java-golden.json';
import { colourFor, hsbToRgb, isPaletteId, PALETTES } from './palette';

describe('hsbToRgb', () => {
  it('matches java.awt.Color.HSBtoRGB', () => {
    for (const [h, s, b, r, g, bl] of golden.hsb) {
      const [r2, g2, b2] = hsbToRgb(h, s, b);
      // Java uses float arithmetic, so allow one step of rounding difference.
      expect(Math.abs(r2 - r), `h=${h} s=${s} b=${b}`).toBeLessThanOrEqual(1);
      expect(Math.abs(g2 - g)).toBeLessThanOrEqual(1);
      expect(Math.abs(b2 - bl)).toBeLessThanOrEqual(1);
    }
  });
});

describe('colourFor', () => {
  it('returns valid channels for every palette', () => {
    for (const { id } of PALETTES) {
      expect(isPaletteId(id)).toBe(true);
      for (const smooth of [0, 1.5, 37.2, 999]) {
        for (const channel of colourFor(id, smooth, 1000, 0.49)) {
          expect(channel).toBeGreaterThanOrEqual(0);
          expect(channel).toBeLessThanOrEqual(255);
        }
      }
    }
  });
});
