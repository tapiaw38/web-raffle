<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  numero: { type: Object, required: true },
  config: { type: Object, default: () => ({}) },
  cargando: { type: Boolean, default: false },
  errorExterno: { type: String, default: '' },
})

const emit = defineEmits(['confirmar', 'cerrar'])

const nombre = ref('')
const errorLocal = ref('')

const nombreValido = computed(() => nombre.value.trim().length >= 2)
const errorMsg = computed(() => errorLocal.value || props.errorExterno)

function confirmar() {
  if (!nombreValido.value) {
    errorLocal.value = 'Ingresá tu nombre (mínimo 2 caracteres)'
    return
  }
  errorLocal.value = ''
  emit('confirmar', {
    numero: props.numero.numero,
    comprador: nombre.value.trim(),
  })
}

function onOverlayClick(e) {
  if (e.target === e.currentTarget) emit('cerrar')
}
</script>

<template>
  <div class="overlay" @click="onOverlayClick">
    <div class="modal" role="dialog" aria-modal="true">
      <button class="close-btn" @click="emit('cerrar')" aria-label="Cerrar">✕</button>

      <div class="modal-header">
        <div class="numero-badge">{{ numero.numero }}</div>
        <h2>Reservar número</h2>
        <p class="subtitle">Completá el formulario y realizá la transferencia</p>
      </div>

      <div class="modal-body">
        <!-- Nombre -->
        <div class="field">
          <label for="nombre">Tu nombre o alias</label>
          <input
            id="nombre"
            v-model="nombre"
            type="text"
            placeholder="Ej: Juan García"
            maxlength="40"
            @keydown.enter="confirmar"
            autofocus
          />
          <span v-if="errorMsg" class="error-msg">{{ errorMsg }}</span>
        </div>

        <!-- Info transferencia -->
        <div class="transfer-box">
          <div class="transfer-title">Datos para la transferencia</div>
          <div v-if="config.precio_numero" class="transfer-row">
            <span class="transfer-icon">💰</span>
            <span>Monto: <strong>${{ config.precio_numero }}</strong></span>
          </div>
          <div v-if="config.alias_transferencia" class="transfer-row">
            <span class="transfer-icon">🏦</span>
            <span>Alias: <strong class="alias">{{ config.alias_transferencia }}</strong></span>
          </div>
          <div v-if="config.banco" class="transfer-row">
            <span class="transfer-icon">🏛️</span>
            <span>Banco: <strong>{{ config.banco }}</strong></span>
          </div>
          <div v-if="config.cbu" class="transfer-row">
            <span class="transfer-icon">🔢</span>
            <span>CBU: <strong class="alias">{{ config.cbu }}</strong></span>
          </div>
        </div>

        <!-- Aviso -->
        <div class="notice">
          <span class="notice-icon">⏱️</span>
          <p>
            Tu número quedará <strong>reservado por 15 minutos</strong>.
            Una vez que el organizador confirme el pago, pasará a <strong>COMPRADO</strong>.
            Si no se confirma a tiempo, quedará disponible nuevamente.
          </p>
        </div>
      </div>

      <div v-if="errorMsg" class="error-api" style="margin: 0 28px 8px">
        <span>⚠️</span>
        <span>{{ errorMsg }}</span>
      </div>

      <div class="modal-footer">
        <button class="btn btn-ghost" @click="emit('cerrar')" :disabled="cargando">
          Cancelar
        </button>
        <button
          class="btn btn-primary"
          @click="confirmar"
          :disabled="!nombreValido || cargando"
        >
          <span v-if="cargando" class="spinner" />
          <span v-else>Reservar número {{ numero.numero }}</span>
        </button>
      </div>

      <!-- Overlay de carga sobre el modal -->
      <Transition name="fade">
        <div v-if="cargando" class="loading-overlay">
          <div class="loading-box">
            <span class="spinner spinner-lg" />
            <span>Reservando...</span>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
  backdrop-filter: blur(4px);
  animation: fade-in 0.15s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
}

.modal {
  background: #1a1a2e;
  border: 1px solid var(--border);
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  position: relative;
  box-shadow: var(--shadow);
  animation: slide-up 0.2s ease;
}

@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 18px;
  line-height: 1;
  padding: 4px;
  cursor: pointer;
  transition: color 0.1s;
}
.close-btn:hover { color: var(--text); }

.modal-header {
  padding: 28px 28px 0;
  text-align: center;
}

.numero-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  font-size: 26px;
  font-weight: 800;
  margin-bottom: 12px;
  box-shadow: 0 0 24px rgba(124,58,237,0.4);
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 700;
}

.subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

.modal-body {
  padding: 20px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}

.field input {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  padding: 10px 14px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.15s;
}

.field input:focus {
  border-color: var(--primary-light);
}

.error-msg {
  font-size: 12px;
  color: #f87171;
}

.transfer-box {
  background: rgba(124, 58, 237, 0.08);
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transfer-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--primary-light);
  margin-bottom: 2px;
}

.transfer-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.transfer-icon { font-size: 16px; }

.alias {
  font-family: 'Courier New', monospace;
  background: rgba(255,255,255,0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.notice {
  display: flex;
  gap: 10px;
  background: rgba(217,119,6,0.1);
  border: 1px solid rgba(217,119,6,0.25);
  border-radius: 8px;
  padding: 12px 14px;
}

.notice-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
.notice p { font-size: 13px; color: #d4af7a; line-height: 1.5; }

.modal-footer {
  padding: 0 28px 24px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(13, 13, 26, 0.85);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(2px);
}

.loading-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  color: var(--text-muted);
  font-size: 14px;
}

.spinner-lg {
  width: 36px !important;
  height: 36px !important;
  border-width: 3px !important;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.error-api {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #fca5a5;
}

@media (max-width: 480px) {
  .modal-header, .modal-body { padding-inline: 20px; }
  .modal-footer { padding-inline: 20px; flex-direction: column; }
  .modal-footer .btn { width: 100%; }
}
</style>
