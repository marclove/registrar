/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: './src/index.ts',
      },
      output: {
        entryFileNames: '[name].js',
        format: 'es',
      },
      external: (id) => {
        // Keep node: prefixed imports as externals, but let Vite handle the rest
        return id.startsWith('node:') && !id.startsWith('node:process');
      },
    },
    target: 'node18',
    ssr: true, // This tells Vite we're building for server-side (Node.js)
  },
  resolve: {
    alias: {
      'node:process': 'process',
      'node:path': 'path',
      'node:fs': 'fs',
      'node:url': 'url',
    },
  },
  define: {
    // Ensure process is available
    global: 'globalThis',
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
    },
    setupFiles: ['./src/test-setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tmp/**',
      ...(process.env.VITEST_INTEGRATION ? [] : ['integration-api.test.ts'])
    ],
  },
});
