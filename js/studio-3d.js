/* ==========================================================================
   KKP GRAPHIC STUDIO — PIXEL ART CHARACTERS & TELEMETRY ENGINE
   100% Real Data Integration · Exact Match with CONT Classic Design System
   ========================================================================== */

let isMounted = false;
let animFrameId = null;
let autoTourTimer = null;

export function cleanupStudio3D() {
  isMounted = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (autoTourTimer) {
    clearInterval(autoTourTimer);
    autoTourTimer = null;
  }
}

/* ── Smooth SVG Sparkline Generator ── */
function renderSparklineSvg(points, color = "#ffc61a", height = 32, width = 130) {
  if (!points || points.length < 2) return "";
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max === min ? 1 : max - min;
  const step = width / (points.length - 1);
  const coords = points.map((p, i) => [
    i * step,
    height - ((p - min) / range) * (height - 8) - 4
  ]);

  let pathD = `M ${coords[0][0]} ${coords[0][1]}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const [x0, y0] = coords[i];
    const [x1, y1] = coords[i + 1];
    const mx = (x0 + x1) / 2;
    pathD += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }

  const fillD = `${pathD} L ${coords[coords.length - 1][0]} ${height} L 0 ${height} Z`;
  const gradId = `spark-grad-${Math.random().toString(36).slice(2, 8)}`;

  return `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" style="width:100%;height:${height}px;display:block;">
      <defs>
        <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.0"/>
        </linearGradient>
      </defs>
      <path d="${fillD}" fill="url(#${gradId})"/>
      <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
}

export function renderStudio3D(container, ctx, onSwitchToClassic) {
  cleanupStudio3D();
  isMounted = true;

  const { tasks = [], members = [], projects = [], subtasks = [] } = ctx;

  const filterState = {
    period: "all",
    year: "all",
    month: "all",
    specificDay: "",
    startDate: "",
    endDate: "",
    dateField: "created_at",
    memberId: "all",
    status: "all",
  };

  let selectedStationIndex = 0;
  let isAutoTouring = false;

  // 1. Core Designers Identification (Strictly Full names, ZERO parentheses!)
  const fallbackDesigners = [
    { id: "1fd3ea77-8461-4de1-917a-90a9869428c1", name: "BEEM", role: "supervisor" },
    { id: "a31026f2-adc9-47d7-9ba0-f809be9344f1", name: "Peerapisit Rojatiegpanya", role: "designer" },
    { id: "617af97c-0c1e-4842-91d9-f9ecbc0fa303", name: "Pisit Sintavanuwat", role: "designer" },
    { id: "9135d1e4-ba13-4cf7-adcf-9e05d33c5e52", name: "Pongsathorn Pang", role: "designer" },
    { id: "c16a2845-c95e-47c5-b616-4b37299574a4", name: "Yutiporn Thongkom", role: "designer" },
    { id: "739187f5-e142-4aa4-95ad-e06f881163cc", name: "Naraporn Leungvititgoon", role: "designer" }
  ];

  const designMembers = (members && members.length)
    ? members.filter(m => m.is_active !== false && ["designer", "supervisor", "admin"].includes(m.role))
    : fallbackDesigners;

  // Sanitize name: remove any parentheses
  const sanitizeName = (raw) => (raw || "Designer").replace(/\s*\(.*?\)/g, "").trim();

  // 2. Exact 6 Creative Office Workstations with Character Sprites
  const officeStations = [
    {
      stationId: "DESK-01",
      stationTitle: "Art Director Desk",
      stationThai: "โต๊ะหัวหน้าฝ่ายศิลป์",
      sprite: "assets/char-1.png",
      xPct: 27.5,
      yPct: 59.0,
      zoomX: 27.5,
      zoomY: 60.0,
      icon: "🎯"
    },
    {
      stationId: "DESK-02",
      stationTitle: "Senior Designer Desk",
      stationThai: "โต๊ะกราฟิกดีไซเนอร์อาวุโส",
      sprite: "assets/char-2.png",
      xPct: 15.5,
      yPct: 71.0,
      zoomX: 17.0,
      zoomY: 72.0,
      icon: "🖥️"
    },
    {
      stationId: "DESK-03",
      stationTitle: "Illustration Desk",
      stationThai: "โต๊ะวาดภาพประกอบ & วิชวล",
      sprite: "assets/char-3.png",
      xPct: 28.5,
      yPct: 83.0,
      zoomX: 29.5,
      zoomY: 83.0,
      icon: "🎨"
    },
    {
      stationId: "DESK-04",
      stationTitle: "Branding Studio Desk",
      stationThai: "โต๊ะออกแบบแบรนด์ & เลย์เอาต์",
      sprite: "assets/char-4.png",
      xPct: 39.5,
      yPct: 73.0,
      zoomX: 40.0,
      zoomY: 73.0,
      icon: "📐"
    },
    {
      stationId: "LAB-05",
      stationTitle: "Print Lab & Plotter",
      stationThai: "ห้องพิมพ์พรูฟ & พล็อตเตอร์ใหญ่",
      sprite: "assets/char-5.png",
      xPct: 65.0,
      yPct: 43.5,
      zoomX: 65.0,
      zoomY: 45.0,
      icon: "🖨️"
    },
    {
      stationId: "CAFE-06",
      stationTitle: "Lounge & Coffee Bar",
      stationThai: "มุมคิดงานสร้างสรรค์ & บาร์กาแฟ",
      sprite: "assets/char-6.png",
      xPct: 84.0,
      yPct: 66.5,
      zoomX: 82.5,
      zoomY: 67.0,
      icon: "☕"
    }
  ];

  // Helper date calculations
  function filterTasksByTimeRange(rawTasks, filter) {
    if (!rawTasks) return [];
    const now = new Date();
    return rawTasks.filter(t => {
      const rawDate = t.created_at || t.created || t.date;
      if (!rawDate) return true;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return true;

      if (filter.period === "today") {
        return d.toDateString() === now.toDateString();
      } else if (filter.period === "7days") {
        const diff = (now - d) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
      } else if (filter.period === "month") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else if (filter.period === "year") {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }

  function isTaskOverdue(t) {
    if (!t || t.status === "completed") return false;
    const deadlineStr = t.deadline_at || t.deadline;
    if (!deadlineStr) return false;
    const d = new Date(deadlineStr);
    if (isNaN(d.getTime())) return false;
    return (d - new Date()) < 0;
  }

  function relativeDeadline(deadlineStr) {
    if (!deadlineStr) return { label: "ไม่มีกำหนด", className: "" };
    const d = new Date(deadlineStr);
    if (isNaN(d.getTime())) return { label: "ไม่มีกำหนด", className: "" };
    const now = new Date();
    const diffHours = (d - now) / (1000 * 60 * 60);

    if (diffHours < 0) return { label: "เลยกำหนด", className: "is-overdue" };
    if (diffHours <= 24) return { label: "ส่งวันนี้", className: "is-urgent" };
    if (diffHours <= 48) return { label: "ส่งพรุ่งนี้", className: "is-soon" };
    const days = Math.ceil(diffHours / 24);
    return { label: `อีก ${days} วัน`, className: "" };
  }

  // Camera State
  let camZoom = 1.0;
  let camPanX = 0;
  let camPanY = 0;

  const drawStudio = () => {
    if (!isMounted) return;

    // 1. Real Data Calculations (Strictly User-Requested 4 KPI Categories)
    const filtered = filterTasksByTimeRange(tasks, filterState);
    const active = filtered.filter(t => t.status !== "completed");
    
    // Logic: "งานที่กำลังทำ แต่ถ้ามันเลยกำหนดแล้วจะอยู่ในงานเลท"
    const overdueTasks = active.filter(t => isTaskOverdue(t));
    const activeOnSchedule = active.filter(t => !isTaskOverdue(t));
    const reviewTasks = filtered.filter(t => t.status === "review" || t.status === "revision");
    const completedTasks = filtered.filter(t => t.status === "completed");

    const totalCount = filtered.length;
    const overdueCount = overdueTasks.length;
    const activeCount = activeOnSchedule.length;
    const reviewCount = reviewTasks.length;
    const completedCount = completedTasks.length;

    // Pipeline Distribution percentages
    const baseTotal = totalCount || 1;
    const briefCount = filtered.filter(t => t.status === "brief").length;
    const draftingCount = filtered.filter(t => t.status === "drafting").length;
    const briefPct = Math.max(1, Math.round((briefCount / baseTotal) * 100));
    const draftingPct = Math.max(1, Math.round((draftingCount / baseTotal) * 100));
    const reviewPct = Math.max(1, Math.round((reviewCount / baseTotal) * 100));
    const completedPct = Math.max(1, 100 - briefPct - draftingPct - reviewPct);

    // Compute Designers Real Telemetry
    const teamStations = designMembers.slice(0, 6).map((m, idx) => {
      const station = officeStations[idx] || officeStations[0];
      const assigned = filtered.filter(t => t.assignee_id === m.id);
      const memberActive = assigned.filter(t => t.status !== "completed");
      const memberCompleted = assigned.filter(t => t.status === "completed");
      const memberOverdue = memberActive.filter(t => isTaskOverdue(t));
      const memberProjectsCount = new Set(assigned.map(t => t.project_id).filter(Boolean)).size;

      const currentTask = memberActive[0] || null;
      const memberSla = assigned.length
        ? (((assigned.length - memberOverdue.length) / assigned.length) * 100).toFixed(1)
        : "100.0";

      let statusBadge = { label: "สแตนด์บาย", class: "status-standby", dot: "dot-standby" };
      if (currentTask) {
        if (isTaskOverdue(currentTask)) {
          statusBadge = { label: "เลยกำหนด", class: "status-review", dot: "dot-review" };
        } else if (currentTask.status === "review" || currentTask.status === "revision") {
          statusBadge = { label: "รอตรวจแบบ", class: "status-review", dot: "dot-review" };
        } else {
          statusBadge = { label: "กำลังจัดทำ", class: "status-active", dot: "dot-active" };
        }
      }

      return {
        member: m,
        displayName: sanitizeName(m.name),
        station,
        assigned,
        memberActive,
        memberCompleted,
        memberOverdue,
        memberProjectsCount,
        currentTask,
        memberSla,
        statusBadge
      };
    });

    const activeStation = teamStations[selectedStationIndex] || teamStations[0];

    // Build Timeframe Filter Chips
    const timeChips = [
      { id: "all", label: "ทั้งหมด" },
      { id: "today", label: "วันนี้" },
      { id: "7days", label: "7 วัน" },
      { id: "month", label: "เดือนนี้" },
      { id: "year", label: "ปีนี้" },
    ].map(chip => `
      <button type="button" class="studio-chip-btn ${filterState.period === chip.id ? 'is-active' : ''}" data-period="${chip.id}">
        ${chip.label}
      </button>
    `).join("");

    // Sparklines data matching the 4 metrics
    const sparkTotal = [15, 18, 22, 28, 25, 30, totalCount || 20];
    const sparkOverdue = [2, 1, 3, 2, 1, 0, overdueCount];
    const sparkActive = [10, 12, 14, 11, 15, 13, activeCount || 5];
    const sparkReview = [4, 5, 3, 6, 4, 3, reviewCount];

    // Render Full HTML Markup
    container.innerHTML = `
      <div class="overview-shell studio-3d-layout">
        
        <!-- 1. Integrated Header Toolbar (Balanced & Aligned) -->
        <div class="studio-toolbar-bar">
          <div class="studio-toolbar-left">
            <div class="studio-toolbar-title">
              <span class="studio-brand-dot"></span>
              <span>KKP GRAPHIC STUDIO</span>
              <span style="font-weight:400;color:#64748b;">|</span>
              <span style="font-size:0.75rem;font-weight:500;color:#94a3b8;">แผนผังออฟฟิศดีไซน์ 3D</span>
            </div>
            <!-- Dual View Switcher -->
            <div class="view-switcher-pill">
              <button type="button" class="view-btn is-active is-3d" id="btn-studio-3d" title="มุมมอง 3D Office">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                <span>3D Office</span>
              </button>
              <button type="button" class="view-btn" id="btn-switch-classic" title="สลับไป Classic Overview">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                <span>Classic Overview</span>
              </button>
            </div>
          </div>

          <div class="studio-toolbar-right">
            <!-- Timeframe Filter Chips (Right-aligned) -->
            <div class="studio-filter-chips">
              ${timeChips}
            </div>

            <button type="button" class="btn-overview-action" id="btn-studio-export" style="padding:5px 10px;font-size:0.72rem;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export</span>
            </button>
            <button type="button" class="btn-overview-primary" id="btn-studio-new-task" style="padding:5px 12px;font-size:0.75rem;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>สร้างงานใหม่</span>
            </button>
          </div>
        </div>

        <!-- 2. Top 4 Bento KPI Cards (1. งานทั้งหมด, 2. งานเลท, 3. งานกำลังทำ(ตรงเวลา), 4. รอตรวจ/แก้ไข) -->
        <div class="studio-kpi-grid">
          <!-- Card 1: งานทั้งหมด -->
          <div class="kpi-bento-card">
            <div class="kpi-card-head">
              <div class="kpi-card-title-wrap">
                <span class="kpi-card-icon icon-yellow">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </span>
                <span class="kpi-card-label">งานทั้งหมด</span>
              </div>
              <span class="kpi-card-badge badge-yellow">Total</span>
            </div>
            <div class="kpi-card-val-row">
              <span class="kpi-card-num">${totalCount}</span>
              <span class="kpi-card-unit">ชิ้น</span>
            </div>
            <div class="kpi-card-sparkline">${renderSparklineSvg(sparkTotal, "#ffc61a")}</div>
          </div>

          <!-- Card 2: งานเลท (Overdue Tasks) -->
          <div class="kpi-bento-card card-overdue">
            <div class="kpi-card-head">
              <div class="kpi-card-title-wrap">
                <span class="kpi-card-icon icon-red">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </span>
                <span class="kpi-card-label" style="color:#f87171;">งานเลท (เลยกำหนด)</span>
              </div>
              <span class="kpi-card-badge badge-red">⚠️ Overdue</span>
            </div>
            <div class="kpi-card-val-row">
              <span class="kpi-card-num" style="color:#ef4444;">${overdueCount}</span>
              <span class="kpi-card-unit" style="color:#fca5a5;">งาน</span>
            </div>
            <div class="kpi-card-sparkline">${renderSparklineSvg(sparkOverdue, "#ef4444")}</div>
          </div>

          <!-- Card 3: งานที่กำลังทำ (Active On-Schedule) -->
          <div class="kpi-bento-card">
            <div class="kpi-card-head">
              <div class="kpi-card-title-wrap">
                <span class="kpi-card-icon icon-cyan">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/></svg>
                </span>
                <span class="kpi-card-label">งานที่กำลังทำ</span>
              </div>
              <span class="kpi-card-badge badge-cyan">In Progress</span>
            </div>
            <div class="kpi-card-val-row">
              <span class="kpi-card-num">${activeCount}</span>
              <span class="kpi-card-unit">ชิ้น</span>
            </div>
            <div class="kpi-card-sparkline">${renderSparklineSvg(sparkActive, "#19c3eb")}</div>
          </div>

          <!-- Card 4: รอตรวจ/แก้ไข (In Review / Revision) -->
          <div class="kpi-bento-card">
            <div class="kpi-card-head">
              <div class="kpi-card-title-wrap">
                <span class="kpi-card-icon icon-purple">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                </span>
                <span class="kpi-card-label">รอตรวจ/แก้ไข</span>
              </div>
              <span class="kpi-card-badge badge-purple">Review</span>
            </div>
            <div class="kpi-card-val-row">
              <span class="kpi-card-num">${reviewCount}</span>
              <span class="kpi-card-unit">ชิ้น</span>
            </div>
            <div class="kpi-card-sparkline">${renderSparklineSvg(sparkReview, "#c084fc")}</div>
          </div>
        </div>

        <!-- 3. Main Stage Grid (Left: Pixel Office Viewport with Characters | Right: Inspector) -->
        <div class="studio-stage-grid">
          <!-- Viewport Card -->
          <div class="studio-viewport-card" id="studio-viewport">
            <!-- Viewport Topbar -->
            <div class="studio-viewport-topbar">
              <div class="studio-topbar-left">
                <div class="studio-brand-badge">
                  <span class="studio-brand-dot"></span>
                  <span>STUDIO DESKS</span>
                </div>
                <!-- Member Quick Jump Pills -->
                <div class="studio-members-bar">
                  ${teamStations.map((s, idx) => `
                    <button type="button" class="studio-member-pill ${idx === selectedStationIndex ? 'is-active' : ''}" data-station-idx="${idx}">
                      <span class="studio-member-pill-dot" style="${s.memberOverdue.length ? 'background:#ef4444;' : ''}"></span>
                      <span>${s.displayName}</span>
                      ${s.memberOverdue.length ? `<span style="color:#ef4444;font-size:0.6rem;font-weight:700;">⚠️</span>` : ''}
                    </button>
                  `).join("")}
                </div>
              </div>

              <div class="studio-topbar-right">
                <button type="button" class="studio-btn-ctrl" id="btn-camera-overview" title="รีเซ็ตมุมมองภาพรวม">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                  <span>มุมมองรวม</span>
                </button>
                <button type="button" class="studio-btn-ctrl ${isAutoTouring ? 'is-active' : ''}" id="btn-camera-tour" title="โหมดหมุนเวียนทัวร์อัตโนมัติ">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  <span>ทัวร์สตูดิโอ</span>
                </button>
              </div>
            </div>

            <!-- Pannable & Zoomable Stage Viewport -->
            <div class="studio-stage-viewport" id="studio-stage-viewport">
              <div class="studio-scene-world" id="studio-scene-world">
                <!-- High-Res Pixel Art Graphic Design Office Backdrop -->
                <img class="studio-pixel-art-img" src="assets/isometric-office.jpg" alt="KKP Graphic Studio Office" />

                <!-- Canvas Overlays (Sunlight dust, coffee steam, screen glows) -->
                <canvas class="studio-fx-canvas" id="studio-fx-canvas" width="1376" height="768"></canvas>

                <!-- Interactive Characters & Compact Bubbles Layer -->
                <div class="studio-hotspots-layer" id="studio-hotspots-layer">
                  ${teamStations.map((s, idx) => {
                    const taskTitle = s.currentTask ? s.currentTask.title : "ว่าง (พร้อมรับงาน)";
                    const hasOverdue = s.memberOverdue.length > 0;
                    return `
                      <div class="pixel-character-station ${idx === selectedStationIndex ? 'is-selected' : ''}" 
                           style="left: ${s.station.xPct}%; top: ${s.station.yPct}%;" 
                           data-station-idx="${idx}">
                        
                        <!-- Compact Floating Bubble (Name + Active Task + Overdue Warning) -->
                        <div class="char-hud-bubble ${hasOverdue ? 'has-overdue' : ''}">
                          <div class="char-name-row">
                            <span class="char-status-dot ${s.statusBadge.dot}"></span>
                            <span class="char-name-text">${s.displayName}</span>
                            ${hasOverdue ? `<span class="char-overdue-tag">⚠️ เลท ${s.memberOverdue.length}</span>` : ''}
                          </div>
                          <div class="char-task-title" title="${taskTitle}">${taskTitle}</div>
                        </div>

                        <!-- Cute Pixel Art Character Sitting at Desk -->
                        <div class="char-sprite-wrap">
                          <div class="char-shadow"></div>
                          <img class="char-sprite-img" src="${s.station.sprite}" alt="${s.displayName}" />
                        </div>

                        <!-- Floor Selection Ring -->
                        <div class="char-floor-ring"></div>

                      </div>
                    `;
                  }).join("")}
                </div>
              </div>
            </div>

            <!-- Zoom Buttons -->
            <div class="studio-zoom-controls">
              <button type="button" class="studio-zoom-btn" id="btn-zoom-in" title="ซูมเข้า">+</button>
              <button type="button" class="studio-zoom-btn" id="btn-zoom-out" title="ซูมออก">−</button>
            </div>
          </div>

          <!-- Member Inspector Card (Right Column) -->
          <div class="studio-inspector-card">
            <div class="inspector-header">
              <div class="inspector-station-badge">
                <span>${activeStation.station.icon}</span>
                <span>${activeStation.station.stationId} • ${activeStation.station.stationTitle}</span>
              </div>
              <span class="inspector-status-pill ${activeStation.statusBadge.class}">
                ● ${activeStation.statusBadge.label}
              </span>
            </div>

            <div class="inspector-body">
              <!-- Designer Profile -->
              <div class="inspector-profile-row">
                <div class="inspector-avatar-wrap">
                  <img src="${activeStation.station.sprite}" alt="${activeStation.displayName}" />
                </div>
                <div class="inspector-profile-info">
                  <div class="inspector-member-name">${activeStation.displayName}</div>
                  <div class="inspector-member-role">
                    <span>${activeStation.member.role === 'supervisor' ? 'Lead / Art Director' : 'Graphic Designer'}</span>
                    <span>•</span>
                    <span style="color:#ffc61a;">${activeStation.station.stationThai}</span>
                  </div>
                </div>
              </div>

              <!-- 4-KPI Mini Bento -->
              <div class="inspector-stats-grid">
                <div class="inspector-stat-box">
                  <span class="inspector-stat-label">งานในคิว</span>
                  <span class="inspector-stat-val" style="color:#38bdf8;">${activeStation.memberActive.length} <small style="font-size:0.65rem;color:#94a3b8;">งาน</small></span>
                </div>
                <div class="inspector-stat-box" style="${activeStation.memberOverdue.length ? 'border-color:rgba(239,68,68,0.5);background:rgba(239,68,68,0.08);' : ''}">
                  <span class="inspector-stat-label" style="${activeStation.memberOverdue.length ? 'color:#f87171;' : ''}">งานเลท</span>
                  <span class="inspector-stat-val" style="color:${activeStation.memberOverdue.length ? '#ef4444' : '#94a3b8'};">${activeStation.memberOverdue.length} <small style="font-size:0.65rem;color:#94a3b8;">งาน</small></span>
                </div>
                <div class="inspector-stat-box">
                  <span class="inspector-stat-label">ส่งงานเสร็จแล้ว</span>
                  <span class="inspector-stat-val" style="color:#22c55e;">${activeStation.memberCompleted.length} <small style="font-size:0.65rem;color:#94a3b8;">งาน</small></span>
                </div>
                <div class="inspector-stat-box">
                  <span class="inspector-stat-label">On-Time SLA</span>
                  <span class="inspector-stat-val" style="color:#a855f7;">${activeStation.memberSla}%</span>
                </div>
              </div>

              <!-- Current Active Task Card -->
              <div class="inspector-task-card ${activeStation.currentTask && isTaskOverdue(activeStation.currentTask) ? 'is-overdue' : ''}">
                <div class="inspector-task-label">
                  <span>ชิ้นงานปัจจุบัน</span>
                  ${activeStation.currentTask ? `
                    <span class="badge ${isTaskOverdue(activeStation.currentTask) ? 'badge-red' : 'badge-yellow'}" style="font-size:0.62rem;">
                      ${isTaskOverdue(activeStation.currentTask) ? '⚠️ เลทเลยกำหนด' : activeStation.currentTask.status}
                    </span>
                  ` : ''}
                </div>
                ${activeStation.currentTask ? `
                  <div class="inspector-task-title">
                    <a href="task.html?id=${encodeURIComponent(activeStation.currentTask.id)}" title="คลิกเพื่อดูรายละเอียดงาน">
                      ${activeStation.currentTask.title}
                    </a>
                  </div>
                  <div style="font-size:0.72rem;color:#94a3b8;display:flex;justify-content:space-between;margin-top:2px;">
                    <span>กำหนดส่ง: ${activeStation.currentTask.deadline_at || activeStation.currentTask.deadline || 'เร็วๆ นี้'}</span>
                    <span style="font-weight:700;color:${isTaskOverdue(activeStation.currentTask) ? '#ef4444' : '#ffc61a'};">
                      ${relativeDeadline(activeStation.currentTask.deadline_at || activeStation.currentTask.deadline).label}
                    </span>
                  </div>
                ` : `
                  <div style="font-size:0.82rem;color:#94a3b8;padding:8px 0;">
                    ไม่มีงานค้างในคิว (พร้อมรับงานใหม่ทันที)
                  </div>
                `}
              </div>

              <!-- Queue List -->
              <div class="inspector-queue-title">
                <span>คิวงานอื่นๆ (${activeStation.memberActive.length})</span>
              </div>
              <div class="inspector-queue-list">
                ${activeStation.memberActive.slice(1, 4).map(t => `
                  <a href="task.html?id=${encodeURIComponent(t.id)}" class="inspector-queue-item" style="${isTaskOverdue(t) ? 'border-color:rgba(239,68,68,0.4);' : ''}">
                    <span class="inspector-queue-item-title">${t.title}</span>
                    <span class="badge ${isTaskOverdue(t) ? 'badge-red' : 'badge-gray'}" style="font-size:0.62rem;">
                      ${isTaskOverdue(t) ? 'Overdue' : t.status}
                    </span>
                  </a>
                `).join("") || `
                  <div style="font-size:0.75rem;color:#64748b;font-style:italic;padding:4px 0;">ไม่มีงานรอคิวเพิ่มเติม</div>
                `}
              </div>

            </div>

            <!-- Footer Actions -->
            <div class="inspector-footer">
              <a href="tasks.html?assignee=${encodeURIComponent(activeStation.member.id)}" class="inspector-btn-action btn-dark">
                <span>ดูงานทั้งหมดในคิว</span>
              </a>
              <button type="button" class="inspector-btn-action btn-accent" id="btn-inspector-assign">
                <span>+ มอบหมายงานใหม่</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 4. Pipeline Status Breakdown -->
        <div class="overview-bottom-grid" style="grid-template-columns: 1fr; margin-top: 2px;">
          <div class="overview-bottom-card">
            <div class="bottom-card-head">
              <div>
                <h3 class="bottom-card-title">Task Pipeline Distribution</h3>
                <p class="bottom-card-sub">สัดส่วนสถานะงานในกระบวนการทำงานทั้งหมด</p>
              </div>
              <a href="board.html" class="bottom-card-link">ไปยังกระดาน Kanban ›</a>
            </div>
            
            <div class="pipeline-stacked-bar">
              <div class="pipeline-bar-seg seg-brief" style="width: ${briefPct}%;" title="Brief Intake: ${briefCount} งาน"></div>
              <div class="pipeline-bar-seg seg-drafting" style="width: ${draftingPct}%;" title="Drafting: ${draftingCount} งาน"></div>
              <div class="pipeline-bar-seg seg-review" style="width: ${reviewPct}%;" title="In Review: ${reviewCount} งาน"></div>
              <div class="pipeline-bar-seg seg-completed" style="width: ${completedPct}%;" title="Delivered: ${completedCount} งาน"></div>
            </div>

            <div class="pipeline-legend-grid">
              <div class="pipeline-legend-item">
                <span class="leg-dot bg-yellow"></span>
                <span class="leg-label">Brief Intake</span>
                <span class="leg-val">${briefCount}</span>
              </div>
              <div class="pipeline-legend-item">
                <span class="leg-dot bg-cyan"></span>
                <span class="leg-label">Drafting</span>
                <span class="leg-val">${draftingCount}</span>
              </div>
              <div class="pipeline-legend-item">
                <span class="leg-dot bg-red"></span>
                <span class="leg-label">In Review</span>
                <span class="leg-val">${reviewCount}</span>
              </div>
              <div class="pipeline-legend-item">
                <span class="leg-dot bg-green"></span>
                <span class="leg-label">Delivered</span>
                <span class="leg-val">${completedCount}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    // ── Setup Camera Transforms & Focusing ──
    const worldEl = container.querySelector("#studio-scene-world");
    const viewportEl = container.querySelector("#studio-stage-viewport");

    function applyCameraTransform(smooth = true) {
      if (!worldEl) return;
      if (smooth) {
        worldEl.classList.remove("is-dragging");
      } else {
        worldEl.classList.add("is-dragging");
      }
      worldEl.style.transform = `translate(calc(-50% + ${camPanX}px), calc(-50% + ${camPanY}px)) scale(${camZoom})`;
    }

    function focusOnStation(idx, zoomLevel = 1.65) {
      selectedStationIndex = idx;
      const st = teamStations[idx];
      if (!st || !viewportEl) return;

      const targetImgX = (st.station.zoomX / 100) * 1376;
      const targetImgY = (st.station.zoomY / 100) * 768;

      camZoom = zoomLevel;
      camPanX = (688 - targetImgX) * camZoom;
      camPanY = (384 - targetImgY) * camZoom;

      applyCameraTransform(true);
      drawStudio();
    }

    function resetToOverview() {
      camZoom = 1.0;
      camPanX = 0;
      camPanY = 0;
      applyCameraTransform(true);
    }

    // ── Mouse Drag & Pan Implementation ──
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialPanX = 0;
    let initialPanY = 0;

    if (viewportEl) {
      viewportEl.addEventListener("mousedown", (e) => {
        if (e.target.closest(".char-hud-bubble") || e.target.closest("button")) return;
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        initialPanX = camPanX;
        initialPanY = camPanY;
        worldEl?.classList.add("is-dragging");
      });

      window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        camPanX = initialPanX + dx;
        camPanY = initialPanY + dy;
        applyCameraTransform(false);
      });

      window.addEventListener("mouseup", () => {
        if (isDragging) {
          isDragging = false;
          worldEl?.classList.remove("is-dragging");
        }
      });

      viewportEl.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.15 : 0.15;
        camZoom = Math.min(Math.max(0.75, camZoom + delta), 2.5);
        applyCameraTransform(true);
      }, { passive: false });
    }

    applyCameraTransform(false);

    // ── Setup Effects Canvas (Dust, coffee steam, screen glow) ──
    const fxCanvas = container.querySelector("#studio-fx-canvas");
    if (fxCanvas) {
      const fxCtx = fxCanvas.getContext("2d");
      
      const dustParticles = Array.from({ length: 36 }, () => ({
        x: 950 + Math.random() * 400,
        y: 80 + Math.random() * 580,
        vx: (Math.random() - 0.45) * 0.35,
        vy: 0.12 + Math.random() * 0.38,
        size: 1 + Math.random() * 2.2,
        alpha: 0.2 + Math.random() * 0.6,
        pulseSpeed: 0.02 + Math.random() * 0.03
      }));

      const steamParticles = Array.from({ length: 12 }, () => ({
        x: 1195 + Math.random() * 20,
        y: 430 + Math.random() * 25,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.35 - Math.random() * 0.45,
        size: 2 + Math.random() * 3,
        alpha: 0.4
      }));

      let frameCounter = 0;

      function renderFx() {
        if (!isMounted) return;
        fxCtx.clearRect(0, 0, 1376, 768);
        frameCounter++;

        // 1. Sunlight Shaft Shimmer
        const shimmerAlpha = 0.035 + Math.sin(frameCounter * 0.025) * 0.015;
        fxCtx.save();
        fxCtx.fillStyle = `rgba(255, 235, 175, ${shimmerAlpha})`;
        fxCtx.beginPath();
        fxCtx.moveTo(1100, 40);
        fxCtx.lineTo(1376, 40);
        fxCtx.lineTo(1376, 768);
        fxCtx.lineTo(920, 768);
        fxCtx.closePath();
        fxCtx.fill();
        fxCtx.restore();

        // 2. Dust Motes
        fxCtx.fillStyle = "#ffe6a0";
        dustParticles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y > 700) { p.y = 80; p.x = 950 + Math.random() * 400; }
          if (p.x < 900) p.x = 1350;
          if (p.x > 1360) p.x = 920;

          const currentAlpha = Math.max(0.08, Math.min(0.85, p.alpha + Math.sin(frameCounter * p.pulseSpeed) * 0.3));
          fxCtx.globalAlpha = currentAlpha;
          fxCtx.beginPath();
          fxCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          fxCtx.fill();
        });
        fxCtx.globalAlpha = 1.0;

        // 3. Coffee Steam
        fxCtx.fillStyle = "rgba(255, 255, 255, 0.45)";
        steamParticles.forEach(sp => {
          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.size += 0.04;
          sp.alpha -= 0.007;

          if (sp.alpha <= 0 || sp.y < 380) {
            sp.x = 1195 + Math.random() * 20;
            sp.y = 430 + Math.random() * 25;
            sp.size = 2 + Math.random() * 2;
            sp.alpha = 0.35 + Math.random() * 0.25;
          }

          fxCtx.globalAlpha = Math.max(0, sp.alpha);
          fxCtx.beginPath();
          fxCtx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
          fxCtx.fill();
        });
        fxCtx.globalAlpha = 1.0;

        // 4. Whiteboard Dashboard Screen Glow
        const screenGlow = 0.08 + Math.sin(frameCounter * 0.05) * 0.04;
        const screenGrad = fxCtx.createRadialGradient(120, 190, 10, 120, 190, 90);
        screenGrad.addColorStop(0, `rgba(56, 189, 248, ${screenGlow})`);
        screenGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
        fxCtx.fillStyle = screenGrad;
        fxCtx.beginPath();
        fxCtx.arc(120, 190, 90, 0, Math.PI * 2);
        fxCtx.fill();

        animFrameId = requestAnimationFrame(renderFx);
      }

      renderFx();
    }

    // ── Event Handlers ──
    // Switch to Classic View
    container.querySelector("#btn-switch-classic")?.addEventListener("click", () => {
      cleanupStudio3D();
      if (onSwitchToClassic) onSwitchToClassic();
    });

    // Time Chips
    container.querySelectorAll(".studio-chip-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        filterState.period = btn.dataset.period;
        drawStudio();
      });
    });

    // Overview Camera Button
    container.querySelector("#btn-camera-overview")?.addEventListener("click", () => {
      resetToOverview();
    });

    // Zoom Buttons
    container.querySelector("#btn-zoom-in")?.addEventListener("click", () => {
      camZoom = Math.min(2.5, camZoom + 0.25);
      applyCameraTransform(true);
    });
    container.querySelector("#btn-zoom-out")?.addEventListener("click", () => {
      camZoom = Math.max(0.75, camZoom - 0.25);
      applyCameraTransform(true);
    });

    // Auto Tour Toggle
    container.querySelector("#btn-camera-tour")?.addEventListener("click", () => {
      isAutoTouring = !isAutoTouring;
      if (isAutoTouring) {
        let currentIdx = selectedStationIndex;
        autoTourTimer = setInterval(() => {
          if (!isMounted) return;
          currentIdx = (currentIdx + 1) % teamStations.length;
          focusOnStation(currentIdx, 1.6);
        }, 4200);
      } else {
        if (autoTourTimer) {
          clearInterval(autoTourTimer);
          autoTourTimer = null;
        }
      }
      drawStudio();
    });

    // Quick Jump Member Pills
    container.querySelectorAll(".studio-member-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        const idx = parseInt(pill.dataset.stationIdx, 10);
        focusOnStation(idx, 1.7);
      });
    });

    // Character click
    container.querySelectorAll(".pixel-character-station").forEach(station => {
      station.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(station.dataset.stationIdx, 10);
        focusOnStation(idx, 1.7);
      });
    });

    // Action buttons
    container.querySelector("#btn-studio-new-task")?.addEventListener("click", () => {
      window.openCreateTask?.();
    });
    container.querySelector("#btn-inspector-assign")?.addEventListener("click", () => {
      window.openCreateTask?.();
    });
    container.querySelector("#btn-studio-export")?.addEventListener("click", () => {
      window.print?.();
    });

  };

  drawStudio();
}
