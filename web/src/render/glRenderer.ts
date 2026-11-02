import { PALETTE_INDEX } from '../fractal/palette';
import { FRAGMENT_SHADER, VERTEX_SHADER } from './shaders';
import type { RenderParams } from './types';

const UNIFORMS = [
  'uResolution',
  'uCenter',
  'uUnitsPerPixel',
  'uIterations',
  'uKind',
  'uJuliaC',
  'uPalette',
  'uHueOffset',
] as const;

type UniformName = (typeof UNIFORMS)[number];

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
}

/** Renders a fractal into a canvas with a single full-screen fragment shader pass. */
export class GlRenderer {
  private readonly gl: WebGL2RenderingContext;
  private readonly uniforms: Record<UniformName, WebGLUniformLocation | null>;

  static create(canvas: HTMLCanvasElement): GlRenderer | null {
    const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false });
    if (!gl) return null;
    try {
      return new GlRenderer(gl);
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  private constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    const program = gl.createProgram();
    if (!program) throw new Error('Unable to create program');
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Program link failed: ${gl.getProgramInfoLog(program)}`);
    }
    gl.useProgram(program);

    // One oversized triangle covers the whole viewport.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.uniforms = Object.fromEntries(UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)])) as Record<
      UniformName,
      WebGLUniformLocation | null
    >;
  }

  render(params: RenderParams): void {
    const { gl, uniforms: u } = this;
    gl.viewport(0, 0, params.width, params.height);
    gl.uniform2f(u.uResolution, params.width, params.height);
    gl.uniform2f(u.uCenter, params.view.centerRe, params.view.centerIm);
    gl.uniform1f(u.uUnitsPerPixel, params.view.span / params.height);
    gl.uniform1i(u.uIterations, params.iterations);
    gl.uniform1i(u.uKind, params.kind === 'mandelbrot' ? 0 : 1);
    gl.uniform2f(u.uJuliaC, params.juliaC.re, params.juliaC.im);
    gl.uniform1i(u.uPalette, PALETTE_INDEX[params.palette]);
    gl.uniform1f(u.uHueOffset, params.hueOffset);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  get contextLost(): boolean {
    return this.gl.isContextLost();
  }
}
