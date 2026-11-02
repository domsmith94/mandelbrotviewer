import type { Complex, FractalKind } from '../fractal/core';
import type { PaletteId } from '../fractal/palette';
import {
  complexToPixel,
  pan,
  pixelToComplex,
  zoomAt,
  zoomLevel,
  zoomToRect,
  type Size,
  type Viewport,
} from '../fractal/viewport';
import type { CpuRenderer } from '../render/cpuRenderer';
import { GlRenderer } from '../render/glRenderer';
import { needsDoublePrecision, type RenderParams } from '../render/types';
import { formatComplex } from '../state/appState';

export type DragMode = 'pan' | 'box';

export interface PanelCallbacks {
  onViewChange(view: Viewport): void;
  onHover?(point: Complex | null): void;
  onClick?(point: Complex): void;
}

export interface PanelOptions {
  kind: FractalKind;
  title: string;
  hueOffset: number;
  view: Viewport;
  cpu: CpuRenderer;
  forceCpu: boolean;
  callbacks: PanelCallbacks;
}

interface RenderInputs {
  juliaC: Complex;
  iterations: number;
  palette: PaletteId;
}

const CLICK_SLOP_PX = 4;

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, parent: HTMLElement) {
  const el = document.createElement(tag);
  el.className = className;
  parent.appendChild(el);
  return el;
}

/** One interactive fractal view: canvases, HUD and pointer/wheel/pinch interaction. */
export class FractalPanel {
  private readonly kind: FractalKind;
  private readonly hueOffset: number;
  private readonly cpu: CpuRenderer;
  private readonly forceCpu: boolean;
  private readonly callbacks: PanelCallbacks;

  private readonly surface: HTMLDivElement;
  private readonly glCanvas: HTMLCanvasElement;
  private readonly cpuCanvas: HTMLCanvasElement;
  private readonly cpuContext: CanvasRenderingContext2D;
  private readonly selection: HTMLDivElement;
  private readonly marker: HTMLDivElement;
  private readonly coords: HTMLSpanElement;
  private readonly zoom: HTMLSpanElement;
  private readonly badge: HTMLSpanElement;
  private readonly gl: GlRenderer | null;

  private view: Viewport;
  private inputs: RenderInputs = { juliaC: { re: 0, im: 0 }, iterations: 200, palette: 'aurora' };
  private size: Size = { width: 1, height: 1 };
  private dpr = 1;
  private frame = 0;
  private markerPoint: Complex | null = null;
  private dragMode: DragMode = 'pan';
  private lastCpuView: Viewport | null = null;

  private readonly pointers = new Map<number, { x: number; y: number }>();
  private gesture: { startX: number; startY: number; box: boolean; moved: boolean; multi: boolean } | null = null;

  constructor(container: HTMLElement, options: PanelOptions) {
    this.kind = options.kind;
    this.hueOffset = options.hueOffset;
    this.cpu = options.cpu;
    this.forceCpu = options.forceCpu;
    this.callbacks = options.callbacks;
    this.view = { ...options.view };

    container.classList.add('panel');
    this.surface = element('div', 'surface', container);
    this.glCanvas = element('canvas', 'layer', this.surface);
    this.cpuCanvas = element('canvas', 'layer cpu', this.surface);
    this.cpuContext = this.cpuCanvas.getContext('2d')!;
    this.selection = element('div', 'selection', this.surface);
    this.marker = element('div', 'marker', this.surface);

    const hud = element('div', 'hud', this.surface);
    element('span', 'hud-title', hud).textContent = options.title;
    this.badge = element('span', 'hud-badge', hud);
    const footer = element('div', 'hud-footer', this.surface);
    this.coords = element('span', 'hud-coords', footer);
    this.zoom = element('span', 'hud-zoom', footer);

    this.gl = this.forceCpu ? null : GlRenderer.create(this.glCanvas);
    this.attachInteraction();
    new ResizeObserver(() => this.resize()).observe(this.surface);
    this.resize();
  }

  getView(): Viewport {
    return { ...this.view };
  }

  setView(view: Viewport): void {
    this.view = { ...view };
    this.scheduleRender();
  }

  update(inputs: RenderInputs): void {
    this.inputs = { ...inputs, juliaC: { ...inputs.juliaC } };
    this.scheduleRender();
  }

  setMarker(point: Complex | null): void {
    this.markerPoint = point;
    this.positionMarker();
  }

  setDragMode(mode: DragMode): void {
    this.dragMode = mode;
    this.surface.dataset.dragMode = mode;
  }

  /** Renders the current view at full resolution and returns it as a PNG. */
  async toPng(): Promise<Blob> {
    const params = this.params();
    const canvas = this.usesCpu(params) ? this.cpuCanvas : this.glCanvas;
    if (canvas === this.glCanvas) this.gl?.render(params);
    return new Promise((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))), 'image/png'),
    );
  }

  private params(): RenderParams {
    return {
      kind: this.kind,
      view: this.view,
      juliaC: this.inputs.juliaC,
      iterations: this.inputs.iterations,
      palette: this.inputs.palette,
      hueOffset: this.hueOffset,
      width: Math.max(1, Math.round(this.size.width * this.dpr)),
      height: Math.max(1, Math.round(this.size.height * this.dpr)),
    };
  }

  private usesCpu(params: RenderParams): boolean {
    return !this.gl || this.gl.contextLost || needsDoublePrecision(params);
  }

  private resize(): void {
    const rect = this.surface.getBoundingClientRect();
    this.size = { width: Math.max(1, rect.width), height: Math.max(1, rect.height) };
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = this.params();
    for (const canvas of [this.glCanvas, this.cpuCanvas]) {
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    }
    this.lastCpuView = null;
    this.scheduleRender();
  }

  private scheduleRender(): void {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.render();
    });
  }

  private render(): void {
    const params = this.params();
    this.zoom.textContent = `×${formatZoom(zoomLevel(this.view, this.kind))}`;
    this.positionMarker();

    if (this.usesCpu(params)) {
      this.reprojectCpuImage(params);
      this.cpuCanvas.hidden = false;
      this.setBadge('CPU · float64', true);
      this.cpu.render(params, this.cpuContext, () => this.setBadge('CPU · float64', false));
      this.lastCpuView = { ...params.view };
    } else {
      this.cpu.cancel(this.cpuContext);
      this.cpuCanvas.hidden = true;
      this.lastCpuView = null;
      this.gl!.render(params);
      this.setBadge('GPU · WebGL2', false);
    }
  }

  /** Moves/scales the previous CPU image to approximate the new view while workers re-render it. */
  private reprojectCpuImage(params: RenderParams): void {
    const previous = this.lastCpuView;
    if (!previous || this.cpuCanvas.hidden) {
      this.cpuContext.fillStyle = '#000';
      this.cpuContext.fillRect(0, 0, params.width, params.height);
      return;
    }
    const scale = previous.span / params.view.span;
    if (scale === 1 && previous.centerRe === params.view.centerRe && previous.centerIm === params.view.centerIm) return;
    const unitsPerPx = params.view.span / params.height;
    const dx = (previous.centerRe - params.view.centerRe) / unitsPerPx + (params.width / 2) * (1 - scale);
    const dy = (params.view.centerIm - previous.centerIm) / unitsPerPx + (params.height / 2) * (1 - scale);
    const snapshot = document.createElement('canvas');
    snapshot.width = params.width;
    snapshot.height = params.height;
    snapshot.getContext('2d')!.drawImage(this.cpuCanvas, 0, 0);
    this.cpuContext.fillStyle = '#000';
    this.cpuContext.fillRect(0, 0, params.width, params.height);
    this.cpuContext.drawImage(snapshot, dx, dy, params.width * scale, params.height * scale);
  }

  private setBadge(text: string, busy: boolean): void {
    this.badge.textContent = busy ? `${text} · rendering…` : text;
    this.badge.classList.toggle('busy', busy);
  }

  private positionMarker(): void {
    if (!this.markerPoint) {
      this.marker.hidden = true;
      return;
    }
    const { x, y } = complexToPixel(this.view, this.size, this.markerPoint);
    const visible = x >= 0 && y >= 0 && x <= this.size.width && y <= this.size.height;
    this.marker.hidden = !visible;
    this.marker.style.transform = `translate(${x}px, ${y}px)`;
  }

  private changeView(view: Viewport): void {
    this.view = view;
    this.callbacks.onViewChange({ ...view });
    this.scheduleRender();
  }

  private local(event: PointerEvent | WheelEvent): { x: number; y: number } {
    const rect = this.surface.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private attachInteraction(): void {
    const s = this.surface;
    s.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    s.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    s.addEventListener('pointermove', (e) => this.onPointerMove(e));
    s.addEventListener('pointerup', (e) => this.onPointerUp(e));
    s.addEventListener('pointercancel', (e) => this.endPointer(e));
    s.addEventListener('pointerleave', () => {
      if (this.pointers.size === 0) {
        this.coords.textContent = '';
        this.callbacks.onHover?.(null);
      }
    });
    s.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onWheel(event: WheelEvent): void {
    event.preventDefault();
    const { x, y } = this.local(event);
    const lineScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1;
    // Trackpad pinch arrives as a wheel event with ctrlKey set.
    const sensitivity = event.ctrlKey ? 0.01 : 0.0015;
    const factor = Math.exp(event.deltaY * lineScale * sensitivity);
    this.changeView(zoomAt(this.view, this.size, x, y, factor));
  }

  private onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    this.surface.setPointerCapture(event.pointerId);
    const p = this.local(event);
    this.pointers.set(event.pointerId, p);
    if (this.pointers.size === 1) {
      const box = (this.dragMode === 'box') !== event.shiftKey;
      this.gesture = { startX: p.x, startY: p.y, box, moved: false, multi: false };
    } else if (this.gesture) {
      this.gesture.multi = true;
      this.hideSelection();
    }
  }

  private onPointerMove(event: PointerEvent): void {
    const p = this.local(event);
    const point = pixelToComplex(this.view, this.size, p.x, p.y);
    this.coords.textContent = formatComplex(point, 6);

    const previous = this.pointers.get(event.pointerId);
    if (!previous || !this.gesture) {
      this.callbacks.onHover?.(point);
      return;
    }

    if (this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const before = { mid: midpoint(a, b), dist: distance(a, b) };
      this.pointers.set(event.pointerId, p);
      const [a2, b2] = [...this.pointers.values()];
      const after = { mid: midpoint(a2, b2), dist: distance(a2, b2) };
      let next = pan(this.view, this.size, after.mid.x - before.mid.x, after.mid.y - before.mid.y);
      if (after.dist > 0) next = zoomAt(next, this.size, after.mid.x, after.mid.y, before.dist / after.dist);
      this.changeView(next);
      return;
    }

    this.pointers.set(event.pointerId, p);
    const g = this.gesture;
    if (!g.moved && Math.hypot(p.x - g.startX, p.y - g.startY) > CLICK_SLOP_PX) g.moved = true;
    if (!g.moved) return;
    if (g.box) {
      this.showSelection(g.startX, g.startY, p.x, p.y);
    } else {
      this.changeView(pan(this.view, this.size, p.x - previous.x, p.y - previous.y));
    }
  }

  private onPointerUp(event: PointerEvent): void {
    const g = this.gesture;
    const p = this.local(event);
    if (g && this.pointers.size === 1 && this.pointers.has(event.pointerId)) {
      if (!g.moved && !g.multi) {
        this.callbacks.onClick?.(pixelToComplex(this.view, this.size, p.x, p.y));
      } else if (g.box && !g.multi) {
        const next = zoomToRect(this.view, this.size, g.startX, g.startY, p.x, p.y);
        if (next) this.changeView(next);
      }
    }
    this.endPointer(event);
  }

  private endPointer(event: PointerEvent): void {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size === 0) {
      this.gesture = null;
      this.hideSelection();
    }
  }

  private showSelection(x0: number, y0: number, x1: number, y1: number): void {
    const s = this.selection.style;
    s.display = 'block';
    s.left = `${Math.min(x0, x1)}px`;
    s.top = `${Math.min(y0, y1)}px`;
    s.width = `${Math.abs(x1 - x0)}px`;
    s.height = `${Math.abs(y1 - y0)}px`;
  }

  private hideSelection(): void {
    this.selection.style.display = 'none';
  }
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function formatZoom(zoom: number): string {
  if (zoom < 1000) return zoom.toFixed(zoom < 10 ? 2 : 0);
  return zoom.toExponential(2).replace('e+', 'e');
}
