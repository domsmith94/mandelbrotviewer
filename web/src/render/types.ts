import type { Complex, FractalKind } from '../fractal/core';
import type { PaletteId } from '../fractal/palette';
import type { Viewport } from '../fractal/viewport';

export interface RenderParams {
  kind: FractalKind;
  view: Viewport;
  juliaC: Complex;
  iterations: number;
  palette: PaletteId;
  hueOffset: number;
  /** Canvas size in device pixels. */
  width: number;
  height: number;
}

/**
 * float32 GPU maths stops resolving neighbouring pixels at roughly this many complex units per
 * device pixel; deeper views switch to the float64 CPU renderer.
 */
export const GPU_PRECISION_LIMIT = 2e-6;

export function needsDoublePrecision(params: Pick<RenderParams, 'view' | 'height'>): boolean {
  return params.view.span / params.height < GPU_PRECISION_LIMIT;
}
