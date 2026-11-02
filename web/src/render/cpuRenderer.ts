import type { CpuResult, CpuTask } from './cpu.worker';
import type { RenderParams } from './types';

const ROWS_PER_TASK = 8;

interface Job {
  id: number;
  params: RenderParams;
  target: CanvasRenderingContext2D;
  remaining: number;
  onDone: () => void;
}

/**
 * Shared pool of Web Workers rendering in float64 for zoom depths beyond GPU precision.
 * Starting a new job for a canvas abandons that canvas's previous job.
 */
export class CpuRenderer {
  private readonly idle: Worker[] = [];
  private readonly queue: CpuTask[] = [];
  private readonly jobs = new Map<number, Job>();
  private readonly jobByTarget = new Map<CanvasRenderingContext2D, number>();
  private nextId = 1;

  constructor(workerCount = Math.max(2, Math.min(16, navigator.hardwareConcurrency || 4))) {
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(new URL('./cpu.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (event: MessageEvent<CpuResult>) => this.handleResult(worker, event.data);
      this.idle.push(worker);
    }
  }

  render(params: RenderParams, target: CanvasRenderingContext2D, onDone: () => void): void {
    this.cancel(target);
    const id = this.nextId++;
    const tasks: CpuTask[] = [];
    // Interleave bands from the middle outwards so the area of interest appears first.
    const bands: number[] = [];
    for (let row = 0; row < params.height; row += ROWS_PER_TASK) bands.push(row);
    const middle = params.height / 2;
    bands.sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle));
    for (const rowStart of bands) {
      tasks.push({ id, params, rowStart, rowEnd: Math.min(params.height, rowStart + ROWS_PER_TASK) });
    }
    this.jobs.set(id, { id, params, target, remaining: tasks.length, onDone });
    this.jobByTarget.set(target, id);
    this.queue.push(...tasks);
    this.pump();
  }

  cancel(target: CanvasRenderingContext2D): void {
    const previous = this.jobByTarget.get(target);
    if (previous === undefined) return;
    this.jobs.delete(previous);
    this.jobByTarget.delete(target);
    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (this.queue[i].id === previous) this.queue.splice(i, 1);
    }
  }

  private pump(): void {
    while (this.idle.length > 0 && this.queue.length > 0) {
      const worker = this.idle.pop()!;
      worker.postMessage(this.queue.shift()!);
    }
  }

  private handleResult(worker: Worker, result: CpuResult): void {
    this.idle.push(worker);
    const job = this.jobs.get(result.id);
    if (job) {
      const image = new ImageData(result.pixels, job.params.width, result.rowEnd - result.rowStart);
      job.target.putImageData(image, 0, result.rowStart);
      job.remaining--;
      if (job.remaining === 0) {
        this.jobs.delete(job.id);
        this.jobByTarget.delete(job.target);
        job.onDone();
      }
    }
    this.pump();
  }
}
