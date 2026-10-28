import {initWebGPU} from './shared/webgpu-init.ts';
import {createBodyBuffers, destroyBodyBuffers} from './shared/buffers.ts';
import {DEFAULT_PARAMS, writeParams} from './shared/params.ts';
import {uploadInitialConditions} from './simulation/initial-conditions.ts';
import {createSimulation} from './simulation/simulation.ts';
import {runSanityChecks} from './simulation/sanity-checks.ts';
import {createRenderer} from './renderer/renderer.ts';
import {DEFAULT_FIELD_OF_VIEW} from './renderer/camera.ts';
import {createFpsMeter} from './ui/fps.ts';
import {createParameterSliders, type SliderValues} from './ui/sliders.ts';

const SEED = 1;

const canvas = document.getElementById('gpuCanvas') as HTMLCanvasElement;
const errorBox = document.getElementById('error') as HTMLDivElement;
const controls = document.getElementById('controls') as HTMLDivElement;
const startPauseButton = document.getElementById('startPause') as HTMLButtonElement;
const resetButton = document.getElementById('reset') as HTMLButtonElement;
const fpsBox = document.getElementById('fps') as HTMLDivElement;

try { // without this the page just stays black when WebGPU fails
    const {device, context, format} = await initWebGPU(canvas);

    // http://localhost:5173/?check runs the Simulation sanity checks, results are in the console
    if (new URLSearchParams(location.search).has('check')) {
        const passed = await runSanityChecks(device);
        errorBox.textContent = passed ? 'Sanity checks passed (details in the console)' : 'Sanity checks FAILED (details in the console)';
    }

    // everything is created once, per frame only the command encoder and the texture view are new
    const params: SliderValues = {...DEFAULT_PARAMS, fieldOfView: DEFAULT_FIELD_OF_VIEW}; // current values, changed by the sliders
    let buffers = createBodyBuffers(device, params.N, params);
    uploadInitialConditions(device, buffers, SEED);
    const simulation = createSimulation(device, buffers);
    const renderer = createRenderer(device, format, canvas, buffers);
    const fps = createFpsMeter(fpsBox);

    // same seed, so exactly the same Initial conditions; the buffers are only overwritten
    function reset() {
        uploadInitialConditions(device, buffers, SEED);
    }

    // new N: buffers of the new size (with N in Params), bind groups re-pointed, old buffers freed, then Reset
    function changeN() {
        const oldBuffers = buffers;
        buffers = createBodyBuffers(device, params.N, params);
        simulation.setBuffers(buffers);
        renderer.setBuffers(buffers);
        destroyBodyBuffers(oldBuffers);
        reset();
    }

    createParameterSliders(document.getElementById('sliders') as HTMLDivElement, params, (key) => {
        if (key === 'N') {
            changeN();
        } else if (key === 'fieldOfView') {
            renderer.setFieldOfView(params.fieldOfView); // only the camera, not the Simulation
        } else {
            writeParams(device, buffers.params, params); // only when a value changes, used by the next Step
        }
    });

    let running = false;
    startPauseButton.addEventListener('click', () => {
        running = !running;
        startPauseButton.textContent = running ? 'Pause' : 'Start';
    });
    resetButton.addEventListener('click', reset); // keeps the slider values
    controls.hidden = false;

    function frame(timestamp: number) {
        fps.frame(timestamp);
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
