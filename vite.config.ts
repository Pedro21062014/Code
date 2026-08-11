import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url))
    }
  },
  server: {
    host: true,
    allowedHosts: true,
    port: 5173
  },
  optimizeDeps: {
    esbuildOptions: { target: 'esnext' }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    // O Navebox usa top-level await; precisa de target esnext
    target: 'esnext'
  },
  esbuild: {
    target: 'esnext'
  }
});
