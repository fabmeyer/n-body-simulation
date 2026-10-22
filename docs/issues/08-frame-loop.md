# #8 Frame loop

**Labels:** ui · **Milestone:** v1 · **Depends on:** #2

## Goal

The heartbeat in `main.ts`: once per animation frame, record exactly one Step (if running) and one draw into a command encoder and submit it. Plus a Start/Pause button.

## Acceptance criteria

- [ ] Driven by `requestAnimationFrame`
- [ ] Each frame: one command encoder; if running, the Simulation records one Step; the Renderer always records one draw; one `submit`
- [ ] A Start/Pause button (plain HTML); paused means no Step, but the current state stays visible
- [ ] Built against the interface from #2, so it works with stub Simulation/Renderer implementations before #5 and #7 are merged
- [ ] Nothing is created per frame except the command encoder (and the canvas texture view)

## Hints & pitfalls

- **Exactly 1 Step per frame** is deliberate: it makes performance directly visible (#9). It also means simulated time per second depends on the display's refresh rate. That's acceptable for this project; just be aware of it.
- **Create pipelines, bind groups and buffers once**, outside the loop. Creating them per frame works, but is slow and hides the real cost of the Simulation.
- The canvas texture changes every frame: get the current texture inside the loop, not once at startup.
- Recording Step and draw in the same encoder is fine: WebGPU guarantees the compute passes finish before the render pass reads `positions`.
- `requestAnimationFrame` pauses in background tabs; that's fine.
- Stubs: a Simulation that records nothing and a Renderer that only clears the screen are enough to test the loop and the button.

## Links

- [MDN: `Window.requestAnimationFrame()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- [WebGPU Fundamentals: Fundamentals](https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html) (command encoders and submit)
- [MDN: `GPUCanvasContext.getCurrentTexture()`](https://developer.mozilla.org/en-US/docs/Web/API/GPUCanvasContext/getCurrentTexture)
