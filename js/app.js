const PAGE_TITLES = {
  dashboard:    '集團總覽',
  units:        '單位 AI 推動追蹤',
  requirements: '需求管理',
  cases:        'AI 應用案例',
  talent:       'AI 人才網路',
  training:     '課程安排',
  plan:         '導入計畫',
  api:          'API 用量管理',
  changelog:    '修改記錄',
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

// ── Region Accordion ──

function toggleRegionChildren(name) {
  const panel = document.getElementById(`region-children-${name}`);
  const arrow = document.getElementById(`region-arrow-${name}`);
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.textContent = isOpen ? '▸' : '▾';
}

// ── Navigation ──

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}

function closeSidebarOnMobile() {
  if (window.innerWidth < 768) {
    document.querySelector('.sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
  }
}

function navigate(page) {
  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.page === page)
  );
  document.getElementById('page-title').textContent = PAGE_TITLES[page] || page;
  closeSidebarOnMobile();

  const content = document.getElementById('content');
  switch (page) {
    case 'dashboard':    renderDashboard(content);    break;
    case 'units':        renderUnits(content);        break;
    case 'requirements': renderRequirements(content); break;
    case 'cases':        renderCases(content);        break;
    case 'talent':    renderTalent(content);    break;
    case 'training':  renderTraining(content);  break;
    case 'plan':      renderPlan(content);      break;
    case 'api':       renderApiUsage(content);  break;
    case 'changelog': renderChangelog(content); break;
  }
}

// ── Dashboard ──

function renderDashboard(el) {
  const { units, cases, talents, regions, updates, api_usage } = APP_DATA;

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

  // API usage summary for dashboard
  const apiMonths = [...new Set(api_usage.map(r => r.month))].sort().reverse();
  const apiLatestMonth = apiMonths[0] || '';
  const apiLatest = api_usage.filter(r => r.month === apiLatestMonth);
  const apiTotalCost = apiLatest.reduce((s, r) => s + r.cost_usd, 0);
  const apiTotalBudget = apiLatest.reduce((s, r) => s + r.budget_usd, 0);
  // Group by unit for dashboard display
  const apiUnitMap = {};
  apiLatest.forEach(r => {
    if (!apiUnitMap[r.unit]) apiUnitMap[r.unit] = { unit: r.unit, provider: r.provider, cost_usd: 0, budget_usd: 0 };
    apiUnitMap[r.unit].cost_usd += r.cost_usd;
    apiUnitMap[r.unit].budget_usd += r.budget_usd;
  });
  const apiUnitList = Object.values(apiUnitMap);
  const apiOverCount = apiUnitList.filter(u => u.cost_usd > u.budget_usd).length;

  // Build parent-child map
  const childrenOf = {};
  regions.forEach(r => {
    if (r.parent) {
      if (!childrenOf[r.parent]) childrenOf[r.parent] = [];
      childrenOf[r.parent].push(r);
    }
  });

  // Auto-generate virtual top-level entries for parents referenced but missing as rows
  const regionNames = new Set(regions.map(r => r.name));
  const allRegions = [...regions];
  Object.keys(childrenOf).forEach(parentName => {
    if (!regionNames.has(parentName)) {
      const firstChild = childrenOf[parentName][0];
      allRegions.push({ name: parentName, group: firstChild.group, color: firstChild.color, parent: '' });
    }
  });

  // Group only top-level regions (no parent)
  const grouped = {};
  allRegions.filter(r => !r.parent).forEach(r => {
    if (!grouped[r.group]) grouped[r.group] = [];
    grouped[r.group].push(r);
  });

  // Group units directly by unit.region (no regions-table lookup needed)
  const unitsByGroup = {};
  units.forEach(u => {
    const g = u.region;
    if (g) { if (!unitsByGroup[g]) unitsByGroup[g] = []; unitsByGroup[g].push(u); }
  });
  const groupOrder = Object.keys(unitsByGroup);
  const groupColorMap = {
    '台灣': '#f59e0b', '中國': '#3b82f6', '東南亞總部': '#f43f5e',
  };

  // Map unitName → cases
  const casesByUnit = {};
  cases.forEach(c => {
    if (!casesByUnit[c.unitName]) casesByUnit[c.unitName] = [];
    casesByUnit[c.unitName].push(c);
  });

  el.innerHTML = `
    <!-- Mission Statement -->
    <div style="
      background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
      border-radius: 12px;
      padding: 18px 24px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 14px;
    ">
      <span style="font-size: 22px; flex-shrink: 0;">💡</span>
      <p style="
        margin: 0;
        color: #fff;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.7;
        letter-spacing: 0.02em;
      ">AI 推動的目的，不是讓所有人都會開發，而是讓每個單位都能被 AI 支援。</p>
    </div>

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

    <!-- API Usage Summary -->
    ${apiLatest.length ? `
    <div class="card" style="margin-bottom:20px">
      <div class="api-dash-header">
        <div class="card-title" style="margin-bottom:0">API 用量快覽（${apiLatestMonth}）</div>
        <div class="api-dash-meta">
          <span style="font-size:13px;color:var(--text-muted)">
            本月花費 <strong style="color:var(--text)">$${apiTotalCost.toFixed(2)}</strong>
            / 預算 $${apiTotalBudget.toFixed(2)}
            ${apiOverCount > 0 ? `<span class="tag tag-red" style="margin-left:6px">${apiOverCount} 單位超出</span>` : '<span class="tag tag-green" style="margin-left:6px">全部正常</span>'}
          </span>
          <a onclick="navigate('api')" style="font-size:12px;color:var(--primary);cursor:pointer;white-space:nowrap">查看詳情 →</a>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:9px">
        ${apiUnitList.map(r => {
          const pct = Math.min(r.cost_usd / r.budget_usd * 100, 100);
          const over = r.cost_usd > r.budget_usd;
          return `
            <div class="api-dash-row">
              <span class="api-dash-unit">${r.unit}</span>
              <span class="api-provider-badge api-provider-${r.provider.toLowerCase()}" style="flex-shrink:0">${r.provider}</span>
              <div class="api-dash-bar">
                <div style="width:${pct}%;height:100%;background:${over ? '#ef4444' : '#2563eb'};border-radius:4px"></div>
              </div>
              <span class="api-dash-amount" style="color:${over ? '#ef4444' : 'var(--text-muted)'};font-weight:${over ? '600' : '400'}">
                $${r.cost_usd.toFixed(2)} / $${r.budget_usd.toFixed(2)}
              </span>
            </div>`;
        }).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Maturity Matrix + Side Panel -->
    <div class="two-col wide-left" style="margin-bottom:20px">
      <div class="card">
        <div class="card-title">AI 成熟度矩陣</div>

        <!-- Summary bars -->
        <div class="maturity-summary">
          ${levelCounts.map(l => `
            <div class="msummary-row">
              <div class="msummary-label">
                <span class="level-badge" style="background:${l.color};font-size:10px;width:24px;height:24px;flex-shrink:0">${l.level}</span>
                <span class="msummary-name">${l.label}</span>
              </div>
              <div style="flex:1;min-width:0">
                <div class="msummary-bar-wrap">
                  <div class="msummary-bar" style="width:${l.count ? (l.count/maxCount)*100 : 0}%;background:${l.color}"></div>
                </div>
                <div class="msummary-desc">${l.desc}</div>
              </div>
              <span class="msummary-count">${l.count} 單位</span>
            </div>
          `).join('')}
        </div>

        <!-- Detail table -->
        <div style="margin-top:16px;overflow-x:auto;max-width:100%;width:100%">
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
          ${groupOrder.map(group => {
            const gUnits = (unitsByGroup[group] || []).slice().sort((a, b) => {
              const ac = (casesByUnit[a.unitName] || []).length;
              const bc = (casesByUnit[b.unitName] || []).length;
              return bc - ac;
            });
            const totalCases = gUnits.reduce((s, u) => s + (casesByUnit[u.unitName] || []).length, 0);
            const groupColor = groupColorMap[group] || '#94a3b8';
            return `
              <div style="margin-bottom:14px">
                <div style="display:flex;align-items:center;justify-content:space-between;
                            padding:6px 10px;border-radius:6px;
                            background:${groupColor}18;border-left:3px solid ${groupColor};
                            margin-bottom:4px">
                  <span style="font-size:12px;font-weight:600;color:${groupColor}">${group}</span>
                  <span style="font-size:11px;color:#64748b">${totalCases} 個案例</span>
                </div>
                ${gUnits.length > 0 ? gUnits.map(u => {
                  const uCases = casesByUnit[u.unitName] || [];
                  return `
                    <div style="padding:4px 8px 4px 8px;border-radius:5px;cursor:default"
                         onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                      <div style="display:flex;align-items:center;gap:6px;margin-bottom:${uCases.length ? '4px' : '0'}">
                        <span style="font-size:12px;font-weight:500;color:var(--text);
                                     white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${u.unitName}">${u.unitName}</span>
                        ${uCases.length === 0 ? `<span style="font-size:11px;color:#cbd5e1">—</span>` : ''}
                      </div>
                      ${uCases.length > 0 ? `
                        <div style="display:flex;flex-direction:column;gap:3px;padding-left:4px">
                          ${uCases.map(c => {
                            const isPoc = c.stage === 'poc';
                            const dotColor = isPoc ? '#f59e0b' : '#10b981';
                            const bgColor  = isPoc ? '#fffbeb' : '#f0fdf4';
                            const textColor = isPoc ? '#92400e' : '#166534';
                            return `
                              <div style="display:flex;align-items:center;gap:6px;
                                          padding:2px 7px;border-radius:5px;background:${bgColor}">
                                <span style="width:6px;height:6px;border-radius:50%;background:${dotColor};flex-shrink:0"></span>
                                <span style="font-size:11px;font-weight:500;color:${textColor};flex:1;
                                             overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
                                      title="${c.caseName}">${c.caseName}</span>
                                <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">
                                  ${c.owner ? `<span style="font-size:10px;color:#94a3b8;white-space:nowrap">${c.owner}</span>` : ''}
                                  ${c.devUnit ? `<span style="font-size:9px;color:#fff;background:#6366f1;border-radius:3px;padding:1px 4px;white-space:nowrap">協作</span>` : ''}
                                </div>
                              </div>`;
                          }).join('')}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('') : `<div style="padding:6px 8px;font-size:12px;color:#94a3b8">尚無單位資料</div>`}
              </div>
            `;
          }).join('')}

          <!-- Legend -->
          <div style="display:flex;gap:14px;margin-top:10px;padding-top:10px;border-top:1px solid #f1f5f9">
            <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:#64748b">
              <span style="width:8px;height:8px;border-radius:50%;background:#10b981;display:inline-block"></span>已完成
            </span>
            <span style="display:flex;align-items:center;gap:5px;font-size:11px;color:#64748b">
              <span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;display:inline-block"></span>PoC 進行中
            </span>
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
      <td>
        ${u.aiStaff && u.aiStaff.length
          ? u.aiStaff.map(s => `<span class="tag tag-blue" style="margin:1px 2px 1px 0">${s}</span>`).join('')
          : '<span style="color:#94a3b8">—</span>'}
      </td>
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

// ── Requirements ──

const STATUS_CONFIG = {
  '蒐集中': { bg: '#f1f5f9', color: '#475569' },
  '評估中': { bg: '#fef3c7', color: '#92400e' },
  '已立案': { bg: '#dcfce7', color: '#15803d' },
  '暫緩':   { bg: '#fee2e2', color: '#991b1b' },
};
const PRIORITY_CONFIG = {
  '高': { bg: '#fee2e2', color: '#991b1b' },
  '中': { bg: '#fef3c7', color: '#92400e' },
  '低': { bg: '#f1f5f9', color: '#64748b' },
};
const FEASIBILITY_COLOR = { '高': '#22c55e', '中': '#f59e0b', '低': '#ef4444' };
const COMPLEXITY_COLOR  = { '高': '#ef4444', '中': '#f59e0b', '低': '#22c55e' };

function renderRequirements(el) {
  const { requirements } = APP_DATA;

  const total      = requirements.length;
  const collecting = requirements.filter(r => r.status === '蒐集中').length;
  const evaluating = requirements.filter(r => r.status === '評估中').length;
  const approved   = requirements.filter(r => r.status === '已立案').length;
  const paused     = requirements.filter(r => r.status === '暫緩').length;

  const unitNames = [...new Set(requirements.map(r => r.unitName).filter(Boolean))];

  el.innerHTML = `
    <div class="kpi-grid kpi-grid-4" style="margin-bottom:20px">
      <div class="kpi-card blue">
        <div class="kpi-label">總需求數</div>
        <div class="kpi-value">${total}</div>
        <div class="kpi-sub">各單位提出需求</div>
      </div>
      <div class="kpi-card yellow">
        <div class="kpi-label">評估中</div>
        <div class="kpi-value">${evaluating}</div>
        <div class="kpi-sub">可行性評估進行中</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">已立案</div>
        <div class="kpi-value">${approved}</div>
        <div class="kpi-sub">已進入執行階段</div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-label">蒐集中／暫緩</div>
        <div class="kpi-value">${collecting + paused}</div>
        <div class="kpi-sub">蒐集中 ${collecting}・暫緩 ${paused}</div>
      </div>
    </div>

    <div class="page-header">
      <div class="filter-bar">
        <select class="filter-select" id="rf-unit" onchange="filterRequirements()">
          <option value="">所有單位</option>
          ${unitNames.map(u => `<option>${u}</option>`).join('')}
        </select>
        <select class="filter-select" id="rf-status" onchange="filterRequirements()">
          <option value="">所有狀態</option>
          ${['蒐集中','評估中','已立案','暫緩'].map(s => `<option>${s}</option>`).join('')}
        </select>
        <select class="filter-select" id="rf-priority" onchange="filterRequirements()">
          <option value="">所有優先序</option>
          ${['高','中','低'].map(p => `<option>${p}</option>`).join('')}
        </select>
      </div>
      <span id="req-count" style="font-size:13px;color:#64748b">${total} 個需求</span>
    </div>

    <div id="req-list">${requirementCards(requirements)}</div>
  `;
}

function requirementCards(list) {
  if (!list.length) return `
    <div class="placeholder-page">
      <div class="placeholder-icon">🔍</div>
      <div class="placeholder-text">尚無需求資料</div>
      <div class="placeholder-sub">請在 Google Sheets 的 requirements 分頁填入資料</div>
    </div>`;

  return `<div class="case-grid">
    ${list.map(r => {
      const sc = STATUS_CONFIG[r.status]      || { bg: '#f1f5f9', color: '#64748b' };
      const pc = PRIORITY_CONFIG[r.priority]  || { bg: '#f1f5f9', color: '#64748b' };
      const fc = FEASIBILITY_COLOR[r.feasibility] || '#94a3b8';
      const cc = COMPLEXITY_COLOR[r.complexity]   || '#94a3b8';

      return `
        <div class="case-card">

          <!-- 第一層：狀態 + 優先序（左對齊橫排） -->
          <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
            <span style="background:${sc.bg};color:${sc.color};font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">${r.status || '—'}</span>
            ${r.priority ? `<span style="background:${pc.bg};color:${pc.color};font-size:11px;font-weight:500;padding:3px 10px;border-radius:20px">優先：${r.priority}</span>` : ''}
          </div>

          <!-- 第二層：標題（最大最粗） -->
          <div style="font-size:15px;font-weight:700;color:var(--text);line-height:1.35;margin-bottom:6px">${r.title || '（未命名）'}</div>

          <!-- 第三層：單位 · 窗口 · 負責人（一行） -->
          <div style="font-size:12px;color:var(--text-muted);display:flex;flex-wrap:wrap;gap:4px;align-items:center;margin-bottom:12px">
            <span>${r.unitName || '—'}</span>
            ${r.contact  ? `<span style="color:#e2e8f0">·</span><span>窗口 <strong style="color:var(--text)">${r.contact}</strong></span>`  : ''}
            ${r.assignee ? `<span style="color:#e2e8f0">·</span><span>負責 <strong style="color:var(--text)">${r.assignee}</strong></span>` : ''}
          </div>

          <div style="height:1px;background:#f1f5f9;margin-bottom:12px"></div>

          <!-- 第四層：問題描述 -->
          ${r.problemDesc ? `<div style="font-size:13px;color:var(--text);line-height:1.65;margin-bottom:10px">${r.problemDesc}</div>` : ''}

          <!-- 第五層：AI 解法方向 -->
          ${r.aiDirection ? `
            <div style="display:flex;align-items:flex-start;gap:7px;margin-bottom:12px">
              <span style="font-size:14px;flex-shrink:0;line-height:1.5">💡</span>
              <span style="font-size:12.5px;color:#2563eb;font-weight:600;line-height:1.55">${r.aiDirection}</span>
            </div>` : ''}

          <!-- 第六層：評估摘要列（灰底一條） -->
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:12px;padding:8px 12px;background:#f8fafc;border-radius:8px;margin-bottom:10px;font-size:12px">
            ${r.feasibility ? `<span style="color:var(--text-muted)">可行性 <strong style="color:${fc}">${r.feasibility}</strong></span>` : ''}
            ${r.complexity  ? `<span style="color:var(--text-muted)">複雜度 <strong style="color:${cc}">${r.complexity}</strong></span>` : ''}
            ${r.dataReady   ? `<span style="color:var(--text-muted)">資料 <strong style="color:var(--text)">${r.dataReady}</strong></span>` : ''}
            ${r.expectedBenefit ? `<span style="color:var(--text-muted);margin-left:auto;text-align:right;white-space:nowrap">${r.expectedBenefit}</span>` : ''}
          </div>

          <!-- 第七層：連結案例 + 日期 -->
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px">
            ${r.linkedCase ? `<span style="color:var(--primary);font-weight:600">→ ${r.linkedCase}</span>` : '<span></span>'}
            <span style="color:#94a3b8">${r.lastUpdated || ''}</span>
          </div>

        </div>`;
    }).join('')}
  </div>`;
}

function filterRequirements() {
  const unit     = document.getElementById('rf-unit').value;
  const status   = document.getElementById('rf-status').value;
  const priority = document.getElementById('rf-priority').value;

  let list = APP_DATA.requirements;
  if (unit)     list = list.filter(r => r.unitName === unit);
  if (status)   list = list.filter(r => r.status === status);
  if (priority) list = list.filter(r => r.priority === priority);

  document.getElementById('req-list').innerHTML = requirementCards(list);
  document.getElementById('req-count').textContent = `${list.length} 個需求`;
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
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;flex-wrap:wrap;gap:4px">
        <div style="display:flex;align-items:center;gap:10px;font-size:11px;color:#94a3b8">
          ${c.owner ? `<span>負責人：<span style="color:#64748b;font-weight:500">${c.owner}</span></span>` : ''}
          ${c.devUnit ? `<span style="color:#cbd5e1">|</span><span>協作開發：<span style="color:#6366f1;font-weight:500">${c.devUnit}</span></span>` : ''}
        </div>
        <span style="font-size:11px;color:#94a3b8">${c.lastUpdated}</span>
      </div>
    </div>
  `).join('');
}

// ── Talent ──

function renderTalent(el) {
  const { talents, units, training, training_records, cases } = APP_DATA;

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
        <div class="kpi-label">累計完課人次</div>
        <div class="kpi-value">${training_records.filter(r=>r.status==='completed').length}</div>
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

              ${(() => {
                const myCases = cases.filter(c => c.owner === t.name);
                if (!myCases.length) return '';
                return `
                  <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9">
                    <div style="font-size:11px;color:#94a3b8;margin-bottom:6px">負責專案</div>
                    ${myCases.map(c => `
                      <div style="display:flex;align-items:center;gap:6px;font-size:12px;margin-bottom:5px">
                        ${stageTag(c.stage)}
                        <span style="flex:1;color:var(--text)">${c.caseName}</span>
                      </div>`).join('')}
                  </div>`;
              })()}

              ${(() => {
                const myRecords = training_records.filter(r => r.name === t.name);
                const completed = myRecords.filter(r => r.status === 'completed');
                const enrolled  = myRecords.filter(r => r.status === 'enrolled');
                if (!myRecords.length) return '';
                return `
                  <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9">
                    ${completed.length ? `
                      <div style="font-size:11px;color:#94a3b8;margin-bottom:5px">已完成</div>
                      ${completed.map(r=>`
                        <div style="display:flex;align-items:center;gap:4px;font-size:12px;margin-bottom:3px">
                          <span style="color:#22c55e;font-weight:700">✓</span>${r.course}
                          ${r.date ? `<span style="color:#94a3b8;font-size:10px">${r.date}</span>` : ''}
                        </div>`).join('')}
                    ` : ''}
                    ${enrolled.length ? `
                      <div style="font-size:11px;color:#94a3b8;margin:8px 0 5px">報名中</div>
                      ${enrolled.map(r=>`
                        <div style="display:flex;align-items:center;gap:4px;font-size:12px;margin-bottom:3px">
                          <span style="color:#f59e0b;font-weight:700">○</span>${r.course}
                        </div>`).join('')}
                    ` : ''}
                  </div>`;
              })()}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}

    <!-- Units without AI staff -->
    ${(() => {
      const noStaff = units.filter(u => !u.aiStaff || !u.aiStaff.length);
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
  const { training, talents, training_records } = APP_DATA;

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
        <div class="kpi-value">${training_records.length}</div>
        <div class="kpi-sub">累計報名人次</div>
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

          ${(() => {
            const records = training_records.filter(r => r.course === t.module);
            const completed = records.filter(r => r.status === 'completed');
            const enrolled  = records.filter(r => r.status === 'enrolled');
            if (!records.length) return `<div style="margin-top:10px;font-size:12px;color:#94a3b8">尚無報名學員</div>`;
            const chip = (r, bg, color) => {
              const talent = talents.find(tl => tl.name === r.name);
              return `<span class="tag" style="background:${bg};color:${color};font-size:11px">${talent?.isSeed ? '⭐ ' : ''}${r.name}</span>`;
            };
            return `
              <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9">
                ${completed.length ? `
                  <div style="font-size:11px;color:#94a3b8;margin-bottom:5px">已完成（${completed.length}）</div>
                  <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px">
                    ${completed.map(r => chip(r,'#f0fdf4','#166534')).join('')}
                  </div>` : ''}
                ${enrolled.length ? `
                  <div style="font-size:11px;color:#94a3b8;margin-bottom:5px">報名中（${enrolled.length}）</div>
                  <div style="display:flex;flex-wrap:wrap;gap:4px">
                    ${enrolled.map(r => chip(r,'#fef9c3','#854d0e')).join('')}
                  </div>` : ''}
              </div>`;
          })()}
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
              ${training.map(tr => {
                const rec = training_records.find(r => r.name === tl.name && r.course === tr.module);
                if (!rec) return `<td style="text-align:center"><span style="color:#e2e8f0">—</span></td>`;
                if (rec.status === 'completed') return `<td style="text-align:center" title="${rec.date}"><span style="color:#22c55e;font-size:15px;font-weight:700">✓</span></td>`;
                return `<td style="text-align:center"><span style="color:#f59e0b;font-size:15px">○</span></td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ── API Usage ──

function renderApiUsage(el) {
  const { api_usage } = APP_DATA;

  if (!api_usage.length) {
    el.innerHTML = `<div class="placeholder-page">
      <div class="placeholder-icon">💳</div>
      <div class="placeholder-text">尚無 API 用量資料</div>
      <div class="placeholder-sub">請在 Google Sheets 的 api_usage 分頁填入資料</div>
    </div>`;
    return;
  }

  const months = [...new Set(api_usage.map(r => r.month))].sort().reverse();
  const latestMonth = months[0];
  const latestData = api_usage.filter(r => r.month === latestMonth);

  const totalCost   = latestData.reduce((s, r) => s + r.cost_usd, 0);
  const totalBudget = latestData.reduce((s, r) => s + r.budget_usd, 0);

  // Check if app field exists
  const hasAppField = api_usage.some(r => r.app && r.app.trim());

  // Group by unit
  const unitGroups = {};
  latestData.forEach(r => {
    if (!unitGroups[r.unit]) {
      unitGroups[r.unit] = { unit: r.unit, provider: r.provider, cost_usd: 0, budget_usd: 0, apps: [] };
    }
    unitGroups[r.unit].cost_usd += r.cost_usd;
    unitGroups[r.unit].budget_usd += r.budget_usd;
    unitGroups[r.unit].apps.push(r);
  });
  const unitGroupList = Object.values(unitGroups);
  const overUnits = unitGroupList.filter(u => u.cost_usd > u.budget_usd).length;

  // Provider breakdown
  const byProvider = {};
  latestData.forEach(r => {
    byProvider[r.provider] = (byProvider[r.provider] || 0) + r.cost_usd;
  });

  el.innerHTML = `
    <!-- KPI -->
    <div class="kpi-grid kpi-grid-3" style="margin-bottom:20px">
      <div class="kpi-card blue">
        <div class="kpi-label">本月總花費</div>
        <div class="kpi-value">$${totalCost.toFixed(2)}</div>
        <div class="kpi-sub">預算 $${totalBudget.toFixed(2)} · ${latestMonth}</div>
      </div>
      <div class="kpi-card ${overUnits > 0 ? 'yellow' : 'green'}">
        <div class="kpi-label">超出預算單位</div>
        <div class="kpi-value">${overUnits}</div>
        <div class="kpi-sub">${overUnits > 0 ? '需調整用量或預算' : '全部單位在預算內'}</div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-label">使用單位數</div>
        <div class="kpi-value">${unitGroupList.length}</div>
        <div class="kpi-sub">個單位本月有使用紀錄</div>
      </div>
    </div>

    <!-- Provider breakdown + month tabs -->
    <div class="two-col" style="margin-bottom:20px">
      <div class="card">
        <div class="card-title">Provider 費用分佈（${latestMonth}）</div>
        <div style="display:flex;flex-direction:column;gap:14px">
          ${Object.entries(byProvider).map(([provider, cost]) => {
            const pct = Math.round(cost / totalCost * 100);
            const provClass = `api-provider-${provider.toLowerCase()}`;
            return `
              <div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                  <span class="api-provider-badge ${provClass}">${provider}</span>
                  <span style="font-size:13px;font-weight:600">$${cost.toFixed(2)} <span style="font-size:11px;color:var(--text-muted);font-weight:400">${pct}%</span></span>
                </div>
                <div style="background:#f1f5f9;border-radius:4px;height:10px;overflow:hidden">
                  <div style="width:${pct}%;height:100%;border-radius:4px;${provider==='Anthropic'?'background:#a855f7':'background:#22c55e'}"></div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-title">月份摘要</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:10px">每個月的 5 號做更新</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${months.map(m => {
            const mData = api_usage.filter(r => r.month === m);
            const mCost = mData.reduce((s, r) => s + r.cost_usd, 0);
            const mBudget = mData.reduce((s, r) => s + r.budget_usd, 0);
            const mOver = mData.filter(r => r.cost_usd > r.budget_usd).length;
            return `
              <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;background:${m===latestMonth?'#eff6ff':'#f8fafc'};border:1px solid ${m===latestMonth?'#bfdbfe':'#e2e8f0'}">
                <span style="font-size:13px;font-weight:600;width:70px">${m}</span>
                <span style="flex:1;font-size:13px">$${mCost.toFixed(2)} <span style="color:var(--text-muted);font-size:11px">/ $${mBudget.toFixed(2)}</span></span>
                ${mOver > 0 ? `<span class="tag tag-red">${mOver} 超出</span>` : '<span class="tag tag-green">正常</span>'}
              </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Per-unit cards -->
    <div style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">
      各單位用量（${latestMonth}）
    </div>
    <div class="api-usage-grid">
      ${unitGroupList.map(g => {
        const pct = Math.min(g.cost_usd / g.budget_usd * 100, 100);
        const over = g.cost_usd > g.budget_usd;
        const provClass = `api-provider-${g.provider.toLowerCase()}`;
        const showApps = hasAppField && g.apps.some(r => r.app && r.app.trim());
        return `
          <div class="api-unit-card">
            <div class="api-unit-header">
              <div class="api-unit-name">${g.unit}</div>
              <span class="api-provider-badge ${provClass}">${g.provider}</span>
            </div>
            ${showApps ? `
              <div style="display:flex;flex-direction:column;gap:10px;margin:10px 0 14px">
                ${g.apps.map(r => {
                  const appPct = Math.min(r.cost_usd / g.budget_usd * 100, 100);
                  return `
                    <div>
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
                        <span style="font-size:12px;font-weight:600;color:var(--text)">${r.app || '（未命名）'}</span>
                        <span style="font-size:12px;color:var(--text-muted)">$${r.cost_usd.toFixed(2)}</span>
                      </div>
                      <div style="background:#f1f5f9;border-radius:3px;height:6px;overflow:hidden">
                        <div style="width:${appPct}%;height:100%;background:#2563eb;border-radius:3px"></div>
                      </div>
                    </div>`;
                }).join('')}
              </div>
              <div style="border-top:1px solid #f1f5f9;padding-top:12px">
                <div class="api-budget-row">
                  <span>總花費 / 預算</span>
                  <span style="color:${over ? '#ef4444' : 'var(--text)'};font-weight:${over ? '600' : '400'}">
                    ${over ? '⚠ ' : ''}$${g.cost_usd.toFixed(2)} / $${g.budget_usd.toFixed(2)}
                  </span>
                </div>
                <div class="api-budget-bar">
                  <div class="api-budget-fill${over ? ' over' : ''}" style="width:${pct}%"></div>
                </div>
                <div class="api-stats-row">
                  <span>使用率：<span class="api-stat-num${over ? ' api-over-warn' : ''}">${Math.round(pct)}%</span></span>
                </div>
              </div>
            ` : `
              <div class="api-budget-row">
                <span>花費 / 預算</span>
                <span style="color:${over ? '#ef4444' : 'var(--text)'};font-weight:${over ? '600' : '400'}">
                  ${over ? '⚠ ' : ''}$${g.cost_usd.toFixed(2)} / $${g.budget_usd.toFixed(2)}
                </span>
              </div>
              <div class="api-budget-bar">
                <div class="api-budget-fill${over ? ' over' : ''}" style="width:${pct}%"></div>
              </div>
              <div class="api-stats-row">
                <span>使用率：<span class="api-stat-num${over ? ' api-over-warn' : ''}">${Math.round(pct)}%</span></span>
              </div>
            `}
          </div>`;
      }).join('')}
    </div>

    <!-- History table -->
    <div class="card" style="margin-top:20px;overflow-x:auto">
      <div class="card-title">所有紀錄</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>月份</th><th>單位</th>
            ${hasAppField ? '<th>應用</th>' : ''}
            <th>Provider</th>
            <th>花費 (USD)</th><th>預算 (USD)</th><th>狀態</th>
          </tr>
        </thead>
        <tbody>
          ${[...api_usage].sort((a,b) => b.month.localeCompare(a.month) || a.unit.localeCompare(b.unit) || (a.app||'').localeCompare(b.app||'')).map(r => `
            <tr>
              <td style="color:var(--text-muted)">${r.month}</td>
              <td><strong>${r.unit}</strong></td>
              ${hasAppField ? `<td style="color:var(--text-muted);font-size:12px">${r.app || '—'}</td>` : ''}
              <td><span class="api-provider-badge api-provider-${r.provider.toLowerCase()}">${r.provider}</span></td>
              <td style="font-weight:500">$${r.cost_usd.toFixed(2)}</td>
              <td style="color:var(--text-muted)">$${r.budget_usd.toFixed(2)}</td>
              <td>${r.cost_usd > r.budget_usd
                ? '<span class="tag tag-red">超出預算</span>'
                : r.cost_usd / r.budget_usd >= 0.8
                  ? '<span class="tag tag-yellow">接近上限</span>'
                  : '<span class="tag tag-green">正常</span>'}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ── Plan ──

function renderPlan(el) {
  const phases = [
    {
      id: 'discover',
      label: '01 · 調查',
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe',
      steps: [
        { n: 1, icon: '🔍', name: '資訊普查', desc: '盤點各單位現有流程、系統與資料現況' },
        { n: 2, icon: '🗣️', name: '單位訪談', desc: '深入了解各單位痛點、需求與期望' },
        { n: 3, icon: '📝', name: '問題蒐集', desc: '彙整可被 AI 解決的問題清單與優先序' },
      ],
    },
    {
      id: 'evaluate',
      label: '02 · 評估',
      color: '#7c3aed',
      bg: '#f5f3ff',
      border: '#ddd6fe',
      steps: [
        { n: 4, icon: '⚖️', name: '可行性評估', desc: '技術可行性、資料完整度與投資報酬率分析' },
      ],
    },
    {
      id: 'execute',
      label: '03 · 執行',
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      steps: [
        { n: 5, icon: '🧪', name: 'PoC',   desc: '小規模驗證 AI 解決方案，快速迭代優化' },
        { n: 6, icon: '🚀', name: '實際導入', desc: '系統整合、上線部署與人員培訓落地' },
        { n: 7, icon: '📊', name: '成果驗證', desc: '確認效益與改善點' },
      ],
    },
    {
      id: 'scale',
      label: '04 · 擴散',
      color: '#d97706',
      bg: '#fffbeb',
      border: '#fde68a',
      steps: [
        { n: 8, icon: '🌐', name: '跨廠複製', desc: '將成功模式標準化，推廣至集團各廠區' },
      ],
    },
  ];

  // build step cards for a phase — inline badge (no absolute) to avoid overflow clipping
  const stepCards = (steps, color) => steps.map((s, i) => `
    <div class="plan-step-item" style="display:flex;align-items:stretch;gap:0;flex:1 1 0;max-width:260px;min-width:150px">
      <div style="
        display:flex;flex-direction:column;align-items:center;
        background:#fff;
        border:1.5px solid ${color}33;
        border-radius:14px;
        padding:16px 14px 18px;
        width:100%;
        box-shadow:0 2px 10px ${color}15;
      ">
        <!-- step number badge — inline so no overflow clipping -->
        <div style="
          width:28px;height:28px;border-radius:50%;
          background:${color};color:#fff;
          font-size:12px;font-weight:700;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 6px ${color}44;
          margin-bottom:10px;flex-shrink:0;
        ">${s.n}</div>
        <div style="font-size:26px;margin-bottom:8px;line-height:1">${s.icon}</div>
        <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:5px;text-align:center">${s.name}</div>
        <div style="font-size:11.5px;color:#64748b;text-align:center;line-height:1.55">${s.desc}</div>
      </div>
    </div>
    ${i < steps.length - 1 ? `
      <div class="plan-step-sep" style="
        display:flex;align-items:center;padding:0 6px;flex-shrink:0;
        color:${color};font-size:22px;opacity:.5;font-weight:300;
      ">›</div>
    ` : ''}
  `).join('');

  // phase → phase connector
  const phaseArrow = `
    <div style="display:flex;justify-content:center;align-items:center;padding:8px 0">
      <div style="
        width:2px;height:28px;
        background:linear-gradient(to bottom,#e2e8f0,#cbd5e1);
      "></div>
    </div>
    <div style="display:flex;justify-content:center;margin-bottom:8px">
      <div style="
        width:0;height:0;
        border-left:7px solid transparent;
        border-right:7px solid transparent;
        border-top:8px solid #cbd5e1;
      "></div>
    </div>
  `;

  el.innerHTML = `
    <!-- Hero -->
    <div style="
      background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 60%,#1d4ed8 100%);
      border-radius:16px;
      padding:36px 32px;
      margin-bottom:24px;
      position:relative;
      overflow:hidden;
    ">
      <div style="position:absolute;inset:0;opacity:.04;background:repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%);background-size:20px 20px"></div>
      <div style="position:relative">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <span style="
            background:rgba(255,255,255,.15);
            border:1px solid rgba(255,255,255,.25);
            border-radius:8px;padding:6px 14px;
            font-size:12px;font-weight:600;color:#93c5fd;letter-spacing:.05em
          ">AI 導入框架</span>
        </div>
        <h2 style="color:#fff;font-size:26px;font-weight:700;margin-bottom:10px;line-height:1.3">
          八步驟 AI 導入計畫
        </h2>
        <p style="color:#93c5fd;font-size:14px;line-height:1.7;max-width:480px">
          從初步調查到全廠複製，系統性推動每個單位的 AI 轉型，確保每一步都有依據、每一步都可驗證。
        </p>
        <div style="display:flex;gap:20px;margin-top:20px;flex-wrap:wrap">
          ${[
            { n: '4', label: '推動階段' },
            { n: '8', label: '執行步驟' },
            { n: '∞', label: '持續優化' },
          ].map(s => `
            <div>
              <div style="color:#fff;font-size:22px;font-weight:700">${s.n}</div>
              <div style="color:#93c5fd;font-size:12px">${s.label}</div>
            </div>
          `).join('<div style="width:1px;background:rgba(255,255,255,.15)"></div>')}
        </div>
      </div>
    </div>

    <!-- Phases -->
    <div style="display:flex;flex-direction:column;gap:0;max-width:860px;margin:0 auto;width:100%">
      ${phases.map((phase, pi) => `
        <!-- Phase ${pi + 1} -->
        <div style="
          background:${phase.bg};
          border:1.5px solid ${phase.border};
          border-radius:14px;
          padding:24px 22px 22px;
        ">
          <!-- Phase header -->
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
            <div style="
              width:4px;height:22px;border-radius:2px;
              background:${phase.color};flex-shrink:0;
            "></div>
            <span style="
              font-size:13px;font-weight:700;
              color:${phase.color};
              letter-spacing:.06em;
              text-transform:uppercase;
            ">${phase.label}</span>
            <div style="flex:1;height:1px;background:${phase.border}"></div>
            <span style="
              font-size:11px;color:${phase.color};
              background:${phase.color}18;
              border-radius:99px;padding:2px 10px;font-weight:600;
            ">${phase.steps.length} 步驟</span>
          </div>

          <!-- Step cards row -->
          <div class="plan-steps-row" style="display:flex;align-items:stretch;gap:0;flex-wrap:wrap;row-gap:12px">
            ${stepCards(phase.steps, phase.color)}
          </div>
        </div>

        ${pi < phases.length - 1 ? phaseArrow : ''}
      `).join('')}
    </div>

    <!-- Footer note -->
    <div style="
      max-width:860px;margin:20px auto 0;
      display:flex;align-items:flex-start;gap:10px;
      background:#f8fafc;border:1px solid #e2e8f0;
      border-radius:10px;padding:14px 18px;
    ">
      <span style="font-size:16px;flex-shrink:0">💡</span>
      <p style="font-size:12.5px;color:#64748b;line-height:1.7;margin:0">
        此框架可依單位規模彈性調整步驟深度。部分成熟度較高的單位可從 <strong>PoC</strong> 直接切入；
        若已有成功案例，亦可優先推進 <strong>跨廠複製</strong>，同步帶動其他廠區啟動調查。
      </p>
    </div>
  `;
}

// ── Changelog ──

const CHANGELOG = [
  {
    version: 'v2.7.1',
    date: '2026-05-28',
    tag: '優化',
    tagColor: '#10b981',
    items: [
      '需求管理卡片重新設計：狀態+優先序移至左上橫排、標題加大加粗',
      '單位/窗口/負責人合併為一行 meta 列，資訊更緊湊',
      '評估摘要（可行性/複雜度/資料備齊/預期效益）整合為灰底條，一行掃完',
      '複雜度改為顏色編碼：高=紅、中=橙、低=綠',
      'AI 解法方向去除重藍框，改為 💡 圖示+藍色文字',
    ],
  },
  {
    version: 'v2.7.0',
    date: '2026-05-28',
    tag: '功能',
    tagColor: '#2563eb',
    items: [
      '新增「需求管理」頁面（側邊欄第4項）',
      '支援記錄各單位普查需求：問題描述、痛點、AI解法方向、可行性、複雜度、負責人等',
      '可依單位、狀態、優先序篩選；需求卡片顯示完整資訊',
      '資料來源：Google Sheets requirements 分頁（18 欄）',
    ],
  },
  {
    version: 'v2.6.5',
    date: '2026-05-28',
    tag: '功能',
    tagColor: '#2563eb',
    items: [
      'API 用量管理頁新增「應用」欄位支援：單位卡片內顯示各應用名稱與個別用量條',
      '所有紀錄表格新增「應用」欄（有填入 app 欄位時自動顯示）',
      '集團總覽與 API 頁的單位數統計改為以單位為單位計算（而非以 row 計算）',
    ],
  },
  {
    version: 'v2.6.4',
    date: '2026-05-28',
    tag: '修復',
    tagColor: '#f59e0b',
    items: [
      '修正成熟度矩陣在手機上卡片超出螢幕寬度的問題（grid min-width: 0）',
      '成熟度 label 欄縮窄至 70px，讓進度條有更多空間',
      '成熟度 detail table wrapper 加 max-width: 100% 防止撐寬父容器',
    ],
  },
  {
    version: 'v2.6.3',
    date: '2026-05-28',
    tag: '優化',
    tagColor: '#10b981',
    items: [
      'API 用量進度條在手機上改為獨佔一整行（由一個點變為完整的條）',
      'API 摘要「查看詳情」改為換行顯示，不再擠在同一行',
      '成熟度摘要改用 CSS class，mobile media query 可正確覆寫',
    ],
  },
  {
    version: 'v2.6.2',
    date: '2026-05-28',
    tag: '優化',
    tagColor: '#10b981',
    items: [
      '導入計畫步驟卡在手機上改為垂直排列，不再出現最後一張只佔半行的問題',
      '步驟間橫向箭頭在手機上隱藏',
      'API 摘要標題列在手機上自動換行',
    ],
  },
  {
    version: 'v2.6.1',
    date: '2026-05-28',
    tag: '修復',
    tagColor: '#f59e0b',
    items: [
      '導入計畫頁版面修正',
      '成果驗證文字調整',
    ],
  },
  {
    version: 'v2.6.0',
    date: '2026-05-25',
    tag: '功能',
    tagColor: '#2563eb',
    items: [
      '首頁新增使命標語：「AI 推動的目的，不是讓所有人都會開發，而是讓每個單位都能被 AI 支援。」',
      '新增修改記錄頁（本頁），方便追蹤每個版本的修改內容',
    ],
  },
  {
    version: 'v2.5.9',
    date: '2026-05-24',
    tag: '修復',
    tagColor: '#f59e0b',
    items: ['改以 inline styles 重寫成熟度摘要列，修正說明文字排版異常'],
  },
  {
    version: 'v2.5.8',
    date: '2026-05-24',
    tag: '修復',
    tagColor: '#f59e0b',
    items: ['修正成熟度說明文字排版：desc 移至 bar 欄內，align-items 改為 flex-start'],
  },
  {
    version: 'v2.5.7',
    date: '2026-05-24',
    tag: '修復',
    tagColor: '#f59e0b',
    items: ['成熟度進度條下方顯示說明文字，修正版面'],
  },
  {
    version: 'v2.5.6',
    date: '2026-05-24',
    tag: '功能',
    tagColor: '#2563eb',
    items: ['更新各成熟度等級說明文字', '在矩陣摘要中顯示成熟度描述'],
  },
  {
    version: 'v2.5.5',
    date: '2026-05-23',
    tag: '功能',
    tagColor: '#2563eb',
    items: ['案例頁與地區狀態面板新增顯示開發單位（devUnit）'],
  },
  {
    version: 'v2.5.4',
    date: '2026-05-23',
    tag: '修復',
    tagColor: '#f59e0b',
    items: ['Dashboard 單位改直接依 unit.region 分組，不再經由 regions 表查找'],
  },
  {
    version: 'v2.5.3',
    date: '2026-05-23',
    tag: '優化',
    tagColor: '#10b981',
    items: ['地區案例列表改為橫向排版，加入階段顏色標示與負責人姓名'],
  },
  {
    version: 'v2.5.2',
    date: '2026-05-22',
    tag: '資料',
    tagColor: '#8b5cf6',
    items: ['清除所有 mock 資料，Google Sheets 成為唯一資料來源'],
  },
  {
    version: 'v2.5.1',
    date: '2026-05-22',
    tag: '資料',
    tagColor: '#8b5cf6',
    items: ['單位與案例改為 merge 策略：保留 Sheets 中不存在的本地項目'],
  },
  {
    version: 'v2.5.0',
    date: '2026-05-21',
    tag: '功能',
    tagColor: '#2563eb',
    items: ['各地區啟動狀況改為顯示執行中案例名稱'],
  },
  {
    version: 'v2.4.0',
    date: '2026-05-20',
    tag: '功能',
    tagColor: '#2563eb',
    items: ['地區啟動狀況改版：每單位顯示 6 點成熟度追蹤器'],
  },
  {
    version: 'v2.3.0',
    date: '2026-05-19',
    tag: '優化',
    tagColor: '#10b981',
    items: ['地區卡片 UX 優化：進度條 + 成熟度 badge 取代 X/Y 單位計數'],
  },
  {
    version: 'v2.2.1',
    date: '2026-05-18',
    tag: '修復',
    tagColor: '#f59e0b',
    items: ['修正 units.region 與 regions.name 對齊，確保 dashboard 計數正確'],
  },
  {
    version: 'v2.2.0',
    date: '2026-05-17',
    tag: '功能',
    tagColor: '#2563eb',
    items: ['人才頁顯示負責專案', '地區子單位預設展開', 'regions 資料結構對齊 Sheets'],
  },
  {
    version: 'v2.1.0',
    date: '2026-05-16',
    tag: '功能',
    tagColor: '#2563eb',
    items: ['地區支援階層展開式子卡片'],
  },
];

function renderChangelog(el) {
  const tagStyles = (color) => `
    display:inline-block;
    padding:2px 10px;
    border-radius:99px;
    font-size:11px;
    font-weight:600;
    color:#fff;
    background:${color};
    vertical-align:middle;
    margin-left:10px;
  `;

  el.innerHTML = `
    <div class="card" style="max-width:780px;margin:0 auto">
      <div style="margin-bottom:28px">
        <div class="card-title" style="font-size:18px;margin-bottom:6px">📋 修改記錄</div>
        <p style="color:var(--text-muted);font-size:13px;margin:0">
          記錄每個版本的功能新增、問題修復與優化項目。
        </p>
      </div>

      <div style="display:flex;flex-direction:column;gap:0">
        ${CHANGELOG.map((entry, idx) => `
          <div style="
            display:flex;
            gap:0;
            position:relative;
          ">
            <!-- Timeline line -->
            <div style="
              display:flex;
              flex-direction:column;
              align-items:center;
              width:40px;
              flex-shrink:0;
            ">
              <div style="
                width:12px;height:12px;
                border-radius:50%;
                background:${idx === 0 ? '#2563eb' : 'var(--border)'};
                border:2px solid ${idx === 0 ? '#2563eb' : 'var(--border)'};
                margin-top:18px;
                flex-shrink:0;
                z-index:1;
              "></div>
              ${idx < CHANGELOG.length - 1 ? `<div style="
                width:2px;flex:1;
                background:var(--border);
                margin-top:2px;
              "></div>` : ''}
            </div>

            <!-- Content -->
            <div style="
              flex:1;
              padding:12px 0 28px 16px;
            ">
              <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:6px">
                <span style="
                  font-size:15px;font-weight:700;
                  color:${idx === 0 ? '#2563eb' : 'var(--text)'};
                ">${entry.version}</span>
                <span style="${tagStyles(entry.tagColor)}">${entry.tag}</span>
                <span style="font-size:12px;color:var(--text-muted);margin-left:auto">${entry.date}</span>
              </div>
              <ul style="
                margin:0;padding-left:18px;
                display:flex;flex-direction:column;gap:5px;
              ">
                ${entry.items.map(item => `
                  <li style="font-size:13px;color:var(--text-muted);line-height:1.6">${item}</li>
                `).join('')}
              </ul>
            </div>
          </div>
        `).join('')}
      </div>
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
