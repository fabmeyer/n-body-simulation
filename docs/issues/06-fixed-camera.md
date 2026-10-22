# #6 Fixed camera

**Labels:** renderer · **Milestone:** v1 · **Depends on:** #1

## Goal

A fixed perspective camera looking at the origin from a distance, as a view-projection matrix in a uniform buffer. Write your own small matrix helper; no matrix library.

## Acceptance criteria

- [ ] A small mat4 helper in `src/renderer/` with at least: perspective projection, look-at (view), and multiplication
- [ ] Camera positioned so the whole sphere of Initial conditions (radius 3) is comfortably in view, for example at distance ~10 on one axis, looking at the origin
- [ ] The combined view-projection matrix is written to a uniform buffer
- [ ] The aspect ratio follows the canvas; resizing the window doesn't stretch the picture
- [ ] Verified with a hard-coded test triangle (or a few points) around the origin: centred, correctly proportioned, and smaller when the camera moves further away

## Hints & pitfalls

- **WebGPU clip space depth is 0…1, not −1…1 like OpenGL.** A perspective matrix copied from an OpenGL tutorial will clip or distort depth. WebGPU Fundamentals derives the right one.
- **Matrices are column-major** in WGSL (`mat4x4f`), and a `Float32Array` uploaded to the GPU is interpreted column by column. If the picture is mirrored or skewed, a transposed matrix is the most likely cause.
- Multiplication order matters: think through which matrix is applied to the position first.
- Near and far planes: near too close to 0 destroys depth precision; with the camera at distance ~10, something like 0.1 and 100 is fine.
- The field of view is usually given in degrees by humans and needed in radians by the math.
- Recompute the projection when the canvas size changes (#1 already handles the canvas resize).

## Links

- [WebGPU Fundamentals: Matrix math](https://webgpufundamentals.org/webgpu/lessons/webgpu-matrix-math.html)
- [WebGPU Fundamentals: Perspective projection](https://webgpufundamentals.org/webgpu/lessons/webgpu-perspective-projection.html)
- [WebGPU Fundamentals: Cameras](https://webgpufundamentals.org/webgpu/lessons/webgpu-cameras.html)
- [WebGPU Fundamentals: Uniforms](https://webgpufundamentals.org/webgpu/lessons/webgpu-uniforms.html)
