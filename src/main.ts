import {initWebGPU} from './shared/webgpu-init.ts';
import {createBodyBuffers} from './shared/buffers.ts';
import {DEFAULT_PARAMS} from './shared/params.ts';
import {uploadInitialConditions} from './simulation/initial-conditions.ts';
import {createSimulation} from './simulation/simulation.ts';
import {runSanityChecks} from './simulation/sanity-checks.ts';
import {createRenderer} from './renderer/renderer.ts';

const SEED = 1;

const canvas = document.getElementById('gpuCanvas') as HTMLCanvasElement;
const errorBox = document.getElementById('error') as HTMLDivElement;
const startPauseButton = document.getElementById('startPause') as HTMLButtonElement;

try { // without this the page just stays black when WebGPU fails
    const {device, context, format} = await initWebGPU(canvas);

    // http://localhost:5173/?check runs the Simulation sanity checks, results are in the console
    if (new URLSearchParams(location.search).has('check')) {
        const passed = await runSanityChecks(device);
        errorBox.textContent = passed ? 'Sanity checks passed (details in the console)' : 'Sanity checks FAILED (details in the console)';
    }

    // everything is created once, per frame only the command encoder and the texture view are new
    const buffers = createBodyBuffers(device, DEFAULT_PARAMS.N);
    uploadInitialConditions(device, buffers, SEED);
    const simulation = createSimulation(device, buffers);
    const renderer = createRenderer(device, format, canvas, buffers);

    let running = false;
    startPauseButton.hidden = false;
    startPauseButton.addEventListener('click', () => {
        running = !running;
        startPauseButton.textContent = running ? 'Pause' : 'Start';
    });

    function frame() {
        const encoder = device.createCommandEncoder();
        if (running) {
            simulation.recordStep(encoder); // exactly 1 Step per frame
        }
        // paused: no Step, but still draw so the current state stays visible
        renderer.recordDraw(encoder, context.getCurrentTexture().createView());
        device.queue.submit([encoder.finish()]);
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
} catch (err) {
    errorBox.textContent = (err as Error).message;
}
