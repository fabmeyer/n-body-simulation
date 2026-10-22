# #9 FPS readout

**Labels:** ui · **Milestone:** v1 · **Depends on:** #8

## Goal

A small overlay in a corner of the page that shows frames per second and milliseconds per frame. With 1 Step per frame, this is your performance meter.

## Acceptance criteria

- [ ] Shows FPS and ms per frame, as plain HTML on top of the canvas
- [ ] The numbers are smoothed (averaged), so they are readable rather than flickering
- [ ] Measured from the time between frames, using `performance.now()` or the timestamp `requestAnimationFrame` passes in
- [ ] Doesn't noticeably cost performance itself

## Hints & pitfalls

- **The frame rate is capped at the display refresh rate** (often 60 or 120 Hz). As long as you see the cap, the GPU has spare capacity; the number only becomes informative once it drops below. Increase N (#10) to find where that happens.
- Update the DOM a few times per second, not every frame; writing text to the DOM every frame is wasted work.
- Averaging: either over the last ~30 frames, or count the frames in each ~0.5 s window.
- This measures time between frames on the CPU side, not pure GPU time. For this project that's the right number: it's what the user experiences. (GPU timestamp queries exist but are optional and not supported everywhere, so leave them out.)

## Links

- [MDN: `Performance.now()`](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)
- [MDN: `Window.requestAnimationFrame()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame) (the timestamp argument)
