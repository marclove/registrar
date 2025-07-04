import { defineConfig } from 'vite';
import pkg from './package.json';

// Automatically externalize dependencies and peerDependencies
const externalPackages = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  // Add node built-in modules
  'node:fs',
  'node:path',
  'node:url',
];

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
      // Mark all dependencies and node built-ins as external
      external: (id) => externalPackages.some((pkgName) => id.startsWith(pkgName)),
    },
    target: 'node18',
    ssr: true, // This tells Vite we're building for server-side (Node.js)
  },
  resolve: {
    alias: {
      'node:process': 'process',
    },
  },
  define: {
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
      ...(process.env.VITEST_INTEGRATION ? [] : ['integration-api.test.ts']),
    ],
  },
});
