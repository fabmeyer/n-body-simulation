/*
 * shared data for issue #2
 *
 * positions:  vec4f per body, xyz = position, w = mass
 * velocities: vec4f per body
 * params:     G, K, softening, dt, N (params.wgsl / params.ts)
 */
import type {BodyBuffers} from './buffers.ts';

export interface Simulation {
    recordStep(encoder: GPUCommandEncoder): void;
}

export interface Renderer {
    recordDraw(encoder: GPUCommandEncoder, target: GPUTextureView): void;
}

export type CreateSimulation = (device: GPUDevice, buffers: BodyBuffers) => Simulation;
export type CreateRenderer = (device: GPUDevice, format: GPUTextureFormat, canvas: HTMLCanvasElement, buffers: BodyBuffers) => Renderer;
