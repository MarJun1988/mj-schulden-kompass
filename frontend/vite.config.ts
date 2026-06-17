import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@primeuix")) {
            return "primevue-theme";
          }

          if (
            id.includes("node_modules/primevue/autocomplete") ||
            id.includes("node_modules/primevue/datepicker") ||
            id.includes("node_modules/primevue/dialog") ||
            id.includes("node_modules/primevue/inputnumber") ||
            id.includes("node_modules/primevue/inputtext")
          ) {
            return "primevue-forms";
          }

          if (id.includes("node_modules/primevue")) {
            return "primevue";
          }

          if (
            id.includes("node_modules/vue") ||
            id.includes("node_modules/vue-router") ||
            id.includes("node_modules/pinia")
          ) {
            return "vendor";
          }

          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/graphql": {
        target: "http://localhost:4001",
        changeOrigin: true,
      },
    },
  },
});
