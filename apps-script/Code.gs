// ================================================================
// CONFIGURACIÓN - Editá estos valores
// ================================================================
const SPREADSHEET_ID = 'TU_SPREADSHEET_ID_AQUI';
const ADMIN_TOKEN    = 'TU_CONTRASEÑA_ADMIN_AQUI'; // Misma que ponés en el panel
const EXPIRE_MS      = 15 * 60 * 1000;             // 15 minutos
// ================================================================
//
// ESTRUCTURA ESPERADA DE LA PLANILLA
// ───────────────────────────────────
// Hoja "numeros"  →  columnas: numero | estado | comprador | reservado_en
//   1  | disponible |            |
//   2  | disponible |            |
//   …
//
// Hoja "config"   →  columnas: key | value
//   titulo_rifa        | Mi Rifa 2024
//   descripcion_rifa   | Descripción de la rifa
//   fecha_rifa         | 31/12/2024
//   precio_numero      | 1000
//   alias_transferencia| alias.banco
//   banco              | Banco Ejemplo
//   cbu                | 0000000000000000000000
//   organizador        | Juan Pérez
//   estado_rifa        | activa
//   ganador            |
//   premios            | [{"nombre":"TV 55\"","cantidad":1,"url":"https://ejemplo.com/tv.jpg"},{"nombre":"Notebook","cantidad":1,"url":"https://ejemplo.com/notebook.jpg"}]
//
// Ejecutá la función setup() UNA SOLA VEZ desde el editor de Apps Script
// para crear las hojas con datos de ejemplo.
// ================================================================

function doGet(e) {
  try {
    const action = e.parameter.action || 'getData';

    if (action === 'getData') {
      expirarReservas();
      return jsonOk(getAllData());
    }

    if (action === 'reservar') {
      const { numero, comprador } = e.parameter;
      if (!numero || !comprador) return jsonError('Faltan parámetros');
      return reservarNumero(numero, decodeURIComponent(comprador));
    }

    if (action === 'confirmar') {
      if (e.parameter.token !== ADMIN_TOKEN) return jsonError('No autorizado');
      return confirmarCompra(e.parameter.numero);
    }

    if (action === 'liberar') {
      if (e.parameter.token !== ADMIN_TOKEN) return jsonError('No autorizado');
      return liberarNumero(e.parameter.numero);
    }

    if (action === 'updateConfig') {
      if (e.parameter.token !== ADMIN_TOKEN) return jsonError('No autorizado');
      return actualizarConfig(e.parameter.key, e.parameter.value);
    }

    return jsonError('Acción desconocida');
  } catch (err) {
    return jsonError(err.toString());
  }
}

// ----------------------------------------------------------------

function getAllData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Números
  const numSheet = ss.getSheetByName('numeros');
  const numRows  = numSheet.getDataRange().getValues().slice(1); // saltar cabecera
  const numeros  = numRows
    .filter(r => r[0] !== '')
    .map(r => ({
      numero:      r[0],
      estado:      r[1] || 'disponible',
      comprador:   r[2] || '',
      reservado_en: r[3] ? String(r[3]) : null,
    }));

  // Config
  const cfgSheet = ss.getSheetByName('config');
  const cfgRows  = cfgSheet.getDataRange().getValues().slice(1);
  const config   = {};
  cfgRows.forEach(r => { if (r[0]) config[r[0]] = r[1]; });

  return { numeros, config };
}

function expirarReservas() {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('numeros');
  const data  = sheet.getDataRange().getValues();
  const ahora = Date.now();

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === 'reservado' && data[i][3]) {
      const reservadoEn = new Date(data[i][3]).getTime();
      if (ahora - reservadoEn > EXPIRE_MS) {
        sheet.getRange(i + 1, 2).setValue('disponible');
        sheet.getRange(i + 1, 3).setValue('');
        sheet.getRange(i + 1, 4).setValue('');
      }
    }
  }
}

function reservarNumero(numero, comprador) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('numeros');
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(numero)) {
      // Chequear si ya expiró (puede haber una reserva vieja)
      if (data[i][1] === 'reservado' && data[i][3]) {
        const reservadoEn = new Date(data[i][3]).getTime();
        if (Date.now() - reservadoEn <= EXPIRE_MS) {
          return jsonError('El número ya está reservado');
        }
        // Expiró, se puede reservar igual
      } else if (data[i][1] !== 'disponible') {
        return jsonError('El número no está disponible');
      }

      sheet.getRange(i + 1, 2).setValue('reservado');
      sheet.getRange(i + 1, 3).setValue(comprador);
      sheet.getRange(i + 1, 4).setValue(new Date().toISOString());
      return jsonOk({ success: true });
    }
  }
  return jsonError('Número no encontrado');
}

function confirmarCompra(numero) {
  return actualizarEstado(numero, (fila, sheet, i) => {
    sheet.getRange(i + 1, 2).setValue('comprado');
    sheet.getRange(i + 1, 4).setValue('');
  });
}

function liberarNumero(numero) {
  return actualizarEstado(numero, (fila, sheet, i) => {
    sheet.getRange(i + 1, 2).setValue('disponible');
    sheet.getRange(i + 1, 3).setValue('');
    sheet.getRange(i + 1, 4).setValue('');
  });
}

function actualizarEstado(numero, fn) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('numeros');
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(numero)) {
      fn(data[i], sheet, i);
      return jsonOk({ success: true });
    }
  }
  return jsonError('Número no encontrado');
}

function actualizarConfig(key, value) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('config');
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return jsonOk({ success: true });
    }
  }
  // Clave no encontrada → agregar fila nueva
  sheet.appendRow([key, value]);
  return jsonOk({ success: true });
}

// ----------------------------------------------------------------

function jsonOk(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================================================================
// SETUP - Ejecutá esta función UNA SOLA VEZ para inicializar la planilla
// ================================================================
function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // ── Hoja "numeros" ──────────────────────────────────────────────
  let numSheet = ss.getSheetByName('numeros');
  if (!numSheet) numSheet = ss.insertSheet('numeros');
  numSheet.clearContents();
  numSheet.appendRow(['numero', 'estado', 'comprador', 'reservado_en']);
  for (let i = 1; i <= 100; i++) {
    numSheet.appendRow([i, 'disponible', '', '']);
  }

  // ── Hoja "config" ───────────────────────────────────────────────
  let cfgSheet = ss.getSheetByName('config');
  if (!cfgSheet) cfgSheet = ss.insertSheet('config');
  cfgSheet.clearContents();
  cfgSheet.appendRow(['key', 'value']);

  const premiosEjemplo = JSON.stringify([
    { nombre: 'TV 55"',    cantidad: 1, url: 'https://ejemplo.com/tv.jpg' },
    { nombre: 'Notebook',  cantidad: 1, url: 'https://ejemplo.com/notebook.jpg' },
    { nombre: 'Auriculares', cantidad: 2, url: 'https://ejemplo.com/auriculares.jpg' },
  ]);

  const configDefaults = [
    ['titulo_rifa',         'Mi Rifa 2024'],
    ['descripcion_rifa',    'Descripción de la rifa'],
    ['fecha_rifa',          '31/12/2024'],
    ['precio_numero',       '1000'],
    ['alias_transferencia', 'alias.banco'],
    ['banco',               'Banco Ejemplo'],
    ['cbu',                 '0000000000000000000000'],
    ['organizador',         'Juan Pérez'],
    ['estado_rifa',         'activa'],
    ['ganador',             ''],
    ['premios',             premiosEjemplo],
  ];

  configDefaults.forEach(row => cfgSheet.appendRow(row));

  Logger.log('✅ Setup completado: hojas "numeros" (100 números) y "config" creadas con datos de ejemplo.');
}
