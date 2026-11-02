import { MAX_ITERATIONS, SMOOTH_BAILOUT } from '../fractal/core';

export const VERTEX_SHADER = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

// Palette maths mirrors fractal/palette.ts; keep both in sync.
export const FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp int;

uniform vec2 uResolution;
uniform vec2 uCenter;
uniform float uUnitsPerPixel;
uniform int uIterations;
uniform int uKind;
uniform vec2 uJuliaC;
uniform int uPalette;
uniform float uHueOffset;

out vec4 outColor;

const int MAX_ITERATIONS = ${MAX_ITERATIONS};
const float BAILOUT_SQUARED = ${(SMOOTH_BAILOUT * SMOOTH_BAILOUT).toFixed(1)};
const float TAU = 6.28318530718;

vec3 hsb(float h, float s, float b) {
  vec3 rgb = clamp(abs(mod(fract(h) * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return b * mix(vec3(1.0), rgb, s);
}

vec3 cosinePalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return clamp(a + b * cos(TAU * (c * t + d)), 0.0, 1.0);
}

vec3 colourFor(float smoothIter) {
  if (uPalette == 0) {
    return hsb(uHueOffset + 1.9 * smoothIter / float(uIterations), 0.9, 0.9);
  }
  if (uPalette == 1) {
    float t = sqrt(max(smoothIter, 0.0)) * 0.12 + uHueOffset;
    return cosinePalette(t, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.0, 0.1, 0.2));
  }
  float t = sqrt(max(smoothIter, 0.0)) * 0.1 + uHueOffset;
  return cosinePalette(t, vec3(0.5), vec3(0.5), vec3(1.0, 0.7, 0.4), vec3(0.0, 0.15, 0.2));
}

void main() {
  vec2 point = uCenter + (gl_FragCoord.xy - 0.5 * uResolution) * uUnitsPerPixel;
  vec2 z = uKind == 0 ? vec2(0.0) : point;
  vec2 c = uKind == 0 ? point : uJuliaC;

  int n = 0;
  bool escaped = false;
  for (int i = 0; i < MAX_ITERATIONS; i++) {
    if (i >= uIterations) break;
    float x2 = z.x * z.x;
    float y2 = z.y * z.y;
    if (x2 + y2 > BAILOUT_SQUARED) {
      escaped = true;
      break;
    }
    z = vec2(x2 - y2 + c.x, 2.0 * z.x * z.y + c.y);
    n++;
  }

  if (!escaped) {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  float smoothIter = float(n) + 1.0 - log2(log(length(z)));
  outColor = vec4(colourFor(smoothIter), 1.0);
}`;
