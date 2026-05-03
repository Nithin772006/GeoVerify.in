import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('@react-three/')) {
            return 'three';
          }

          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }

          if (
            id.includes('@supabase/') ||
            id.includes('@tanstack/react-query') ||
            id.includes('node_modules/axios')
          ) {
            return 'supabase';
          }
        },
      },
    },
  },
})
