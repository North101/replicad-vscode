import reactPlugin from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env': {}
  },
  plugins: [
    reactPlugin(),
  ],
  worker: {
    rollupOptions: {
      output: {
        entryFileNames: `[name].js`,
      },
    }
  },
  build: {
    outDir: 'build',
    lib: {
      entry: {
        extension: path.resolve(__dirname, 'src/extension/index.ts'),
        webview: path.resolve(__dirname, 'src/webview/index.tsx'),
      }
    },
    rollupOptions: {
      external: [
        'vscode',
        'path',
      ],
      output: {
        entryFileNames: `[name].js`,
        assetFileNames: `[name].[ext]`
      },
    },
    assetsInlineLimit: 100 * 1024 * 1024
  },
  server: {
    port: 4444,
  },
})
