<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  item: { type: Object, required: true },
  esGanador: Boolean,
  rafFinalizada: Boolean,
})

const emit = defineEmits(['reservar'])

const tiempoRestante = ref('')
let timer = null

function calcularTiempo() {
  if (props.item.estado !== 'reservado' || !props.item.reservado_en) {
    tiempoRestante.value = ''
    return
  }
  const expira = new Date(new Date(props.item.reservado_en).getTime() + 15 * 60 * 1000)
  const diff = expira - Date.now()

  if (diff <= 0) {
    tiempoRestante.value = 'Expirando...'
    return
  }

  const m = Math.floor(diff / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  tiempoRestante.value = `${m}:${s.toString().padStart(2, '0')}`
}

function iniciarTimer() {
  clearInterval(timer)
  calcularTiempo()
  if (props.item.estado === 'reservado') {
    timer = setInterval(calcularTiempo, 1000)
  }
}

watch(() => props.item, iniciarTimer, { immediate: true })
onMounted(iniciarTimer)
onUnmounted(() => clearInterval(timer))

const esClickable = computed(
  () => props.item.estado === 'disponible' && !props.rafFinalizada,
)

function handleClick() {
  if (esClickable.value) emit('reservar', props.item)
}
</script>

<template>
  <button
    class="card"
    :class="[
      `estado-${item.estado}`,
      { ganador: esGanador, clickable: esClickable, finalizada: rafFinalizada && item.estado !== 'comprado' },
    ]"
    :disabled="!esClickable"
    :title="
      item.estado === 'disponible'
        ? `Reservar número ${item.numero}`
        : item.estado === 'reservado'
        ? `Reservado por ${item.comprador}`
        : `Comprado por ${item.comprador}`
    "
    @click="handleClick"
  >
    <span class="num" :class="{ tachado: item.estado === 'comprado' && !esGanador }">
      {{ item.numero }}
    </span>

    <span v-if="item.estado !== 'disponible' && item.comprador" class="buyer">
      {{ item.comprador }}
    </span>

    <span v-if="item.estado === 'reservado'" class="timer">
      {{ tiempoRestante || '...' }}
    </span>

    <span v-if="esGanador" class="winner-star">⭐</span>
  </button>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 8px 4px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: var(--bg-card);
  transition: all 0.15s;
  min-height: 72px;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.card.clickable {
  cursor: pointer;
}

.card.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

/* Disponible */
.estado-disponible {
  border-color: var(--disponible-border);
  background: var(--disponible-bg);
}
.estado-disponible:hover {
  background: rgba(22, 163, 74, 0.25) !important;
  border-color: var(--disponible) !important;
}

/* Reservado */
.estado-reservado {
  border-color: var(--reservado-border);
  background: var(--reservado-bg);
}

/* Comprado */
.estado-comprado {
  border-color: var(--comprado-border);
  background: var(--comprado-bg);
  cursor: default;
}

/* Ganador */
.ganador {
  border-color: var(--ganador-border) !important;
  background: var(--ganador-bg) !important;
  box-shadow: 0 0 16px rgba(202, 138, 4, 0.3);
  animation: pulse-gold 2s ease-in-out infinite;
}

@keyframes pulse-gold {
  0%, 100% { box-shadow: 0 0 8px rgba(202,138,4,0.3); }
  50% { box-shadow: 0 0 20px rgba(202,138,4,0.5); }
}

.num {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.estado-disponible .num { color: #4ade80; }
.estado-reservado .num { color: #fbbf24; }
.estado-comprado .num { color: #94a3b8; }
.ganador .num { color: #fbbf24; }

.tachado {
  text-decoration: line-through;
  opacity: 0.6;
}

.buyer {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
  text-align: center;
}

.estado-reservado .buyer { color: #fbbf24; opacity: 0.8; }
.estado-comprado .buyer { color: #94a3b8; }

.timer {
  font-size: 10px;
  color: #fb923c;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.winner-star {
  position: absolute;
  top: 3px;
  right: 4px;
  font-size: 10px;
}
</style>
