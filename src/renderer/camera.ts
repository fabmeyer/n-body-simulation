/*
 * fixed perspective camera (issue #6), looking at the origin along the z axis
 * it only moves when N changes: the Initial conditions sphere grows with N, the camera moves back with it
 * the uniform buffer has the same layout as struct Camera in bodies.wgsl:
 *   viewProjection: mat4x4f  (bytes 0-63)
 *   right: vec4f             (bytes 64-79, camera x axis in world space, w unused)
 *   up: vec4f                (bytes 80-95, camera y axis in world space, w unused)
 */
import {lookAt, multiply, perspective, type Vec3} from './mat4.ts';

const DISTANCE_PER_RADIUS = 10 / 3; // distance 10 for the default sphere (radius 3), it fits comfortably
const TARGET: Vec3 = [0, 0, 0];
const UP: Vec3 = [0, 1, 0];
const FOV_Y_DEGREES = 90;
// near and far move with the camera: 0.05 and 200 at distance 10
const NEAR_PER_DISTANCE = 0.005;
const FAR_PER_DISTANCE = 20;

const CAMERA_BUFFER_SIZE = 96;

export interface Camera {
    buffer: GPUBuffer;
    setAspect(aspect: number): void; // call when the canvas size changes, so the picture isn't stretched
    frameSphere(radius: number): void; // move back so a sphere of this radius at the origin fits
}

export function createCamera(device: GPUDevice): Camera {
    const buffer = device.createBuffer({
        size: CAMERA_BUFFER_SIZE,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const data = new Float32Array(CAMERA_BUFFER_SIZE / 4);
    let aspect = 1;
    let distance = 10;

    function write() {
        const view = lookAt([0, 0, distance], TARGET, UP);
        const projection = perspective(FOV_Y_DEGREES, aspect, distance * NEAR_PER_DISTANCE, distance * FAR_PER_DISTANCE);
        data.set(multiply(projection, view), 0); // view first, then projection
        // right and up are the first two rows of the view rotation
        // offsetting a dot along them in world space = offsetting it in camera space after the view
        // transform (the view only rotates and moves, it doesn't scale), so the dots are billboards
        data.set([view[0], view[4], view[8], 0, view[1], view[5], view[9], 0], 16);
        device.queue.writeBuffer(buffer, 0, data);
    }

    return {
        buffer,
        setAspect(newAspect) {
            aspect = newAspect;
            write();
        },
        frameSphere(radius) {
            distance = radius * DISTANCE_PER_RADIUS;
            write();
        },
    };
}
