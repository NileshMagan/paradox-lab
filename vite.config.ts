import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true,
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
});
