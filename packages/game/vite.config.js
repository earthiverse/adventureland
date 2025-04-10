import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from 'vite-plugin-vue-devtools'
import { defineConfig } from "vite";
import { compilerOptions, transformAssetUrls } from "vue3-pixi";

export default defineConfig({
  plugins: [
    tailwindcss(),
    vue({
      template: {
        compilerOptions,
        transformAssetUrls,
      },
    }),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
