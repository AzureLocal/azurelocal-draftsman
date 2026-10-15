import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Load package.json version
import pkg from './package.json' with { type: 'json' };

// The app is served from the org Pages path https://azurelocal.cloud/azurelocal-draftsman/ (docs under /docs/).
// Local dev serves from '/'; set VITE_BASE to override.
export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE ?? (command === 'build' ? '/azurelocal-draftsman/' : '/'),
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 8125,
  },
}));
