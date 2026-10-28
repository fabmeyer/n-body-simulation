/*
 * gets an adapter and a device, configures the canvas and keeps it sharp on resize
 * throws an Error with a readable message if WebGPU can't be used (main.ts shows it)
 */
export interface WebGPUContext {
    device: GPUDevice;
    context: GPUCanvasContext;
    canvas: HTMLCanvasElement;
    format: GPUTextureFormat;
}

export async function initWebGPU(canvas: HTMLCanvasElement): Promise<WebGPUContext> {
    if (!navigator.gpu) {
        throw new Error('WebGPU is not supported in this browser.');
    }

    // resolves to null (doesn't throw) if WebGPU exists but can't be used
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error('No suitable GPU adapter found.');
    }

    const device = await adapter.requestDevice();

    // without these, GPU errors are silent
    device.lost.then((info) => {
        console.error(`WebGPU device was lost: ${info.message}`);
    });
    device.addEventListener('uncapturederror', (event) => {
        console.error('WebGPU error:', event.error.message);
    });

    const context = canvas.getContext('webgpu');
    if (!context) {
        throw new Error('Failed to get a WebGPU canvas context.');
    }

    const format = navigator.gpu.getPreferredCanvasFormat();

    // drawing buffer size = CSS size * devicePixelRatio, otherwise it's blurry
    const configure = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
        canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
        context.configure({device, format, alphaMode: 'opaque'});
    };

    configure();
    new ResizeObserver(configure).observe(canvas);

    return {device, context, canvas, format};
}
