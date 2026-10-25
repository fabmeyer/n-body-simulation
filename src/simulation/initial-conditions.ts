import type {BodyBuffers} from '../shared/buffers.ts';

export const SPHERE_RADIUS = 3;

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

export function generateInitialConditions(n: number, seed: number): {positions: Float32Array, velocities: Float32Array} {
    const positions = new Float32Array(n * 4);
    const velocities = new Float32Array(n * 4); // all zero = at rest
    const rand = mulberry32(seed);
    // bodies that start too close push each other away and fly off
    const minDistance = 0.3 * Math.cbrt(50 / n);
    for (let i = 0; i < n; i++) {
        let x: number, y: number, z: number;
        // random point in the unit sphere, try again if it's outside or too close
        do {
            x = rand() * 2 - 1; y = rand() * 2 - 1; z = rand() * 2 - 1;
        } while (x * x + y * y + z * z > 1 || tooClose(positions, i, x * SPHERE_RADIUS, y * SPHERE_RADIUS, z * SPHERE_RADIUS, minDistance));
        const vI = i * 4;
        positions[vI] = x * SPHERE_RADIUS;
        positions[vI + 1] = y * SPHERE_RADIUS;
        positions[vI + 2] = z * SPHERE_RADIUS;
        positions[vI + 3] = 1; // mass
    }
    return {positions, velocities};
}

export function uploadInitialConditions(device: GPUDevice, buffers: BodyBuffers, seed: number): void {
    const {positions, velocities} = generateInitialConditions(buffers.n, seed);
    device.queue.writeBuffer(buffers.positions, 0, positions);
    device.queue.writeBuffer(buffers.velocities, 0, velocities);
}
