import { defineConfig } from "vitest/config";

// Specs run on their own config: the build's eslint and dts plugins stay out.
export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
  },
});
