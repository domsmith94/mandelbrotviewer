export type PaletteId = 'classic' | 'aurora' | 'ember';

export interface PaletteInfo {
  id: PaletteId;
  label: string;
}

export const PALETTES: readonly PaletteInfo[] = [
  { id: 'aurora', label: 'Aurora' },
  { id: 'ember', label: 'Ember' },
  { id: 'classic', label: 'Classic (2014)' },
];

export const PALETTE_INDEX: Record<PaletteId, number> = { classic: 0, aurora: 1, ember: 2 };

export function isPaletteId(value: unknown): value is PaletteId {
  return value === 'classic' || value === 'aurora' || value === 'ember';
}

export type Rgb = [number, number, number];

/** java.awt.Color.HSBtoRGB equivalent, returning 0..255 channels. */
export function hsbToRgb(hue: number, saturation: number, brightness: number): Rgb {
  const h = (hue - Math.floor(hue)) * 6;
  const sector = Math.floor(h);
  const f = h - sector;
  const p = brightness * (1 - saturation);
  const q = brightness * (1 - saturation * f);
  const t = brightness * (1 - saturation * (1 - f));
  const table: Rgb[] = [
    [brightness, t, p],
    [q, brightness, p],
    [p, brightness, t],
    [p, q, brightness],
    [t, p, brightness],
    [brightness, p, q],
  ];
  const [r, g, b] = table[sector % 6];
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/** Inigo Quilez style cosine palette. */
function cosinePalette(t: number, a: Rgb, b: Rgb, c: Rgb, d: Rgb): Rgb {
  const channel = (i: number) => {
    const v = a[i] + b[i] * Math.cos(2 * Math.PI * (c[i] * t + d[i]));
    return Math.round(Math.min(1, Math.max(0, v)) * 255);
  };
  return [channel(0), channel(1), channel(2)];
}

/**
 * Colour for an escaped point. Mirrors the GLSL implementation in render/shaders.ts;
 * keep both in sync.
 * @param smooth continuous iteration count
 * @param hueOffset per-panel offset (Mandelbrot 0.99, Julia 0.49 in the original)
 */
export function colourFor(palette: PaletteId, smooth: number, maxIterations: number, hueOffset: number): Rgb {
  switch (palette) {
    case 'classic':
      return hsbToRgb(hueOffset + (1.9 * smooth) / maxIterations, 0.9, 0.9);
    case 'aurora': {
      const t = Math.sqrt(Math.max(smooth, 0)) * 0.12 + hueOffset;
      return cosinePalette(t, [0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1.0, 1.0, 1.0], [0.0, 0.1, 0.2]);
    }
    case 'ember': {
      const t = Math.sqrt(Math.max(smooth, 0)) * 0.1 + hueOffset;
      return cosinePalette(t, [0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [1.0, 0.7, 0.4], [0.0, 0.15, 0.2]);
    }
  }
}
