import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const INSTANCE = process.env.INSTANCE ?? 'platform';
const instanceDir = path.resolve(dirname, `../../instances/${INSTANCE}`);

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  resolve: {
    alias: {
      $instance: instanceDir,
    },
  },
  server: {
    port: 5174,
    strictPort: false,
  },
});
