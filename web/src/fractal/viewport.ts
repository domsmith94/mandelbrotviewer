import type { Complex, FractalKind } from './core';

/** A view onto the complex plane: centre point plus the visible height (imaginary span). */
export interface Viewport {
  centerRe: number;
  centerIm: number;
  span: number;
}

export interface Size {
  width: number;
  height: number;
}

/** Below this, doubles can no longer distinguish neighbouring pixels. */
export const MIN_SPAN = 1e-13;
export const MAX_SPAN = 16;
/** Selections smaller than this (in CSS px) on either axis are ignored instead of producing a degenerate view. */
export const MIN_SELECTION_PX = 4;

export const DEFAULT_VIEWPORTS: Record<FractalKind, Viewport> = {
  mandelbrot: { centerRe: -0.6, centerIm: 0, span: 2.6 },
  julia: { centerRe: 0, centerIm: 0, span: 3.2 },
};

export function clampSpan(span: number): number {
  if (!Number.isFinite(span) || span <= 0) return MAX_SPAN;
  return Math.min(MAX_SPAN, Math.max(MIN_SPAN, span));
}

export function unitsPerPixel(view: Viewport, size: Size): number {
  return view.span / size.height;
}

/** Maps a point in panel coordinates (origin top-left, y down) to the complex plane (imaginary axis up). */
export function pixelToComplex(view: Viewport, size: Size, x: number, y: number): Complex {
  const u = unitsPerPixel(view, size);
  return {
    re: view.centerRe + (x - size.width / 2) * u,
    im: view.centerIm - (y - size.height / 2) * u,
  };
}

export function complexToPixel(view: Viewport, size: Size, point: Complex): { x: number; y: number } {
  const u = unitsPerPixel(view, size);
  return {
    x: (point.re - view.centerRe) / u + size.width / 2,
    y: size.height / 2 - (point.im - view.centerIm) / u,
  };
}

/** Zooms by `factor` (<1 zooms in) keeping the point under (x, y) fixed. */
export function zoomAt(view: Viewport, size: Size, x: number, y: number, factor: number): Viewport {
  const span = clampSpan(view.span * factor);
  const applied = span / view.span;
  const anchor = pixelToComplex(view, size, x, y);
  return {
    centerRe: anchor.re - (anchor.re - view.centerRe) * applied,
    centerIm: anchor.im - (anchor.im - view.centerIm) * applied,
    span,
  };
}

export function pan(view: Viewport, size: Size, dx: number, dy: number): Viewport {
  const u = unitsPerPixel(view, size);
  return { ...view, centerRe: view.centerRe - dx * u, centerIm: view.centerIm + dy * u };
}

/**
 * Zooms so the dragged rectangle fills the panel without distorting the aspect ratio.
 * Returns null for selections too thin to be intentional (the 2014 version collapsed the axis to zero width).
 */
export function zoomToRect(
  view: Viewport,
  size: Size,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Viewport | null {
  const w = Math.abs(x1 - x0);
  const h = Math.abs(y1 - y0);
  if (w < MIN_SELECTION_PX || h < MIN_SELECTION_PX) return null;
  const centre = pixelToComplex(view, size, (x0 + x1) / 2, (y0 + y1) / 2);
  const u = unitsPerPixel(view, size);
  const span = clampSpan(Math.max(h * u, w * u * (size.height / size.width)));
  return { centerRe: centre.re, centerIm: centre.im, span };
}

export function zoomLevel(view: Viewport, kind: FractalKind): number {
  return DEFAULT_VIEWPORTS[kind].span / view.span;
}

export function isValidViewport(view: Viewport): boolean {
  return Number.isFinite(view.centerRe) && Number.isFinite(view.centerIm) && Number.isFinite(view.span) && view.span > 0;
}
