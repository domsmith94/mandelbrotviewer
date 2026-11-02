# Fractal Viewer (2014, Java Swing)

The original university project: a Java Swing viewer for the Mandelbrot set and its Julia sets, with drag-to-zoom, a live Julia preview, favourites and PNG export. It is kept unchanged for reference; the maintained version is the web app in [`../web`](../web).

## Run
Requires a JDK (tested with 17).
```bash
cd java
javac -d out *.java
java -cp out Viewer
```
Favourites (`savedFavourites.txt`) and saved PNGs are written to the working directory.

## Files
| File | Purpose |
|---|---|
| `Viewer.java` | Swing window, panels, listeners and rendering |
| `Calculator.java` | Recursive escape-time iteration for Mandelbrot and Julia |
| `Complex.java` | Mutable complex number |
| `IOHandler.java` | Favourites file and PNG export |

## Known issues
These were found in a 2026 review. They are fixed in the web version, not here:
- The smooth-colouring formula is misparenthesised (`ln(log2|z|)` instead of `log2(ln|z|)`), so the colour bands don't blend smoothly.
- Iteration is recursive and `MAXITERATIONS` is never enforced, so very high iteration counts throw `StackOverflowError`.
- A purely horizontal or vertical drag-zoom collapses one axis to zero width.
- A malformed line in `savedFavourites.txt` crashes startup.
- Julia runs one iteration fewer than Mandelbrot.
- Rendering runs on the Swing event thread.
