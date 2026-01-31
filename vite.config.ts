import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiKey = env.GEMINI_API_KEY || env.API_KEY || '';

    // Determine if we're building for Electron
    const isElectron = process.env.BUILD_TARGET === 'electron';

    return {
      // Base path needs to be './' for Electron to work correctly with relative paths
      base: isElectron ? './' : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          external: [
            'fs',
            'fs/promises',
            'path',
            'os',
            'child_process',
            'xlsx',
            'exceljs'
          ]
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
