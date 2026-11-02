import './styles.css';
import { clampIterations, DEFAULT_ITERATIONS, MAX_ITERATIONS, MIN_ITERATIONS, type Complex } from './fractal/core';
import { PALETTES, isPaletteId } from './fractal/palette';
import { DEFAULT_VIEWPORTS } from './fractal/viewport';
import { CpuRenderer } from './render/cpuRenderer';
import { decodeState, defaultState, encodeState, formatComplex, type AppState } from './state/appState';
import {
  addFavourite,
  formatLegacyFavourites,
  loadFavourites,
  parseLegacyFavourites,
  removeFavourite,
  saveFavourites,
  sameComplex,
} from './state/favourites';
import { FractalPanel, type DragMode } from './ui/panel';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const ui = {
  iterationsRange: $<HTMLInputElement>('iterations-range'),
  iterationsInput: $<HTMLInputElement>('iterations-input'),
  palette: $<HTMLSelectElement>('palette'),
  dragPan: $<HTMLButtonElement>('drag-pan'),
  dragBox: $<HTMLButtonElement>('drag-box'),
  reset: $<HTMLButtonElement>('reset'),
  share: $<HTMLButtonElement>('share'),
  favourites: $<HTMLSelectElement>('favourites'),
  addFavourite: $<HTMLButtonElement>('add-favourite'),
  removeFavourite: $<HTMLButtonElement>('remove-favourite'),
  importFavourites: $<HTMLInputElement>('import-favourites'),
  exportFavourites: $<HTMLButtonElement>('export-favourites'),
  saveMandelbrot: $<HTMLButtonElement>('save-mandelbrot'),
  saveJulia: $<HTMLButtonElement>('save-julia'),
  juliaC: $<HTMLSpanElement>('julia-c'),
  liveStatus: $<HTMLButtonElement>('live-status'),
  toast: $<HTMLDivElement>('toast'),
};

let state: AppState = location.hash ? decodeState(location.hash) : defaultState();
let favourites = loadFavourites();
let live = false;
const forceCpu = new URLSearchParams(location.search).get('renderer') === 'cpu';
const cpu = new CpuRenderer();

const mandelbrot = new FractalPanel($('mandelbrot'), {
  kind: 'mandelbrot',
  title: 'Mandelbrot set',
  hueOffset: 0.99,
  view: state.mandelbrot,
  cpu,
  forceCpu,
  callbacks: {
    onViewChange: (view) => {
      state.mandelbrot = view;
      persist();
    },
    onHover: (point) => {
      if (live && point) setJuliaC(point);
    },
    onClick: (point) => {
      live = !live;
      setJuliaC(point);
    },
  },
});

const julia = new FractalPanel($('julia'), {
  kind: 'julia',
  title: 'Julia set',
  hueOffset: 0.49,
  view: state.julia,
  cpu,
  forceCpu,
  callbacks: {
    onViewChange: (view) => {
      state.julia = view;
      persist();
    },
  },
});

// Slider is logarithmic so both 50 and 5000 iterations are easy to reach.
const LOG_MIN = Math.log(10);
const LOG_MAX = Math.log(MAX_ITERATIONS);
const sliderToIterations = (v: number) => Math.round(Math.exp(LOG_MIN + (v / 1000) * (LOG_MAX - LOG_MIN)));
const iterationsToSlider = (n: number) => Math.round(((Math.log(Math.max(n, 10)) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 1000);

function renderAll(): void {
  const inputs = { juliaC: state.juliaC, iterations: state.iterations, palette: state.palette };
  mandelbrot.update(inputs);
  julia.update(inputs);
  mandelbrot.setMarker(state.juliaC);
  syncControls();
}

function syncControls(): void {
  ui.iterationsInput.value = String(state.iterations);
  ui.iterationsRange.value = String(iterationsToSlider(state.iterations));
  ui.palette.value = state.palette;
  ui.juliaC.textContent = formatComplex(state.juliaC);
  ui.liveStatus.textContent = live ? 'Following cursor' : 'Pinned';
  ui.liveStatus.classList.toggle('live', live);
  const selected = favourites.findIndex((f) => sameComplex(f, state.juliaC));
  ui.favourites.value = selected >= 0 ? String(selected) : '';
  ui.removeFavourite.disabled = selected < 0;
}

function setJuliaC(point: Complex): void {
  state.juliaC = { re: point.re, im: point.im };
  renderAll();
  persist();
}

function setIterations(value: number): void {
  state.iterations = clampIterations(value);
  renderAll();
  persist();
}

let persistTimer = 0;
let lastHash = '';
function persist(): void {
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    lastHash = encodeState(state);
    history.replaceState(null, '', `${location.pathname}${location.search}${lastHash}`);
  }, 200);
}

function toast(message: string): void {
  ui.toast.textContent = message;
  ui.toast.classList.add('visible');
  window.setTimeout(() => ui.toast.classList.remove('visible'), 1800);
}

function renderFavourites(): void {
  ui.favourites.replaceChildren(new Option('Favourites…', ''));
  favourites.forEach((f, i) => ui.favourites.add(new Option(formatComplex(f), String(i))));
  syncControls();
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setDragMode(mode: DragMode): void {
  mandelbrot.setDragMode(mode);
  julia.setDragMode(mode);
  ui.dragPan.classList.toggle('active', mode === 'pan');
  ui.dragBox.classList.toggle('active', mode === 'box');
}

function reset(): void {
  state.mandelbrot = { ...DEFAULT_VIEWPORTS.mandelbrot };
  state.julia = { ...DEFAULT_VIEWPORTS.julia };
  state.iterations = DEFAULT_ITERATIONS;
  mandelbrot.setView(state.mandelbrot);
  julia.setView(state.julia);
  renderAll();
  persist();
}

function initControls(): void {
  ui.iterationsInput.min = String(MIN_ITERATIONS);
  ui.iterationsInput.max = String(MAX_ITERATIONS);
  ui.iterationsRange.addEventListener('input', () => setIterations(sliderToIterations(Number(ui.iterationsRange.value))));
  ui.iterationsInput.addEventListener('change', () => setIterations(Number(ui.iterationsInput.value)));

  PALETTES.forEach((p) => ui.palette.add(new Option(p.label, p.id)));
  ui.palette.addEventListener('change', () => {
    if (isPaletteId(ui.palette.value)) state.palette = ui.palette.value;
    renderAll();
    persist();
  });

  ui.dragPan.addEventListener('click', () => setDragMode('pan'));
  ui.dragBox.addEventListener('click', () => setDragMode('box'));
  ui.reset.addEventListener('click', reset);
  ui.liveStatus.addEventListener('click', () => {
    live = !live;
    syncControls();
  });

  ui.share.addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}${encodeState(state)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied to clipboard');
    } catch {
      window.prompt('Copy this link', url);
    }
  });

  ui.favourites.addEventListener('change', () => {
    const favourite = favourites[Number(ui.favourites.value)];
    if (ui.favourites.value !== '' && favourite) {
      live = false;
      setJuliaC(favourite);
    }
  });
  ui.addFavourite.addEventListener('click', () => {
    favourites = addFavourite(favourites, state.juliaC);
    saveFavourites(favourites);
    renderFavourites();
    toast(`Saved ${formatComplex(state.juliaC)}`);
  });
  ui.removeFavourite.addEventListener('click', () => {
    favourites = removeFavourite(favourites, state.juliaC);
    saveFavourites(favourites);
    renderFavourites();
  });
  ui.importFavourites.addEventListener('change', async () => {
    const file = ui.importFavourites.files?.[0];
    if (!file) return;
    const imported = parseLegacyFavourites(await file.text());
    favourites = imported.reduce(addFavourite, favourites);
    saveFavourites(favourites);
    renderFavourites();
    toast(`Imported ${imported.length} favourite${imported.length === 1 ? '' : 's'}`);
    ui.importFavourites.value = '';
  });
  ui.exportFavourites.addEventListener('click', () => {
    download(new Blob([formatLegacyFavourites(favourites)], { type: 'text/plain' }), 'savedFavourites.txt');
  });

  const fixed = (n: number) => n.toFixed(6);
  ui.saveJulia.addEventListener('click', async () => {
    const c = state.juliaC;
    download(await julia.toPng(), `julia_${fixed(c.re)}${c.im < 0 ? '' : '+'}${fixed(c.im)}i.png`);
  });
  ui.saveMandelbrot.addEventListener('click', async () => {
    const v = state.mandelbrot;
    download(await mandelbrot.toPng(), `mandelbrot_${fixed(v.centerRe)}_${fixed(v.centerIm)}_x${(DEFAULT_VIEWPORTS.mandelbrot.span / v.span).toPrecision(3)}.png`);
  });

  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    if (event.key === 'r') reset();
    if (event.key === 'l') {
      live = !live;
      syncControls();
    }
    if (event.key === 'Escape' && live) {
      live = false;
      syncControls();
    }
  });

  window.addEventListener('hashchange', () => {
    if (location.hash === lastHash) return;
    state = decodeState(location.hash);
    mandelbrot.setView(state.mandelbrot);
    julia.setView(state.julia);
    renderAll();
  });
}

initControls();
setDragMode('pan');
renderFavourites();
renderAll();
