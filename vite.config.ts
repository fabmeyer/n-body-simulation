import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // WebGPU only exists in recent browsers, so there is no reason to
    // transpile further down.
    target: 'esnext',
  },
  server: {
    // localhost is a secure context, so navigator.gpu works without HTTPS.
    port: 5173,
  },
});
