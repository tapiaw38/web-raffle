import { ref, onMounted, onUnmounted } from 'vue'

// En desarrollo usamos el proxy de Vite para evitar CORS con Apps Script
const SCRIPT_URL = import.meta.env.DEV
  ? '/script-proxy'
  : (import.meta.env.VITE_SCRIPT_URL || '')

export function useRaffle() {
  const numeros = ref([])
  const config = ref({})
  const cargando = ref(false)
  const error = ref(null)
  const ultimaActualizacion = ref(null)

  async function api(params) {
    if (!SCRIPT_URL) {
      throw new Error('VITE_SCRIPT_URL no configurado en .env')
    }
    const url = new URL(SCRIPT_URL, window.location.origin)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    const res = await fetch(url.toString())
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data
  }

  async function cargarDatos() {
    try {
      cargando.value = true
      error.value = null
      const data = await api({ action: 'getData' })
      numeros.value = data.numeros || []
      config.value = data.config || {}
      ultimaActualizacion.value = new Date()
    } catch (e) {
      error.value = e.message
    } finally {
      cargando.value = false
    }
  }

  async function reservarNumero(numero, comprador) {
    const data = await api({ action: 'reservar', numero, comprador })
    await cargarDatos()
    return data
  }

  async function confirmarCompra(numero, token) {
    const data = await api({ action: 'confirmar', numero, token })
    await cargarDatos()
    return data
  }

  async function liberarNumero(numero, token) {
    const data = await api({ action: 'liberar', numero, token })
    await cargarDatos()
    return data
  }

  async function actualizarConfig(key, value, token) {
    const data = await api({ action: 'updateConfig', key, value, token })
    await cargarDatos()
    return data
  }

  let intervalo
  onMounted(() => {
    cargarDatos()
    intervalo = setInterval(cargarDatos, 30_000)
  })
  onUnmounted(() => clearInterval(intervalo))

  return {
    numeros,
    config,
    cargando,
    error,
    ultimaActualizacion,
    cargarDatos,
    reservarNumero,
    confirmarCompra,
    liberarNumero,
    actualizarConfig,
  }
}
