import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
  },
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/canvas-confetti')) {
            return 'vendor-icons';
          }
          if (id.includes('src/data/recipesData.ts')) {
            return 'recipes-catalog';
          }
          if (id.includes('src/data/ingredientsData.ts') || id.includes('src/data/substitutesData.ts')) {
            return 'ingredients-catalog';
          }
        }
      }
    }
  }
});
