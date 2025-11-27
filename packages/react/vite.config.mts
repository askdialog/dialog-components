import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    dts({
      rollupTypes: false,
      tsconfigPath: "./tsconfig.lib.json",
      outDir: "dist",
      include: ["src/**/*"],
      entryRoot: "src",
      compilerOptions: {
        // Don't resolve workspace path aliases in generated types
        // This ensures @askdialog/dialog-sdk remains a package reference
        paths: {},
      },
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      name: "dialog-react",
      fileName: "dialog-react",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@askdialog/dialog-sdk",
      ],
      output: {
        inlineDynamicImports: true,
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "react/jsx-runtime",
        },
      },
    },
  },
});
