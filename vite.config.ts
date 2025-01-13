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
  build: {
    outDir: 'build',
    lib: {
      entry: {
        extension: path.resolve(__dirname, 'src/extension.ts'),
        webview: path.resolve(__dirname, 'src/webview/index.tsx'),
      }
    },
    rollupOptions: {
      external: [
        'vscode',
        'path'
      ],
      output: {
        entryFileNames: `[name].js`,
      }
    },
    assetsInlineLimit: 100 * 1024 * 1024
  },
  server: {
    port: 4444,
  },
})
