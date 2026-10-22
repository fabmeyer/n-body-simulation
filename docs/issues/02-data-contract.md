# #2 Data contract

**Labels:** setup · **Milestone:** v1 · **Depends on:** #1 · **Done by:** all three together

## Goal

Agree on, and write down in code, everything that the Simulation, the Renderer and `main.ts` share. After this issue, the three tracks can work in parallel without stepping on each other.

## The contract

- **`positions`**: a storage buffer of `array<vec4f>`, one entry per Body. xyz = position, w = mass.
- **`velocities`**: a storage buffer of `array<vec4f>`, one entry per Body. xyz = velocity, w unused.
- **`Params`**: one uniform buffer with named fields: G, K, Softening (ε), `dt`, and N.
- **Default Parameters**: G = 1, K = 1, ε = 0.05, `dt` = 0.01, N = 50.
- **How `main.ts` talks to the two parts**: agree in prose (then in TS types) on what the Simulation and the Renderer each expose. For example: each one is created once from the device and the shared buffers, and each one can *record its work into a command encoder* that `main.ts` owns. Then the frame loop (#8) can be built against that shape before the real implementations exist.

## Acceptance criteria

- [ ] `src/shared/params.ts` defines the Parameters layout and default values; it is the only place on the TS side that knows byte offsets
- [ ] A matching WGSL `struct` exists, with the same fields in the same order, and a comment pointing to `params.ts` (and vice versa)
- [ ] A helper creates the `positions`, `velocities` and `Params` buffers for a given N, with the usage flags each one needs
- [ ] The agreed interface for Simulation and Renderer exists as TS types (no implementation yet)
- [ ] The contract is summarised in a comment or short README in `src/shared/` so nobody has to reverse-engineer it

## Hints & pitfalls

- **Use `vec4f`, not `vec3f`, in arrays.** In WGSL storage arrays, a `vec3f` is aligned and strided to 16 bytes anyway. With `vec3f` on the GPU and tightly packed floats on the CPU, every Body after the first is read from the wrong place, with no error.
- **Uniform buffer sizes.** Round the `Params` buffer size up to a multiple of 16 bytes. Read the memory-layout article below before you decide the field order.
- **Mixing `f32` and `u32` in one buffer.** N is an integer, the rest are floats. On the CPU side you can have two typed-array views (`Float32Array` and `Uint32Array`) over the same `ArrayBuffer`. Writing N through a `Float32Array` silently gives the shader garbage.
- **Usage flags** decide what a buffer may be used for, and they can't be changed later. Think through each buffer: is it written from the CPU? Read by a compute shader? Read in a vertex shader?
- **Vertex shaders can only *read* storage buffers.** The Renderer must bind `positions` as read-only storage, while the force pass writes `velocities`. That's fine, but it means the bind group layouts differ per pipeline.
- Keep the contract small. Every field you add is a field three people have to keep in sync.

## Links

- [WebGPU Fundamentals: Memory layout](https://webgpufundamentals.org/webgpu/lessons/webgpu-memory-layout.html) (read this one carefully)
- [WebGPU Fundamentals: Uniforms](https://webgpufundamentals.org/webgpu/lessons/webgpu-uniforms.html)
- [WebGPU Fundamentals: Storage buffers](https://webgpufundamentals.org/webgpu/lessons/webgpu-storage-buffers.html)
- [WGSL spec: Memory layouts](https://www.w3.org/TR/WGSL/#memory-layouts)
- [MDN: `GPUDevice.createBuffer()`](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/createBuffer)
- [WebGPU offset computer](https://webgpufundamentals.org/webgpu/lessons/resources/wgsl-offset-computer.html): paste a WGSL struct, see the byte offsets
