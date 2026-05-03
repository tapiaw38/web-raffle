import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const scriptUrl = env.VITE_SCRIPT_URL || ''

  // Extraemos el path /macros/s/.../exec para el proxy de desarrollo
  let scriptPath = ''
  try {
    scriptPath = scriptUrl ? new URL(scriptUrl).pathname : ''
  } catch (_) {}

  return {
    plugins: [vue()],
    // Cambiá 'web-raffle' por el nombre exacto de tu repositorio en GitHub
    base: mode === 'production' ? '/web-raffle/' : '/',
    server: {
      proxy: scriptPath
        ? {
            '/script-proxy': {
              target: 'https://script.google.com',
              changeOrigin: true,
              // rewrite recibe el path completo incluyendo query string — hay que preservarlos
              rewrite: (path) => {
                const qIdx = path.indexOf('?')
                return scriptPath + (qIdx !== -1 ? path.slice(qIdx) : '')
              },
            },
          }
        : {},
    },
  }
})
