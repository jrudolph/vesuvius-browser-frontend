import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      src: path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      //"/.*/dzi": {
      "^(.*/dzi)|(/openseadragon/.*)": {
        target: "https://vesuvius.virtual-void.net",
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            // Preserve original path when forwarding
            const target = new URL(proxyReq.protocol + "//" + proxyReq.host);
            target.pathname = req.url;
            proxyReq.path = target.pathname + target.search;
          });
        },
      },
    },
  },
});
