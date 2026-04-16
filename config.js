// ============================================================
// config.js — Configuración central del Dashboard de Producción
// Grupo Erlo S.A. / Heavendly Digital
// Versión 1.0 — Abril 2026
//
// INSTRUCCIONES: Este es el único archivo que se edita al
// cambiar de entorno (desarrollo → producción) o al modificar
// URLs de SharePoint o GitHub.
// ============================================================

const ERLO_CONFIG = {

  // ── FUENTES DE DATOS (GitHub Pages) ──────────────────────
  // Los flujos de Power Automate escriben estos archivos cada 5 min
  DATA: {
    OPS:       'https://csotoajoy.github.io/grupoerlo/ps_data.json',
    INVENTARIO:'https://csotoajoy.github.io/grupoerlo/ps_inventario.json',
  },

  // ── SHAREPOINT ───────────────────────────────────────────
  SHAREPOINT: {
    SITE: 'https://grupoerlocr677.sharepoint.com/sites/GrupoErloHeavenlyDigital',
    LISTAS: {
      ORDENES_PRODUCCION:  '8cd59792-3b1b-47a5-964c-43391afc4a34',
      INVENTARIO_PT:       '5ca15c72-a54e-46e2-adae-470b98454889',
      INVENTARIO_SKU:      'a1e1ede2-f21d-4637-b1a1-1816492b408a',
      CONSOLIDADO_OCS:     '659e7e7d-aa5c-4655-b719-bed18fe1352c',
    },
  },

  // ── REFRESH ───────────────────────────────────────────────
  // Intervalo de actualización automática en milisegundos
  REFRESH_MS: 30000, // 30 segundos

  // ── ESTACIONES ───────────────────────────────────────────
  // Valores exactos del catálogo estandarizado.
  // Cualquier valor fuera de esta lista no será reconocido por el dashboard.
  ESTACIONES: [
    { id: 'A-Cambio de Molde',          grupo: 'A', short: 'Cambio de Molde' },
    { id: 'A-Preparar Resina',          grupo: 'A', short: 'Preparar Resina' },
    { id: 'A-Quimico',                  grupo: 'A', short: 'Quimico' },
    { id: 'B-Inyección Soplado',        grupo: 'B', short: 'Inyección / Soplado' },
    { id: 'B-Maquina Bolitas',          grupo: 'B', short: 'Maquina Bolitas' },
    { id: 'C-Etiquetado y Serigrafía',  grupo: 'C', short: 'Etiquetado' },
    { id: 'C-Armar Tapas',              grupo: 'C', short: 'Armar Tapas' },
    { id: 'C-Re-etiquetado Scrap',      grupo: 'C', short: 'Re-etiquetado' },
    { id: 'D-Llenado',                  grupo: 'D', short: 'Llenado' },
    { id: 'E-Alisto',                   grupo: 'E', short: 'Alisto' },
    { id: 'F-Entregas Chofer',          grupo: 'F', short: 'Entregas' },
    { id: 'G-Mantenimiento',            grupo: 'G', short: 'Mantenimiento' },
    { id: 'H-Inventario',               grupo: 'H', short: 'Inventario' },
    { id: 'I-Tareas Varias',            grupo: 'I', short: 'Tareas Varias' },
  ],

  // ── MÁQUINAS ─────────────────────────────────────────────
  MAQUINAS: [
    'Sopladora',
    'Inyectora 1',
    'Inyectora 2',
    'Inyección soplado (Ametralladora)',
    'Maquina de Bolitas',
    'Etiquetadora 1',
    'Etiquetadora 2',
    'Horno Serigrafía',
    'Serigrafia',
    'Llenadora Roll On Grande',
    'Llenadora Roll On Pequeño',
    'Llenadora de Crema',
    'Llenadora de Talco',
    'Llenadora de Gel',
    'Batidoras',
    'Horno Ofertas',
    'Compresor',
  ],

  // ── PRIORIDADES ───────────────────────────────────────────
  PRIORIDADES: {
    'URGENTE':   { color: '#e74c3c', glow: 'rgba(231,76,60,0.25)' },
    'A':         { color: '#e67e22', glow: 'rgba(230,126,34,0.25)' },
    'B':         { color: '#3498db', glow: 'rgba(52,152,219,0.25)' },
    'C':         { color: '#2ecc71', glow: 'rgba(46,204,113,0.25)' },
    'BLOQUEADA': { color: '#9b59b6', glow: 'rgba(155,89,182,0.25)' },
  },

  // ── ESTADOS ──────────────────────────────────────────────
  // Valores exactos del choice de SharePoint
  ESTADOS: {
    'Pendiente':     { color: '#4a5a78', bg: 'rgba(74,90,120,0.12)'  },
    'En Producción': { color: '#2ecc71', bg: 'rgba(46,204,113,0.15)' },
    'Pausada':       { color: '#f39c12', bg: 'rgba(243,156,18,0.15)' },
    'Bloqueada':     { color: '#e74c3c', bg: 'rgba(231,76,60,0.15)'  },
    'Completada':    { color: '#2ecc71', bg: 'rgba(46,204,113,0.12)' },
  },

  // ── RESINAS ──────────────────────────────────────────────
  RESINAS: [
    { nombre: 'Alta Soplado Tradicional',   codigos: ['5502-HDPE','HB-5502-B','Q-5502BN','HD-5502-BAY'], proceso: 'Soplado' },
    { nombre: 'Alta Tradicional Inyección', codigos: ['HD1750NCA','ME-9180','LH-5420'],                  proceso: 'Inyección' },
    { nombre: 'PP Clarificado Inyección',   codigos: ['J590K','45R60CD'],                                proceso: 'Inyección' },
    { nombre: 'PP Clarificado Soplado',     codigos: ['02R01CA-1','SB-520','R301'],                      proceso: 'Soplado' },
    { nombre: 'PP Para Bolitas',            codigos: ['01H41'],                                           proceso: 'Bolitas' },
  ],

  // ── TIEMPO MUERTO ─────────────────────────────────────────
  // Minutos máximos entre fin de una OP y inicio de la siguiente
  // en la misma máquina antes de generar alerta en el Gantt
  ALERTA_TIEMPO_MUERTO_MIN: 60,

  // ── CAMIÓN / DESPACHO ────────────────────────────────────
  CAMION: {
    CAPACIDAD_M3:     10,
    MINIMO_DESPACHO:  0.5,  // 50% de capacidad = 5 m³
    CAJAS: {
      Elopack: 0.037,
      Talco:   0.048,
      Tipo3:   0.024,
      Tipo4:   0.026,
    },
  },

  // ── FRASES 5S (pantalla sin OP activa) ───────────────────
  FRASES_5S: [
    'Un lugar para cada cosa, y cada cosa en su lugar.',
    'La limpieza es el primer paso hacia la calidad.',
    'Organización hoy, eficiencia mañana.',
    'El orden en planta refleja el orden en la mente.',
    'Eliminar lo innecesario libera espacio para lo importante.',
    'Estandarizar hoy evita errores mañana.',
    'La disciplina convierte los buenos hábitos en rutina.',
    'El tiempo invertido en orden se recupera en productividad.',
    'Una planta limpia es una planta segura.',
    'Seiso: limpiar es inspeccionar.',
  ],

  // ── GITHUB PAGES ─────────────────────────────────────────
  GITHUB: {
    REPO:  'https://csotoajoy.github.io/grupoerlo',
    URLS: {
      ESTACION:   'https://csotoajoy.github.io/grupoerlo/estacion.html',
      RECEPCION:  'https://csotoajoy.github.io/grupoerlo/recepcion.html',
      SUPERVISOR: 'https://csotoajoy.github.io/grupoerlo/supervisor.html',
    },
  },

};

// Exportar para uso en módulos (opcional)
if (typeof module !== 'undefined') module.exports = ERLO_CONFIG;
