import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use TEST_DIST=true to test against built library instead of sources
// Example: TEST_DIST=true pnpm dev
const useDistForTesting = process.env.TEST_DIST === "true";
const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias:
      useDistForTesting || isProduction
        ? []
        : [
            // Resolve CSS first (more specific pattern)
            {
              find: "@askdialog/dialog-react/style.css",
              replacement: resolve(__dirname, "../react/src/style.css"),
            },
            // Then resolve main package
            {
              find: "@askdialog/dialog-react",
              replacement: resolve(__dirname, "../react/src/main.ts"),
            },
            {
              find: "@askdialog/dialog-sdk",
              replacement: resolve(__dirname, "../sdk/src/index.ts"),
            },
          ],
  },
  server: {
    port: 5174,
    open: true,
  },
  optimizeDeps: {
    exclude: ["@askdialog/dialog-react", "@askdialog/dialog-sdk"],
  },
});
