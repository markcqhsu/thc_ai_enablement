const PAGE_TITLES = {
  dashboard: '集團總覽',
  units:     '單位 AI 推動追蹤',
  cases:     'AI 應用案例',
  talent:    'AI 人才網路',
  training:  '課程安排',
};

// ── Helpers ──

function lv(level) {
  return MATURITY_LEVELS[level] || MATURITY_LEVELS['L0'];
}

function levelBadge(level) {
  const m = lv(level);
  return `<span class="level-badge" style="background:${m.color}" title="${m.desc}">${level}</span>`;
}

function stageTag(stage) {
  const map = {
    'completed': ['tag-green', '已上線'],
    'poc':       ['tag-yellow', 'PoC 中'],
    'paused':    ['tag-gray', '暫緩'],
  };
  const [cls, label] = map[stage] || ['tag-gray', stage];
  return `<span class="tag ${cls}">${label}</span>`;
}

function bool(val) {
  return val
    ? `<span style="color:#22c55e;font-weight:600">是</span>`
    : `<span style="color:#94a3b8">否</span>`;
}

// ── Navigation ──

function navigate(page) {
  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.page === page)
  );
  document.getElementById('page-title').textContent = PAGE_TITLES[page] || page;

  const content = document.getElementById('content');
  switch (page) {
    case 'dashboard': renderDashboard(content); break;
    case 'units':     renderUnits(content);     break;
    case 'cases':     renderCases(content);     break;
    case 'talent':    renderTalent(content);    break;
    case 'training':  renderTraining(content);  break;
  }
}

// ── Dashboard ──

function renderDashboard(el) {
  const { units, cases, talents, regions, updates } = APP_DATA;

  const completedApps   = cases.filter(c => c.stage === 'completed').length;
  const pocInProgress   = cases.filter(c => c.stage === 'poc').length;
  const replicableCases = cases.filter(c => c.isReplicable).length;
  const needSupport     = units.filter(u => u.needSupport).length;

  // Level counts
  const levelCounts = ['L0','L1','L2','L3','L4','L5'].map(l => ({
    level: l, ...lv(l),
    count: units.filter(u => u.maturityLevel === l).length,
  }));
  const maxCount = Math.max(...levelCounts.map(l => l.count), 1);

  // Region groups
  const grouped = {};
  regions.forEach(r => {
    if (!grouped[r.group]) grouped[r.group] = [];
    grouped[r.group].push(r);
  });

  el.innerHTML = `
    <!-- KPI Row -->
    <div class="kpi-grid kpi-grid-4">
      <div class="kpi-card green">
        <div class="kpi-label">已完成應用</div>
        <div class="kpi-value">${completedApps}</div>
        <div class="kpi-sub">正式上線運作中</div>
      </div>
      <div class="kpi-card yellow">
        <div class="kpi-label">PoC 進行中</div>
        <div class="kpi-value">${pocInProgress}</div>
        <div class="kpi-sub">個案例測試中</div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-label">AI 人才</div>
        <div class="kpi-value">${talents.length}</div>
        <div class="kpi-sub">已認定種子成員 ${talents.filter(t=>t.isSeed).length} 位</div>
      </div>
      <div class="kpi-card gold">
        <div class="kpi-label">可複製案例</div>
        <div class="kpi-value">${replicableCases}</div>
        <div class="kpi-sub">可推廣至其他單位</div>
      </div>
    </div>

    <!-- Maturity Matrix + Side Panel -->
    <div class="two-col wide-left" style="margin-bottom:20px">
      <div class="card">
        <div class="card-title">AI 成熟度矩陣</div>

        <!-- Summary bars -->
        <div class="maturity-summary">
          ${levelCounts.map(l => `
            <div class="msummary-row">
              <span class="msummary-label">
                <span class="level-badge" style="background:${l.color};font-size:10px;width:24px;height:24px">${l.level}</span>
                <span class="msummary-name">${l.label}</span>
              </span>
              <div class="msummary-bar-wrap">
                <div class="msummary-bar" style="width:${l.count ? (l.count/maxCount)*100 : 0}%;background:${l.color}"></div>
              </div>
              <span class="msummary-count">${l.count} 單位</span>
            </div>
          `).join('')}
        </div>

        <!-- Detail table -->
        <div style="margin-top:16px;overflow-x:auto">
          <table class="maturity-table">
            <thead>
              <tr>
                <th style="text-align:left">單位</th>
                <th>地區</th>
                ${levelCounts.map(l => `<th title="${l.desc}">${l.level}<br><span style="font-weight:400;font-size:10px">${l.label}</span></th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${units.map(u => {
                const cur = parseInt(u.maturityLevel.replace('L',''));
                return `<tr>
                  <td style="font-weight:500;white-space:nowrap">${u.unitName}</td>
                  <td style="font-size:12px;color:#64748b;white-space:nowrap">${u.region}</td>
                  ${[0,1,2,3,4,5].map(l =>
                    `<td>${l === cur
                      ? levelBadge(u.maturityLevel)
                      : l < cur
                        ? `<span class="level-dot-done"></span>`
                        : `<span class="level-dot"></span>`
                    }</td>`
                  ).join('')}
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Side: Regions + Updates -->
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="card">
          <div class="card-title">各地區啟動狀況</div>
          ${Object.entries(grouped).map(([group, rs]) => `
            <div class="region-group">
              <div class="region-group-label">${group}</div>
              <div class="region-mini-grid">
                ${rs.map(r => {
                  const regionUnits = units.filter(u => u.region === r.name);
                  const active = regionUnits.filter(u => u.maturityLevel !== 'L0').length;
                  const topLevel = regionUnits.reduce((best, u) => {
                    const n = parseInt(u.maturityLevel.replace('L',''));
                    return n > parseInt(best.replace('L','')) ? u.maturityLevel : best;
                  }, 'L0');
                  return `
                    <div class="region-mini-card region-card-${r.color}">
                      <div class="region-mini-name">${r.name}</div>
                      <div style="display:flex;align-items:center;gap:4px;margin-top:4px">
                        <span class="region-dot" style="background:${lv(topLevel).color}"></span>
                        <span style="font-size:11px;color:#64748b">${active}/${regionUnits.length} 單位</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}

          <!-- Legend -->
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid #f1f5f9">
            ${Object.entries(MATURITY_LEVELS).map(([k,v]) =>
              `<span style="display:flex;align-items:center;gap:3px;font-size:11px;color:#64748b">
                <span style="width:8px;height:8px;border-radius:50%;background:${v.color};display:inline-block"></span>${k} ${v.label}
              </span>`
            ).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-title">最新動態</div>
          <div class="updates-list">
            ${updates.map(u => `
              <div class="update-item">
                <div class="update-dot"></div>
                <div style="flex:1">
                  <div class="update-text">${u.text}</div>
                  <div class="update-date">${u.date}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Units ──

function renderUnits(el) {
  const { units } = APP_DATA;
  const regions = [...new Set(units.map(u => u.region))];

  el.innerHTML = `
    <div class="page-header">
      <div class="filter-bar">
        <select class="filter-select" id="f-region" onchange="filterUnits()">
          <option value="">所有地區</option>
          ${regions.map(r => `<option>${r}</option>`).join('')}
        </select>
        <select class="filter-select" id="f-level" onchange="filterUnits()">
          <option value="">所有成熟度</option>
          ${Object.entries(MATURITY_LEVELS).map(([k,v]) => `<option value="${k}">${k} ${v.label}</option>`).join('')}
        </select>
        <select class="filter-select" id="f-support" onchange="filterUnits()">
          <option value="">全部</option>
          <option value="true">需要支援</option>
          <option value="false">不需要支援</option>
        </select>
      </div>
      <span id="units-count" style="font-size:13px;color:#64748b">${units.length} 個單位</span>
    </div>
    <div style="overflow-x:auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>單位</th><th>地區</th><th>窗口</th><th>AI 人員</th>
            <th>需支援</th><th>目前階段</th><th>PoC 項目</th>
            <th>預估效益</th><th>預計完成</th><th>最後更新</th>
          </tr>
        </thead>
        <tbody id="units-tbody">${unitsRows(units)}</tbody>
      </table>
    </div>
  `;
}

function unitsRows(list) {
  return list.map(u => {
    const m = lv(u.maturityLevel);
    return `<tr>
      <td><strong>${u.unitName}</strong></td>
      <td style="white-space:nowrap">${u.region}</td>
      <td>${u.aiContact || '<span style="color:#94a3b8">—</span>'}</td>
      <td>${u.aiStaff || '<span style="color:#94a3b8">—</span>'}</td>
      <td>${bool(u.needSupport)}</td>
      <td>
        <span class="level-badge" style="background:${m.color}">${u.maturityLevel}</span>
        <span class="tag" style="background:${m.color}18;color:${m.color};margin-left:4px">${m.label}</span>
      </td>
      <td style="font-size:12px">
        ${u.pocItems.length
          ? u.pocItems.map(p => `<span class="tag tag-blue" style="margin-right:3px;margin-bottom:2px">${p}</span>`).join('')
          : '<span style="color:#94a3b8">—</span>'}
      </td>
      <td style="font-size:12px;color:#64748b;max-width:140px">${u.estimatedBenefit || '—'}</td>
      <td style="font-size:12px;color:#64748b;white-space:nowrap">${u.dueDate || '—'}</td>
      <td style="font-size:12px;color:#94a3b8;white-space:nowrap">${u.lastUpdated || '—'}</td>
    </tr>`;
  }).join('');
}

function filterUnits() {
  const region  = document.getElementById('f-region').value;
  const level   = document.getElementById('f-level').value;
  const support = document.getElementById('f-support').value;
  let list = APP_DATA.units;
  if (region)  list = list.filter(u => u.region === region);
  if (level)   list = list.filter(u => u.maturityLevel === level);
  if (support !== '') list = list.filter(u => String(u.needSupport) === support);
  document.getElementById('units-tbody').innerHTML = unitsRows(list);
  document.getElementById('units-count').textContent = `${list.length} 個單位`;
}

// ── Cases ──

let currentCaseFilter = 'all';

function renderCases(el) {
  el.innerHTML = `
    <div class="page-header">
      <div class="tab-bar">
        <button class="tab-btn ${currentCaseFilter==='all'?'active':''}" onclick="setCaseFilter('all')">全部 (${APP_DATA.cases.length})</button>
        <button class="tab-btn ${currentCaseFilter==='poc'?'active':''}" onclick="setCaseFilter('poc')">PoC 中 (${APP_DATA.cases.filter(c=>c.stage==='poc').length})</button>
        <button class="tab-btn ${currentCaseFilter==='completed'?'active':''}" onclick="setCaseFilter('completed')">已上線 (${APP_DATA.cases.filter(c=>c.stage==='completed').length})</button>
      </div>
      <select class="filter-select" id="f-apptype" onchange="filterCases()">
        <option value="">所有類型</option>
        ${[...new Set(APP_DATA.cases.map(c=>c.appType))].map(t=>`<option>${t}</option>`).join('')}
      </select>
    </div>
    <div class="case-grid" id="cases-grid">${caseCards(getFilteredCases())}</div>
  `;
}

function getFilteredCases() {
  let list = APP_DATA.cases;
  if (currentCaseFilter !== 'all') list = list.filter(c => c.stage === currentCaseFilter);
  const apptype = document.getElementById('f-apptype') ? document.getElementById('f-apptype').value : '';
  if (apptype) list = list.filter(c => c.appType === apptype);
  return list;
}

function setCaseFilter(f) {
  currentCaseFilter = f;
  renderCases(document.getElementById('content'));
}

function filterCases() {
  document.getElementById('cases-grid').innerHTML = caseCards(getFilteredCases());
}

function caseCards(list) {
  if (!list.length) return `<div style="color:#94a3b8;padding:40px;text-align:center">目前無此狀態案例</div>`;
  return list.map(c => `
    <div class="case-card">
      <div class="case-card-header">
        <div>
          <div class="case-name">${c.caseName}</div>
          <div class="case-unit">${c.unitName} · ${c.region}</div>
        </div>
        ${stageTag(c.stage)}
      </div>

      <div class="case-meta">
        <span class="tag tag-blue">${c.appType}</span>
        ${c.toolsUsed.map(t=>`<span class="tag tag-outline">${t}</span>`).join('')}
      </div>

      <div class="case-field">問題：<span>${c.problem}</span></div>
      <div class="case-field" style="margin-top:4px">解法：<span>${c.solution}</span></div>

      ${c.architectureNote ? `
        <div class="arch-note">
          <span class="arch-note-label">架構說明</span>
          ${c.architectureNote}
        </div>
      ` : ''}

      <div class="case-footer">
        <div>
          <div class="case-field">預估效益：<span>${c.estimatedBenefit}</span></div>
          ${c.stage === 'completed' && c.actualBenefit
            ? `<div class="case-field" style="margin-top:2px">實際成效：<span style="color:#22c55e;font-weight:600">${c.actualBenefit}</span></div>`
            : ''}
        </div>
        ${c.isReplicable
          ? `<div>
              <span class="replicable-badge">✓ 可複製</span>
              ${c.replicableTo.length ? `<div style="font-size:10px;color:#64748b;margin-top:2px">${c.replicableTo.join('、')}</div>` : ''}
            </div>`
          : `<span style="font-size:11px;color:#94a3b8">尚未評估複製性</span>`}
      </div>
      <div style="font-size:11px;color:#94a3b8;margin-top:8px">負責人：${c.owner} · ${c.lastUpdated}</div>
    </div>
  `).join('');
}

// ── Talent ──

function renderTalent(el) {
  const { talents, units, training } = APP_DATA;

  const seedCount = talents.filter(t => t.isSeed).length;
  const regions = [...new Set(talents.map(t => t.region))];

  el.innerHTML = `
    <!-- Stats -->
    <div class="kpi-grid kpi-grid-4" style="margin-bottom:20px">
      <div class="kpi-card purple">
        <div class="kpi-label">AI 人才總數</div>
        <div class="kpi-value">${talents.length}</div>
        <div class="kpi-sub">已認定成員</div>
      </div>
      <div class="kpi-card yellow">
        <div class="kpi-label">種子成員</div>
        <div class="kpi-value">${seedCount}</div>
        <div class="kpi-sub">可擔任他廠支援</div>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-label">涵蓋地區</div>
        <div class="kpi-value">${regions.length}</div>
        <div class="kpi-sub">個地區有 AI 人才</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">累計修課人次</div>
        <div class="kpi-value">${talents.reduce((s,t)=>s+t.completedCourses.length,0)}</div>
        <div class="kpi-sub">已完成課程紀錄</div>
      </div>
    </div>

    <!-- Talent cards grouped by region -->
    ${regions.map(region => `
      <div style="margin-bottom:24px">
        <div style="font-size:13px;font-weight:600;color:#64748b;margin-bottom:12px;display:flex;align-items:center;gap:8px">
          <span style="width:3px;height:16px;background:#2563eb;border-radius:2px;display:inline-block"></span>
          ${region}
        </div>
        <div class="talent-grid">
          ${talents.filter(t=>t.region===region).map(t => `
            <div class="talent-card">
              <div class="talent-header">
                <div class="talent-avatar" style="background:${t.isSeed?'#7c3aed':'#2563eb'}">${t.name.charAt(0)}</div>
                <div>
                  <div style="display:flex;align-items:center;gap:6px">
                    <div class="talent-name">${t.name}</div>
                    ${t.isSeed ? `<span class="seed-badge">種子</span>` : ''}
                  </div>
                  <div style="font-size:11px;color:#64748b;margin-top:2px">${t.unit}</div>
                  <div style="margin-top:3px">
                    <span class="tag" style="background:#f3e8ff;color:#7c3aed;font-size:10px">${t.role}</span>
                  </div>
                </div>
              </div>

              <div style="font-size:12px;color:#64748b;margin-bottom:8px">支援範圍：${t.supportScope}</div>

              <div class="skill-tags">
                ${t.skills.map(s=>`<span class="skill-tag">${s}</span>`).join('')}
              </div>

              ${t.completedCourses.length ? `
                <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9">
                  <div style="font-size:11px;color:#94a3b8;margin-bottom:5px">已完成課程</div>
                  ${t.completedCourses.map(c=>`
                    <div style="display:flex;align-items:center;gap:4px;font-size:12px;margin-bottom:3px">
                      <span style="color:#22c55e;font-size:10px">✓</span>${c}
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}

    <!-- Units without AI staff -->
    ${(() => {
      const noStaff = units.filter(u => !u.aiStaff);
      if (!noStaff.length) return '';
      return `
        <div class="card" style="margin-top:4px">
          <div class="card-title">尚未有 AI 人員的單位（${noStaff.length} 個）</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${noStaff.map(u => `
              <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:8px 12px;font-size:12px">
                <strong>${u.unitName}</strong> · ${u.region}
                ${u.needSupport ? `<span class="tag tag-yellow" style="margin-left:6px">需要支援</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    })()}
  `;
}

// ── Training ──

function renderTraining(el) {
  const { training, talents } = APP_DATA;

  el.innerHTML = `
    <!-- Stats -->
    <div class="kpi-grid kpi-grid-3" style="margin-bottom:20px">
      <div class="kpi-card blue">
        <div class="kpi-label">課程模組</div>
        <div class="kpi-value">${training.length}</div>
        <div class="kpi-sub">個課程規劃中</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">招生中</div>
        <div class="kpi-value">${training.filter(t=>t.status==='招生中').length}</div>
        <div class="kpi-sub">正在接受報名</div>
      </div>
      <div class="kpi-card yellow">
        <div class="kpi-label">已報名人次</div>
        <div class="kpi-value">${training.reduce((s,t)=>s+t.enrolled,0)}</div>
        <div class="kpi-sub">累計報名</div>
      </div>
    </div>

    <div class="training-grid">
      ${training.map(t => `
        <div class="training-card">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
            <div class="training-icon">${t.icon}</div>
            <span class="tag ${t.status==='招生中'?'tag-green':'tag-yellow'}">${t.status}</span>
          </div>
          <div class="training-title">${t.module}</div>
          <div class="training-desc">${t.desc}</div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:12px">
            <span style="color:#64748b">📅 ${t.date}</span>
            <span style="color:#64748b">${t.enrolled}/${t.capacity} 人</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${Math.round((t.enrolled/t.capacity)*100)}%"></div>
          </div>

          ${t.participants.length ? `
            <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9">
              <div style="font-size:11px;color:#94a3b8;margin-bottom:6px">已報名學員</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px">
                ${t.participants.map(p => {
                  const talent = talents.find(tl => tl.name === p);
                  return `<span class="tag" style="background:#f0fdf4;color:#166534;font-size:11px">
                    ${talent?.isSeed ? '⭐ ' : ''}${p}
                  </span>`;
                }).join('')}
              </div>
            </div>
          ` : `<div style="margin-top:10px;font-size:12px;color:#94a3b8">尚無報名學員</div>`}
        </div>
      `).join('')}
    </div>

    <!-- Talent × Course Matrix -->
    <div class="card" style="margin-top:20px;overflow-x:auto">
      <div class="card-title">人才 × 課程矩陣</div>
      <table class="data-table" style="font-size:12px">
        <thead>
          <tr>
            <th>姓名</th><th>單位</th>
            ${training.map(t=>`<th style="text-align:center;min-width:80px">${t.module.slice(0,6)}<br><span style="font-weight:400;font-size:10px">${t.date.slice(5)}</span></th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${talents.map(tl => `
            <tr>
              <td>
                ${tl.isSeed ? `<span class="seed-badge" style="margin-right:4px">種子</span>` : ''}
                ${tl.name}
              </td>
              <td style="color:#64748b">${tl.unit}</td>
              ${training.map(tr => `
                <td style="text-align:center">
                  ${tr.participants.includes(tl.name)
                    ? `<span style="color:#22c55e;font-size:16px">✓</span>`
                    : `<span style="color:#e2e8f0;font-size:16px">○</span>`}
                </td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ── Init ──

async function init() {
  document.getElementById('content').innerHTML = `
    <div class="placeholder-page">
      <div class="placeholder-icon">⏳</div>
      <div class="placeholder-text">載入資料中...</div>
      <div class="placeholder-sub">正在從 Google Sheets 讀取資料</div>
    </div>
  `;

  try {
    await loadFromSheets();
    document.getElementById('update-date').textContent =
      '資料更新：' + new Date().toISOString().slice(0, 10);
  } catch (err) {
    console.warn('Sheets 讀取失敗，使用本地資料', err);
    document.getElementById('update-date').textContent = '資料更新：本地資料';
  }

  navigate('dashboard');
}

init();
