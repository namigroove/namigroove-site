import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// namigroove.com 用: /tools/chimera/ の下に置く。index.html = 歌声レンダラー、app.html = CHIMERA本体
export default defineConfig({
  base: process.env.CHIMERA_BASE ?? "/",
  plugins: [react()],
  worker: { format: "es" },
  build: {
    target: "es2022",
    rollupOptions: { input: { index: "index.html", app: "app.html" } },
  },
});
