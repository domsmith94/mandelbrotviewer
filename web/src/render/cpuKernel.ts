import { escape, smoothIterations } from '../fractal/core';
import { colourFor } from '../fractal/palette';
import type { RenderParams } from './types';

/** Renders rows [rowStart, rowEnd) of the image in float64 into an RGBA buffer. */
export function renderRows(params: RenderParams, rowStart: number, rowEnd: number): Uint8ClampedArray {
  const { width, height, view, juliaC, iterations, palette, hueOffset, kind } = params;
  const pixels = new Uint8ClampedArray(width * (rowEnd - rowStart) * 4);
  const u = view.span / height;
  let offset = 0;
  for (let y = rowStart; y < rowEnd; y++) {
    const im = view.centerIm - (y + 0.5 - height / 2) * u;
    for (let x = 0; x < width; x++) {
      const re = view.centerRe + (x + 0.5 - width / 2) * u;
      const result =
        kind === 'mandelbrot' ? escape(0, 0, re, im, iterations) : escape(re, im, juliaC.re, juliaC.im, iterations);
      if (result.escaped) {
        const [r, g, b] = colourFor(palette, smoothIterations(result), iterations, hueOffset);
        pixels[offset] = r;
        pixels[offset + 1] = g;
        pixels[offset + 2] = b;
      }
      pixels[offset + 3] = 255;
      offset += 4;
    }
  }
  return pixels;
}
