import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Aktive Instanz zur Build-/Dev-Zeit. Default 'energize' (erste Instanz).
// Wird ueber INSTANCE=<slug> gesetzt (siehe Root-Scripts build:<slug>).
const INSTANCE = process.env.INSTANCE ?? 'platform';
const instanceDir = path.resolve(dirname, `../../instances/${INSTANCE}`);

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  resolve: {
    alias: {
      // Loest sowohl TS-Imports ($instance/instance.config) als auch
      // CSS-@imports ($instance/tokens.css) auf die aktive Instanz auf.
      $instance: instanceDir,
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
