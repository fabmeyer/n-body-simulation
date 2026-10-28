/*
 * data contract (issue #2): everything the Simulation, the Renderer and main.ts share
 * change it only after talking to everyone
 *
 * buffers (created by createBodyBuffers in buffers.ts, one vec4f per Body):
 *   positions:  array<vec4f>, xyz = position, w = mass
 *   velocities: array<vec4f>, xyz = velocity, w unused
 *   params:     uniform Params {G, K, softening, dt, N}
 *               layout lives in params.wgsl, params.ts is the only TS file that knows the byte offsets
 *               N is u32, the rest f32, buffer size rounded up to 32 bytes
 *
 * N is stored twice: BodyBuffers.n (size of the buffers) and Params.N (read by the shaders)
 * createBodyBuffers sets both, so they always match; when N changes, make new buffers
 *
 * defaults: G = 1, K = 1, softening = 0.05, dt = 0.01, N = 50 (DEFAULT_PARAMS in params.ts)
 *
 * binding numbers are internal to each pipeline (see its .wgsl file), positions is binding 1 in all of them by convention
 *
 * how main.ts uses the two parts:
 *   both are created once from the device and the shared buffers
 *   every frame main.ts makes one command encoder, the Simulation records one Step into it,
 *   the Renderer records one draw, then main.ts submits
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
