import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Cible du proxy de dev : l'API Gateway Nginx (k3d expose le port 8080 sur l'hôte).
// En dev (`npm run dev`), le front appelle en relatif (/api, /socket.io) et Vite
// proxifie vers la gateway — exactement comme en prod. Aucune URL absolue n'est
// donc figée dans le code, ce qui élimine les ERR_CONNECTION_REFUSED.
const GATEWAY = process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: GATEWAY, changeOrigin: true },
      '/socket.io': { target: GATEWAY, changeOrigin: true, ws: true },
    },
  },
})
