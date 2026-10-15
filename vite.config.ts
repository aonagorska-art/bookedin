import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: { output: { postBanner: '/*! Third-party licenses: /THIRD-PARTY-NOTICES.txt */' } }
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:4174' }
  },
  preview: { port: 5173 }
})
