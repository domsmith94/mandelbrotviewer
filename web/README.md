# Fractal Explorer v2 (web)

A TypeScript + WebGL2 port of the 2014 Java Swing Fractal Viewer in the repository root. It renders the Mandelbrot and Julia sets on the GPU in real time and runs in any modern browser, including Safari on macOS.

## Features
- Mandelbrot and Julia sets side by side, rendered by a GPU fragment shader at 60 fps and at full Retina resolution.
- Scroll or pinch to zoom, drag to pan, Shift+drag (or "Box zoom" mode) to zoom to a selection. Touch pinch works too.
- Click the Mandelbrot set to pick a Julia constant and follow the cursor; click again to pin it. A marker shows the current constant.
- **Deep zoom:** beyond float32 precision (about 2e-6 units per pixel) rendering switches automatically to float64 on a pool of Web Workers, down to about 1e-13.
- **Shareable links:** the full view (both viewports, Julia constant, iterations, palette) is kept in the URL hash. Use "Copy link".
- Favourites are stored in the browser and can be imported/exported in the original `savedFavourites.txt` format.
- PNG export of either panel, and three palettes including the original "Classic (2014)" colour scheme.

## Fixes over the Java version
| 2014 issue | v2 |
|---|---|
| Smooth-colouring formula misparenthesised (`ln(log2\|z\|)`), escape radius 2 → banding | `log2(ln\|z\|)` with escape radius 256; continuity is checked in tests |
| Recursive iteration, `MAXITERATIONS` never enforced → StackOverflowError | Iterative loop, input clamped to 1–10,000 |
| Zero-width drag-zoom collapsed the axis | Selections thinner than 4 px are ignored; zoom keeps the aspect ratio |
| A malformed favourites line crashed startup | Malformed lines are skipped |
| Julia ran N-1 iterations (counter started at 1) | Same iteration semantics for both sets |
| Rendering on the UI thread, whole frame repainted on every drag event | GPU rendering; CPU fallback runs in workers; only the panel that changed is redrawn |

## Development
```bash
cd web
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests, including parity with the Java Calculator
npm run lint
npm run build      # static site in dist/
```
Add `?renderer=cpu` to the URL to force the float64 CPU renderer, for example to compare it with the GPU output.

### Parity with the original
`src/fractal/__fixtures__/java-golden.json` holds iteration counts and colours produced by the original `Calculator.java` and `java.awt.Color`. `npm run golden` regenerates it (requires a JDK), and `core.test.ts` checks the TypeScript port against it. CI regenerates the fixture and fails if it drifts from the Java code.

## Deployment
`.github/workflows/web-deploy.yml` publishes `dist/` to GitHub Pages on pushes to `master`. Enable it under **Settings → Pages → Source: GitHub Actions**.
