# #1 Scaffold & GPU device

**Labels:** setup · **Milestone:** v1 · **Depends on:** – · **Done by:** all three together

## Goal

A Vite + TypeScript project that opens a page, acquires a WebGPU device, and clears a full-window canvas to a solid colour. This is the foundation everyone else builds on.

## Acceptance criteria

- [ ] Vite project with TypeScript; `npm run dev` serves the page on localhost
- [ ] `@webgpu/types` installed and configured, so the WebGPU API is type-checked
- [ ] Folder structure in place: `src/main.ts`, `src/simulation/`, `src/renderer/`, `src/shared/`
- [ ] An adapter and a device are requested; the canvas is configured with the browser's preferred format
- [ ] Each frame (or once, for now) the canvas is cleared to a recognisable colour
- [ ] If `navigator.gpu` is missing, or no adapter is returned, the page shows a readable message instead of a black screen
- [ ] The canvas fills the window and stays sharp on high-DPI screens

## Hints & pitfalls

- Getting the device is asynchronous, in two stages: first the adapter, then the device. Both can fail; handle both.
- `requestAdapter()` can resolve to `null` (not throw) when WebGPU is present but unusable. That is a separate case from `navigator.gpu` being undefined.
- `@webgpu/types` only helps once it is added to the `types` in `tsconfig.json`.
- Clearing the screen is a render pass with a `loadOp` of `clear` and nothing drawn. It's the smallest possible end-to-end use of command encoder → pass → submit, and worth understanding fully before moving on.
- The canvas has two sizes: its CSS size and its drawing-buffer size (`width`/`height` attributes). Multiply by `devicePixelRatio` for the latter, or everything will look blurry.
- Get a device-lost handler or at least a `console.error` in place; silent GPU errors are the hardest thing to debug in WebGPU. Also look at `pushErrorScope` / `popErrorScope` and the `uncapturederror` event.
- Test in a Chromium-based browser first; it has the most mature WebGPU support and good shader error messages in the console.

## Links

- [Vite: Getting started](https://vite.dev/guide/)
- [`@webgpu/types`](https://github.com/gpuweb/types)
- [WebGPU Fundamentals: Fundamentals](https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html)
- [MDN: `GPU.requestAdapter()`](https://developer.mozilla.org/en-US/docs/Web/API/GPU/requestAdapter)
- [MDN: `GPUAdapter.requestDevice()`](https://developer.mozilla.org/en-US/docs/Web/API/GPUAdapter/requestDevice)
- [MDN: `GPUCanvasContext.configure()`](https://developer.mozilla.org/en-US/docs/Web/API/GPUCanvasContext/configure)
- [MDN: `GPUDevice.lost`](https://developer.mozilla.org/en-US/docs/Web/API/GPUDevice/lost)
