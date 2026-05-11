import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  base: '/app/',
  plugins: [react()],
  server: {
    allowedHosts: ['mirror-vote.ru', 'www.mirror-vote.ru', 'mirrorvote.ru', 'www.mirrorvote.ru'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
