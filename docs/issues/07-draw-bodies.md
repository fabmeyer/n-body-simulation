# #7 Draw Bodies

**Labels:** renderer · **Milestone:** v1 · **Depends on:** #2, #6

## Goal

Draw every Body as a small round dot that always faces the camera, reading positions directly from the `positions` storage buffer. One instanced draw call for all Bodies.

## Acceptance criteria

- [ ] A render pipeline with a WGSL vertex and fragment shader in `src/renderer/`
- [ ] One instanced draw: 6 vertices (two triangles = one quad) per Body, N instances
- [ ] No vertex buffer: the vertex shader takes the Body's position from `positions` using the instance index, and the quad corner from the vertex index
- [ ] Quads face the camera from any angle (billboards)
- [ ] The fragment shader cuts each quad into a circle
- [ ] Near Bodies correctly cover far ones
- [ ] Exposed to `main.ts` through the interface agreed in #2
- [ ] Verified with the Initial conditions from #3 (or hand-written positions if #3 isn't done yet): N round dots, smaller with distance

## Hints & pitfalls

- **Why not `point-list`?** WebGPU points are always exactly 1 pixel, with no size control. Quads are the standard workaround.
- **Billboarding:** add the quad's corner offset *after* the view transform (in camera space) and *before* the projection. Then the quad is always parallel to the screen. Adding it in world space makes the dots flat and edge-on from some angles.
- The vertex shader can pass the quad-local corner coordinate (e.g. −1…1) to the fragment shader; the fragment shader `discard`s everything outside the unit circle.
- **Depth:** without a depth test, draw order decides what is in front, and dots flicker as Bodies move. Create a depth texture matching the canvas size (and recreate it on resize) and enable depth testing in the pipeline.
- `positions` must be bound as **read-only** storage in the vertex stage; writable storage isn't allowed there.
- A dot radius of ~0.1 (a tenth of the Equilibrium distance) is a good start; make it a constant you can tweak.
- The Renderer should not run any physics. If you're tempted to compute anything about Bodies here other than where to draw them, it belongs in the Simulation.

## Links

- [WebGPU Fundamentals: Storage buffers](https://webgpufundamentals.org/webgpu/lessons/webgpu-storage-buffers.html) (instancing without vertex buffers)
- [WebGPU Fundamentals: Inter-stage variables](https://webgpufundamentals.org/webgpu/lessons/webgpu-inter-stage-variables.html)
- [WebGPU Fundamentals: Orthographic projection](https://webgpufundamentals.org/webgpu/lessons/webgpu-orthographic-projection.html) (explains depth textures and depth testing)
- [WebGPU Fundamentals: Points](https://webgpufundamentals.org/webgpu/lessons/webgpu-points.html) (why point-list is 1 px, and the quad approach)
- [WGSL spec: Built-in values (`vertex_index`, `instance_index`)](https://www.w3.org/TR/WGSL/#builtin-values)
