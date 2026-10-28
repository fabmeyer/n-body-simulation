/*
 * fixed perspective camera (issue #6), looking at the origin from distance 10 on the z axis
 * the field of view can change (zoom)
 * the uniform buffer has the same layout as struct Camera in bodies.wgsl:
 *   viewProjection: mat4x4f  (bytes 0-63)
 *   right: vec4f             (bytes 64-79, camera x axis in world space, w unused)
 *   up: vec4f                (bytes 80-95, camera y axis in world space, w unused)
 */
import {lookAt, multiply, perspective, type Vec3} from './mat4.ts';

const EYE: Vec3 = [0, 0, 10]; // the Initial conditions sphere (radius 3) fits comfortably
const TARGET: Vec3 = [0, 0, 0];
const UP: Vec3 = [0, 1, 0];
// vertical field of view: smaller = zoomed in, larger = zoomed out (wide angle)
export const DEFAULT_FIELD_OF_VIEW = 90;
const NEAR = 0.05;
const FAR = 200;

const CAMERA_BUFFER_SIZE = 96;

export interface Camera {
    buffer: GPUBuffer;
    setAspect(aspect: number): void; // call when the canvas size changes, so the picture isn't stretched
    setFieldOfView(degrees: number): void; // zoom
}

export function createCamera(device: GPUDevice): Camera {
    const buffer = device.createBuffer({
        size: CAMERA_BUFFER_SIZE,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const data = new Float32Array(CAMERA_BUFFER_SIZE / 4);
    let aspect = 1;
    let fieldOfView = DEFAULT_FIELD_OF_VIEW;

    function write() {
        const view = lookAt(EYE, TARGET, UP);
        const projection = perspective(fieldOfView, aspect, NEAR, FAR);
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
        setFieldOfView(degrees) {
            fieldOfView = degrees;
            write();
        },
    };
}
