import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    transparent: {
      sizes: [192, 512],
      favicons: [],
    },
    maskable: {
      sizes: [512],
      padding: 0.1,
      resizeOptions: { background: '#DA6278' },
    },
    apple: {
      sizes: [180],
      resizeOptions: { background: '#ffffff' },
    },
  },
  images: ['public/favicon.svg'],
})
