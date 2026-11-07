import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Long-term cacheable vendor chunks; heavy libraries load only where used.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/](react|react-dom|react-router|scheduler)[\\/]/.test(id)) return 'react';
          if (id.includes('@tanstack')) return 'query';
          if (/[\\/](recharts|d3-|victory-vendor)/.test(id)) return 'charts';
        },
      },
    },
  },
});
