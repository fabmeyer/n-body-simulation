/*
 * sanity checks from issues #4 and #5, run on the GPU with the real shaders
 * open the page with ?check (http://localhost:5173/?check) and look at the console
 */
import {createBodyBuffers, destroyBodyBuffers, type BodyBuffers} from '../shared/buffers.ts';
import {createSimulation} from './simulation.ts';
import {SPHERE_RADIUS, uploadInitialConditions} from './initial-conditions.ts';
import {readBuffer, readMapped} from './readback.ts';

const BODY_BYTES = 4 * 4;

interface CheckResult {
    check: string;
    result: string;
    pass: boolean;
}

function length(data: Float32Array, base: number): number {
    return Math.hypot(data[base], data[base + 1], data[base + 2]);
}

function writeTwoBodies(device: GPUDevice, buffers: BodyBuffers): void {
    // 2 Bodies at distance 3 on the x axis, mass 1, at rest (velocities start as zeros)
    device.queue.writeBuffer(buffers.positions, 0, new Float32Array([-1.5, 0, 0, 1, 1.5, 0, 0, 1]));
}

// #4: after one Step the two velocities point towards each other and are equal in size
async function checkOneStep(device: GPUDevice): Promise<CheckResult> {
    const buffers = createBodyBuffers(device, 2);
    writeTwoBodies(device, buffers);
    const simulation = createSimulation(device, buffers);

    const encoder = device.createCommandEncoder();
    simulation.recordStep(encoder);
    device.queue.submit([encoder.finish()]);
    const v = await readBuffer(device, buffers.velocities);

    const towardsEachOther = v[0] > 0 && v[4] < 0; // left Body moves right, right Body moves left
    const equalSize = Math.abs(length(v, 0) - length(v, 4)) < 1e-6 * length(v, 0);
    const onAxis = v[1] === 0 && v[2] === 0 && v[5] === 0 && v[6] === 0;
    destroyBodyBuffers(buffers);
    return {
        check: '#4: 2 Bodies, 1 Step',
        result: `v0 = ${v[0].toExponential(3)}, v1 = ${v[4].toExponential(3)}`,
        pass: towardsEachOther && equalSize && onAxis,
    };
}

// #5: 2 Bodies fall together, bounce at ~0.65 and swing back to ~3, again and again
async function checkTwoBodySwing(device: GPUDevice): Promise<CheckResult> {
    const steps = 3000; // one full swing is ~900 Steps with the default Parameters
    const buffers = createBodyBuffers(device, 2);
    writeTwoBodies(device, buffers);
    const simulation = createSimulation(device, buffers);

    // copy both positions after every Step into one big buffer, so there is only one readback
    const stepBytes = 2 * BODY_BYTES;
    const staging = device.createBuffer({size: steps * stepBytes, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ});
    const encoder = device.createCommandEncoder();
    for (let k = 0; k < steps; k++) {
        simulation.recordStep(encoder);
        encoder.copyBufferToBuffer(buffers.positions, 0, staging, k * stepBytes, stepBytes);
    }
    device.queue.submit([encoder.finish()]);
    const p = await readMapped(staging);

    // turning points of the distance: closest and farthest of each swing
    const distances = Array.from({length: steps}, (_, k) => p[k * 8 + 4] - p[k * 8]);
    const minima: number[] = [];
    const maxima: number[] = [];
    for (let k = 1; k < steps - 1; k++) {
        if (distances[k] < distances[k - 1] && distances[k] <= distances[k + 1]) minima.push(distances[k]);
        if (distances[k] > distances[k - 1] && distances[k] >= distances[k + 1]) maxima.push(distances[k]);
    }
    const fmt = (values: number[]) => values.map((d) => d.toFixed(3)).join(', ');

    staging.destroy();
    destroyBodyBuffers(buffers);
    return {
        check: `#5: 2 Bodies, ${steps} Steps`,
        result: `closest: ${fmt(minima)} | farthest: ${fmt(maxima)}`,
        pass: minima.length >= 2 && maxima.length >= 2
            && minima.every((d) => Math.abs(d - 0.65) < 0.05)
            && maxima.every((d) => Math.abs(d - 3) < 0.05),
    };
}

// #5: 50 Bodies from the Initial conditions don't fly off to infinity in the first few hundred Steps
async function checkFiftyBodies(device: GPUDevice, seed: number): Promise<CheckResult> {
    const steps = 500;
    const n = 50;
    const buffers = createBodyBuffers(device, n);
    uploadInitialConditions(device, buffers, seed);
    const simulation = createSimulation(device, buffers);

    const start = await readBuffer(device, buffers.positions);
    const encoder = device.createCommandEncoder();
    for (let k = 0; k < steps; k++) simulation.recordStep(encoder);
    device.queue.submit([encoder.finish()]);
    const p = await readBuffer(device, buffers.positions);

    const maxRadius = (data: Float32Array) => Math.max(...Array.from({length: n}, (_, i) => length(data, i * 4)));
    const masses = Array.from({length: n}, (_, i) => p[i * 4 + 3]);
    const finite = p.every(Number.isFinite);
    destroyBodyBuffers(buffers);
    return {
        check: `#5: ${n} Bodies, seed ${seed}, ${steps} Steps`,
        result: `farthest Body from the centre: ${maxRadius(start).toFixed(2)} -> ${maxRadius(p).toFixed(2)}`,
        // "not to infinity": no NaN/Infinity and everything still within 10x the starting sphere
        pass: finite && maxRadius(p) < 10 * SPHERE_RADIUS && masses.every((m) => m === 1),
    };
}

export async function runSanityChecks(device: GPUDevice): Promise<boolean> {
    const results = [
        await checkOneStep(device),
        await checkTwoBodySwing(device),
        ...await Promise.all([1, 7, 42, 99, 1234].map((seed) => checkFiftyBodies(device, seed))),
    ];
    console.table(results);
    const allPass = results.every((r) => r.pass);
    console.log(allPass ? 'sanity checks: all passed' : 'sanity checks: FAILED, see table above');
    return allPass;
}
