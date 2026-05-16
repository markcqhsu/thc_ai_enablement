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
const toArr  = v => v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];
const toNum  = v => parseFloat(v) || 0;

async function loadFromSheets() {
  const TAB_NAMES = ['kpis', 'regions', 'units', 'cases', 'talents', 'proposals', 'training', 'executiveItems', 'updates'];

  const results = await Promise.allSettled(TAB_NAMES.map(t => fetchTab(t)));
  const get = i => (results[i].status === 'fulfilled' ? results[i].value : []);

  // kpis（A欄 key, B欄 value）
  const kpiMap = {};
  get(0).slice(1).forEach(([k, v]) => { if (k) kpiMap[k] = v; });
  if (Object.keys(kpiMap).length) {
    APP_DATA.kpis = {
      activatedUnits:   toNum(kpiMap.activatedUnits),
      inventoriedUnits: toNum(kpiMap.inventoriedUnits),
      pocInProgress:    toNum(kpiMap.pocInProgress),
      liveApplications: toNum(kpiMap.liveApplications),
      replicableCases:  toNum(kpiMap.replicableCases),
      aiChampions:      toNum(kpiMap.aiChampions),
      savedHours:       toNum(kpiMap.savedHours),
      estimatedValue:   toNum(kpiMap.estimatedValue),
    };
  }

  // regions
  const regRows = toObjects(get(1));
  if (regRows.length) {
    APP_DATA.regions = regRows.map(r => ({
      ...r, units: toNum(r.units), active: toNum(r.active),
    }));
  }

  // units
  const unitRows = toObjects(get(2));
  if (unitRows.length) {
    APP_DATA.units = unitRows.map((u, i) => ({
      id: i + 1, ...u,
      hasAiTalent: toBool(u.hasAiTalent),
      needSupport:  toBool(u.needSupport),
      appTypes:     toArr(u.appTypes),
    }));
  }

  // cases
  const caseRows = toObjects(get(3));
  if (caseRows.length) {
    APP_DATA.cases = caseRows.map((c, i) => ({
      id: i + 1, ...c,
      isReplicable: toBool(c.isReplicable),
      toolsUsed:    toArr(c.toolsUsed),
      replicableTo: toArr(c.replicableTo),
    }));
  }

  // talents
  const talentRows = toObjects(get(4));
  if (talentRows.length) {
    APP_DATA.talents = talentRows.map((t, i) => ({
      id: i + 1, ...t,
      completedProjects: toNum(t.completedProjects),
      advancedEligible:  toBool(t.advancedEligible),
      canSupportOthers:  toBool(t.canSupportOthers),
      skills:            toArr(t.skills),
      currentCases:      toArr(t.currentCases),
    }));
  }

  // proposals
  const propRows = toObjects(get(5));
  if (propRows.length) {
    APP_DATA.proposals = propRows.map((p, i) => ({ id: i + 1, ...p }));
  }

  // training
  const trainRows = toObjects(get(6));
  if (trainRows.length) {
    APP_DATA.training = trainRows.map((t, i) => ({
      id: i + 1, ...t,
      enrolled: toNum(t.enrolled),
      capacity: toNum(t.capacity),
    }));
  }

  // executiveItems
  const execRows = toObjects(get(7));
  if (execRows.length) APP_DATA.executiveItems = execRows;

  // updates
  const updateRows = toObjects(get(8));
  if (updateRows.length) APP_DATA.updates = updateRows;
}
