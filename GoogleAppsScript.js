// ==========================================
// SCRIPT BACKEND SIMPDB (Sistem Penjadwalan Kuliah)
// Copy script ini ke: Extensions > Apps Script
// ==========================================

// Mapping Nama Sheet dan Kolom Data
const TABLES = {
  courses: {
    sheet: 'Courses',
    columns: ['id', 'code', 'name', 'credits']
  },
  lecturers: {
    sheet: 'Lecturers',
    columns: ['id', 'name', 'nip', 'position', 'expertise']
  },
  rooms: {
    sheet: 'Rooms',
    columns: ['id', 'name', 'capacity', 'building', 'location']
  },
  classes: {
    sheet: 'Classes',
    columns: ['id', 'name']
  },
  schedule: {
    sheet: 'Schedule',
    columns: ['id', 'courseId', 'lecturerId', 'roomId', 'className', 'day', 'timeSlot']
  }
};

// 1. Fungsi Setup Awal (Jalankan ini sekali saja)
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Object.keys(TABLES).forEach(key => {
    const config = TABLES[key];
    let sheet = ss.getSheetByName(config.sheet);
    
    if (!sheet) {
      sheet = ss.insertSheet(config.sheet);
      // Buat Header
      sheet.appendRow(config.columns);
      // Bekukan baris pertama
      sheet.setFrozenRows(1);
      // Bold header
      sheet.getRange(1, 1, 1, config.columns.length).setFontWeight('bold');
    }
  });
}

// 2. Menangani Request GET (Mengambil Data)
function doGet(e) {
  const result = {};
  
  try {
    Object.keys(TABLES).forEach(key => {
      result[key] = getData(key);
    });
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 3. Menangani Request POST (Tambah/Hapus/Update Data)
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Tunggu max 10 detik agar tidak bentrok
  
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action; // 'add', 'bulk_add', 'delete', 'update'
    const tableKey = payload.table;
    const data = payload.data;
    const id = payload.id; // Digunakan untuk delete/update
    
    if (!TABLES[tableKey]) {
      throw new Error("Table not found: " + tableKey);
    }
    
    if (action === 'add') {
      addRow(tableKey, data);
    } else if (action === 'bulk_add') {
      if (Array.isArray(data)) {
        addRows(tableKey, data);
      }
    } else if (action === 'delete') {
      deleteRow(tableKey, id);
    } else if (action === 'update') {
      deleteRow(tableKey, data.id);
      addRow(tableKey, data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// --- Helper Functions ---

function getData(tableKey) {
  const config = TABLES[tableKey];
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
  
  if (!sheet || sheet.getLastRow() <= 1) return [];
  
  const rawData = sheet.getRange(2, 1, sheet.getLastRow() - 1, config.columns.length).getValues();
  
  return rawData.map(row => {
    const item = {};
    config.columns.forEach((col, index) => {
      const val = row[index];
      // Biarkan number tetap number, lainnya string
      item[col] = (typeof val === 'number') ? val : String(val);
    });
    return item;
  });
}

function addRow(tableKey, data) {
  const config = TABLES[tableKey];
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
  
  const rowData = config.columns.map(col => {
    return data[col] || '';
  });
  
  sheet.appendRow(rowData);
}

function addRows(tableKey, dataArray) {
  const config = TABLES[tableKey];
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
  
  if (dataArray.length === 0) return;

  const rows = dataArray.map(item => {
    return config.columns.map(col => item[col] || '');
  });
  
  // Menggunakan setValues untuk performa (Batch Insert)
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, config.columns.length).setValues(rows);
}

function deleteRow(tableKey, id) {
  const config = TABLES[tableKey];
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(config.sheet);
  const data = sheet.getDataRange().getValues();
  
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1); 
      return; 
    }
  }
}
