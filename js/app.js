const PAGE_TITLES = {
  dashboard:  '集團 AI 推廣總覽',
  units:      '單位 AI 推動追蹤',
  cases:      'AI 應用案例管理',
  talent:     'AI 人才與協作網路',
  proposals:  '需求提案與支援媒合',
  training:   '進階課程與人才培訓',
  governance: '風險治理',
  export:     '報表匯出',
  settings:   '系統設定',
};

// ── Helpers ──

function maturityColor(level) {
  return { L0:'#94a3b8', L1:'#93c5fd', L2:'#60a5fa', L3:'#f59e0b', L4:'#22c55e', L5:'#d97706' }[level] || '#94a3b8';
}

function stageTag(stage) {
  const cls = {
    '未啟動':'tag-gray', '需求盤點':'tag-blue',
    'PoC 測試':'tag-yellow', '導入中':'tag-yellow',
    '已上線':'tag-green', '可複製':'tag-gold',
  }[stage] || 'tag-gray';
  return `<span class="tag ${cls}">${stage}</span>`;
}

function statusTag(status) {
  const cls = {
    '已送出':'tag-blue', '評估中':'tag-yellow', '待媒合':'tag-purple',
    'PoC 中':'tag-yellow', '導入中':'tag-yellow', '已完成':'tag-green',
    '暫緩':'tag-gray', '待決策':'tag-red', '進行中':'tag-yellow', '已批准':'tag-green',
    '招生中':'tag-green', '規劃中':'tag-yellow',
  }[status] || 'tag-gray';
  return `<span class="tag ${cls}">${status}</span>`;
}

function bool(val) {
  return val
    ? `<span style="color:#22c55e;font-weight:600">是</span>`
    : `<span style="color:#94a3b8">否</span>`;
}

function levelBadge(level) {
  return `<span class="level-badge" style="background:${maturityColor(level)}">${level}</span>`;
}

// ── Navigation ──

function navigate(page) {
  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.page === page)
  );
  document.getElementById('page-title').textContent = PAGE_TITLES[page] || page;

  const content = document.getElementById('content');
  switch (page) {
    case 'dashboard':  renderDashboard(content); break;
    case 'units':      renderUnits(content);     break;
    case 'cases':      renderCases(content);     break;
    case 'talent':     renderTalent(content);    break;
    case 'proposals':  renderProposals(content); break;
    case 'training':   renderTraining(content);  break;
    default:           renderPlaceholder(content, page); break;
  }
}

// ── Dashboard ──

function renderDashboard(el) {
  const { kpis, regions, funnel, units, cases, executiveItems, updates } = APP_DATA;
  const maxFunnel = funnel[0].value;

  el.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card blue">
        <div class="kpi-label">已啟動單位數</div>
        <div class="kpi-value">${kpis.activatedUnits}</div>
        <div class="kpi-sub">共 ${units.length} 個單位</div>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-label">已完成盤點</div>
        <div class="kpi-value">${kpis.inventoriedUnits}</div>
        <div class="kpi-sub">單位已完成需求盤點</div>
      </div>
      <div class="kpi-card yellow">
        <div class="kpi-label">PoC 進行中</div>
        <div class="kpi-value">${kpis.pocInProgress}</div>
        <div class="kpi-sub">個應用案例測試中</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">已上線應用</div>
        <div class="kpi-value">${kpis.liveApplications}</div>
        <div class="kpi-sub">正式投入使用</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">可複製案例</div>
        <div class="kpi-value">${kpis.replicableCases}</div>
        <div class="kpi-sub">可推廣至其他單位</div>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-label">AI Champion 人數</div>
        <div class="kpi-value">${kpis.aiChampions}</div>
        <div class="kpi-sub">各單位推動者</div>
      </div>
      <div class="kpi-card yellow">
        <div class="kpi-label">累計節省工時</div>
        <div class="kpi-value">${kpis.savedHours}</div>
        <div class="kpi-sub">工時 / 月（預估）</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">預估年度效益</div>
        <div class="kpi-value">NT$${(kpis.estimatedValue / 10000).toFixed(0)}萬</div>
        <div class="kpi-sub">費用節省折算</div>
      </div>
    </div>

    <div class="two-col wide-left">
      <div class="card">
        <div class="card-title">全球推廣熱度</div>
        <div class="region-grid">
          ${regions.map(r => `
            <div class="region-card ${r.color}">
              <div class="region-name">${r.name}</div>
              <div class="region-status">
                <span class="region-dot" style="background:${r.dot}"></span>${r.status}
              </div>
              <div class="region-units">${r.active}/${r.units} 單位啟動</div>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;gap:12px;margin-top:14px;flex-wrap:wrap">
          ${[['#94a3b8','未啟動'],['#3b82f6','需求盤點中'],['#f59e0b','PoC 測試中'],['#22c55e','已導入'],['#d97706','可複製']].map(([c,l]) =>
            `<span style="display:flex;align-items:center;gap:4px;font-size:11px;color:#64748b">
              <span style="width:8px;height:8px;border-radius:50%;background:${c};display:inline-block"></span>${l}
            </span>`
          ).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-title">AI 應用漏斗</div>
        <div class="funnel-container">
          ${funnel.map(f => `
            <div class="funnel-row">
              <div class="funnel-label">${f.label}</div>
              <div class="funnel-bar-wrap">
                <div class="funnel-bar" style="width:${Math.max((f.value/maxFunnel)*100,18)}%;background:${f.color}">${f.value}</div>
              </div>
              <div class="funnel-value">${f.value}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="two-col wide-left">
      <div class="card">
        <div class="card-title">AI 成熟度矩陣</div>
        <table class="maturity-table">
          <thead>
            <tr>
              <th>單位</th>
              <th>L0<br><span style="font-weight:400;font-size:10px">未啟動</span></th>
              <th>L1<br><span style="font-weight:400;font-size:10px">已接觸</span></th>
              <th>L2<br><span style="font-weight:400;font-size:10px">已提出</span></th>
              <th>L3<br><span style="font-weight:400;font-size:10px">PoC</span></th>
              <th>L4<br><span style="font-weight:400;font-size:10px">已成效</span></th>
              <th>L5<br><span style="font-weight:400;font-size:10px">可複製</span></th>
            </tr>
          </thead>
          <tbody>
            ${units.map(u => {
              const lvl = parseInt(u.maturityLevel.replace('L',''));
              return `<tr>
                <td>${u.unitName}</td>
                ${[0,1,2,3,4,5].map(l =>
                  `<td>${l === lvl ? levelBadge(u.maturityLevel) : '<span class="level-dot"></span>'}</td>`
                ).join('')}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="card">
        <div class="card-title">Top 5 高價值案例</div>
        <table class="cases-mini-table">
          <thead>
            <tr><th>案例</th><th>狀態</th><th>效益</th><th style="text-align:center">複製</th></tr>
          </thead>
          <tbody>
            ${cases.slice(0,5).map(c => `
              <tr>
                <td>
                  <div style="font-weight:500">${c.caseName}</div>
                  <div style="color:#94a3b8;font-size:11px">${c.unitName}</div>
                </td>
                <td>${stageTag(c.stage)}</td>
                <td style="font-size:11px;color:#64748b;max-width:110px">${c.estimatedBenefit || '—'}</td>
                <td style="text-align:center">
                  <span class="${c.isReplicable ? 'replicate-yes' : 'replicate-no'}">${c.isReplicable ? '✓' : '○'}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="two-col">
      <div class="card">
        <div class="card-title">高層決策 / 支援事項</div>
        <div class="exec-list">
          ${executiveItems.map(e => `
            <div class="exec-item ${e.priority}">
              <div class="exec-text">${e.item}</div>
              <div>${statusTag(e.status)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-title">最近更新動態</div>
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
  `;
}

// ── Units ──

function renderUnits(el) {
  el.innerHTML = `
    <div class="page-header">
      <div class="filter-bar">
        <select class="filter-select" id="f-country" onchange="filterUnits()">
          <option value="">所有國家</option>
          ${[...new Set(APP_DATA.units.map(u=>u.country))].map(c=>`<option>${c}</option>`).join('')}
        </select>
        <select class="filter-select" id="f-stage" onchange="filterUnits()">
          <option value="">所有階段</option>
          <option>未啟動</option><option>需求盤點</option>
          <option>PoC 測試</option><option>已上線</option><option>可複製</option>
        </select>
        <select class="filter-select" id="f-support" onchange="filterUnits()">
          <option value="">全部</option>
          <option value="true">需要企劃室支援</option>
          <option value="false">不需要支援</option>
        </select>
      </div>
      <button class="btn btn-primary" onclick="navigate('proposals')">＋ 新增提案</button>
    </div>
    <div style="overflow-x:auto">
      <table class="data-table">
        <thead>
          <tr>
            <th>單位</th><th>國家</th><th>AI 窗口</th><th>AI Champion</th>
            <th>AI 人才</th><th>需支援</th><th>目前階段</th><th>成熟度</th>
            <th>代表案例</th><th>預估效益</th><th>下個里程碑</th><th>預計完成</th><th>最後更新</th>
          </tr>
        </thead>
        <tbody id="units-tbody">${unitsRows(APP_DATA.units)}</tbody>
      </table>
    </div>
  `;
}

function unitsRows(list) {
  return list.map(u => `
    <tr>
      <td><strong>${u.unitName}</strong></td>
      <td>${u.country}</td>
      <td>${u.aiContact || '—'}</td>
      <td>${u.aiChampion || '<span style="color:#94a3b8">—</span>'}</td>
      <td>${bool(u.hasAiTalent)}</td>
      <td>${bool(u.needSupport)}</td>
      <td>${stageTag(u.currentStage)}</td>
      <td>${levelBadge(u.maturityLevel)}</td>
      <td style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${u.repCase}">${u.repCase || '—'}</td>
      <td style="font-size:12px;color:#64748b;max-width:130px">${u.estimatedBenefit || '—'}</td>
      <td style="font-size:12px;max-width:130px">${u.nextMilestone || '—'}</td>
      <td style="font-size:12px;color:#64748b;white-space:nowrap">${u.dueDate || '—'}</td>
      <td style="font-size:12px;color:#94a3b8;white-space:nowrap">${u.lastUpdated || '—'}</td>
    </tr>
  `).join('');
}

function filterUnits() {
  const country = document.getElementById('f-country').value;
  const stage   = document.getElementById('f-stage').value;
  const support = document.getElementById('f-support').value;
  let list = APP_DATA.units;
  if (country) list = list.filter(u => u.country === country);
  if (stage)   list = list.filter(u => u.currentStage === stage);
  if (support !== '') list = list.filter(u => String(u.needSupport) === support);
  document.getElementById('units-tbody').innerHTML = unitsRows(list);
}

// ── Cases ──

function renderCases(el) {
  const { cases } = APP_DATA;
  el.innerHTML = `
    <div class="page-header">
      <div class="filter-bar">
        <select class="filter-select" id="f-apptype" onchange="filterCases()">
          <option value="">所有應用類型</option>
          ${[...new Set(cases.map(c=>c.appType))].map(t=>`<option>${t}</option>`).join('')}
        </select>
        <select class="filter-select" id="f-cstage" onchange="filterCases()">
          <option value="">所有狀態</option>
          <option>已上線</option><option>導入中</option><option>PoC 測試</option>
        </select>
      </div>
      <span style="font-size:13px;color:#64748b">${cases.length} 個案例</span>
    </div>
    <div class="case-grid" id="cases-grid">${caseCards(cases)}</div>
  `;
}

function caseCards(list) {
  return list.map(c => `
    <div class="case-card">
      <div class="case-card-header">
        <div>
          <div class="case-name">${c.caseName}</div>
          <div class="case-unit">${c.unitName} · ${c.country}</div>
        </div>
        ${stageTag(c.stage)}
      </div>
      <div class="case-meta">
        <span class="tag tag-blue">${c.appType}</span>
        ${c.toolsUsed.map(t=>`<span class="tag" style="background:#f8fafc;color:#475569;border:1px solid #e2e8f0">${t}</span>`).join('')}
      </div>
      <div class="case-field">問題：<span>${c.problem}</span></div>
      <div class="case-field" style="margin-top:4px">解法：<span>${c.solution}</span></div>
      <div class="case-footer">
        <div>
          <div class="case-field">預估效益：<span>${c.estimatedBenefit}</span></div>
          ${c.actualBenefit && !c.actualBenefit.includes('測試中') && !c.actualBenefit.includes('待確認')
            ? `<div class="case-field" style="margin-top:2px">實際成效：<span style="color:#22c55e">${c.actualBenefit}</span></div>`
            : ''}
        </div>
        ${c.isReplicable
          ? `<span class="replicable-badge">✓ 可複製</span>`
          : `<span style="font-size:11px;color:#94a3b8">測試中</span>`}
      </div>
      <div style="font-size:11px;color:#94a3b8;margin-top:8px">負責人：${c.owner} · ${c.lastUpdated}</div>
    </div>
  `).join('');
}

function filterCases() {
  const apptype = document.getElementById('f-apptype').value;
  const stage   = document.getElementById('f-cstage').value;
  let list = APP_DATA.cases;
  if (apptype) list = list.filter(c => c.appType === apptype);
  if (stage)   list = list.filter(c => c.stage === stage);
  document.getElementById('cases-grid').innerHTML = caseCards(list);
}

// ── Talent ──

function renderTalent(el) {
  const { talents } = APP_DATA;
  const roleColor = { '開發者':'#7c3aed', 'AI Champion':'#2563eb', '推動者':'#059669', '使用者':'#64748b' };

  el.innerHTML = `
    <div class="stats-row cols-4" style="margin-bottom:20px">
      <div class="stat-card">
        <div class="stat-value" style="color:#2563eb">${talents.length}</div>
        <div class="stat-label">AI 人才總數</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:#22c55e">${talents.filter(t=>t.canSupportOthers).length}</div>
        <div class="stat-label">可支援他廠</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:#7c3aed">${talents.filter(t=>t.advancedEligible).length}</div>
        <div class="stat-label">符合進階課程資格</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:#f59e0b">${talents.reduce((s,t)=>s+t.completedProjects,0)}</div>
        <div class="stat-label">累計完成專案</div>
      </div>
    </div>
    <div class="talent-grid">
      ${talents.map(t => `
        <div class="talent-card">
          <div class="talent-header">
            <div class="talent-avatar">${t.name.charAt(0)}</div>
            <div>
              <div class="talent-name">${t.name}</div>
              <div class="talent-role">
                <span class="tag" style="background:${(roleColor[t.role]||'#64748b')}20;color:${roleColor[t.role]||'#64748b'}">${t.role}</span>
              </div>
            </div>
          </div>
          <div style="font-size:12px;color:#64748b;margin-bottom:8px">${t.unit} · ${t.country}</div>
          <div class="skill-tags">${t.skills.map(s=>`<span class="skill-tag">${s}</span>`).join('')}</div>
          <div style="display:flex;gap:16px;margin-top:12px;font-size:12px">
            <div>
              <div style="color:#94a3b8">完成專案</div>
              <div style="font-weight:700">${t.completedProjects}</div>
            </div>
            <div>
              <div style="color:#94a3b8">支援他廠</div>
              <div style="font-weight:700;color:${t.canSupportOthers?'#22c55e':'#94a3b8'}">${t.canSupportOthers?'是':'否'}</div>
            </div>
            <div>
              <div style="color:#94a3b8">進階課程</div>
              <div style="font-weight:700;color:${t.advancedEligible?'#2563eb':'#94a3b8'}">${t.advancedEligible?'符合':'待評估'}</div>
            </div>
          </div>
          ${t.currentCases.length ? `
            <div style="margin-top:12px;padding-top:10px;border-top:1px solid #f1f5f9">
              <div style="font-size:11px;color:#94a3b8;margin-bottom:5px">負責案例</div>
              ${t.currentCases.map(c=>`<span class="tag tag-blue" style="margin-right:4px;margin-bottom:4px">${c}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

// ── Proposals ──

function renderProposals(el) {
  const { proposals } = APP_DATA;
  const statusList = ['已送出','評估中','待媒合','PoC 中','已完成','暫緩'];
  const priorityLabel = { high:'⚡ 高優先', medium:'● 中優先', low:'○ 低優先' };

  el.innerHTML = `
    <div class="page-header">
      <div class="filter-bar">
        <select class="filter-select">
          <option value="">所有狀態</option>
          ${statusList.map(s=>`<option>${s}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary">＋ 提出新需求</button>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
      ${[
        {label:'待處理', count: proposals.filter(p=>['已送出','待媒合'].includes(p.status)).length, color:'#ef4444'},
        {label:'評估中', count: proposals.filter(p=>p.status==='評估中').length, color:'#f59e0b'},
        {label:'進行中', count: proposals.filter(p=>['PoC 中','導入中'].includes(p.status)).length, color:'#3b82f6'},
        {label:'已完成', count: proposals.filter(p=>p.status==='已完成').length, color:'#22c55e'},
      ].map(s => `
        <div class="card" style="padding:14px 20px;flex-shrink:0;min-width:100px">
          <div style="font-size:12px;color:#64748b">${s.label}</div>
          <div style="font-size:26px;font-weight:700;margin-top:4px;color:${s.color}">${s.count}</div>
        </div>
      `).join('')}
    </div>

    <div class="proposal-list">
      ${proposals.map(p => `
        <div class="proposal-card">
          <div class="proposal-status-col">
            ${statusTag(p.status)}
            <div style="font-size:11px;color:#94a3b8;margin-top:6px">${priorityLabel[p.priority]||''}</div>
          </div>
          <div class="proposal-body">
            <div class="proposal-title">${p.unit} — 需求提案 #${p.id}</div>
            <div class="proposal-meta">${p.problem}</div>
            <div style="margin-top:8px;font-size:12px;color:#64748b">
              預期效益：<span style="color:#1e293b;font-weight:500">${p.expectedBenefit}</span>
            </div>
          </div>
          <div style="flex-shrink:0;text-align:right;font-size:11px;color:#94a3b8;white-space:nowrap">
            <div>申請人：${p.applicant}</div>
            <div style="margin-top:4px">送出：${p.submittedDate}</div>
            ${p.assignedTo ? `<div style="margin-top:4px;color:#2563eb;font-weight:500">承辦：${p.assignedTo}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Training ──

function renderTraining(el) {
  const { training } = APP_DATA;

  el.innerHTML = `
    <div class="info-banner">
      <strong>進階課程說明：</strong>課程優先針對已有 AI 使用經驗、曾完成 1-2 個 AI 專案、具備基礎技術能力的人員，並需主管支持參與。
    </div>

    <div class="stats-row cols-3" style="margin-bottom:20px">
      <div class="stat-card">
        <div class="stat-value" style="color:#2563eb">${training.length}</div>
        <div class="stat-label">課程模組總數</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:#22c55e">${training.filter(t=>t.status==='招生中').length}</div>
        <div class="stat-label">招生中</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:#f59e0b">${training.reduce((s,t)=>s+t.enrolled,0)}</div>
        <div class="stat-label">已報名人次</div>
      </div>
    </div>

    <div class="training-grid">
      ${training.map(t => `
        <div class="training-card">
          <div class="training-icon">${t.icon}</div>
          <div class="training-title">${t.module}</div>
          <div class="training-desc">${t.desc}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            ${statusTag(t.status)}
            <span style="font-size:12px;color:#64748b">${t.enrolled}/${t.capacity} 人</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${Math.round((t.enrolled/t.capacity)*100)}%"></div>
          </div>
          <div style="font-size:11px;color:#94a3b8;margin-top:8px">預計開課：${t.nextDate}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Placeholder ──

function renderPlaceholder(el, page) {
  const map = { governance:['🛡️','開發中'], export:['📤','開發中'], settings:['⚙️','開發中'] };
  const [icon, sub] = map[page] || ['📄','開發中'];
  el.innerHTML = `
    <div class="placeholder-page">
      <div class="placeholder-icon">${icon}</div>
      <div class="placeholder-text">${PAGE_TITLES[page]}</div>
      <div class="placeholder-sub">功能${sub}</div>
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
