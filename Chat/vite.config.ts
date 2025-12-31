import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: false,
      open: false,
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
        input: {
          main: path.resolve(__dirname, 'index.html'),
          gamer: path.resolve(__dirname, 'src/gamer/index.html')
        }
      },
      // Generate unique hashes for each build
      chunkSizeWarningLimit: 1000,
      sourcemap: false,
    }
  };
});
