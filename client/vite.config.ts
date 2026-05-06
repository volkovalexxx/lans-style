import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    watch: { usePolling: true, interval: 500 },
    proxy: {
      '/api': process.env.API_TARGET || 'http://localhost:5000',
      '/uploads': process.env.API_TARGET || 'http://localhost:5000',
    },
  },
});
