import {DEFAULT_PARAMS, PARAMS_BUFFER_SIZE, writeParams, type Params} from './params.ts';

export interface BodyBuffers {
    positions: GPUBuffer; // xyz = position, w = mass
    velocities: GPUBuffer;
    params: GPUBuffer;
    n: number;
}

const BODY_STRIDE = 4 * 4; // one vec4f per body

export function createBodyBuffers(device: GPUDevice, n: number, startParams: Params = DEFAULT_PARAMS): BodyBuffers {
    const positions = device.createBuffer({
        size: n * BODY_STRIDE,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });
    const velocities = device.createBuffer({
        size: n * BODY_STRIDE,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });
    const params = device.createBuffer({
        size: PARAMS_BUFFER_SIZE,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    writeParams(device, params, {...startParams, N: n}); // N has to match the buffer size
    return {positions, velocities, params, n};
}
