import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import sapSyncPlugin from './vite-plugin-sync.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Only load sync plugin in development
    mode === 'development' ? sapSyncPlugin() : null,
  ].filter(Boolean),
  // Base path must match the GitHub repo name for GitHub Pages
  // URL: https://jwanOo.github.io/ai-readiness-check/
  base: '/ai-readiness-check/',
}))
