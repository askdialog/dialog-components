import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

// Use TEST_DIST=true to test against built library instead of sources
// Example: TEST_DIST=true pnpm dev
const useDistForTesting = process.env.TEST_DIST === 'true';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: useDistForTesting
      ? {}
      : {
          // Resolve to source for HMR during development
          '@askdialog/dialog-vue': resolve(__dirname, '../vue/src/main.ts'),
          '@askdialog/dialog-sdk': resolve(__dirname, '../sdk/src/index.ts'),
        },
  },
  server: {
    port: 5173,
    open: true,
  },
  optimizeDeps: {
    exclude: ['@askdialog/dialog-vue', '@askdialog/dialog-sdk'],
  },
});
