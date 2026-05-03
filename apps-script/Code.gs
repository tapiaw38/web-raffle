// ================================================================
// CONFIGURACIÓN - Editá estos valores
// ================================================================
const SPREADSHEET_ID = 'TU_SPREADSHEET_ID_AQUI';
const ADMIN_TOKEN    = 'TU_CONTRASEÑA_ADMIN_AQUI'; // Misma que ponés en el panel
const EXPIRE_MS      = 15 * 60 * 1000;             // 15 minutos
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
  return jsonError('Clave de configuración no encontrada: ' + key);
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
