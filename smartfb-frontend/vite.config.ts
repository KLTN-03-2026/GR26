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
    alias: {
      '@': path.resolve(__dirname, './src'),
      "@assets":  path.resolve(__dirname, './src/assets'),
      "@layouts":  path.resolve(__dirname, './src/layouts'),
      "@lib":  path.resolve(__dirname, './src/lib'),
      "@data":  path.resolve(__dirname, './src/data'),
      "@modules":  path.resolve(__dirname, './src/modules'),
      "@pages":  path.resolve(__dirname, './src/pages'),
      "@providers":  path.resolve(__dirname, './src/providers'),
      "@routes":  path.resolve(__dirname, './src/routes'),
      "@shared":  path.resolve(__dirname, './src/shared')
    },
  },
})
