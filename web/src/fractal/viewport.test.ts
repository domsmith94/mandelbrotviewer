import { describe, expect, it } from 'vitest';
import {
  complexToPixel,
  DEFAULT_VIEWPORTS,
  MAX_SPAN,
  MIN_SPAN,
  pan,
  pixelToComplex,
  zoomAt,
  zoomToRect,
  type Viewport,
} from './viewport';

const size = { width: 800, height: 600 };
const view: Viewport = { centerRe: -0.5, centerIm: 0.25, span: 3 };

describe('viewport mapping', () => {
  it('maps the panel centre to the view centre with the imaginary axis pointing up', () => {
    expect(pixelToComplex(view, size, 400, 300)).toEqual({ re: -0.5, im: 0.25 });
    expect(pixelToComplex(view, size, 400, 0).im).toBeCloseTo(1.75);
    expect(pixelToComplex(view, size, 0, 300).re).toBeCloseTo(-0.5 - 2);
  });

  it('round-trips pixel and complex coordinates', () => {
    const p = complexToPixel(view, size, pixelToComplex(view, size, 123, 456));
    expect(p.x).toBeCloseTo(123);
    expect(p.y).toBeCloseTo(456);
  });
});

describe('zoomAt', () => {
  it('keeps the point under the cursor fixed', () => {
    const before = pixelToComplex(view, size, 100, 500);
    const zoomed = zoomAt(view, size, 100, 500, 0.25);
    const after = pixelToComplex(zoomed, size, 100, 500);
    expect(zoomed.span).toBeCloseTo(0.75);
    expect(after.re).toBeCloseTo(before.re, 12);
    expect(after.im).toBeCloseTo(before.im, 12);
  });

  it('clamps to the representable zoom range', () => {
    expect(zoomAt(view, size, 0, 0, 1e-30).span).toBe(MIN_SPAN);
    expect(zoomAt(view, size, 0, 0, 1e9).span).toBe(MAX_SPAN);
  });
});

describe('pan', () => {
  it('moves the view opposite to the drag direction', () => {
    const moved = pan(view, size, 60, -60);
    expect(moved.centerRe).toBeCloseTo(-0.5 - 60 * (3 / 600));
    expect(moved.centerIm).toBeCloseTo(0.25 - 60 * (3 / 600));
  });
});

describe('zoomToRect', () => {
  it('ignores zero-width selections that collapsed the axis in the Java version', () => {
    expect(zoomToRect(view, size, 300, 100, 300, 400)).toBeNull();
    expect(zoomToRect(view, size, 100, 200, 500, 202)).toBeNull();
  });

  it('centres on the selection and preserves the aspect ratio', () => {
    // A wide 400x100 box: width is the limiting dimension.
    const zoomed = zoomToRect(view, size, 200, 250, 600, 350)!;
    expect(zoomed.centerRe).toBeCloseTo(-0.5);
    expect(zoomed.centerIm).toBeCloseTo(0.25);
    expect(zoomed.span).toBeCloseTo(400 * (3 / 600) * (600 / 800));
  });

  it('works for selections dragged in any direction', () => {
    expect(zoomToRect(view, size, 600, 350, 200, 250)).toEqual(zoomToRect(view, size, 200, 250, 600, 350));
  });
});

describe('defaults', () => {
  it('frames the whole Mandelbrot set', () => {
    const d = DEFAULT_VIEWPORTS.mandelbrot;
    expect(d.centerRe - d.span / 2).toBeLessThan(-1.2);
    expect(d.span).toBeGreaterThan(2.24);
  });
});
