import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    // 5174 para não colidir com o painel do aluno (5173).
    port: 5174,
    // Proxy do backend: /api → http://localhost:3333 (evita CORS/expor URL).
    proxy: { '/api': { target: 'http://localhost:3333', changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') } },
  },
});
