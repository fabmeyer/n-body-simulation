# N-Body Simulation

A real-time 3D n-body simulation that runs in the browser on the GPU (WebGPU, Vite + TypeScript).
Vocabulary is in [`GLOSSARY.md`](GLOSSARY.md), the issue plan in [`docs/issues/`](docs/issues/README.md).

## Setup

Install Node.js, then:

```bash
npm install
npm run dev
```

Open http://localhost:5173 in a browser with WebGPU (Chrome or Edge work best). `localhost` is a
secure context, so `navigator.gpu` works without any HTTPS setup.

The page starts paused with 50 Bodies. **Start/Pause** runs one Step per frame, **Reset** restarts from the
same Initial conditions, the sliders change G, K, Softening and `dt` while it runs, and N (2 to 10,000)
rebuilds the buffers and resets. The top-right corner shows FPS and ms per frame.

## Sanity checks

http://localhost:5173/?check runs the Simulation checks from issues #4 and #5 on the GPU and prints a
table to the browser console (DevTools: Cmd+Option+J / Ctrl+Shift+J). To look at buffers yourself,
use `readBuffer` from `src/simulation/readback.ts`.

## Code layout

- `src/main.ts`: entry point, owns the device and the frame loop
- `src/shared/`: the data contract (`contract.ts`), buffers and Parameters shared by everything
- `src/simulation/`: Initial conditions and the force and position compute shaders
- `src/renderer/`: fixed camera and drawing the Bodies
- `src/ui/`: FPS readout and Parameter sliders
- `examples/`: the Torus Knot examples from class, at http://localhost:5173/examples/1-torus-knot/ etc.

## Shaders

`.wgsl` files are imported as raw strings via `?raw`:

```ts
import shaderCode from './shader.wgsl?raw';
```

`?raw` does not resolve `#include`, so shared code (like `struct Params` in `src/shared/params.wgsl`)
is put in front of the shader string in TypeScript, see `src/simulation/simulation.ts`.

## Type checking

`@webgpu/types` gives autocomplete and type checks for `GPUDevice`, `GPUBuffer`, etc. `vite build`
does **not** type-check (esbuild just strips types), so the `build` script runs `tsc --noEmit` first,
and there is a standalone `npm run typecheck` too.

## Building

```bash
npm run build
npm run preview   # check the production build locally
```
