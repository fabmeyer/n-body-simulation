# #10 Reset & N input

**Labels:** ui · **Milestone:** v1 · **Depends on:** #3, #8

## Goal

A Reset button that restarts from the same Initial conditions, and a number input for N. Changing N always triggers a Reset with freshly sized buffers.

## Acceptance criteria

- [ ] A Reset button: regenerates the Initial conditions with the same seed and uploads them; the Simulation restarts from exactly the same state
- [ ] An N input (plain HTML), default 50
- [ ] Changing N: old buffers are released, new buffers of the right size are created, N in `Params` is updated, and a Reset runs
- [ ] Invalid input (empty, non-integer, below 2, absurdly large) is rejected or clamped, without breaking the running page
- [ ] After changing N, the Simulation, the Renderer and the FPS readout keep working

## Hints & pitfalls

- **Bind groups point at specific buffers.** After creating new buffers, every bind group that referenced the old ones (force pass, position pass, Renderer) must be recreated, or the GPU keeps using the old buffers or errors. That's the main trap in this issue. Decide together how the Simulation and Renderer get told about new buffers; this touches the contract from #2, so discuss it before coding.
- Pipelines do *not* depend on N and don't need to be recreated.
- The dispatch count (⌈N / workgroup size⌉) and the instance count of the draw depend on N; make sure both read the current value.
- Reset without changing N doesn't need new buffers: overwriting the contents is enough.
- `destroy()` releases a buffer's GPU memory right away instead of waiting for garbage collection.
- When choosing an upper limit for N, remember the force pass is O(N²): 10× more Bodies means 100× more work. Try it and watch #9.

## Links

- [MDN: `GPUBuffer.destroy()`](https://developer.mozilla.org/en-US/docs/Web/API/GPUBuffer/destroy)
- [MDN: `GPUDevice.createBindGroup()`](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/createBindGroup)
- [WebGPU Fundamentals: Storage buffers](https://webgpufundamentals.org/webgpu/lessons/webgpu-storage-buffers.html)
