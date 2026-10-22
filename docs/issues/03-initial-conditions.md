# #3 Initial conditions

**Labels:** simulation · **Milestone:** v1 · **Depends on:** #2

## Goal

Generate the Initial conditions on the CPU and upload them to the `positions` and `velocities` buffers: N Bodies at random positions inside a sphere of radius 3, all at rest, all with mass 1, reproducible from a fixed seed.

## Acceptance criteria

- [ ] A function generates Initial conditions for a given N and seed
- [ ] Positions are uniformly distributed *inside* the sphere (radius 3), not clustered at the centre or on the surface
- [ ] Every Body has mass 1 (in `positions.w`) and velocity zero
- [ ] The same seed always gives the same Initial conditions
- [ ] The data is uploaded to the GPU buffers from #2
- [ ] Lives in `src/simulation/`

## Hints & pitfalls

- `Math.random()` can't be seeded. Use a tiny seedable PRNG instead; "mulberry32" or "xorshift" are well-known, a few lines each, and fine for this.
- **Uniform in a sphere is a classic trap.** Picking a random direction and a random radius `r = R·u` crowds Bodies near the centre, because the volume of a shell grows with r². Two correct options: rejection sampling (draw in the cube, discard points outside the sphere), or scale the radius with the cube root of a uniform number.
- Build one `Float32Array` of N × 4 floats per buffer and upload it in a single `writeBuffer` call; don't upload Body by Body.
- Two Bodies starting almost on top of each other will get a big Repulsion kick in the first Steps. That's expected physics, not a bug, and Softening keeps it finite.
- Until #7 exists, check your output by logging the first few Bodies and the maximum distance from the origin (it should be just under 3).

## Links

- [MDN: `GPUQueue.writeBuffer()`](https://developer.mozilla.org/en-US/docs/Web/API/GPUQueue/writeBuffer)
- [Wolfram MathWorld: Sphere point picking](https://mathworld.wolfram.com/SpherePointPicking.html) (on the surface; think about how to extend it to the volume)
