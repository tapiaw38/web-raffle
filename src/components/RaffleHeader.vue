<script setup>
import { computed } from 'vue'

const props = defineProps({
  config: { type: Object, default: () => ({}) },
  cargando: Boolean,
  ultimaActualizacion: { type: Date, default: null },
})

const premios = computed(() => {
  try { return JSON.parse(props.config.premios || '[]') } catch { return [] }
})

const tiempoDesde = computed(() => {
  if (!props.ultimaActualizacion) return ''
  const diff = Math.floor((Date.now() - props.ultimaActualizacion) / 1000)
  if (diff < 10) return 'hace un momento'
  if (diff < 60) return `hace ${diff}s`
  return `hace ${Math.floor(diff / 60)}min`
})
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <div class="header-top">
        <div class="title-group">
          <h1 class="title">{{ config.titulo_rifa || 'Rifa' }}</h1>
          <p v-if="config.descripcion_rifa" class="description">{{ config.descripcion_rifa }}</p>
        </div>
        <span v-if="config.estado_rifa" class="badge" :class="`badge-${config.estado_rifa}`">
          <span class="dot" />
          {{ config.estado_rifa }}
        </span>
      </div>

      <div class="meta">
        <div v-if="config.fecha_rifa" class="meta-item">
          <span>📅</span>
          <span>Sorteo: <strong>{{ config.fecha_rifa }}</strong></span>
        </div>
        <div v-if="config.precio_numero" class="meta-item">
          <span>💰</span>
          <span>Precio: <strong>${{ config.precio_numero }}</strong></span>
        </div>
        <div v-if="config.organizador" class="meta-item">
          <span>👤</span>
          <span>Organiza: <strong>{{ config.organizador }}</strong></span>
        </div>
        <div v-if="ultimaActualizacion" class="meta-item refresh-info">
          <span v-if="cargando" class="spinner" style="width:14px;height:14px;border-width:2px" />
          <span v-else>🔄</span>
          <span>{{ cargando ? 'Actualizando...' : `Actualizado ${tiempoDesde}` }}</span>
        </div>
      </div>

      <!-- Premios -->
      <div v-if="premios.length" class="premios">
        <div v-for="(premio, i) in premios" :key="i" class="premio-card">
          <div class="premio-img-wrap">
            <img v-if="premio.url" :src="premio.url" :alt="premio.nombre" class="premio-img" />
            <span v-else class="premio-img-placeholder">🎁</span>
          </div>
          <div class="premio-info">
            <span class="premio-nombre">{{ premio.nombre }}</span>
            <span v-if="premio.cantidad > 1" class="premio-cantidad">x{{ premio.cantidad }}</span>
          </div>
        </div>
      </div>

      <div v-if="config.estado_rifa === 'finalizada' && config.ganador" class="winner-banner">
        <span class="winner-icon">🏆</span>
        <div>
          <div class="winner-label">¡Número ganador!</div>
          <div class="winner-number">{{ config.ganador }}</div>
        </div>
        <span class="winner-icon">🏆</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.title {
  font-size: 26px;
  font-weight: 800;
  background: linear-gradient(135deg, #e8e8f0, var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.description {
  font-size: 14px;
  color: var(--text-muted);
  margin-top: 2px;
}

.badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.badge-activa { background: rgba(22,163,74,0.2); color: #4ade80; }
.badge-pausada { background: rgba(217,119,6,0.2); color: #fbbf24; }
.badge-finalizada { background: rgba(202,138,4,0.2); color: #fbbf24; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; display: inline-block; }

.meta { display: flex; flex-wrap: wrap; gap: 16px; }
.meta-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); }
.refresh-info { margin-left: auto; }

.premios {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.premio-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 14px 8px 8px;
  min-width: 0;
}

.premio-img-wrap {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.premio-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.premio-img-placeholder { font-size: 24px; }

.premio-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.premio-nombre {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.premio-cantidad {
  font-size: 11px;
  color: var(--primary-light);
  font-weight: 600;
}

.winner-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: linear-gradient(135deg, rgba(202,138,4,0.15), rgba(202,138,4,0.08));
  border: 1px solid rgba(202,138,4,0.4);
  border-radius: var(--radius);
  padding: 14px 24px;
  text-align: center;
  animation: pulse-gold 2s ease-in-out infinite;
}

.winner-icon { font-size: 28px; }
.winner-label { font-size: 12px; color: var(--ganador); font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
.winner-number { font-size: 36px; font-weight: 800; color: #fbbf24; }

@keyframes pulse-gold {
  0%, 100% { box-shadow: 0 0 0 0 rgba(202,138,4,0.2); }
  50% { box-shadow: 0 0 20px 4px rgba(202,138,4,0.2); }
}

@media (max-width: 600px) {
  .header-inner { padding: 16px; }
  .title { font-size: 20px; }
  .refresh-info { margin-left: 0; }
}
</style>
