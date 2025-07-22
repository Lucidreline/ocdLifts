// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  test: {
    environment: 'jsdom',
    globals: true,               // enable describe/it/expect as globals
    setupFiles: './src/setupTests.js',
  },
});
