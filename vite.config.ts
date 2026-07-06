import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const modulePath = id.replaceAll("\\", "/");
          if (!modulePath.includes("node_modules")) return undefined;
          if (modulePath.includes("/node_modules/vue/") || modulePath.includes("/node_modules/@vue/")) {
            return "vendor-vue";
          }
          if (modulePath.includes("/node_modules/naive-ui/") || modulePath.includes("/node_modules/@lucide/vue/")) {
            return "vendor-ui";
          }
          return "vendor";
        },
      },
    },
  },
});
