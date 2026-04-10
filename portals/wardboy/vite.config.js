import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Allow serving files from parent dirs (for ../shared/firebase.js)
      allow: [".."],
    },
  },
  resolve: {
    // Hard-pin firebase to THIS portal's node_modules so imports inside
    // ../../shared/firebase.js can resolve it (node module traversal won't
    // find it since shared/ is a sibling of node_modules/, not a child)
    alias: {
      firebase: path.resolve(__dirname, "node_modules/firebase"),
    },
  },
  optimizeDeps: {
    include: ["firebase/app", "firebase/auth", "firebase/database"],
  },
});
