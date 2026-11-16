import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

// Specs run on their own config: the build's eslint and dts plugins stay out.
export default defineConfig({
  plugins: [vue()],
  test: {
    include: ["src/**/*.spec.ts"],
  },
});
