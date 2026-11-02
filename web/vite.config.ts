import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the build works from any path (e.g. GitHub Pages project sites).
  base: './',
  worker: { format: 'es' },
  test: { environment: 'node' },
});
