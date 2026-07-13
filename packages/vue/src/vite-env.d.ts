/// <reference types="vite/client" />

// Injected at build time by the `define` in vite.config.ts
declare const __DIALOG_VUE_VERSION__: string;

declare module "*.vue" {
  import { DefineComponent } from "vue";
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
