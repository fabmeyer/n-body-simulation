# #4 Force pass

**Labels:** simulation · **Milestone:** v1 · **Depends on:** #2

## Goal

The first half of a Step: a compute shader that, for every Body, sums Attraction and Repulsion from all other Bodies (direct summation, O(N²)) and updates that Body's velocity.

## The physics

For Body i, with d = xⱼ − xᵢ (pointing from i towards j) and the softened distance s = √(|d|² + ε²):

- Acceleration: aᵢ = Σⱼ mⱼ · (G/s³ − K/s⁵) · d
- Velocity update: vᵢ ← vᵢ + aᵢ · dt

The G term is Attraction (pulls along +d), the K term is Repulsion (pushes along −d). They cancel at the Equilibrium distance r₀ = √(K/G), which is 1 with the default Parameters.

## Acceptance criteria

- [ ] A WGSL compute shader in `src/simulation/`, loaded through Vite's `?raw` import
- [ ] One invocation per Body; each loops over all N Bodies and accumulates acceleration in a local variable
- [ ] Reads `positions` and `Params`, writes only `velocities`
- [ ] A compute pipeline and bind group are created once (not per frame)
- [ ] The pass can be recorded into a command encoder through the interface agreed in #2
- [ ] Sanity check: with 2 Bodies at distance 3 and at rest, after one Step their velocities point towards each other and are equal in size

## Hints & pitfalls

- **Self-interaction needs no `if`.** For j = i, d is the zero vector, so the term is zero as long as ε > 0. That's one reason Softening exists.
- **Sum, don't store.** Keep a running total per Body inside the loop. Storing every pairwise force would take N² memory for no benefit.
- **Why this pass must not write positions:** other invocations are reading `positions` at the same time. If this pass moved Bodies, some invocations would see old and some new positions, and the result would depend on scheduling. Moving Bodies is #5's job.
- **Workgroup size and dispatch count.** Pick a workgroup size (64 is a good default) and dispatch ⌈N / 64⌉ workgroups. The last workgroup will have invocations with an index ≥ N: they must return early, or they will write outside the Bodies you have.
- **Out-of-bounds access does not crash in WGSL.** It is clamped or returns zero, so an indexing bug shows up as subtly wrong physics, not as an error.
- Using `s³` and `s⁵` with `d` (instead of a unit vector) saves a normalisation and keeps everything finite. Check the algebra yourselves on paper once.
- Shader compile errors appear in the browser console; `getCompilationInfo()` on the shader module gives line numbers.

## Links

- [WebGPU Fundamentals: Compute shader basics](https://webgpufundamentals.org/webgpu/lessons/webgpu-compute-shaders.html)
- [Vite: Importing asset as string (`?raw`)](https://vite.dev/guide/assets#importing-asset-as-string)
- [MDN: `GPUComputePassEncoder.dispatchWorkgroups()`](https://developer.mozilla.org/en-US/docs/Web/API/GPUComputePassEncoder/dispatchWorkgroups)
- [WGSL spec: Built-in values (`global_invocation_id`)](https://www.w3.org/TR/WGSL/#builtin-values)
- [NVIDIA GPU Gems 3, ch. 31: Fast N-Body Simulation with CUDA](https://developer.nvidia.com/gpugems/gpugems3/part-v-physics-simulation/chapter-31-fast-n-body-simulation-cuda) (background on softening and the all-pairs approach)
