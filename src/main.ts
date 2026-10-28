import {initWebGPU} from './shared/webgpu-init.ts';
import {runSanityChecks} from './simulation/sanity-checks.ts';

const canvas = document.getElementById('gpuCanvas') as HTMLCanvasElement;
const errorBox = document.getElementById('error') as HTMLDivElement;

try { // without this the page just stays black when WebGPU fails
    const {device, context} = await initWebGPU(canvas);

    // http://localhost:5173/?check runs the Simulation sanity checks, results are in the console
    if (new URLSearchParams(location.search).has('check')) {
        const passed = await runSanityChecks(device);
        errorBox.textContent = passed ? 'Sanity checks passed (details in the console)' : 'Sanity checks FAILED (details in the console)';
    }

    function frame() {
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view: context.getCurrentTexture().createView(),
                    clearValue: {r: 0.1, g: 0.2, b: 0.5, a: 1}, // blue so I can see it works
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        });
        pass.end();
        device.queue.submit([encoder.finish()]);
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
} catch (err) {
    errorBox.textContent = (err as Error).message;
}
