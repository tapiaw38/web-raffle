<script setup>
import { computed } from 'vue'
import NumberCard from './NumberCard.vue'

const props = defineProps({
  numeros: { type: Array, default: () => [] },
  ganador: { type: [String, Number], default: null },
  estadoRifa: { type: String, default: 'activa' },
})

const emit = defineEmits(['reservar'])

const stats = computed(() => ({
  total: props.numeros.length,
  disponibles: props.numeros.filter(n => n.estado === 'disponible').length,
  reservados: props.numeros.filter(n => n.estado === 'reservado').length,
  comprados: props.numeros.filter(n => n.estado === 'comprado').length,
}))

const rafFinalizada = computed(() => props.estadoRifa === 'finalizada')

function esGanador(item) {
  return rafFinalizada.value && String(item.numero) === String(props.ganador)
}
</script>

<template>
  <main class="grid-container">
    <!-- Leyenda + stats -->
    <div class="legend-row">
      <div class="stats">
        <span class="stat">
          <span class="dot dot-disponible" /> {{ stats.disponibles }} disponibles
        </span>
        <span class="stat">
          <span class="dot dot-reservado" /> {{ stats.reservados }} reservados
        </span>
        <span class="stat">
          <span class="dot dot-comprado" /> {{ stats.comprados }} comprados
        </span>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: stats.total ? `${(stats.comprados / stats.total) * 100}%` : '0%' }"
        />
      </div>
      <span class="progress-label">
        {{ stats.total ? Math.round((stats.comprados / stats.total) * 100) : 0 }}% vendido
      </span>
    </div>

    <!-- Grid -->
    <div v-if="numeros.length" class="grid">
      <NumberCard
        v-for="item in numeros"
        :key="item.numero"
        :item="item"
        :es-ganador="esGanador(item)"
        :raf-finalizada="rafFinalizada"
        @reservar="emit('reservar', $event)"
      />
    </div>
    <div v-else class="empty">
      No hay números configurados todavía.
    </div>
  </main>
</template>

<style scoped>
.grid-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.legend-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot-disponible { background: var(--disponible); }
.dot-reservado { background: var(--reservado); }
.dot-comprado { background: var(--comprado); }

.progress-bar {
  flex: 1;
  min-width: 80px;
  height: 6px;
  background: var(--bg-card);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--primary-light));
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-label {
  font-size: 13px;
  color: var(--text-muted);
  white-space: nowrap;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 8px;
}

.empty {
  text-align: center;
  padding: 60px 24px;
  color: var(--text-muted);
  font-size: 15px;
}

@media (max-width: 480px) {
  .grid-container { padding: 16px; }
  .grid { grid-template-columns: repeat(auto-fill, minmax(62px, 1fr)); gap: 6px; }
}
</style>
