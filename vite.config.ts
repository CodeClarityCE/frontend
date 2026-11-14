import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import EnvironmentPlugin from "vite-plugin-environment";
import vueDevTools from "vite-plugin-vue-devtools";

import logoIcons from "./vite-plugin-logo-icons.ts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    EnvironmentPlugin("all"),
    logoIcons(fileURLToPath(new URL("./src", import.meta.url))),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      // Keeps module order, so reflect-metadata runs before any chunk with decorated entities.
      output: { strictExecutionOrder: true },
    },
  },
});
