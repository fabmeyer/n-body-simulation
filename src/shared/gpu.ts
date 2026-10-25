/**
 * WebGPU setup shared by the whole app: adapter -> device -> canvas context.
 *
 * Every failure on the way is thrown as a `GpuInitError` with a message that
 * can be shown to the user as is, so the page never ends up silently black.
 */

export class GpuInitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GpuInitError';
  }
}

export interface Gpu {
  device: GPUDevice;
  context: GPUCanvasContext;
  canvas: HTMLCanvasElement;
  format: GPUTextureFormat;
}

export interface InitGpuOptions {
  /** Called when the device is lost for any reason other than our own `destroy()`. */
  onDeviceLost?: (message: string) => void;
}

export async function initGpu(canvas: HTMLCanvasElement, options: InitGpuOptions = {}): Promise<Gpu> {
  // Case 1: the browser has no WebGPU at all.
  if (!navigator.gpu) {
    // WebGPU is only exposed on secure pages (https or localhost), so opening
    // the dev server through a LAN IP hides it even in a capable browser.
    if (!window.isSecureContext) {
      throw new GpuInitError(
        'WebGPU only works on secure pages. Open the app via http://localhost or https.',
      );
    }
    throw new GpuInitError(
      'This browser does not support WebGPU. Please use a recent version of Chrome or Edge.',
    );
  }

  // Case 2: WebGPU exists but is unusable here. requestAdapter() resolves to
  // null in that case instead of throwing.
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new GpuInitError(
      'WebGPU is available, but no suitable GPU adapter was found. ' +
        'The GPU may be disabled or blocklisted in this browser.',
    );
  }

  // Case 3: the adapter exists but refuses to give us a device.
  let device: GPUDevice;
  try {
    device = await adapter.requestDevice();
  } catch (err) {
    throw new GpuInitError(`Could not create a WebGPU device: ${errorMessage(err)}`);
  }

  device.lost.then((info) => {
    console.error(`WebGPU device was lost (${info.reason}): ${info.message}`);
    if (info.reason !== 'destroyed') {
      options.onDeviceLost?.(`The GPU device was lost: ${info.message || 'unknown reason'}. Reload the page.`);
    }
  });

  // Validation and out-of-memory errors that no error scope caught end up here.
  // Without this listener they are easy to miss.
  device.addEventListener('uncapturederror', (event) => {
    console.error('Uncaptured WebGPU error:', event.error.message);
  });

  const context = canvas.getContext('webgpu');
  if (!context) {
    throw new GpuInitError('Could not get a WebGPU context for the canvas.');
  }

  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: 'opaque' });

  keepCanvasSizeInSync(canvas, device.limits.maxTextureDimension2D);

  return { device, context, canvas, format };
}

/**
 * The canvas has two sizes: its CSS size (how big it looks) and its drawing
 * buffer size (`width`/`height`, how many pixels we render). The drawing buffer
 * must be the CSS size times `devicePixelRatio`, or the image is blurry on
 * high-DPI screens. The new size takes effect at the next getCurrentTexture().
 */
function keepCanvasSizeInSync(canvas: HTMLCanvasElement, maxSize: number): void {
  const apply = (width: number, height: number) => {
    canvas.width = clamp(Math.round(width), 1, maxSize);
    canvas.height = clamp(Math.round(height), 1, maxSize);
  };

  // Set a size right away so the very first frame is already sharp.
  const dpr = window.devicePixelRatio || 1;
  apply(canvas.clientWidth * dpr, canvas.clientHeight * dpr);

  const observer = new ResizeObserver(([entry]) => {
    // devicePixelContentBoxSize gives exact device pixels where supported
    // (Chrome); otherwise fall back to CSS size x devicePixelRatio.
    const exact = entry.devicePixelContentBoxSize?.[0];
    if (exact) {
      apply(exact.inlineSize, exact.blockSize);
    } else {
      const css = entry.contentBoxSize[0];
      const ratio = window.devicePixelRatio || 1;
      apply(css.inlineSize * ratio, css.blockSize * ratio);
    }
  });

  try {
    observer.observe(canvas, { box: 'device-pixel-content-box' });
  } catch {
    // Browsers without device-pixel-content-box support throw here.
    observer.observe(canvas, { box: 'content-box' });
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
