import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El proxy manda /api al backend Django (evita CORS: el navegador ve mismo origen).
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     port: 5173,
//     proxy: {
//       '/api': { target: 'http://localhost:8000', changeOrigin: true },
//     },
//   },
// })


export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'https://mr-1375.traefik.uner.gy', changeOrigin: true, secure: true },
    },
  },
})
