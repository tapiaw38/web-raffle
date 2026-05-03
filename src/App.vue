<script setup>
import { ref } from 'vue'
import RaffleHeader from './components/RaffleHeader.vue'
import NumberGrid from './components/NumberGrid.vue'
import ReserveModal from './components/ReserveModal.vue'
import AdminPanel from './components/AdminPanel.vue'
import { useRaffle } from './composables/useRaffle'

const {
  numeros,
  config,
  cargando,
  error,
  ultimaActualizacion,
  reservarNumero,
  confirmarCompra,
  liberarNumero,
  actualizarConfig,
} = useRaffle()

const numeroSeleccionado = ref(null)
const adminVisible = ref(false)
const reservando = ref(false)
const errorReserva = ref('')
const toastMsg = ref('')
const toastTipo = ref('ok')
let toastTimer = null

function toast(msg, tipo = 'ok') {
  toastMsg.value = msg
  toastTipo.value = tipo
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toastMsg.value = ''), 3500)
}

function abrirModal(item) {
  numeroSeleccionado.value = item
}

function cerrarModal() {
  numeroSeleccionado.value = null
  errorReserva.value = ''
}

async function hacerReserva({ numero, comprador }) {
  reservando.value = true
  errorReserva.value = ''
  try {
    await reservarNumero(numero, comprador)
    cerrarModal()
    toast(`Número ${numero} reservado. ¡Hacé la transferencia!`)
  } catch (e) {
    errorReserva.value = e.message
  } finally {
    reservando.value = false
  }
}

async function adminConfirmar({ numero, token }) {
  await confirmarCompra(numero, token)
  toast(`Número ${numero} marcado como COMPRADO`)
}

async function adminLiberar({ numero, token }) {
  await liberarNumero(numero, token)
  toast(`Número ${numero} liberado`, 'warn')
}

async function adminUpdateConfig({ key, value, token }) {
  await actualizarConfig(key, value, token)
  toast('Configuración guardada')
}
</script>

<template>
  <div class="app">
    <RaffleHeader
      :config="config"
      :cargando="cargando"
      :ultima-actualizacion="ultimaActualizacion"
    />

    <!-- Error de configuración -->
    <div v-if="error && !numeros.length" class="error-banner">
      <strong>Error:</strong> {{ error }}
      <span v-if="error.includes('VITE_SCRIPT_URL')">
        — Creá un archivo <code>.env</code> con <code>VITE_SCRIPT_URL=tu_url</code>
      </span>
    </div>

    <!-- Loading inicial -->
    <div v-else-if="cargando && !numeros.length" class="loading-state">
      <span class="spinner" />
      <span>Cargando números...</span>
    </div>

    <NumberGrid
      v-else
      :numeros="numeros"
      :ganador="config.ganador"
      :estado-rifa="config.estado_rifa"
      @reservar="abrirModal"
    />

    <!-- Modal reserva -->
    <ReserveModal
      v-if="numeroSeleccionado"
      :numero="numeroSeleccionado"
      :config="config"
      :cargando="reservando"
      :error-externo="errorReserva"
      @confirmar="hacerReserva"
      @cerrar="cerrarModal"
    />

    <!-- Panel admin -->
    <AdminPanel
      v-if="adminVisible"
      :numeros="numeros"
      :config="config"
      @confirmar="adminConfirmar"
      @liberar="adminLiberar"
      @update-config="adminUpdateConfig"
      @cerrar="adminVisible = false"
    />

    <!-- Botón admin (⚙ en esquina) -->
    <button class="fab-admin" @click="adminVisible = true" title="Administrar">
      ⚙
    </button>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toastMsg" class="toast" :class="`toast-${toastTipo}`">
        {{ toastMsg }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
}

.error-banner {
  max-width: 1200px;
  margin: 24px auto;
  padding: 16px 24px;
  background: rgba(239,68,68,0.1);
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: var(--radius);
  font-size: 14px;
  color: #fca5a5;
}

.error-banner code {
  background: rgba(255,255,255,0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 80px 24px;
  color: var(--text-muted);
  font-size: 15px;
}

.fab-admin {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  z-index: 50;
}

.fab-admin:hover {
  background: var(--primary);
  color: white;
  border-color: transparent;
}

.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 200;
  white-space: nowrap;
  box-shadow: var(--shadow);
  max-width: 90vw;
  text-align: center;
}

.toast-ok { background: rgba(22,163,74,0.9); color: white; }
.toast-error { background: rgba(239,68,68,0.9); color: white; }
.toast-warn { background: rgba(217,119,6,0.9); color: white; }

.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(12px); }
</style>
