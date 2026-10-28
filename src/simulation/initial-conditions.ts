import type {BodyBuffers} from '../shared/buffers.ts';
import {initialRadius} from '../shared/initial-radius.ts';

// mulberry32 seeded random (from stackoverflow), Math.random can't be seeded
function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), a | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function tooClose(positions: Float32Array, count: number, x: number, y: number, z: number, minDistance: number): boolean {
    for (let j = 0; j < count; j++) {
        if (Math.hypot(positions[j * 4] - x, positions[j * 4 + 1] - y, positions[j * 4 + 2] - z) < minDistance) return true;
    }
    return false;
}

// Bodies that start almost on top of each other get a huge Repulsion kick and fly off
// (seed 7 with N = 50: one Body leaves at speed ~73), so a new Body has to keep this distance
// from the ones already placed. The sphere grows with N (initialRadius), so the mean spacing
// and this distance are the same for every N.
// this is a small change to "uniform in the sphere": it only removes points that are very close together
// note: the check is O(N²) on the CPU, fine up to a few thousand Bodies
const MIN_DISTANCE = 0.3;

export function generateInitialConditions(n: number, seed: number): {positions: Float32Array, velocities: Float32Array} {
    const positions = new Float32Array(n * 4);
    const velocities = new Float32Array(n * 4); // all zero = at rest
    const rand = mulberry32(seed);
    const radius = initialRadius(n);
    for (let i = 0; i < n; i++) {
        let x: number, y: number, z: number;
        // random point in the unit sphere (rejection sampling), try again if it's outside or too close
        do {
            x = rand() * 2 - 1; y = rand() * 2 - 1; z = rand() * 2 - 1;
        } while (x * x + y * y + z * z > 1 || tooClose(positions, i, x * radius, y * radius, z * radius, MIN_DISTANCE));
        const base = i * 4;
        positions[base] = x * radius;
        positions[base + 1] = y * radius;
        positions[base + 2] = z * radius;
        positions[base + 3] = 1; // mass
    }
    return {positions, velocities};
}

export function uploadInitialConditions(device: GPUDevice, buffers: BodyBuffers, seed: number): void {
    const {positions, velocities} = generateInitialConditions(buffers.n, seed);
    device.queue.writeBuffer(buffers.positions, 0, positions);
    device.queue.writeBuffer(buffers.velocities, 0, velocities);
}
