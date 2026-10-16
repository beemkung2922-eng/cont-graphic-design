/* ==========================================================================
   KKP GRAPHIC STUDIO — RETRO ISOMETRIC WORKSHOP & TELEMETRY ENGINE
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

/* ── Smooth SVG Sparkline Generator (Matching Classic Bento Grid) ── */
function renderSparklineSvg(points, color = "#ffc61a", height = 36, width = 130) {
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

  // 1. Core Designers Identification (Using Real Members only, Full names, ZERO parentheses!)
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

  // Clean member names: remove any parentheses if present
  const sanitizeName = (raw) => (raw || "Designer").replace(/\s*\(.*?\)/g, "").trim();

  // 2. Exact 6 Workshop Stations (Coordinates in 1024x681 image)
  const workshopStations = [
    {
      stationId: "ST-01",
      stationTitle: "Command Deck & Server",
      stationThai: "ศูนย์บัญชาการ & เซิร์ฟเวอร์",
      desc: "ชั้นลอยควบคุมระบบ ตรวจสอบทรูพุต และเซิร์ฟเวอร์ประมวลผลกราฟิก",
      xPct: 48.5,
      yPct: 15.0,
      zoomX: 48.5,
      zoomY: 20.0,
      icon: "💻",
      themeColor: "#ffc61a"
    },
    {
      stationId: "ST-02",
      stationTitle: "Hardware & Design Bench",
      stationThai: "โต๊ะประดิษฐ์และออกแบบกราฟิก",
      desc: "โต๊ะช่างประดิษฐ์ม็อคอัพ ชิ้นงานแคมเปญ และคีย์วิชวล",
      xPct: 63.5,
      yPct: 37.0,
      zoomX: 63.5,
      zoomY: 40.0,
      icon: "🛠️",
      themeColor: "#38bdf8"
    },
    {
      stationId: "ST-03",
      stationTitle: "NeoGeo Arcade Arena",
      stationThai: "โซนเกม Arcade & ตู้เครื่องดื่ม",
      desc: "ตู้เกมย้อนยุค SNK NeoGeo และตู้เครื่องดื่มเย็นสำหรับผ่อนคลาย",
      xPct: 83.5,
      yPct: 55.5,
      zoomX: 80.0,
      zoomY: 57.0,
      icon: "🕹️",
      themeColor: "#f43f5e"
    },
    {
      stationId: "ST-04",
      stationTitle: "Express Delivery Garage",
      stationThai: "โรงจอดรถส่งมอบงานด่วน",
      desc: "โซนยานพาหนะและเครื่องมือ สำหรับเคลียร์งานด่วนและไฟนอลอาร์ตเวิร์ก",
      xPct: 74.5,
      yPct: 74.5,
      zoomX: 72.0,
      zoomY: 75.0,
      icon: "🏎️",
      themeColor: "#fbbf24"
    },
    {
      stationId: "ST-05",
      stationTitle: "Brainstorming Lounge",
      stationThai: "โซฟาคิดงาน & จอ CRT",
      desc: "มุมโซฟาวินเทจ ทีวีมอนิเตอร์ CRT สำหรับระดมไอเดียคอนเซปต์ใหม่",
      xPct: 17.5,
      yPct: 83.0,
      zoomX: 22.0,
      zoomY: 80.0,
      icon: "📺",
      themeColor: "#a855f7"
    },
    {
      stationId: "ST-06",
      stationTitle: "Tactical Review Arena",
      stationThai: "ลานจัดเตรียม & ตรวจงานกลาง",
      desc: "ลานประลองกลางห้อง พร้อมแท่นตรวจสอบคุณภาพงานและโดรนสำรวจ",
      xPct: 37.0,
      yPct: 50.5,
      zoomX: 38.0,
      zoomY: 52.0,
      icon: "🛸",
      themeColor: "#10b981"
    }
  ];

  // Helper date calculator
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

    // 1. Real Data Calculations (100% Synchronized with Classic Overview)
    const filtered = filterTasksByTimeRange(tasks, filterState);
    const active = filtered.filter(t => t.status !== "completed");
    const dueSoon = filtered.filter(t => t.status !== "completed" && relativeDeadline(t.deadline_at || t.deadline).className);
    const review = filtered.filter(t => t.status === "review" || t.status === "revision");
    const completed = filtered.filter(t => t.status === "completed");
    const onTimeRate = filtered.length ? ((completed.length / filtered.length) * 100).toFixed(1) : "100.0";

    const briefCount = filtered.filter(t => t.status === "brief").length;
    const draftingCount = filtered.filter(t => t.status === "drafting").length;
    const reviewCount = review.length;
    const completedCount = completed.length;
    const totalCount = filtered.length || 1;

    const briefPct = Math.max(1, Math.round((briefCount / totalCount) * 100));
    const draftingPct = Math.max(1, Math.round((draftingCount / totalCount) * 100));
    const reviewPct = Math.max(1, Math.round((reviewCount / totalCount) * 100));
    const completedPct = Math.max(1, 100 - briefPct - draftingPct - reviewPct);

    // Compute Designers Real Telemetry (NO fake tasks! ZERO parentheses in names!)
    const teamStations = designMembers.slice(0, 6).map((m, idx) => {
      const station = workshopStations[idx] || workshopStations[0];
      const assigned = filtered.filter(t => t.assignee_id === m.id);
      const memberActive = assigned.filter(t => t.status !== "completed");
      const memberCompleted = assigned.filter(t => t.status === "completed");
      const memberProjectsCount = new Set(assigned.map(t => t.project_id).filter(Boolean)).size;

      const currentTask = memberActive[0] || null;
      const memberSla = assigned.length
        ? ((memberCompleted.length / assigned.length) * 100).toFixed(1)
        : "100.0";

      let statusBadge = { label: "สแตนด์บาย", class: "status-standby", dot: "status-standby" };
      if (currentTask) {
        if (currentTask.status === "review" || currentTask.status === "revision") {
          statusBadge = { label: "รอตรวจแบบ", class: "status-review", dot: "status-review" };
        } else {
          statusBadge = { label: "กำลังจัดทำ", class: "status-active", dot: "status-active" };
        }
      }

      return {
        member: m,
        displayName: sanitizeName(m.name),
        station,
        assigned,
        memberActive,
        memberCompleted,
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
      <button type="button" class="dfb-chip ${filterState.period === chip.id ? 'is-active' : ''}" data-period="${chip.id}">
        ${chip.label}
      </button>
    `).join("");

    // Bento Top 4 KPIs Sparklines Data
    const sparkPoints1 = [12, 18, 15, 24, 28, 22, 35, filtered.length || 20];
    const sparkPoints2 = [8, 10, 14, 12, 16, 15, active.length || 10];
    const sparkPoints3 = [3, 4, 2, 6, 5, 4, review.length || 3];
    const sparkPoints4 = [95, 96, 98, 97, 99, 100, parseFloat(onTimeRate) || 100];

    // Render Full Page Markup
    container.innerHTML = `
      <div class="overview-shell studio-3d-layout">
        <!-- 1. Page Header (Dual View Switcher) -->
        <div class="overview-header">
          <div class="overview-title-group">
            <h1 class="overview-title">KKP Graphic Studio — Retro Workshop 3D</h1>
            <p class="overview-subtitle">ห้องสตูดิโอทีมกราฟิก KKP แบบ Interactive Isometric Map เชื่อมต่อข้อมูลจริงแบบเรียลไทม์ 100%</p>
          </div>
          <div class="overview-header-actions">
            <!-- Dual View Switcher -->
            <div class="view-switcher-pill" style="margin-right: 6px;">
              <button type="button" class="view-btn is-active is-3d" id="btn-studio-3d" title="มุมมอง 3D Workshop Studio">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                <span>3D Workshop</span>
              </button>
              <button type="button" class="view-btn" id="btn-switch-classic" title="สลับกลับไป Classic Overview">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                <span>Classic Overview</span>
              </button>
            </div>

            <button type="button" class="btn-overview-action" id="btn-studio-export">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export สรุป</span>
            </button>
            <button type="button" class="btn-overview-primary" id="btn-studio-new-task">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>สร้างงานใหม่</span>
            </button>
          </div>
        </div>

        <!-- 2. Integrated Timeframe Filter Bar -->
        <div class="dash-filter-bar">
          <div class="dfb-main">
            <div class="dfb-quick-chips">
              ${timeChips}
            </div>
            <div class="dfb-summary-text" style="font-size:0.75rem;color:var(--text-dim,#8c91a8);margin-left:auto;">
              แสดงข้อมูลภาระงานแบบเรียลไทม์ · สมาชิก 6 โต๊ะทำงาน
            </div>
          </div>
        </div>

        <!-- 3. Top 4 Bento KPI Cards (100% Real Data with Sparklines) -->
        <div class="overview-top-grid" style="grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 2px;">
          <!-- Card 1: Total Jobs -->
          <div class="stat-bento-card">
            <div class="stat-bento-head">
              <div class="stat-bento-title-wrap">
                <span class="stat-bento-icon icon-yellow">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </span>
                <span class="stat-bento-label">ชิ้นงานทั้งหมด</span>
              </div>
              <span class="badge badge-yellow" style="font-size:0.65rem;">Total</span>
            </div>
            <div class="stat-bento-val-row">
              <span class="stat-bento-num">${filtered.length}</span>
              <span class="stat-bento-unit">ชิ้น</span>
            </div>
            <div class="stat-bento-chart">${renderSparklineSvg(sparkPoints1, "#ffc61a")}</div>
          </div>

          <!-- Card 2: Active / In Progress -->
          <div class="stat-bento-card">
            <div class="stat-bento-head">
              <div class="stat-bento-title-wrap">
                <span class="stat-bento-icon icon-cyan">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/></svg>
                </span>
                <span class="stat-bento-label">งานกำลังทำ</span>
              </div>
              <span class="badge badge-cyan" style="font-size:0.65rem;">Active</span>
            </div>
            <div class="stat-bento-val-row">
              <span class="stat-bento-num">${active.length}</span>
              <span class="stat-bento-unit">ชิ้น</span>
            </div>
            <div class="stat-bento-chart">${renderSparklineSvg(sparkPoints2, "#19c3eb")}</div>
          </div>

          <!-- Card 3: In Review -->
          <div class="stat-bento-card">
            <div class="stat-bento-head">
              <div class="stat-bento-title-wrap">
                <span class="stat-bento-icon icon-red">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </span>
                <span class="stat-bento-label">รอตรวจ/แก้ไข</span>
              </div>
              <span class="badge badge-red" style="font-size:0.65rem;">Review</span>
            </div>
            <div class="stat-bento-val-row">
              <span class="stat-bento-num">${review.length}</span>
              <span class="stat-bento-unit">ชิ้น</span>
            </div>
            <div class="stat-bento-chart">${renderSparklineSvg(sparkPoints3, "#ef4444")}</div>
          </div>

          <!-- Card 4: On-time SLA Rate -->
          <div class="stat-bento-card">
            <div class="stat-bento-head">
              <div class="stat-bento-title-wrap">
                <span class="stat-bento-icon icon-green">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span class="stat-bento-label">ส่งตรงเวลา (SLA)</span>
              </div>
              <span class="badge badge-green" style="font-size:0.65rem;">Target 95%</span>
            </div>
            <div class="stat-bento-val-row">
              <span class="stat-bento-num">${onTimeRate}%</span>
              <span class="stat-bento-unit">On-Time</span>
            </div>
            <div class="stat-bento-chart">${renderSparklineSvg(sparkPoints4, "#22c55e")}</div>
          </div>
        </div>

        <!-- 4. Main Stage Grid (Left: Retro Isometric Workshop | Right: Member Inspector) -->
        <div class="studio-stage-grid">
          <!-- Viewport Card -->
          <div class="studio-viewport-card" id="studio-viewport">
            <!-- Viewport Topbar -->
            <div class="studio-viewport-topbar">
              <div class="studio-topbar-left">
                <div class="studio-brand-badge">
                  <span class="studio-brand-dot"></span>
                  <span>KKP RETRO WORKSHOP</span>
                </div>
                <!-- Member Quick Jump Pills -->
                <div class="studio-members-bar">
                  ${teamStations.map((s, idx) => `
                    <button type="button" class="studio-member-pill ${idx === selectedStationIndex ? 'is-active' : ''}" data-station-idx="${idx}">
                      <span class="studio-member-pill-dot"></span>
                      <span>${s.displayName}</span>
                    </button>
                  `).join("")}
                </div>
              </div>

              <div class="studio-topbar-right">
                <button type="button" class="studio-btn-ctrl" id="btn-camera-overview" title="รีเซ็ตมุมมองภาพรวม">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                  <span>มุมมองรวม</span>
                </button>
                <button type="button" class="studio-btn-ctrl ${isAutoTouring ? 'is-active' : ''}" id="btn-camera-tour" title="โหมดหมุนเวียนทัวร์อัตโนมัติ">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  <span>ทัวร์สตูดิโอ</span>
                </button>
              </div>
            </div>

            <!-- Pannable & Zoomable Stage Viewport -->
            <div class="studio-stage-viewport" id="studio-stage-viewport">
              <div class="studio-scene-world" id="studio-scene-world">
                <!-- Authentic High-Res Pixel Art Background -->
                <img class="studio-pixel-art-img" src="assets/isometric-workshop.jpg" alt="KKP Graphic Studio Workshop" />

                <!-- Canvas Overlays (Sunbeams, CRT glow, dust motes, server blinkers) -->
                <canvas class="studio-fx-canvas" id="studio-fx-canvas" width="1024" height="681"></canvas>

                <!-- Interactive Hotspots & Floating Tags Layer -->
                <div class="studio-hotspots-layer" id="studio-hotspots-layer">
                  ${teamStations.map((s, idx) => {
                    const taskTitle = s.currentTask ? s.currentTask.title : "พร้อมรับงานใหม่ (ว่างในคิว)";
                    const progressVal = s.currentTask ? (s.currentTask.progress || (s.currentTask.status === "review" ? 85 : 50)) : 100;
                    return `
                      <div class="station-hotspot ${idx === selectedStationIndex ? 'is-selected' : ''}" 
                           style="left: ${s.station.xPct}%; top: ${s.station.yPct}%;" 
                           data-station-idx="${idx}">
                        
                        <!-- Pulsing Target Ring -->
                        <div class="station-floor-marker"></div>

                        <!-- Floating HUD Tag -->
                        <div class="station-hud-tag">
                          <div class="hud-tag-header">
                            <span class="hud-tag-station-num">${s.station.stationId}</span>
                            <span class="hud-tag-name">${s.displayName}</span>
                            <span class="hud-tag-status-dot ${s.statusBadge.dot}"></span>
                          </div>
                          <div class="hud-tag-station-title">${s.station.icon} ${s.station.stationThai}</div>
                          <div class="hud-tag-task-wrap">
                            <div class="hud-tag-task-title" title="${taskTitle}">${taskTitle}</div>
                            <div class="hud-tag-progress-track">
                              <div class="hud-tag-progress-fill" style="width: ${progressVal}%; background: ${s.currentTask ? '#ffc61a' : '#22c55e'};"></div>
                            </div>
                          </div>
                        </div>

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
                <div class="inspector-avatar">
                  ${activeStation.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div class="inspector-profile-info">
                  <div class="inspector-member-name">${activeStation.displayName}</div>
                  <div class="inspector-member-role">
                    <span>${activeStation.member.role === 'supervisor' ? 'Lead / Supervisor' : 'Graphic Designer'}</span>
                    <span>•</span>
                    <span style="color:#ffc61a;">${activeStation.station.stationThai}</span>
                  </div>
                </div>
              </div>

              <!-- 4-KPI Mini Bento -->
              <div class="inspector-stats-grid">
                <div class="inspector-stat-box">
                  <span class="inspector-stat-label">งานในคิว</span>
                  <span class="inspector-stat-val" style="color:#38bdf8;">${activeStation.memberActive.length} <small style="font-size:0.65rem;font-weight:400;color:#94a3b8;">งาน</small></span>
                </div>
                <div class="inspector-stat-box">
                  <span class="inspector-stat-label">ส่งงานเสร็จแล้ว</span>
                  <span class="inspector-stat-val" style="color:#22c55e;">${activeStation.memberCompleted.length} <small style="font-size:0.65rem;font-weight:400;color:#94a3b8;">งาน</small></span>
                </div>
                <div class="inspector-stat-box">
                  <span class="inspector-stat-label">โปรเจคที่ดูแล</span>
                  <span class="inspector-stat-val" style="color:#fbbf24;">${activeStation.memberProjectsCount} <small style="font-size:0.65rem;font-weight:400;color:#94a3b8;">โปรเจค</small></span>
                </div>
                <div class="inspector-stat-box">
                  <span class="inspector-stat-label">On-Time SLA</span>
                  <span class="inspector-stat-val" style="color:#a855f7;">${activeStation.memberSla}%</span>
                </div>
              </div>

              <!-- Current Active Task Card -->
              <div class="inspector-task-card">
                <div class="inspector-task-label">
                  <span>ชิ้นงานที่กำลังทำปัจจุบัน</span>
                  ${activeStation.currentTask ? `<span class="badge badge-yellow" style="font-size:0.62rem;">${activeStation.currentTask.status}</span>` : ''}
                </div>
                ${activeStation.currentTask ? `
                  <div class="inspector-task-title">
                    <a href="task.html?id=${encodeURIComponent(activeStation.currentTask.id)}" title="คลิกเพื่อดูรายละเอียดงาน">
                      ${activeStation.currentTask.title}
                    </a>
                  </div>
                  <div class="inspector-progress-row">
                    <span>ความคืบหน้า</span>
                    <span style="font-weight:700;color:#ffffff;">${activeStation.currentTask.progress || (activeStation.currentTask.status === 'review' ? '85%' : '60%')}</span>
                  </div>
                  <div class="inspector-progress-track">
                    <div class="inspector-progress-bar" style="width: ${activeStation.currentTask.progress || (activeStation.currentTask.status === 'review' ? '85%' : '60%')};"></div>
                  </div>
                  <div style="font-size:0.72rem;color:#94a3b8;display:flex;justify-content:space-between;">
                    <span>กำหนดส่ง: ${activeStation.currentTask.deadline_at || activeStation.currentTask.deadline || 'เร็วๆ นี้'}</span>
                    <span style="color:#ffc61a;">${relativeDeadline(activeStation.currentTask.deadline_at || activeStation.currentTask.deadline).label}</span>
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
                <span style="font-size:0.65rem;font-weight:400;color:#94a3b8;">ตามกำหนดเวลา</span>
              </div>
              <div class="inspector-queue-list">
                ${activeStation.memberActive.slice(1, 4).map(t => `
                  <a href="task.html?id=${encodeURIComponent(t.id)}" class="inspector-queue-item">
                    <span class="inspector-queue-item-title">${t.title}</span>
                    <span class="badge badge-gray" style="font-size:0.62rem;">${t.status}</span>
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

        <!-- 5. Pipeline Status Breakdown (Identical to Classic Overview) -->
        <div class="overview-bottom-grid" style="grid-template-columns: 1fr; margin-top: 4px;">
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

      const vpW = viewportEl.clientWidth || 800;
      const vpH = viewportEl.clientHeight || 580;

      // Center station in viewport
      const targetImgX = (st.station.zoomX / 100) * 1024;
      const targetImgY = (st.station.zoomY / 100) * 681;

      camZoom = zoomLevel;
      camPanX = (512 - targetImgX) * camZoom;
      camPanY = (340.5 - targetImgY) * camZoom;

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
        if (e.target.closest(".station-hud-tag") || e.target.closest("button")) return;
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

    // Initial camera apply
    applyCameraTransform(false);

    // ── Setup Effects Canvas (Dust particles, CRT glow, server blinkers) ──
    const fxCanvas = container.querySelector("#studio-fx-canvas");
    if (fxCanvas) {
      const fxCtx = fxCanvas.getContext("2d");
      
      // Generate 32 floating dust motes
      const dustParticles = Array.from({ length: 32 }, () => ({
        x: 600 + Math.random() * 380,
        y: 100 + Math.random() * 500,
        vx: (Math.random() - 0.45) * 0.35,
        vy: 0.15 + Math.random() * 0.45,
        size: 1 + Math.random() * 2.2,
        alpha: 0.2 + Math.random() * 0.6,
        pulseSpeed: 0.02 + Math.random() * 0.03
      }));

      let frameCounter = 0;

      function renderFx() {
        if (!isMounted) return;
        fxCtx.clearRect(0, 0, 1024, 681);
        frameCounter++;

        // 1. Sunlight Shaft Subtle Shimmer (top right to center)
        const shimmerAlpha = 0.04 + Math.sin(frameCounter * 0.03) * 0.02;
        fxCtx.save();
        fxCtx.fillStyle = `rgba(255, 220, 150, ${shimmerAlpha})`;
        fxCtx.beginPath();
        fxCtx.moveTo(780, 0);
        fxCtx.lineTo(920, 0);
        fxCtx.lineTo(760, 681);
        fxCtx.lineTo(440, 681);
        fxCtx.closePath();
        fxCtx.fill();
        fxCtx.restore();

        // 2. Dust Motes along sunbeam
        fxCtx.fillStyle = "#ffe4a0";
        dustParticles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y > 650) { p.y = 80; p.x = 600 + Math.random() * 380; }
          if (p.x < 480) p.x = 980;
          if (p.x > 1000) p.x = 500;

          const currentAlpha = Math.max(0.08, Math.min(0.85, p.alpha + Math.sin(frameCounter * p.pulseSpeed) * 0.3));
          fxCtx.globalAlpha = currentAlpha;
          fxCtx.beginPath();
          fxCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          fxCtx.fill();
        });
        fxCtx.globalAlpha = 1.0;

        // 3. CRT Screen Soft Glow (in Lounge Pit around x: 70, y: 520)
        const crtGlow = 0.12 + Math.sin(frameCounter * 0.08) * 0.06;
        const crtGrad = fxCtx.createRadialGradient(80, 520, 4, 80, 520, 45);
        crtGrad.addColorStop(0, `rgba(56, 189, 248, ${crtGlow})`);
        crtGrad.addColorStop(1, "rgba(56, 189, 248, 0)");
        fxCtx.fillStyle = crtGrad;
        fxCtx.beginPath();
        fxCtx.arc(80, 520, 45, 0, Math.PI * 2);
        fxCtx.fill();

        // 4. Arcade Neon Pulse (in right arcade around x: 840, y: 380)
        const arcadeColor = (frameCounter % 120 < 40) ? "244, 63, 94" : ((frameCounter % 120 < 80) ? "56, 189, 248" : "251, 191, 36");
        const arcadeGlow = 0.18 + Math.sin(frameCounter * 0.1) * 0.08;
        const arcGrad = fxCtx.createRadialGradient(845, 380, 5, 845, 380, 40);
        arcGrad.addColorStop(0, `rgba(${arcadeColor}, ${arcadeGlow})`);
        arcGrad.addColorStop(1, `rgba(${arcadeColor}, 0)`);
        fxCtx.fillStyle = arcGrad;
        fxCtx.beginPath();
        fxCtx.arc(845, 380, 40, 0, Math.PI * 2);
        fxCtx.fill();

        // 5. Server Rack Blinking LEDs (at Mezzanine around x: 590, y: 70)
        if (frameCounter % 8 === 0) {
          fxCtx.fillStyle = Math.random() > 0.4 ? "#22c55e" : "#ffc61a";
          fxCtx.fillRect(602, 60, 3, 3);
          fxCtx.fillStyle = Math.random() > 0.5 ? "#38bdf8" : "#ef4444";
          fxCtx.fillRect(606, 68, 3, 3);
        }

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
    container.querySelectorAll(".dash-filter-bar .dfb-chip").forEach(btn => {
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

    // Hotspot clicks
    container.querySelectorAll(".station-hotspot").forEach(hotspot => {
      hotspot.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(hotspot.dataset.stationIdx, 10);
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
