import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adminNodeModules = path.resolve(__dirname, 'node_modules');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      // Allow Vite to serve files from the shared folder (2 levels up)
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      // Explicitly map every bare package that shared/ files import
      // to admin's own node_modules — shared folder has no node_modules
      'firebase/app':       path.join(adminNodeModules, 'firebase', 'app'),
      'firebase/database':  path.join(adminNodeModules, 'firebase', 'database'),
      'firebase/auth':      path.join(adminNodeModules, 'firebase', 'auth'),
      'lucide-react':       path.join(adminNodeModules, 'lucide-react'),
      'clsx':               path.join(adminNodeModules, 'clsx'),
      'date-fns':           path.join(adminNodeModules, 'date-fns'),
      'react-hot-toast':    path.join(adminNodeModules, 'react-hot-toast'),
      'framer-motion':      path.join(adminNodeModules, 'framer-motion'),
      'react':              path.join(adminNodeModules, 'react'),
      'react-dom':          path.join(adminNodeModules, 'react-dom'),
    },
  },
});
