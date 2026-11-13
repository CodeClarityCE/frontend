/// <reference types="vite/client" />

// Logo icon subsets built by vite-plugin-logo-icons.ts.
declare module "virtual:logo-icons" {
  import type { IconifyJSON } from "@iconify/vue";
  const collections: IconifyJSON[];
  export default collections;
}
