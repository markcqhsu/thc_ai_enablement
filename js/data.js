// Mock data — 由 Google Sheets 載入覆蓋；陣列保持空白避免舊資料干擾

const APP_DATA = {
  regions:          [],
  units:            [],
  cases:            [],
  talents:          [],
  training:         [],
  training_records: [],
  api_usage:        [],
  updates:          [],
};

// ── L 等級定義（對齊規劃書）──
const MATURITY_LEVELS = {
  L0: { label: '未啟動', desc: '尚未完成資訊普查',           color: '#94a3b8' },
  L1: { label: '已接觸', desc: '已有負責窗口',               color: '#93c5fd' },
  L2: { label: '已提出', desc: '已提出希望解決的問題與目標',  color: '#60a5fa' },
  L3: { label: 'PoC',   desc: '專案開始測試與場域驗證',      color: '#f59e0b' },
  L4: { label: '已成效', desc: '已完成上線測試',              color: '#22c55e' },
  L5: { label: '可複製', desc: '完成後確定可以複製推廣',      color: '#d97706' },
};
