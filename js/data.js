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
  requirements:     [],
};

// ── L 等級定義（對齊規劃書）──
const MATURITY_LEVELS = {
  L0: { label: '未啟動', desc: '尚未進行普查',                                    color: '#94a3b8' },
  L1: { label: '已接觸', desc: '普查中',                                          color: '#93c5fd' },
  L2: { label: '已提出', desc: '尋找與發現需要改善的流程',                         color: '#60a5fa' },
  L3: { label: 'PoC',   desc: '提出流程修改與優化方向',                            color: '#f59e0b' },
  L4: { label: '已成效', desc: '確認導入效果（已導入 AI 應用）',                   color: '#22c55e' },
  L5: { label: '可複製', desc: '可完全導入，且可複製到其他單位',                   color: '#d97706' },
};
