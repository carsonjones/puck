import path from 'node:path';
import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), cloudflare()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../src/shared'),
      '@web': path.resolve(__dirname, './src'),
    },
  },
});
