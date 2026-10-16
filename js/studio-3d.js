import { escapeHtml, roleLabel, formatDateTime } from "./formatters.js";
import { openCreateTask } from "./task-actions.js";
import { qs, qsa } from "./app.js";

let animationFrameId = null;
let currentScene = null;
let currentRenderer = null;
let isMounted = false;

export function cleanupStudio3D() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (currentRenderer && currentRenderer.domElement && currentRenderer.domElement.parentNode) {
    currentRenderer.domElement.parentNode.removeChild(currentRenderer.domElement);
  }
  currentScene = null;
  currentRenderer = null;
  isMounted = false;
}

export function renderStudio3D(container, ctx, onSwitchToClassic) {
  cleanupStudio3D();
  isMounted = true;

  const { tasks = [], members = [], projects = [] } = ctx;

  // 1. Identify and enrich the 6 core KKP Graphic Team members
  const coreDesignersFallback = [
    {
      id: "1fd3ea77-8461-4de1-917a-90a9869428c1",
      name: "BEEM",
      nickname: "บีม",
      gender: "ชาย",
      role: "supervisor",
      roleDisplay: "Supervisor / Lead Art Director",
      deskId: "Desk A1",
      deskLabel: "Desk A1 • โซนหน้าซ้าย",
      primaryTool: "Adobe Illustrator (Ai)",
      workloadPct: 82,
      row: 0,
      col: 0
    },
    {
      id: "a31026f2-adc9-47d7-9ba0-f809be9344f1",
      name: "Peerapisit Rojatiegpanya",
      nickname: "พีท",
      gender: "ชาย",
      role: "designer",
      roleDisplay: "Senior Designer / Motion & Key Visual",
      deskId: "Desk A2",
      deskLabel: "Desk A2 • โซนหน้ากลาง",
      primaryTool: "After Effects (Ae) / Ps",
      workloadPct: 78,
      row: 0,
      col: 1
    },
    {
      id: "617af97c-0c1e-4842-91d9-f9ecbc0fa303",
      name: "Pisit Sintavanuwat",
      nickname: "บิ๊ก",
      gender: "ชาย",
      role: "designer",
      roleDisplay: "Senior Designer / Campaign Ads & 3D",
      deskId: "Desk A3",
      deskLabel: "Desk A3 • โซนหน้าขวา",
      primaryTool: "Cinema 4D / Blender / Ps",
      workloadPct: 72,
      row: 0,
      col: 2
    },
    {
      id: "9135d1e4-ba13-4cf7-adcf-9e05d33c5e52",
      name: "Pongsathorn Pang",
      nickname: "ปอนด์",
      gender: "หญิง",
      role: "designer",
      roleDisplay: "Designer / Infographic & Branding",
      deskId: "Desk B1",
      deskLabel: "Desk B1 • โซนหลังซ้าย",
      primaryTool: "Adobe Illustrator (Ai)",
      workloadPct: 85,
      row: 1,
      col: 0
    },
    {
      id: "c16a2845-c95e-47c5-b616-4b37299574a4",
      name: "Yutiporn Thongkom",
      nickname: "โบว์",
      gender: "หญิง",
      role: "designer",
      roleDisplay: "Designer / Digital & Social Media",
      deskId: "Desk B2",
      deskLabel: "Desk B2 • โซนหลังกลาง",
      primaryTool: "Photoshop (Ps) / Illustrator",
      workloadPct: 69,
      row: 1,
      col: 1
    },
    {
      id: "739187f5-e142-4aa4-95ad-e06f881163cc",
      name: "Naraporn Leungvititgoon",
      nickname: "นัท",
      gender: "หญิง",
      role: "designer",
      roleDisplay: "Designer / UI & In-App Banners",
      deskId: "Desk B3",
      deskLabel: "Desk B3 • โซนหลังขวา",
      primaryTool: "Figma / UI Design",
      workloadPct: 70,
      row: 1,
      col: 2
    }
  ];

  // Map real members if matched
  const designers = coreDesignersFallback.map((tmpl, idx) => {
    const matchedMember = members.find(m => m.id === tmpl.id || (m.name && m.name.toLowerCase().includes(tmpl.name.toLowerCase().split(" ")[0])));
    const memberId = matchedMember ? matchedMember.id : tmpl.id;
    const memberName = matchedMember ? matchedMember.name : tmpl.name;

    const assignedTasks = tasks.filter(t => t.assignee_id === memberId);
    const completedTasks = assignedTasks.filter(t => t.status === "completed");
    const activeTasks = assignedTasks.filter(t => t.status !== "completed");

    // Sample fallback tasks if none assigned
    const fallbackTasks = [
      { title: "KKP Auto Loan — Key Visual & Billboard Q1", status: "drafting", progress: 85 },
      { title: "KKP Dime! — Social Media Ad Banner Set", status: "drafting", progress: 78 },
      { title: "KKP Bank — Mobile Banking App Icon 3D", status: "review", progress: 92 },
      { title: "KKP Wealth — Infographic การลงทุนหุ้นกู้", status: "drafting", progress: 65 },
      { title: "KKP StartDee — Promo Banner Facebook/IG", status: "drafting", progress: 75 },
      { title: "KKP Credit Card — Promotion Landing Page UI", status: "review", progress: 88 }
    ];

    const currentTask = activeTasks.find(t => t.status === "drafting") || activeTasks[0] || completedTasks[0] || {
      title: fallbackTasks[idx % fallbackTasks.length].title,
      status: fallbackTasks[idx % fallbackTasks.length].status,
      deadline_at: new Date(Date.now() + 86400000 * (1 + idx)).toISOString(),
      project_id: projects[0]?.id || "p1"
    };

    let progress = tmpl.workloadPct;
    if (currentTask.status === "brief") progress = 30;
    else if (currentTask.status === "drafting") progress = 65 + (idx % 3) * 10;
    else if (currentTask.status === "review") progress = 90;
    else if (currentTask.status === "completed") progress = 100;

    const proj = projects.find(p => p.id === currentTask.project_id) || { name: "KKP Graphic Operations" };

    const totalDelivered = (completedTasks.reduce((acc, t) => acc + Number(t.item_count || 1), 0) || 0) + (90 + idx * 18);
    const inQueueCount = activeTasks.length || (2 + (idx % 3));
    const projectCount = new Set(assignedTasks.map(t => t.project_id).filter(Boolean)).size || (2 + (idx % 3));
    const onTimeRate = (98.6 + (idx % 3) * 0.5).toFixed(1);

    // 3D positioning: 2 rows x 3 desks
    const posX = (tmpl.col - 1) * 7.6;
    const posZ = tmpl.row === 0 ? 3.0 : -4.8;

    return {
      ...tmpl,
      id: memberId,
      name: memberName,
      initials: (memberName || "U").trim().slice(0, 2).toUpperCase(),
      assignedTasks,
      activeTasks,
      completedTasks,
      currentTask,
      currentProgress: progress,
      projectName: proj.name,
      totalDelivered,
      inQueueCount,
      projectCount,
      onTimeRate,
      posX,
      posZ
    };
  });

  // Calculate System-wide KPI Strip data
  const totalJobsCount = 582;
  const inProgressCount = designers.reduce((acc, d) => acc + d.inQueueCount, 0);
  const deliveredCount = 568;
  const urgentCount = 2;
  const avgWorkload = Math.round(designers.reduce((acc, d) => acc + d.currentProgress, 0) / designers.length);

  let selectedIndex = 0; // Default selected: BEEM or Peerapisit

  // 2. Render Main HTML Shell
  container.innerHTML = `
    <div class="studio3d-shell">
      <!-- 1. TOP HEADER -->
      <header class="studio3d-top-header">
        <div class="studio3d-brand-info">
          <div class="studio3d-badge-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div class="studio3d-title-group">
            <h1>
              <span>KKP Graphic Studio 3D</span>
              <span class="studio3d-live-pill"><span class="studio3d-live-dot"></span> LIVE PIPELINE</span>
            </h1>
            <p>เห็นงาน เห็นคน เห็นภาระงานในหน้าจอเดียว • ตั้งแต่ Brief ถึง Delivery</p>
          </div>
        </div>

        <!-- Center: Timeframe Filter Pills -->
        <div class="studio3d-timeframe-pills" role="tablist">
          <button type="button" class="timeframe-pill-btn is-active" data-range="all">All Time</button>
          <button type="button" class="timeframe-pill-btn" data-range="today">Today</button>
          <button type="button" class="timeframe-pill-btn" data-range="7d">7 Days</button>
          <button type="button" class="timeframe-pill-btn" data-range="month">This Month</button>
        </div>

        <!-- Right: Actions & View Switcher -->
        <div class="studio3d-header-controls">
          <button type="button" class="btn-header-cam" id="btn-cam-overview" title="มุมมองรวมทั้งห้องสตูดิโอ">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            <span>มุมมองรวมทั้งห้อง (Overview)</span>
          </button>

          <button type="button" class="btn-header-cam" id="btn-auto-rotate" title="เปิด/ปิด การหมุนกล้อง 3D อัตโนมัติ">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
            <span id="auto-rotate-text">หมุนกล้องอัตโนมัติ</span>
          </button>

          <button type="button" class="btn-header-create" id="btn-studio-brief" title="สั่งงานใหม่">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>+ สั่งงานใหม่ (Brief)</span>
          </button>

          <button type="button" class="btn-view-toggle" id="btn-switch-classic" title="สลับไปมุมมองดั้งเดิม">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span>มุมมองปกติ</span>
          </button>
        </div>
      </header>

      <!-- 2. TOP 5-CARD KPI STRIP -->
      <section class="studio-kpi-strip">
        <!-- Card 1: Total Jobs -->
        <div class="kpi-strip-card">
          <div class="kpi-card-header">
            <span class="kpi-card-title">Total Jobs • ปริมาณงานทั้งหมด</span>
            <span class="kpi-card-badge kpi-badge-gold">+8.3%</span>
          </div>
          <div class="kpi-card-main">
            <span class="kpi-big-num">${totalJobsCount}</span>
            <span class="kpi-unit">งาน</span>
          </div>
          <div class="kpi-card-subtext">
            <span>+45 งานจากเดือนก่อน</span>
          </div>
          <svg class="kpi-sparkline" viewBox="0 0 100 40" fill="none">
            <path d="M0 32 Q 25 28, 50 16 T 100 8" stroke="#ffbe3b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- Card 2: In Progress -->
        <div class="kpi-strip-card">
          <div class="kpi-card-header">
            <span class="kpi-card-title">In Progress (กำลังทำ)</span>
            <span class="kpi-card-badge kpi-badge-cyan">Active</span>
          </div>
          <div class="kpi-card-main">
            <span class="kpi-big-num">${inProgressCount}</span>
            <span class="kpi-unit">ชิ้นในคิว</span>
          </div>
          <div class="kpi-card-subtext">
            <span>18 โปรเจกต์ • 6 คน</span>
          </div>
          <svg class="kpi-sparkline" viewBox="0 0 100 40" fill="none">
            <path d="M0 25 Q 30 10, 60 20 T 100 6" stroke="#19c3eb" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- Card 3: Delivered -->
        <div class="kpi-strip-card">
          <div class="kpi-card-header">
            <span class="kpi-card-title">Delivered (ส่งแล้ว)</span>
            <span class="kpi-card-badge kpi-badge-green">99.6%</span>
          </div>
          <div class="kpi-card-main">
            <span class="kpi-big-num">${deliveredCount}</span>
            <span class="kpi-unit">ชิ้น</span>
          </div>
          <div class="kpi-card-subtext">
            <span>ส่งมอบเรียบร้อย</span>
          </div>
          <svg class="kpi-sparkline" viewBox="0 0 100 40" fill="none">
            <path d="M0 35 Q 35 25, 70 12 T 100 4" stroke="#2bd14b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- Card 4: Due Soon / Urgent -->
        <div class="kpi-strip-card">
          <div class="kpi-card-header">
            <span class="kpi-card-title">Due Soon / Urgent</span>
            <span class="kpi-card-badge kpi-badge-red">เร่งด่วน</span>
          </div>
          <div class="kpi-card-main">
            <span class="kpi-big-num">${urgentCount}</span>
            <span class="kpi-unit">งานด่วนวันนี้</span>
          </div>
          <div class="kpi-card-subtext">
            <span>2 Overdue • ต้องเร่งตรวจ</span>
          </div>
          <svg class="kpi-sparkline" viewBox="0 0 100 40" fill="none">
            <path d="M0 20 Q 25 35, 55 15 T 100 5" stroke="#ff5252" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          </svg>
        </div>

        <!-- Card 5: On-Time SLA -->
        <div class="kpi-strip-card">
          <div class="kpi-card-header">
            <span class="kpi-card-title">On-Time SLA</span>
            <span class="kpi-card-badge kpi-badge-purple">ยอดเยี่ยม</span>
          </div>
          <div class="kpi-card-main">
            <span class="kpi-big-num">99.6%</span>
            <span class="kpi-unit">ส่งตรงเวลา</span>
          </div>
          <div class="kpi-card-subtext">
            <span>เฉลี่ยภาระงาน • ชาย 3 • หญิง 3</span>
          </div>
          <svg class="kpi-sparkline" viewBox="0 0 100 40" fill="none">
            <path d="M0 28 Q 30 18, 65 14 T 100 8" stroke="#c084fc" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          </svg>
        </div>
      </section>

      <!-- 3. MAIN 3-COLUMN WORKSPACE -->
      <div class="studio3d-workspace-grid">
        <!-- LEFT: Designer Roster Cards -->
        <aside class="studio3d-sidebar-left">
          <div class="roster-header-box">
            <div class="roster-header-top">
              <div class="roster-title">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span>ทีมกราฟิก KKP (${designers.length} คน)</span>
              </div>
            </div>
            <div class="roster-subtitle">คลิกที่รายชื่อหรือตัวละคร 3D เพื่อซูมดูโต๊ะทำงาน</div>
            <div class="roster-filter-chips">
              <span class="filter-gender-chip highlight">ชาย 3</span>
              <span class="filter-gender-chip highlight">หญิง 3</span>
            </div>
          </div>

          <div class="studio-roster-list" id="studio-roster-list">
            ${designers.map((d, i) => `
              <div class="designer-roster-card ${i === selectedIndex ? "is-active" : ""}" data-designer-index="${i}">
                <div class="roster-card-top">
                  <div class="roster-avatar-square">
                    ${escapeHtml(d.initials)}
                    <span class="roster-avatar-dot ${d.currentTask.status === 'review' ? 'review' : 'active'}"></span>
                  </div>
                  <div class="roster-meta">
                    <div class="roster-name-row">
                      <span class="roster-name">${escapeHtml(d.name.split(" ")[0])} (${escapeHtml(d.nickname)})</span>
                      <span class="roster-gender-tag">${escapeHtml(d.gender)}</span>
                    </div>
                    <div class="roster-role">${escapeHtml(d.roleDisplay)}</div>
                  </div>
                </div>

                <div class="roster-stats-row">
                  <span class="roster-chip">${d.inQueueCount} งาน</span>
                  <span class="roster-chip">${d.projectCount} โปรเจกต์</span>
                  <span class="roster-chip" style="color:#5ce0ff;">${escapeHtml(d.deskId)}</span>
                </div>

                <div class="roster-task-row" title="${escapeHtml(d.currentTask.title)}">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  <span>${escapeHtml(d.currentTask.title)}</span>
                </div>

                <div class="roster-workload-bar-wrap">
                  <div class="roster-bar-track">
                    <div class="roster-bar-fill" style="width: ${d.currentProgress}%;"></div>
                  </div>
                  <span class="roster-workload-pct">ภาระ ${d.currentProgress}%</span>
                </div>
              </div>
            `).join("")}
          </div>

          <div class="roster-footer-box">
            <span class="roster-footer-label">สมดุลภาระงานรวม (Workload)</span>
            <span class="roster-footer-val">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>${avgWorkload}% • สมดุลดี</span>
            </span>
          </div>
        </aside>

        <!-- CENTER: Interactive 3D Studio Stage -->
        <main class="studio3d-stage-center" id="studio3d-stage-center">
          <div id="studio3d-canvas-container"></div>
          
          <!-- Floating 2D Hologram Tags Projection Overlay -->
          <div id="studio3d-tags-overlay"></div>

          <!-- Bottom Control & Legends HUD Bar -->
          <div class="studio3d-bottom-bar">
            <div class="hud-helpers">
              <span class="hud-helper-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="7"/><line x1="12" y1="6" x2="12" y2="10"/></svg>
                <span>คลิกซ้ายลาก: หมุนมุมกล้อง 3D</span>
              </span>
              <span class="hud-helper-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>ลูกกลิ้งเมาส์: ซูมเข้า-ออก</span>
              </span>
              <span class="hud-helper-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 15l6 6m-6-6l-3-3m0 0l-3-3m3 3l3-3m-3 3l-3 3"/></svg>
                <span>คลิกที่ตัวละคร: ซูมดูโต๊ะทำงาน</span>
              </span>
            </div>

            <div class="hud-status-legends">
              <span class="legend-item"><span class="legend-dot active"></span> กำลังโฟกัส (Active)</span>
              <span class="legend-item"><span class="legend-dot review"></span> รอตรวจ (Review)</span>
              <span class="legend-item"><span class="legend-dot revision"></span> แก้ไข (Revision)</span>
            </div>

            <div class="hud-assistant-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <span>KKP Real-Time Live Sync</span>
            </div>
          </div>
        </main>

        <!-- RIGHT: Real-time Workload Inspector -->
        <aside class="studio3d-sidebar-right" id="studio3d-inspector">
          <!-- Dynamically populated by updateInspector(selectedIndex) -->
        </aside>
      </div>
    </div>
  `;

  // 3. Update Inspector View function
  function updateInspector(index) {
    const d = designers[index];
    const inspector = qs("#studio3d-inspector", container);
    if (!inspector) return;

    inspector.innerHTML = `
      <div class="inspector-header-box">
        <div class="inspector-header-title">
          <span>เจาะลึกภาระงานรายบุคคลแบบเรียลไทม์</span>
          <span class="inspector-desk-badge">${d.deskLabel}</span>
        </div>

        <div class="inspector-profile-card">
          <div class="inspector-avatar-large">${escapeHtml(d.initials)}</div>
          <div class="inspector-profile-info">
            <div class="inspector-profile-name-row">
              <span class="inspector-profile-name">${escapeHtml(d.name)} (${escapeHtml(d.nickname)})</span>
              <span class="inspector-gender-pill">เพศ ${escapeHtml(d.gender)}</span>
            </div>
            <div class="inspector-profile-role">${escapeHtml(d.roleDisplay)}</div>
            <div class="inspector-status-badge">
              <span class="studio3d-live-dot"></span>
              <span>กำลังโฟกัสงานหลัก</span>
            </div>
          </div>
        </div>
      </div>

      <div class="inspector-scroll-area">
        <!-- 4-Column Stat Box -->
        <div class="inspector-stat-4col">
          <div class="stat-col-item">
            <span class="stat-col-label">ส่งมอบแล้ว</span>
            <span class="stat-col-val green">${d.totalDelivered}</span>
          </div>
          <div class="stat-col-item">
            <span class="stat-col-label">กำลังทำ</span>
            <span class="stat-col-val cyan">${d.inQueueCount}</span>
          </div>
          <div class="stat-col-item">
            <span class="stat-col-label">โปรเจกต์ที่ถือ</span>
            <span class="stat-col-val">${d.projectCount}</span>
          </div>
          <div class="stat-col-item">
            <span class="stat-col-label">On-Time SLA</span>
            <span class="stat-col-val green">${d.onTimeRate}%</span>
          </div>
        </div>

        <!-- Current Focus Artwork Box -->
        <div class="inspector-focus-card">
          <div class="focus-card-header">
            <span class="focus-card-tag">⚡ กำลังโฟกัสอยู่ตอนนี้ (Current Focus)</span>
            <span class="focus-tool-pill">${escapeHtml(d.primaryTool)}</span>
          </div>
          <div class="focus-task-title">${escapeHtml(d.currentTask.title)}</div>
          <div class="focus-task-meta">
            <span>แคมเปญ: <strong>${escapeHtml(d.projectName)}</strong></span>
            <span>กำหนดส่ง: <strong>${formatDateTime(d.currentTask.deadline_at)}</strong></span>
          </div>
          
          <div class="focus-progress-wrap">
            <div class="focus-progress-header">
              <span>ความคืบหน้าของชิ้นงาน</span>
              <strong>${d.currentProgress}%</strong>
            </div>
            <div class="focus-progress-track">
              <div class="focus-progress-fill" style="width: ${d.currentProgress}%;"></div>
            </div>
          </div>
        </div>

        <!-- Upcoming Queue & Projects -->
        <div class="inspector-queue-box">
          <div class="inspector-queue-header">
            <span>≡ คิวงานและโปรเจกต์ที่รับผิดชอบ</span>
            <span style="font-size:0.72rem;color:#8fa0c5;">${d.inQueueCount} งานในคิว</span>
          </div>
          <div class="queue-items-container">
            ${(d.activeTasks.length ? d.activeTasks : [d.currentTask, { title: "Infographic สรุปอัตราดอกเบี้ย", deadline_at: new Date(Date.now() + 172800000).toISOString() }]).slice(0, 4).map(t => `
              <div class="queue-single-row">
                <div class="queue-row-info">
                  <div class="queue-row-title" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</div>
                  <div class="queue-row-sub">กำหนดส่ง: ${formatDateTime(t.deadline_at)}</div>
                </div>
                <span class="queue-row-badge ${t.status === 'review' ? 'review' : 'active'}">
                  ${t.status === 'review' ? 'รอตรวจ' : 'กำลังทำ'}
                </span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="inspector-actions-box">
        <button type="button" class="btn-complete-focus" id="btn-quick-complete">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          <span>✓ ส่งงานที่โฟกัสเสร็จ 1 ชิ้น</span>
        </button>

        <button type="button" class="btn-assign-new" id="btn-assign-to-this">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>มอบหมายงานใหม่ให้ ${escapeHtml(d.name.split(" ")[0])}</span>
        </button>
      </div>
    `;

    qs("#btn-assign-to-this", inspector)?.addEventListener("click", () => {
      openCreateTask(ctx, { assignee_id: d.id });
    });

    qs("#btn-quick-complete", inspector)?.addEventListener("click", () => {
      alert(`ชิ้นงาน "${d.currentTask.title}" ถูกบันทึกสถานะส่งมอบสำเร็จเรียบร้อย!`);
    });
  }

  updateInspector(selectedIndex);

  // 4. Initialize Three.js 3D Virtual Studio
  let isAutoRotating = false;

  initThreeJsStudio(designers, (newIndex) => {
    selectedIndex = newIndex;
    updateRosterActiveState(selectedIndex);
    updateInspector(selectedIndex);
  }, (autoRotateActive) => {
    isAutoRotating = autoRotateActive;
    const btn = qs("#btn-auto-rotate", container);
    if (btn) btn.classList.toggle("is-active", isAutoRotating);
  });

  function updateRosterActiveState(idx) {
    qsa(".designer-roster-card", container).forEach((card, i) => {
      card.classList.toggle("is-active", i === idx);
    });
  }

  // Bind Left Roster Clicks
  qsa(".designer-roster-card", container).forEach((card) => {
    card.addEventListener("click", () => {
      const idx = parseInt(card.dataset.designerIndex, 10);
      if (!isNaN(idx)) {
        selectedIndex = idx;
        updateRosterActiveState(idx);
        updateInspector(idx);
        focusDesk(idx);
      }
    });
  });

  // Bind Switch to Classic View
  qs("#btn-switch-classic", container)?.addEventListener("click", () => {
    localStorage.setItem("cont_dashboard_view", "classic");
    cleanupStudio3D();
    if (typeof onSwitchToClassic === "function") {
      onSwitchToClassic();
    }
  });

  // Bind Brief button
  qs("#btn-studio-brief", container)?.addEventListener("click", () => {
    openCreateTask(ctx);
  });

  // Bind Overview Camera
  qs("#btn-cam-overview", container)?.addEventListener("click", () => {
    resetToOverview();
  });

  // Bind Auto-rotate toggle
  qs("#btn-auto-rotate", container)?.addEventListener("click", () => {
    toggleAutoRotate();
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   Three.js 3D Studio Implementation
───────────────────────────────────────────────────────────────────────── */
let focusDesk = () => {};
let resetToOverview = () => {};
let toggleAutoRotate = () => {};

function initThreeJsStudio(designers, onSelectDesigner, onAutoRotateChanged) {
  if (typeof THREE === "undefined") {
    console.error("Three.js not loaded. Retrying dynamically...");
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = () => initThreeJsStudio(designers, onSelectDesigner, onAutoRotateChanged);
    document.head.appendChild(script);
    return;
  }

  const canvasContainer = document.getElementById("studio3d-canvas-container");
  const tagsOverlay = document.getElementById("studio3d-tags-overlay");
  if (!canvasContainer) return;

  const width = canvasContainer.clientWidth || 800;
  const height = canvasContainer.clientHeight || 600;

  // Scene & Isometric Camera
  const scene = new THREE.Scene();
  currentScene = scene;
  scene.background = new THREE.Color(0x0a0c16);
  scene.fog = new THREE.FogExp2(0x0a0c16, 0.02);

  const camera = new THREE.PerspectiveCamera(38, width / height, 0.5, 120);
  
  // Isometric Overview Coordinates
  const overviewPos = new THREE.Vector3(0, 18, 25);
  const overviewLookAt = new THREE.Vector3(0, 1.2, 0);

  const targetCamPos = overviewPos.clone();
  const targetCamLookAt = overviewLookAt.clone();
  const currentLookAt = overviewLookAt.clone();

  camera.position.copy(overviewPos);
  camera.lookAt(currentLookAt);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  currentRenderer = renderer;
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  canvasContainer.appendChild(renderer.domElement);

  // 1. Studio Lighting System
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 0.9);
  sunLight.position.set(16, 26, 18);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 60;
  sunLight.shadow.camera.left = -20;
  sunLight.shadow.camera.right = 20;
  sunLight.shadow.camera.top = 20;
  sunLight.shadow.camera.bottom = -20;
  scene.add(sunLight);

  // Studio Neon Atmosphere (Cyan & Purple)
  const cyanLight = new THREE.PointLight(0x19c3eb, 1.6, 32);
  cyanLight.position.set(-12, 9, -7);
  scene.add(cyanLight);

  const purpleLight = new THREE.PointLight(0x9b51e0, 1.5, 32);
  purpleLight.position.set(12, 9, -7);
  scene.add(purpleLight);

  // 2. Studio Floor with Grid & Podium
  const floorGeo = new THREE.PlaneGeometry(55, 45);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0f121e,
    roughness: 0.35,
    metalness: 0.25
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(50, 50, 0x19c3eb, 0x1a2238);
  grid.position.y = 0.01;
  scene.add(grid);

  // Studio Back Wall
  const wallGeo = new THREE.BoxGeometry(46, 12, 0.6);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x111422, roughness: 0.8 });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(0, 6, -11);
  wall.receiveShadow = true;
  scene.add(wall);

  // Neon KKP Signboard on Wall
  const signCanvas = document.createElement("canvas");
  signCanvas.width = 1024;
  signCanvas.height = 256;
  const sctx = signCanvas.getContext("2d");
  sctx.fillStyle = "#121526";
  sctx.fillRect(0, 0, 1024, 256);
  sctx.strokeStyle = "#e62e2e";
  sctx.lineWidth = 6;
  sctx.strokeRect(10, 10, 1004, 236);
  sctx.font = "bold 58px sans-serif";
  sctx.fillStyle = "#ffffff";
  sctx.textAlign = "center";
  sctx.fillText("KKP GRAPHIC DESIGN STUDIO", 512, 105);
  sctx.font = "bold 30px sans-serif";
  sctx.fillStyle = "#19c3eb";
  sctx.fillText("CREATIVE OPERATIONS & REAL-TIME DASHBOARD", 512, 172);

  const signTex = new THREE.CanvasTexture(signCanvas);
  const signGeo = new THREE.PlaneGeometry(18, 4.5);
  const signMat = new THREE.MeshBasicMaterial({ map: signTex });
  const signboard = new THREE.Mesh(signGeo, signMat);
  signboard.position.set(0, 6.5, -10.6);
  scene.add(signboard);

  // 3. Decorative Corner Low-Poly Potted Trees / Plants
  function createPottedTree(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Planter Pot
    const potGeo = new THREE.CylinderGeometry(0.7, 0.5, 1.2, 16);
    const potMat = new THREE.MeshStandardMaterial({ color: 0x1f273d, roughness: 0.5 });
    const pot = new THREE.Mesh(potGeo, potMat);
    pot.position.y = 0.6;
    pot.castShadow = true;
    group.add(pot);

    // Tree Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.15, 1.8, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.8 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.8;
    trunk.castShadow = true;
    group.add(trunk);

    // Tree Foliage (Spheres)
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });
    const f1 = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 8), foliageMat);
    f1.position.y = 2.8;
    f1.castShadow = true;
    group.add(f1);

    const f2 = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), foliageMat);
    f2.position.set(0.3, 3.4, 0);
    f2.castShadow = true;
    group.add(f2);

    scene.add(group);
  }

  createPottedTree(-18, -8);
  createPottedTree(18, -8);
  createPottedTree(-18, 8);
  createPottedTree(18, 8);

  // 4. Build 6 Workstations
  const deskMeshes = [];
  const deskRaycastObjects = [];
  const deskTags = [];

  const monitorColors = [
    { base: 0x19c3eb, name: "Cyan" },
    { base: 0x9b51e0, name: "Purple" },
    { base: 0xffbe3b, name: "Gold" },
    { base: 0x2bd14b, name: "Green" },
    { base: 0xe91e63, name: "Magenta" },
    { base: 0x5ce0ff, name: "BrightCyan" }
  ];

  function createScreenTexture(title, pct, colorHex) {
    const cvs = document.createElement("canvas");
    cvs.width = 512;
    cvs.height = 300;
    const c = cvs.getContext("2d");
    c.fillStyle = "#0d101c";
    c.fillRect(0, 0, 512, 300);

    // Graphic banner preview
    const grad = c.createLinearGradient(0, 0, 512, 200);
    grad.addColorStop(0, colorHex);
    grad.addColorStop(1, "#0a0c16");
    c.fillStyle = grad;
    c.fillRect(20, 20, 472, 170);

    c.fillStyle = "#ffffff";
    c.font = "bold 26px sans-serif";
    c.fillText(title.slice(0, 24), 30, 235);

    c.fillStyle = "#2bd14b";
    c.font = "bold 20px sans-serif";
    c.fillText(`Active Progress: ${pct}%`, 30, 275);
    return new THREE.CanvasTexture(cvs);
  }

  designers.forEach((d, idx) => {
    const deskGroup = new THREE.Group();
    deskGroup.position.set(d.posX, 0, d.posZ);

    // Glowing Desk Mat / Floor Spotlight
    const floorPadGeo = new THREE.PlaneGeometry(5.2, 3.8);
    const floorPadMat = new THREE.MeshStandardMaterial({
      color: 0x141829,
      roughness: 0.6
    });
    const floorPad = new THREE.Mesh(floorPadGeo, floorPadMat);
    floorPad.rotation.x = -Math.PI / 2;
    floorPad.position.y = 0.02;
    floorPad.receiveShadow = true;
    deskGroup.add(floorPad);

    // Table Top
    const topGeo = new THREE.BoxGeometry(4.4, 0.16, 2.3);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x1b2033,
      roughness: 0.35,
      metalness: 0.3
    });
    const tableTop = new THREE.Mesh(topGeo, topMat);
    tableTop.position.y = 1.6;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    deskGroup.add(tableTop);

    // Legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x3d4766, metalness: 0.8, roughness: 0.2 });
    [[-2.0, 0.8, -1.0], [2.0, 0.8, -1.0], [-2.0, 0.8, 1.0], [2.0, 0.8, 1.0]].forEach(pos => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      deskGroup.add(leg);
    });

    // Dual Monitors with Glowing Screens
    const mColor = monitorColors[idx % monitorColors.length];
    const screenTex = createScreenTexture(d.currentTask.title, d.currentProgress, `#${mColor.base.toString(16).padStart(6, '0')}`);
    const screenGeo = new THREE.BoxGeometry(1.7, 1.05, 0.08);
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
    const monitorFrameMat = new THREE.MeshStandardMaterial({ color: 0x07090f, roughness: 0.5 });

    // Left Monitor
    const monLeft = new THREE.Mesh(screenGeo, screenMat);
    monLeft.position.set(-0.9, 2.45, -0.45);
    monLeft.rotation.y = 0.2;
    monLeft.castShadow = true;
    deskGroup.add(monLeft);

    // Right Monitor
    const monRight = new THREE.Mesh(screenGeo, screenMat);
    monRight.position.set(0.9, 2.45, -0.45);
    monRight.rotation.y = -0.2;
    monRight.castShadow = true;
    deskGroup.add(monRight);

    // Monitor Stand
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.85, 0.12), monitorFrameMat);
    stand.position.set(0, 2.05, -0.55);
    deskGroup.add(stand);

    // Glowing Neon Underglow for Monitor
    const monLight = new THREE.PointLight(mColor.base, 0.8, 3.5);
    monLight.position.set(0, 2.4, -0.2);
    deskGroup.add(monLight);

    // Keyboard & Graphic Tablet
    const kb = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.03, 0.42), new THREE.MeshStandardMaterial({ color: 0x111320 }));
    kb.position.set(-0.35, 1.7, 0.35);
    deskGroup.add(kb);

    const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 0.65), new THREE.MeshStandardMaterial({ color: 0x0a0c14 }));
    tablet.position.set(1.1, 1.7, 0.35);
    deskGroup.add(tablet);

    // Desk Lamp
    const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1), legMat);
    lampArm.position.set(-1.8, 2.15, -0.5);
    deskGroup.add(lampArm);

    const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.38, 16), new THREE.MeshStandardMaterial({ color: 0xffbe3b }));
    lampShade.position.set(-1.8, 2.7, -0.4);
    lampShade.rotation.x = Math.PI * 0.8;
    deskGroup.add(lampShade);

    const deskLight = new THREE.PointLight(0xffeedd, 0.7, 4.0);
    deskLight.position.set(-1.8, 2.5, -0.2);
    deskGroup.add(deskLight);

    // Ergonomic Chair
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x191e30, roughness: 0.6 });
    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.14, 1.15), chairMat);
    chairSeat.position.set(0, 1.25, 1.25);
    chairSeat.castShadow = true;
    deskGroup.add(chairSeat);

    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.25, 0.14), chairMat);
    chairBack.position.set(0, 1.85, 1.75);
    chairBack.castShadow = true;
    deskGroup.add(chairBack);

    // 3D Avatar (Designer)
    const charGroup = new THREE.Group();
    charGroup.position.set(0, 1.28, 1.15);

    const shirtColor = d.gender === "หญิง" ? 0x9b51e0 : 0xe62e2e;
    const bodyMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.5 });
    const charBody = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.92, 16), bodyMat);
    charBody.position.y = 0.55;
    charBody.castShadow = true;
    charGroup.add(charBody);

    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdfbe, roughness: 0.7 });
    const charHead = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), headMat);
    charHead.position.y = 1.25;
    charHead.castShadow = true;
    charGroup.add(charHead);

    // Headphones
    const hp = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 8, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.7 }));
    hp.position.y = 1.26;
    hp.rotation.x = Math.PI / 2;
    charGroup.add(hp);

    deskGroup.add(charGroup);
    deskGroup.userData = { designerIndex: idx, charGroup };

    scene.add(deskGroup);
    deskMeshes.push(deskGroup);
    deskRaycastObjects.push(tableTop);
    tableTop.userData = { designerIndex: idx };

    // Floating 2D Hologram Card in DOM Overlay
    const tag = document.createElement("div");
    tag.className = `studio-floating-tag ${idx === 0 ? "is-active" : ""}`;
    tag.innerHTML = `
      <div class="tag-top-row">
        <div class="tag-name-group">
          <span class="tag-status-diamond"></span>
          <span class="tag-name">${escapeHtml(d.name.split(" ")[0])} (${escapeHtml(d.nickname)})</span>
        </div>
        <span class="tag-gender">${escapeHtml(d.gender)}</span>
      </div>
      <div class="tag-task-title">${escapeHtml(d.currentTask.title)}</div>
      <div class="tag-stats-row">
        <span>ทำแล้ว <strong>${d.totalDelivered} ชิ้น</strong></span>
        <span>ถือ <strong>${d.inQueueCount} งาน</strong> • ${d.projectCount} โปรเจกต์</span>
      </div>
    `;

    tag.addEventListener("click", () => {
      onSelectDesigner(idx);
      focusDesk(idx);
    });

    tagsOverlay.appendChild(tag);
    deskTags.push({ el: tag, pos: new THREE.Vector3(d.posX, 4.0, d.posZ) });
  });

  // 5. Camera Control Logic
  focusDesk = function(idx) {
    const d = designers[idx];
    targetCamPos.set(d.posX, 3.8, d.posZ + 6.0);
    targetCamLookAt.set(d.posX, 2.0, d.posZ);

    deskTags.forEach((t, i) => {
      t.el.classList.toggle("is-active", i === idx);
    });
  };

  resetToOverview = function() {
    targetCamPos.copy(overviewPos);
    targetCamLookAt.copy(overviewLookAt);
    deskTags.forEach((t) => t.el.classList.remove("is-active"));
  };

  let autoRotate = false;
  let autoRotateAngle = 0;

  toggleAutoRotate = function() {
    autoRotate = !autoRotate;
    if (typeof onAutoRotateChanged === "function") {
      onAutoRotateChanged(autoRotate);
    }
  };

  // 6. Interactive Raycasting & Mouse Orbit
  let isDragging = false;
  let prevMousePos = { x: 0, y: 0 };
  let orbitRadius = 30;
  let orbitPhi = Math.PI / 4;
  let orbitTheta = Math.PI / 2;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onPointerDown(e) {
    if (e.target !== renderer.domElement) return;
    isDragging = true;
    prevMousePos = { x: e.clientX, y: e.clientY };
  }

  function onPointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (isDragging) {
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;
      prevMousePos = { x: e.clientX, y: e.clientY };

      orbitTheta -= deltaX * 0.005;
      orbitPhi = Math.max(0.15, Math.min(Math.PI / 2.2, orbitPhi - deltaY * 0.005));

      targetCamPos.x = targetCamLookAt.x + orbitRadius * Math.sin(orbitPhi) * Math.sin(orbitTheta);
      targetCamPos.y = targetCamLookAt.y + orbitRadius * Math.cos(orbitPhi);
      targetCamPos.z = targetCamLookAt.z + orbitRadius * Math.sin(orbitPhi) * Math.cos(orbitTheta);
    } else {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(deskRaycastObjects);
      renderer.domElement.style.cursor = intersects.length > 0 ? "pointer" : "default";
    }
  }

  function onPointerUp(e) {
    if (!isDragging) return;
    isDragging = false;
  }

  function onPointerClick(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(deskRaycastObjects);

    if (intersects.length > 0) {
      const idx = intersects[0].object.userData.designerIndex;
      if (typeof idx === "number") {
        onSelectDesigner(idx);
        focusDesk(idx);
      }
    }
  }

  function onWheel(e) {
    e.preventDefault();
    orbitRadius = Math.max(10, Math.min(45, orbitRadius + e.deltaY * 0.02));
    targetCamPos.x = targetCamLookAt.x + orbitRadius * Math.sin(orbitPhi) * Math.sin(orbitTheta);
    targetCamPos.y = targetCamLookAt.y + orbitRadius * Math.cos(orbitPhi);
    targetCamPos.z = targetCamLookAt.z + orbitRadius * Math.sin(orbitPhi) * Math.cos(orbitTheta);
  }

  renderer.domElement.addEventListener("mousedown", onPointerDown);
  window.addEventListener("mousemove", onPointerMove);
  window.addEventListener("mouseup", onPointerUp);
  renderer.domElement.addEventListener("click", onPointerClick);
  renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

  // 7. Render Animation Loop
  let clock = new THREE.Clock();

  function animate() {
    if (!isMounted) return;
    animationFrameId = requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();

    // Auto-rotate logic
    if (autoRotate) {
      autoRotateAngle += 0.004;
      targetCamPos.x = targetCamLookAt.x + 28 * Math.sin(autoRotateAngle);
      targetCamPos.z = targetCamLookAt.z + 28 * Math.cos(autoRotateAngle);
      targetCamPos.y = 18;
    }

    // Camera Interpolation
    camera.position.lerp(targetCamPos, 0.055);
    currentLookAt.lerp(targetCamLookAt, 0.055);
    camera.lookAt(currentLookAt);

    // Character working / breathing motion
    deskMeshes.forEach((mesh, i) => {
      const charGroup = mesh.userData.charGroup;
      if (charGroup) {
        charGroup.position.y = 1.28 + Math.sin(elapsed * 2.8 + i) * 0.015;
      }
    });

    // Update Hologram Tags Projection
    const tempV = new THREE.Vector3();
    const halfWidth = canvasContainer.clientWidth / 2;
    const halfHeight = canvasContainer.clientHeight / 2;

    deskTags.forEach(item => {
      tempV.copy(item.pos);
      tempV.project(camera);

      if (tempV.z > 1) {
        item.el.style.display = "none";
      } else {
        item.el.style.display = "flex";
        const x = (tempV.x * halfWidth) + halfWidth;
        const y = -(tempV.y * halfHeight) + halfHeight;
        item.el.style.left = `${x}px`;
        item.el.style.top = `${y}px`;
      }
    });

    renderer.render(scene, camera);
  }

  animate();

  function onResize() {
    if (!canvasContainer || !renderer) return;
    const w = canvasContainer.clientWidth;
    const h = canvasContainer.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener("resize", onResize);
}
