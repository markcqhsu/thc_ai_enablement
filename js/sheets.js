const SHEET_ID = '1xO3bhohlyLBzQ00xY0P-AAWeHxPh6EFg_ZTkFCWK1qg';
const API_KEY  = 'AIzaSyDREiK8EEvC26TLoiKgs7kTgDzYX-XAhV0';
const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values`;

async function fetchTab(tabName) {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(tabName)}?key=${API_KEY}`);
  if (!res.ok) throw new Error(`Tab "${tabName}" 讀取失敗: ${res.status}`);
  const json = await res.json();
  return json.values || [];
}

function toObjects(rows) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1)
    .filter(row => row.some(c => c !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (row[i] || '').trim(); });
      return obj;
    });
}

const toBool = v => v === 'TRUE' || v === 'true' || v === '是';
const toArr  = v => v ? v.split(/[,、]/).map(s => s.trim()).filter(Boolean) : [];
const toNum  = v => parseFloat(v) || 0;

async function loadFromSheets() {
  const TABS = ['regions', 'units', 'cases', 'talents', 'training', 'updates', 'api_usage', 'training_records'];
  const results = await Promise.allSettled(TABS.map(t => fetchTab(t)));
  const get = i => (results[i].status === 'fulfilled' ? results[i].value : []);

  // regions — merge by name: Sheets entries override matching mock rows, extras kept
  const regRows = toObjects(get(0));
  if (regRows.length) {
    const sheetsNames = new Set(regRows.map(r => r.name));
    const kept = APP_DATA.regions.filter(r => !sheetsNames.has(r.name));
    APP_DATA.regions = [...regRows, ...kept];
  }

  // units
  const unitRows = toObjects(get(1));
  if (unitRows.length) {
    APP_DATA.units = unitRows.map((u, i) => ({
      id: i + 1, ...u,
      needSupport: toBool(u.needSupport),
      pocItems:    toArr(u.pocItems),
      aiStaff:     toArr(u.aiStaff),
    }));
  }

  // cases
  const caseRows = toObjects(get(2));
  if (caseRows.length) {
    APP_DATA.cases = caseRows.map((c, i) => ({
      id: i + 1, ...c,
      isReplicable: toBool(c.isReplicable),
      toolsUsed:    toArr(c.toolsUsed),
      replicableTo: toArr(c.replicableTo),
    }));
  }

  // talents
  const talentRows = toObjects(get(3));
  if (talentRows.length) {
    APP_DATA.talents = talentRows.map((t, i) => ({
      id: i + 1, ...t,
      isSeed:           toBool(t.isSeed),
      skills:           toArr(t.skills),
      completedCourses: toArr(t.completedCourses),
    }));
  }

  // training
  const trainRows = toObjects(get(4));
  if (trainRows.length) {
    APP_DATA.training = trainRows.map((t, i) => ({
      id: i + 1, ...t,
      enrolled:     toNum(t.enrolled),
      capacity:     toNum(t.capacity),
      participants: toArr(t.participants),
    }));
  }

  // updates
  const updateRows = toObjects(get(5));
  if (updateRows.length) {
    APP_DATA.updates = updateRows;
  }

  // training_records
  const trRecordRows = toObjects(get(7));
  if (trRecordRows.length) {
    APP_DATA.training_records = trRecordRows;
  }

  // api_usage
  const apiRows = toObjects(get(6));
  if (apiRows.length) {
    APP_DATA.api_usage = apiRows.map(r => ({
      ...r,
      tokens:     toNum(r.tokens),
      cost_usd:   toNum(r.cost_usd),
      budget_usd: toNum(r.budget_usd),
    }));
  }
}
