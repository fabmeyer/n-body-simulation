import { GpuInitError, errorMessage, initGpu } from './shared/gpu.ts';

/** Background colour of the canvas (dark blue), easy to recognise. */
const CLEAR_COLOR: GPUColor = { r: 0.04, g: 0.06, b: 0.16, a: 1 };

const canvas = document.querySelector<HTMLCanvasElement>('#gpu-canvas')!;
const errorBox = document.querySelector<HTMLDivElement>('#error')!;

function showError(message: string): void {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

async function main(): Promise<void> {
  const { device, context } = await initGpu(canvas, { onDeviceLost: showError });

  // Placeholder loop: only clears the screen. The real frame loop is #8.
  const frame = () => {
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          // The canvas texture changes every frame, so it is fetched each time.
          view: context.getCurrentTexture().createView(),
          clearValue: CLEAR_COLOR,
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });
    pass.end();
    device.queue.submit([encoder.finish()]);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

main().catch((err: unknown) => {
  console.error(err);
  showError(err instanceof GpuInitError ? err.message : `Something went wrong: ${errorMessage(err)}`);
});
