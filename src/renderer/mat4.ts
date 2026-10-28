/*
 * small 4x4 matrix helper (issue #6), no matrix library
 * column-major like WGSL mat4x4f: element (row r, column c) is at index c * 4 + r
 */
export type Mat4 = Float32Array;
export type Vec3 = [number, number, number];

function subtract(a: Vec3, b: Vec3): Vec3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a: Vec3, b: Vec3): Vec3 {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function dot(a: Vec3, b: Vec3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function normalize(a: Vec3): Vec3 {
    const len = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / len, a[1] / len, a[2] / len];
}

// WebGPU clip space depth is 0..1 (OpenGL is -1..1): near plane -> 0, far plane -> 1
export function perspective(fovYDegrees: number, aspect: number, near: number, far: number): Mat4 {
    const f = 1 / Math.tan((fovYDegrees * Math.PI / 180) / 2);
    const rangeInv = 1 / (near - far);
    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, far * rangeInv, -1,
        0, 0, near * far * rangeInv, 0,
    ]);
}

// view matrix: moves the world so the camera sits at the origin and looks along -z
export function lookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
    const zAxis = normalize(subtract(eye, target)); // from the target back to the eye
    const xAxis = normalize(cross(up, zAxis)); // camera right
    const yAxis = cross(zAxis, xAxis); // camera up
    return new Float32Array([
        xAxis[0], yAxis[0], zAxis[0], 0,
        xAxis[1], yAxis[1], zAxis[1], 0,
        xAxis[2], yAxis[2], zAxis[2], 0,
        -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1,
    ]);
}

// a * b: b is applied to the position first, then a
export function multiply(a: Mat4, b: Mat4): Mat4 {
    const out = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
        for (let r = 0; r < 4; r++) {
            let sum = 0;
            for (let k = 0; k < 4; k++) sum += a[k * 4 + r] * b[c * 4 + k];
            out[c * 4 + r] = sum;
        }
    }
    return out;
}
