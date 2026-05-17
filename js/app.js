const PAGE_TITLES = {
  dashboard: '集團總覽',
  units:     '單位 AI 推動追蹤',
  cases:     'AI 應用案例',
  talent:    'AI 人才網路',
  training:  '課程安排',
  api:       'API 用量管理',
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
    case 'dashboard': renderDashboard(content); break;
    case 'units':     renderUnits(content);     break;
    case 'cases':     renderCases(content);     break;
    case 'talent':    renderTalent(content);    break;
    case 'training':  renderTraining(content);  break;
    case 'api':       renderApiUsage(content);  break;
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
  const apiOverCount = apiLatest.filter(r => r.cost_usd > r.budget_usd).length;

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

    <!-- API Usage Summary -->
    ${apiLatest.length ? `
    <div class="card" style="margin-bottom:20px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <div class="card-title" style="margin-bottom:0">API 用量快覽（${apiLatestMonth}）</div>
        <div style="display:flex;align-items:center;gap:16px">
          <span style="font-size:13px;color:var(--text-muted)">
            本月花費 <strong style="color:var(--text)">$${apiTotalCost.toFixed(2)}</strong>
            / 預算 $${apiTotalBudget.toFixed(2)}
            ${apiOverCount > 0 ? `<span class="tag tag-red" style="margin-left:6px">${apiOverCount} 單位超出</span>` : '<span class="tag tag-green" style="margin-left:6px">全部正常</span>'}
          </span>
          <a onclick="navigate('api')" style="font-size:12px;color:var(--primary);cursor:pointer;white-space:nowrap">查看詳情 →</a>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:9px">
        ${apiLatest.map(r => {
          const pct = Math.min(r.cost_usd / r.budget_usd * 100, 100);
          const over = r.cost_usd > r.budget_usd;
          return `
            <div style="display:flex;align-items:center;gap:12px">
              <span style="width:96px;font-size:12px;font-weight:500;flex-shrink:0;color:var(--text)">${r.unit}</span>
              <span class="api-provider-badge api-provider-${r.provider.toLowerCase()}" style="flex-shrink:0">${r.provider}</span>
              <div style="flex:1;background:#f1f5f9;border-radius:4px;height:8px;overflow:hidden">
                <div style="width:${pct}%;height:100%;background:${over ? '#ef4444' : '#2563eb'};border-radius:4px"></div>
              </div>
              <span style="width:100px;font-size:12px;color:${over ? '#ef4444' : 'var(--text-muted)'};text-align:right;flex-shrink:0;font-weight:${over ? '600' : '400'}">
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
  const { talents, units, training, training_records } = APP_DATA;

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
  const overUnits   = latestData.filter(r => r.cost_usd > r.budget_usd).length;

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
        <div class="kpi-value">${latestData.length}</div>
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
      ${latestData.map(r => {
        const pct = Math.min(r.cost_usd / r.budget_usd * 100, 100);
        const over = r.cost_usd > r.budget_usd;
        const provClass = `api-provider-${r.provider.toLowerCase()}`;
        return `
          <div class="api-unit-card">
            <div class="api-unit-header">
              <div class="api-unit-name">${r.unit}</div>
              <span class="api-provider-badge ${provClass}">${r.provider}</span>
            </div>
            <div class="api-budget-row">
              <span>花費 / 預算</span>
              <span style="color:${over ? '#ef4444' : 'var(--text)'};font-weight:${over ? '600' : '400'}">
                ${over ? '⚠ ' : ''}$${r.cost_usd.toFixed(2)} / $${r.budget_usd.toFixed(2)}
              </span>
            </div>
            <div class="api-budget-bar">
              <div class="api-budget-fill${over ? ' over' : ''}" style="width:${pct}%"></div>
            </div>
            <div class="api-stats-row">
              <span>使用率：<span class="api-stat-num${over ? ' api-over-warn' : ''}">${Math.round(r.cost_usd / r.budget_usd * 100)}%</span></span>
            </div>
          </div>`;
      }).join('')}
    </div>

    <!-- History table -->
    <div class="card" style="margin-top:20px;overflow-x:auto">
      <div class="card-title">所有紀錄</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>月份</th><th>單位</th><th>Provider</th>
            <th>花費 (USD)</th><th>預算 (USD)</th><th>狀態</th>
          </tr>
        </thead>
        <tbody>
          ${[...api_usage].sort((a,b) => b.month.localeCompare(a.month) || a.unit.localeCompare(b.unit)).map(r => `
            <tr>
              <td style="color:var(--text-muted)">${r.month}</td>
              <td><strong>${r.unit}</strong></td>
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
