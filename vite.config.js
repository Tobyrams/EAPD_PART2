import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: "./index.html",
      },
    },
    // Ensure that index.html is copied to the output directory
    emptyOutDir: true,
  },
  // Handle SPA routing
  server: {
    historyApiFallback: true,
  },
});
