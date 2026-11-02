import { renderRows } from './cpuKernel';
import type { RenderParams } from './types';

export interface CpuTask {
  id: number;
  params: RenderParams;
  rowStart: number;
  rowEnd: number;
}

export interface CpuResult {
  id: number;
  rowStart: number;
  rowEnd: number;
  pixels: Uint8ClampedArray;
}

self.onmessage = (event: MessageEvent<CpuTask>) => {
  const { id, params, rowStart, rowEnd } = event.data;
  const pixels = renderRows(params, rowStart, rowEnd);
  const result: CpuResult = { id, rowStart, rowEnd, pixels };
  (self as unknown as Worker).postMessage(result, [pixels.buffer]);
};
