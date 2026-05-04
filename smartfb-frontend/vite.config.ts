import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  resolve: {
    alias: [
      { find: '@assets', replacement: path.resolve(__dirname, './src/assets') },
      { find: '@layouts', replacement: path.resolve(__dirname, './src/layouts') },
      { find: '@lib', replacement: path.resolve(__dirname, './src/lib') },
      { find: '@data', replacement: path.resolve(__dirname, './src/data') },
      { find: '@modules', replacement: path.resolve(__dirname, './src/modules') },
      { find: '@pages', replacement: path.resolve(__dirname, './src/pages') },
      { find: '@providers', replacement: path.resolve(__dirname, './src/providers') },
      { find: '@routes', replacement: path.resolve(__dirname, './src/routes') },
      { find: '@shared', replacement: path.resolve(__dirname, './src/shared') },
      { find: '@', replacement: path.resolve(__dirname, './src') }
    ],
  }, 
  // Polyfill `global` cho sockjs-client (package dùng Node.js global, không có trong browser)
  define: {
    global: 'globalThis',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      },
      // Proxy WebSocket STOMP/SockJS endpoint sang BE
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  }
})
