<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  numeros: { type: Array, default: () => [] },
  config: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['confirmar', 'liberar', 'updateConfig', 'cerrar'])

const CONFIG_FIELDS = {
  titulo_rifa: 'Título',
  descripcion_rifa: 'Descripción',
  fecha_rifa: 'Fecha del sorteo',
  precio_numero: 'Precio por número ($)',
  alias_transferencia: 'Alias de transferencia',
  banco: 'Banco',
  cbu: 'CBU',
  organizador: 'Organizador',
  estado_rifa: 'Estado de la rifa',
  ganador: 'Número ganador',
}

const password = ref('')
const token = ref(localStorage.getItem('raffle_admin_token') || '')
const autenticado = ref(!!token.value)
const errMsg = ref('')
const cargandoAccion = ref(null)

const configEdit = ref(
  Object.fromEntries(Object.keys(CONFIG_FIELDS).map(k => [k, props.config[k] || ''])),
)

function parsePremios(cfg) {
  try { return JSON.parse(cfg.premios || '[]') } catch { return [] }
}

const premiosEdit = ref(parsePremios(props.config))

function sincronizarConfig() {
  Object.keys(CONFIG_FIELDS).forEach(k => {
    configEdit.value[k] = props.config[k] || ''
  })
  premiosEdit.value = parsePremios(props.config)
}

function agregarPremio() {
  premiosEdit.value.push({ nombre: '', cantidad: 1, url: '' })
}

function eliminarPremio(i) {
  premiosEdit.value.splice(i, 1)
}

function guardarPremios() {
  accion(
    () => emit('updateConfig', { key: 'premios', value: JSON.stringify(premiosEdit.value), token: token.value }),
    'cfg-premios',
  )
}

function login() {
  if (!password.value.trim()) return
  token.value = password.value.trim()
  localStorage.setItem('raffle_admin_token', token.value)
  autenticado.value = true
  errMsg.value = ''
  sincronizarConfig()
}

function logout() {
  token.value = ''
  localStorage.removeItem('raffle_admin_token')
  autenticado.value = false
  password.value = ''
}

if (autenticado.value) sincronizarConfig()

const reservados = computed(() => props.numeros.filter(n => n.estado === 'reservado'))

async function accion(fn, id) {
  try {
    errMsg.value = ''
    cargandoAccion.value = id
    await fn()
  } catch (e) {
    errMsg.value = e.message
  } finally {
    cargandoAccion.value = null
  }
}

function confirmar(numero) {
  accion(() => emit('confirmar', { numero, token: token.value }), `c-${numero}`)
}

function liberar(numero) {
  accion(() => emit('liberar', { numero, token: token.value }), `l-${numero}`)
}

function guardarConfig(key) {
  accion(
    () => emit('updateConfig', { key, value: configEdit.value[key], token: token.value }),
    `cfg-${key}`,
  )
}

function onOverlayClick(e) {
  if (e.target === e.currentTarget) emit('cerrar')
}
</script>

<template>
  <div class="overlay" @click="onOverlayClick">
    <div class="panel">
      <div class="panel-header">
        <h2>Panel Admin</h2>
        <div class="header-actions">
          <button v-if="autenticado" class="btn btn-ghost btn-sm" @click="logout">
            Cerrar sesión
          </button>
          <button class="close-btn" @click="emit('cerrar')">✕</button>
        </div>
      </div>

      <!-- Login -->
      <div v-if="!autenticado" class="login-form">
        <p class="login-hint">Ingresá la contraseña de administrador</p>
        <form class="field-row" @submit.prevent="login">
          <input
            v-model="password"
            type="password"
            placeholder="Contraseña"
            autofocus
          />
          <button type="submit" class="btn btn-primary" :disabled="!password.trim()">
            Entrar
          </button>
        </form>
        <p v-if="errMsg" class="err">{{ errMsg }}</p>
      </div>

      <!-- Panel autenticado -->
      <div v-else class="panel-body">
        <p v-if="errMsg" class="err">{{ errMsg }}</p>

        <!-- Reservas pendientes -->
        <section>
          <h3 class="section-title">
            Reservas pendientes
            <span class="count">{{ reservados.length }}</span>
          </h3>
          <div v-if="reservados.length === 0" class="empty-section">
            No hay reservas pendientes
          </div>
          <div v-else class="reservas-list">
            <div v-for="item in reservados" :key="item.numero" class="reserva-item">
              <div class="reserva-info">
                <span class="reserva-num">#{{ item.numero }}</span>
                <div>
                  <div class="reserva-comprador">{{ item.comprador }}</div>
                  <div v-if="item.reservado_en" class="reserva-time">
                    {{ new Date(item.reservado_en).toLocaleTimeString('es-AR') }}
                  </div>
                </div>
              </div>
              <div class="reserva-acciones">
                <button
                  class="btn btn-success btn-sm"
                  :disabled="cargandoAccion === `c-${item.numero}`"
                  @click="confirmar(item.numero)"
                >
                  <span v-if="cargandoAccion === `c-${item.numero}`" class="spinner" style="width:12px;height:12px" />
                  <span v-else>✓</span>
                </button>
                <button
                  class="btn btn-danger btn-sm"
                  :disabled="cargandoAccion === `l-${item.numero}`"
                  @click="liberar(item.numero)"
                >
                  <span v-if="cargandoAccion === `l-${item.numero}`" class="spinner" style="width:12px;height:12px" />
                  <span v-else>✗</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Config -->
        <section>
          <h3 class="section-title">Configuración</h3>
          <div class="config-grid">
            <div v-for="(label, key) in CONFIG_FIELDS" :key="key" class="config-field">
              <label>{{ label }}</label>
              <div class="config-input-row">
                <select v-if="key === 'estado_rifa'" v-model="configEdit[key]">
                  <option value="activa">activa</option>
                  <option value="pausada">pausada</option>
                  <option value="finalizada">finalizada</option>
                </select>
                <input v-else v-model="configEdit[key]" type="text" />
                <button
                  class="btn btn-ghost btn-sm"
                  @click="guardarConfig(key)"
                  :disabled="cargandoAccion === `cfg-${key}`"
                >
                  <span v-if="cargandoAccion === `cfg-${key}`" class="spinner" style="width:12px;height:12px" />
                  <span v-else>OK</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Premios -->
        <section>
          <h3 class="section-title">
            Premios
            <span class="count">{{ premiosEdit.length }}</span>
          </h3>
          <div class="premios-list">
            <div v-for="(premio, i) in premiosEdit" :key="i" class="premio-item">
              <div class="premio-fields">
                <div class="config-field">
                  <label>Nombre</label>
                  <input v-model="premio.nombre" type="text" placeholder="Ej: TV 55&quot;" />
                </div>
                <div class="config-field">
                  <label>Cantidad</label>
                  <input v-model.number="premio.cantidad" type="number" min="1" placeholder="1" />
                </div>
                <div class="config-field">
                  <label>URL de imagen</label>
                  <input v-model="premio.url" type="text" placeholder="https://..." />
                </div>
              </div>
              <button class="btn btn-danger btn-sm btn-icon" @click="eliminarPremio(i)" title="Eliminar">✕</button>
            </div>
            <div v-if="premiosEdit.length === 0" class="empty-section">No hay premios cargados</div>
          </div>
          <div class="premios-footer">
            <button class="btn btn-ghost btn-sm" @click="agregarPremio">+ Agregar premio</button>
            <button
              class="btn btn-primary btn-sm"
              @click="guardarPremios"
              :disabled="cargandoAccion === 'cfg-premios'"
            >
              <span v-if="cargandoAccion === 'cfg-premios'" class="spinner" style="width:12px;height:12px" />
              <span v-else>Guardar premios</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  z-index: 100;
  backdrop-filter: blur(4px);
  animation: fade-in 0.15s ease;
}
@keyframes fade-in { from { opacity: 0; } }

.panel {
  background: #13131f;
  border-left: 1px solid var(--border);
  width: 100%;
  max-width: 420px;
  height: 100vh;
  overflow-y: auto;
  animation: slide-left 0.2s ease;
}
@keyframes slide-left { from { transform: translateX(40px); opacity: 0; } }

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: #13131f;
  z-index: 1;
}
.panel-header h2 { font-size: 18px; font-weight: 700; }
.header-actions { display: flex; gap: 8px; align-items: center; }
.close-btn { background: none; border: none; color: var(--text-muted); font-size: 18px; cursor: pointer; padding: 4px; line-height: 1; }
.close-btn:hover { color: var(--text); }

.login-form { padding: 32px 24px; display: flex; flex-direction: column; gap: 16px; }
.login-hint { font-size: 14px; color: var(--text-muted); }
.field-row { display: flex; gap: 8px; }
.field-row input {
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  padding: 10px 14px;
  font-size: 15px;
  outline: none;
  font-family: inherit;
}
.field-row input:focus { border-color: var(--primary-light); }

.panel-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 28px; }

.section-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.count { background: var(--primary); color: white; border-radius: 10px; padding: 1px 7px; font-size: 11px; }
.empty-section { font-size: 13px; color: var(--text-muted); padding: 12px 0; text-align: center; }

.reservas-list { display: flex; flex-direction: column; gap: 8px; }
.reserva-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
}
.reserva-info { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.reserva-num { font-size: 18px; font-weight: 700; color: #fbbf24; flex-shrink: 0; }
.reserva-comprador { font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.reserva-time { font-size: 11px; color: var(--text-muted); }
.reserva-acciones { display: flex; gap: 6px; flex-shrink: 0; }

.config-grid { display: flex; flex-direction: column; gap: 12px; }
.config-field { display: flex; flex-direction: column; gap: 4px; }
.config-field label { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.config-input-row { display: flex; gap: 8px; }
.config-input-row input,
.config-input-row select {
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  padding: 8px 10px;
  font-size: 13px;
  outline: none;
  font-family: inherit;
}
.config-input-row input:focus,
.config-input-row select:focus { border-color: var(--primary-light); }
.config-input-row select option { background: #1a1a2e; }

.btn-sm { padding: 6px 12px; font-size: 12px; }
.err { font-size: 13px; color: #f87171; background: rgba(239,68,68,0.1); padding: 10px 14px; border-radius: 6px; }

@media (max-width: 480px) { .panel { max-width: 100%; } }

.premios-list { display: flex; flex-direction: column; gap: 10px; }
.premio-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px;
}
.premio-fields { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; }
.premio-fields input {
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  padding: 7px 10px;
  font-size: 13px;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}
.premio-fields input:focus { border-color: var(--primary-light); }
.btn-icon { padding: 6px 8px; flex-shrink: 0; margin-top: 2px; }
.premios-footer { display: flex; justify-content: space-between; margin-top: 10px; gap: 8px; }
</style>
