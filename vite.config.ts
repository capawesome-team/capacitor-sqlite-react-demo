import { defineConfig } from 'vite';
import type { ServerOptions } from 'vite';
import react from '@vitejs/plugin-react';

// Ionic CLI (react / CRA-style runner) sets PORT and HOST when it runs `npm run ionic:serve`.
// Vite does not read those env vars by default; map them so `ionic serve` matches the CLI probe port.
const server: ServerOptions = {
  headers: {
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
  },
};
const ionicPort = Number(process.env.PORT);
if (Number.isFinite(ionicPort) && ionicPort > 0) {
  server.port = ionicPort;
  server.strictPort = true;
}
if (process.env.HOST) {
  server.host = process.env.HOST;
}

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs so Capacitor WebView and file-based loads resolve JS/workers correctly.
  base: './',
  build: {
    outDir: 'www',
    // Ionic bundles `:host-context(...)` in utility CSS; LightningCSS logs warnings on minify.
    cssMinify: 'esbuild',
  },
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  server,
});
