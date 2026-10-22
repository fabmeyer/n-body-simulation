# #11 Parameter sliders

**Labels:** ui · **Milestone:** later · **Depends on:** v1 (#5, #7, #10)

## Goal

Let the user play with the physics while it runs: sliders for G (Attraction strength), K (Repulsion strength), ε (Softening) and `dt`, wired to the `Params` buffer.

## Acceptance criteria

- [ ] Four sliders (plain HTML `range` inputs), each with a label and its current value shown next to it
- [ ] Moving a slider takes effect at the next Step, without a Reset
- [ ] Start values are the default Parameters from #2
- [ ] The derived Equilibrium distance r₀ = √(K/G) is shown, so the user sees what G and K mean together
- [ ] Ranges are chosen so the user can reach interesting behaviour (and break it a little), but can't reach values that are nonsensical (ε = 0, `dt` ≤ 0, negative G or K)
- [ ] Reset keeps the current slider values (only N and the Initial conditions are reset)

## Hints & pitfalls

- Only write to the `Params` buffer when a value actually changes, not every frame. Use the field offsets from `shared/params.ts` so the layout stays defined in one place.
- `dt` and ε are best explored over orders of magnitude (0.001…0.1); consider a logarithmic slider (map the slider position through an exponential).
- Expect to see real numerical effects: a large `dt` makes Bodies jump through each other and gain energy; a tiny ε makes close encounters violent. Try them deliberately; this is the learning payoff of the whole project.
- Changing G or K changes r₀, which changes how big the clusters are relative to the initial sphere of radius 3.

## Links

- [MDN: `<input type="range">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range)
- [MDN: `GPUQueue.writeBuffer()`](https://developer.mozilla.org/en-US/docs/Web/API/GPUQueue/writeBuffer) (including the offset parameter)
