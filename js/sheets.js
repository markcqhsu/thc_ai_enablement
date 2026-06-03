// ── 資料來源：Google Apps Script Web App ──
// 9 個分頁合併為單一請求，避免 Sheets API 配額限制
// Web App 設定：Execute as Me ／ Anyone can access
// 部署後將 URL 填入下方

const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL';

const toBool = v => v === 'TRUE' || v === 'true' || v === '是';
const toArr  = v => v ? v.split(/[,、]/).map(s => s.trim()).filter(Boolean) : [];
const toNum  = v => parseFloat(v) || 0;

async function loadFromSheets() {
  const res = await fetch(APPS_SCRIPT_URL);
  if (!res.ok) throw new Error(`Web App 讀取失敗: ${res.status}`);
  const data = await res.json();

  const get = key => data[key] || [];

  // regions
  const regRows = get('regions');
  if (regRows.length) {
    const sheetsNames = new Set(regRows.map(r => r.name));
    const kept = APP_DATA.regions.filter(r => !sheetsNames.has(r.name));
    APP_DATA.regions = [...regRows, ...kept];
  }

  // units
  const unitRows = get('units');
  if (unitRows.length) {
    const sheetsUnitNames = new Set(unitRows.map(r => r.unitName));
    const kept = APP_DATA.units.filter(u => !sheetsUnitNames.has(u.unitName));
    const mapped = unitRows.map((u, i) => ({
      id: i + 1, ...u,
      needSupport: toBool(u.needSupport),
      pocItems:    toArr(u.pocItems),
      aiStaff:     toArr(u.aiStaff),
    }));
    APP_DATA.units = [...mapped, ...kept];
  }

  // cases
  const caseRows = get('cases');
  if (caseRows.length) {
    const sheetsCaseNames = new Set(caseRows.map(r => r.caseName));
    const keptCases = APP_DATA.cases.filter(c => !sheetsCaseNames.has(c.caseName));
    const mappedCases = caseRows.map((c, i) => ({
      id: i + 1, ...c,
      isReplicable: toBool(c.isReplicable),
      toolsUsed:    toArr(c.toolsUsed),
      replicableTo: toArr(c.replicableTo),
    }));
    APP_DATA.cases = [...mappedCases, ...keptCases];
  }

  // talents
  const talentRows = get('talents');
  if (talentRows.length) {
    APP_DATA.talents = talentRows.map((t, i) => ({
      id: i + 1, ...t,
      isSeed:           toBool(t.isSeed),
      skills:           toArr(t.skills),
      completedCourses: toArr(t.completedCourses),
    }));
  }

  // training
  const trainRows = get('training');
  if (trainRows.length) {
    APP_DATA.training = trainRows.map((t, i) => ({
      id: i + 1, ...t,
      enrolled:     toNum(t.enrolled),
      capacity:     toNum(t.capacity),
      participants: toArr(t.participants),
    }));
  }

  // updates
  const updateRows = get('updates');
  if (updateRows.length) {
    APP_DATA.updates = updateRows;
  }

  // training_records
  const trRecordRows = get('training_records');
  if (trRecordRows.length) {
    APP_DATA.training_records = trRecordRows;
  }

  // requirements
  const reqRows = get('requirements');
  if (reqRows.length) {
    APP_DATA.requirements = reqRows;
  }

  // api_usage
  const apiRows = get('api_usage');
  if (apiRows.length) {
    APP_DATA.api_usage = apiRows.map(r => ({
      ...r,
      tokens:     toNum(r.tokens),
      cost_usd:   toNum(r.cost_usd),
      budget_usd: toNum(r.budget_usd),
    }));
  }
}
