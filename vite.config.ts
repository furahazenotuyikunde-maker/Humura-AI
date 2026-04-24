import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@google/generative-ai')) {
            return 'vendor-ai';
          }
          if (id.includes('framer-motion') || id.includes('lucide-react')) {
            return 'vendor-ui';
          }
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
});
