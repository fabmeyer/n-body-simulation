import {DEFAULT_PARAMS} from './params.ts';

// the Initial conditions fill a sphere of this radius: 3 for the default N, growing with ∛N
// so the density, and the spacing between Bodies, is the same for every N
// (more Bodies in the same sphere would start deep inside the Repulsion range and blow apart)
// shared because the Simulation fills this sphere and the Renderer points the camera at it
const DEFAULT_RADIUS = 3;

export function initialRadius(n: number): number {
    return DEFAULT_RADIUS * Math.cbrt(n / DEFAULT_PARAMS.N);
}
