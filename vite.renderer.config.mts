import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
// import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // プロダクションビルドでstagewiseパッケージを除外
        if (process.env.NODE_ENV === 'production' && id.includes('@stagewise/')) {
          return true;
        }
        return false;
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-dom/client'],
        }
      }
      // plugins: [
      //     visualizer(),
      //   ],
    },
  },
});
