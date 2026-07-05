import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ command }) => ({
  // GitHub Pages serves this project site under /paradox-lab/. Dev stays at
  // root. Override with BASE_PATH in CI if the repo is ever renamed.
  base: command === 'build' ? process.env.BASE_PATH ?? '/paradox-lab/' : '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Do NOT auto-open a browser: test runs (walkthrough e2e, ad-hoc vite) each
    // spawn their own server and would pop a tab on a random port. Open
    // http://localhost:5173/ yourself.
    open: false,
    // Proxy the room WebSocket to the local multiplayer server (npm run server),
    // so the client connects same-origin at /ws in dev. See server/room-server.mjs.
    proxy: {
      '/ws': {
        target: `ws://localhost:${process.env.MP_PORT ?? 8787}`,
        ws: true,
        rewrite: (path) => path.replace(/^\/ws/, ''),
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: {
        // Landing page / lobby (src/lobby) — the hub that launches every game.
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        // The Quantum Split — the co-op cross-dimension game (src/main.ts).
        quantum: fileURLToPath(new URL('./quantum.html', import.meta.url)),
        // Dev scenery showroom (src/scenery/gallery) — see src/scenery/README.md.
        gallery: fileURLToPath(new URL('./gallery.html', import.meta.url)),
        // Composed escape-room adventures (src/scenery/rooms).
        rooms: fileURLToPath(new URL('./rooms.html', import.meta.url)),
      },
    },
  },
}));
