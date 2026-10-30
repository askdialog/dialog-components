import { defineConfig } from "vite";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use TEST_DIST=true to test against the built SDK instead of its sources
// Example: TEST_DIST=true pnpm dev
const useDistForTesting = process.env.TEST_DIST === "true";
const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  resolve: {
    alias:
      useDistForTesting || isProduction
        ? []
        : [
            {
              find: "@askdialog/dialog-sdk",
              replacement: resolve(__dirname, "../sdk/src/index.ts"),
            },
          ],
  },
  server: {
    port: 5175,
    open: true,
  },
  optimizeDeps: {
    exclude: ["@askdialog/dialog-sdk"],
  },
});
