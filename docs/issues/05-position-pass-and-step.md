# #5 Position pass & Step

**Labels:** simulation · **Milestone:** v1 · **Depends on:** #4

## Goal

The second half of a Step: a compute shader that moves every Body using its *new* velocity, xᵢ ← xᵢ + vᵢ · dt. Then combine both passes into one Step that `main.ts` can record each frame.

Force pass first, then position pass, with the new velocity: that order is what makes this semi-implicit Euler (stable) rather than explicit Euler (energy grows until the system blows up).

## Acceptance criteria

- [ ] A second WGSL compute shader that reads `velocities` and `Params` and updates `positions`
- [ ] The mass in `positions.w` is left unchanged
- [ ] A Step records the force pass and then the position pass into the same command encoder
- [ ] Exposed to `main.ts` through the interface agreed in #2
- [ ] Sanity check: 2 Bodies at distance 3, at rest, fall towards each other, bounce off at a closest distance of about 0.65, and swing back out to about 3, again and again. There's no damping, so each swing should return to roughly the starting distance; if it keeps growing or shrinking, something is wrong.
- [ ] Sanity check: 50 Bodies from #3 do not fly off to infinity within the first few hundred Steps

## Hints & pitfalls

- **Ordering between passes is guaranteed.** Work in one compute pass (or one dispatch) finishes before the next one sees its buffers, so you need no manual barriers. Two separate passes, or two dispatches in the same pass, both work; think about which one you find clearer.
- This shader is tiny. The interesting part is plumbing: a second pipeline, a second bind group (`positions` is now read-write, `velocities` read-only).
- Same workgroup size, dispatch-count and early-return rules as #4.
- Until #7 exists, check results by copying `positions` into a `MAP_READ` buffer and logging it. That's also a useful debugging tool to keep around later.
- If Bodies explode outwards, try a smaller `dt` before hunting for a bug: Repulsion is steep at short range, and a too-large `dt` lets Bodies jump past each other.

## Links

- [WebGPU Fundamentals: Compute shader basics](https://webgpufundamentals.org/webgpu/lessons/webgpu-compute-shaders.html) (includes reading results back to the CPU)
- [MDN: `GPUBuffer.mapAsync()`](https://developer.mozilla.org/en-US/docs/Web/API/GPUBuffer/mapAsync)
- [Wikipedia: Semi-implicit Euler method](https://en.wikipedia.org/wiki/Semi-implicit_Euler_method)
