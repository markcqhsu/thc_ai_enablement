// ── THC AI 推動管理系統 — Sheets Proxy ──
// 部署為 Google Apps Script Web App
// Execute as: Me ／ Who has access: Anyone
//
// 部署後將 Web App URL 填入 js/sheets.js 的 APPS_SCRIPT_URL

const SHEET_ID = '1xO3bhohlyLBzQ00xY0P-AAWeHxPh6EFg_ZTkFCWK1qg';
const TABS = [
  'regions', 'units', 'cases', 'talents', 'training',
  'updates', 'api_usage', 'training_records', 'requirements'
];

function doGet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const result = {};

  TABS.forEach(tabName => {
    try {
      const sheet = ss.getSheetByName(tabName);
      if (!sheet) { result[tabName] = []; return; }

      const values = sheet.getDataRange().getDisplayValues();
      if (values.length < 2) { result[tabName] = []; return; }

      const headers = values[0].map(h => h.trim());
      result[tabName] = values.slice(1)
        .filter(row => row.some(c => c.trim() !== ''))
        .map(row => {
          const obj = {};
          headers.forEach((h, i) => { obj[h] = (row[i] || '').trim(); });
          return obj;
        });
    } catch (e) {
      result[tabName] = [];
    }
  });

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
