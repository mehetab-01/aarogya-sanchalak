import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
  resolve: {
    // Ensure firebase imported from shared/ resolves from driver's node_modules
    alias: {
      'firebase/app':      path.resolve(__dirname, 'node_modules/firebase/app'),
      'firebase/database': path.resolve(__dirname, 'node_modules/firebase/database'),
      'firebase/auth':     path.resolve(__dirname, 'node_modules/firebase/auth'),
    },
  },
});
