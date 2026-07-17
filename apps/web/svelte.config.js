import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Aktive Instanz (Default 'energize'). Muss zum Vite-Alias passen, damit
// svelte-check / TS $instance/* genauso aufloesen wie der Vite-Bundler.
const INSTANCE = process.env.INSTANCE ?? 'energize';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true,
    }),
    alias: {
      $lib: './src/lib',
      $instance: `../../instances/${INSTANCE}`,
    },
  },
};

export default config;
