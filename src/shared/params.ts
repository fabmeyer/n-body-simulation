import {makeShaderDataDefinitions, makeStructuredView} from 'webgpu-utils';
import paramsWgsl from './params.wgsl?raw';

export interface Params {
    G: number;
    K: number;
    softening: number;
    dt: number;
    N: number;
}

export const DEFAULT_PARAMS: Params = {G: 1, K: 1, softening: 0.05, dt: 0.01, N: 50};

const defs = makeShaderDataDefinitions(paramsWgsl);
export const paramsView = makeStructuredView(defs.structs.Params);

// uniform buffer size has to be a multiple of 16 (20 -> 32 bytes)
export const PARAMS_BUFFER_SIZE = Math.ceil(paramsView.arrayBuffer.byteLength / 16) * 16;

// N should always be buffers.n
export function writeParams(device: GPUDevice, buffer: GPUBuffer, params: Params): void {
    paramsView.set(params);
    device.queue.writeBuffer(buffer, 0, paramsView.arrayBuffer);
}
