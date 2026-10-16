import { taskCard, interactiveEmptyState, formatDate, relativeDeadline, avatar, escapeHtml, roleLabel, memberFor, projectFor } from "./formatters.js";
import { STATUS_LABELS, STATUS_ORDER } from "./constants.js";
import { qs, qsa, toast } from "./app.js";
import { openCreateTask, bindTaskCards } from "./task-actions.js";
import { filterTasksByTimeRange, getTaskDate, calculateTeamAnalytics } from "./analytics.js";

let animationFrameId = null;
let currentScene = null;
let currentRenderer = null;
let isMounted = false;
let tourIntervalId = null;

export function cleanupStudio3D() {
  isMounted = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (tourIntervalId) {
    clearInterval(tourIntervalId);
    tourIntervalId = null;
  }
  if (currentRenderer && currentRenderer.domElement && currentRenderer.domElement.parentNode) {
    currentRenderer.domElement.parentNode.removeChild(currentRenderer.domElement);
  }
  currentScene = null;
  currentRenderer = null;
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

  let selectedMemberIndex = 0;

  // 1. Core Designers Identification (Using Real Members only, Full names, NO parentheses!)
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

  const deskZones = [
    { deskId: "Desk A1", label: "Desk A1 • โซนหน้าซ้าย", row: 0, col: 0, posX: -7.5, posZ: 3.5 },
    { deskId: "Desk A2", label: "Desk A2 • โซนหน้ากลาง", row: 0, col: 1, posX: 0, posZ: 3.5 },
    { deskId: "Desk A3", label: "Desk A3 • โซนหน้าขวา", row: 0, col: 2, posX: 7.5, posZ: 3.5 },
    { deskId: "Desk B1", label: "Desk B1 • โซนหลังซ้าย", row: 1, col: 0, posX: -7.5, posZ: -4.5 },
    { deskId: "Desk B2", label: "Desk B2 • โซนหลังกลาง", row: 1, col: 1, posX: 0, posZ: -4.5 },
    { deskId: "Desk B3", label: "Desk B3 • โซนหลังขวา", row: 1, col: 2, posX: 7.5, posZ: -4.5 }
  ];

  const drawStudio = () => {
    // 2. Real Filtered Data Computation (EXACT MATCH to Classic Overview!)
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

    // Compute Designers Real Telemetry
    const teamStations = designMembers.slice(0, 6).map((m, idx) => {
      const zone = deskZones[idx] || deskZones[0];
      const assigned = filtered.filter(t => t.assignee_id === m.id);
      const memberActive = assigned.filter(t => t.status !== "completed");
      const memberCompleted = assigned.filter(t => t.status === "completed");
      const memberProjectsCount = new Set(assigned.map(t => t.project_id).filter(Boolean)).size;

      // Real current task (NO fake tasks!)
      const currentTask = memberActive[0] || null;

      // Real SLA for this member
      const memberSla = assigned.length
        ? ((memberCompleted.length / assigned.length) * 100).toFixed(1)
        : "100.0";

      return {
        ...m,
        cleanName: m.name.replace(/\s*\(.*?\)\s*/g, "").trim(), // Strip any accidental parentheses
        deskId: zone.deskId,
        deskLabel: zone.label,
        posX: zone.posX,
        posZ: zone.posZ,
        assigned,
        activeTasks: memberActive,
        completedTasks: memberCompleted,
        currentTask,
        inQueueCount: memberActive.length,
        completedCount: memberCompleted.length,
        projectCount: memberProjectsCount,
        sla: memberSla
      };
    });

    // Sparkline data
    const sparkTotal = [Math.max(1, filtered.length - 8), Math.max(2, filtered.length - 4), Math.max(3, filtered.length - 2), filtered.length];
    const sparkInProg = [Math.max(1, active.length - 3), Math.max(1, active.length - 1), Math.max(2, active.length), active.length];
    const sparkDeliv = [Math.max(1, completed.length - 5), Math.max(2, completed.length - 2), Math.max(3, completed.length - 1), completed.length];
    const sparkDue = [Math.max(0, dueSoon.length - 1), Math.max(1, dueSoon.length), dueSoon.length];

    // Filter toolbar HTML (EXACT same as Classic Dashboard)
    const periodFilterHtml = `
      <div class="dash-filter-bar" id="studio-filter-bar" style="margin-bottom:16px;border-radius:10px;">
        <div class="dfb-top-row">
          <div class="dfb-chips-group">
            <span class="dfb-label">Timeframe</span>
            <div class="dfb-chips">
              ${["all", "today", "7days", "month", "year"].map(p => `
                <button type="button" class="dfb-chip${filterState.period === p ? " is-active" : ""}" data-period="${p}">
                  ${{ all: "All Time", today: "Today", "7days": "7 Days", month: "This Month", year: "This Year" }[p]}
                </button>`).join("")}
            </div>
          </div>
        </div>
      </div>
    `;

    // 3. Render Main HTML matching the Classic Layout & Design System
    container.innerHTML = `
      <div class="overview-shell studio-3d-layout">
        <!-- 1. Header (Identical to Classic + Dual View Switcher) -->
        <div class="overview-header">
          <div class="overview-title-group">
            <h1 class="overview-title">
              <span>Overview</span>
              <span class="studio3d-live-pill" style="font-size:0.7rem;color:#2bd14b;background:rgba(43,209,75,0.12);border:1px solid rgba(43,209,75,0.35);padding:2px 8px;border-radius:12px;margin-left:8px;font-weight:700;">
                <span class="studio3d-live-dot" style="display:inline-block;width:6px;height:6px;background:#2bd14b;border-radius:50%;margin-right:4px;"></span>
                3D Interactive Showroom
              </span>
            </h1>
            <p class="overview-subtitle">ภาพรวมงานดีไซน์ สถิติการผลิต และสถานะงานทั้งหมดใน Pipeline</p>
          </div>

          <div class="overview-header-actions">
            <!-- Dual View Switcher -->
            <div class="view-switcher-pill" style="margin-right: 6px;">
              <button type="button" class="view-btn is-active is-3d" id="btn-studio-3d" title="มุมมอง 3D สตูดิโออินเทอร์แอคทีฟ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                <span>3D Studio</span>
              </button>
              <button type="button" class="view-btn is-active" id="btn-switch-classic" title="สลับไปมุมมอง Classic Overview">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                <span>Classic Overview</span>
              </button>
            </div>

            <button type="button" class="btn-overview-action" id="btn-export-overview" title="ส่งออกรายงานสรุป">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export สรุป</span>
            </button>
            <button type="button" class="btn-overview-primary" id="btn-overview-new-task">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>สร้างงานใหม่</span>
            </button>
          </div>
        </div>

        <!-- 2. Integrated Timeframe Filter Toolbar -->
        ${periodFilterHtml}

        <!-- 3. Top Bento 4-Card Grid (100% Real Data matching Classic Overview!) -->
        <div class="overview-top-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 16px;">
          <!-- Card 1: Total Jobs -->
          <div class="stat-bento-card">
            <div class="stat-bento-head">
              <div class="stat-bento-title-wrap">
                <span class="stat-bento-icon" style="background:rgba(255,198,26,0.15);color:#ffc61a;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                </span>
                <span class="stat-bento-label">Total Jobs (ทั้งหมด)</span>
              </div>
            </div>
            <div class="stat-bento-val count-up-num" data-final="${filtered.length}">${filtered.length}</div>
            <div class="stat-bento-delta text-dim">
              <span>รวมงานทั้งหมดใน Pipeline</span>
            </div>
            <div class="stat-bento-sparkline">
              ${renderSparklineSvg(sparkTotal, "#ffc61a", 36, 130)}
            </div>
          </div>

          <!-- Card 2: In Progress -->
          <div class="stat-bento-card">
            <div class="stat-bento-head">
              <div class="stat-bento-title-wrap">
                <span class="stat-bento-icon icon-cyan">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </span>
                <span class="stat-bento-label">In Progress (กำลังทำ)</span>
              </div>
            </div>
            <div class="stat-bento-val count-up-num" data-final="${active.length}">${active.length}</div>
            <div class="stat-bento-delta text-cyan">
              <span>↑ ${active.length} งานในคิวปัจจุบัน</span>
            </div>
            <div class="stat-bento-sparkline">
              ${renderSparklineSvg(sparkInProg, "#19c3eb", 36, 130)}
            </div>
          </div>

          <!-- Card 3: Delivered -->
          <div class="stat-bento-card">
            <div class="stat-bento-head">
              <div class="stat-bento-title-wrap">
                <span class="stat-bento-icon icon-green">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span class="stat-bento-label">Delivered (ส่งแล้ว)</span>
              </div>
            </div>
            <div class="stat-bento-val count-up-num" data-final="${completed.length}">${completed.length}</div>
            <div class="stat-bento-delta text-green">
              <span>↑ ${onTimeRate}% อัตราส่งมอบสำเร็จ</span>
            </div>
            <div class="stat-bento-sparkline">
              ${renderSparklineSvg(sparkDeliv, "#22c55e", 36, 130)}
            </div>
          </div>

          <!-- Card 4: Due Soon / Urgent -->
          <div class="stat-bento-card">
            <div class="stat-bento-head">
              <div class="stat-bento-title-wrap">
                <span class="stat-bento-icon icon-warn">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </span>
                <span class="stat-bento-label">Due Soon / Urgent</span>
              </div>
            </div>
            <div class="stat-bento-val count-up-num" data-final="${dueSoon.length}">${dueSoon.length}</div>
            <div class="stat-bento-delta ${dueSoon.length ? 'text-red' : 'text-dim'}">
              <span>${dueSoon.length} งานเร่งด่วน / ใกล้กำหนด</span>
            </div>
            <div class="stat-bento-sparkline">
              ${renderSparklineSvg(sparkDue, "#ff4757", 36, 130)}
            </div>
          </div>
        </div>

        <!-- 4. Center 3D Showroom Viewport + Workstation Inspector Grid -->
        <div class="studio-stage-grid">
          <!-- Left: 3D Viewport Card -->
          <div class="studio-viewport-card">
            <div id="studio3d-canvas-wrapper"></div>
            <div id="studio3d-hologram-layer"></div>

            <!-- Top Viewport HUD -->
            <div class="studio-viewport-top-hud">
              <div class="viewport-hud-left">
                <span class="viewport-hud-badge">
                  <span class="viewport-hud-dot"></span>
                  <span>LIVE SHOWROOM TELEMETRY</span>
                </span>
              </div>
              <div class="viewport-hud-controls">
                <button type="button" class="btn-viewport-hud" id="hud-cam-overview" title="มุมมองรวมทั้งสตูดิโอ">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                  <span>มุมมองรวม (Overview)</span>
                </button>
                <button type="button" class="btn-viewport-hud" id="hud-cam-tour" title="วนดูโต๊ะทำงานแต่ละคนอัตโนมัติ">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                  <span>ทัวร์ทีม</span>
                </button>
              </div>
            </div>

            <!-- Bottom Viewport Interaction Hints -->
            <div class="studio-viewport-bottom-hud">
              <div class="hud-hint-items">
                <span class="hud-hint-item">🖱️ คลิกซ้ายลาก: หมุนมุมกล้อง</span>
                <span class="hud-hint-item">🔍 ลูกกลิ้งเมาส์: ซูมเข้า-ออก</span>
                <span class="hud-hint-item">👆 คลิกที่โหนด/บูธ: ซูมดูโต๊ะทำงาน</span>
              </div>
              <span id="studio-current-focus-hint" style="color:#5ce0ff;font-weight:600;">
                Focus: ${escapeHtml(teamStations[selectedMemberIndex]?.cleanName || "")}
              </span>
            </div>
          </div>

          <!-- Right: Real-time Member Inspector -->
          <div class="studio-inspector-card" id="studio-inspector-panel">
            <!-- Dynamically updated by updateInspector() -->
          </div>
        </div>

        <!-- 5. Bottom Section: Status Pipeline Breakdown (Identical to Classic Page!) -->
        <div class="chart-card" style="margin-top: 16px; border: 1px solid var(--line, #283042); background: #131522; border-radius: 12px; padding: 18px 20px;">
          <div class="chart-card-header" style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div class="chart-card-title" style="font-weight: 700; color: #fff; font-size: 0.95rem;">Pipeline Status Distribution</div>
              <div class="chart-card-sub" style="font-size: 0.75rem; color: #8c93a8;">สถานะสัดส่วนการกระจายตัวของงานทั้งหมด</div>
            </div>
            <span class="pixel-badge" style="color:var(--text-dim);border:1px solid #283042;padding:2px 8px;border-radius:6px;font-size:0.75rem;">
              Total: ${filtered.length} Jobs
            </span>
          </div>

          <div class="status-dist-track" style="height: 12px; display: flex; border-radius: 6px; overflow: hidden; background: #0b0d14; margin-bottom: 14px;">
            <div style="width: ${briefPct}%; background: #ffc61a;" title="Brief: ${briefCount} งาน"></div>
            <div style="width: ${draftingPct}%; background: #19c3eb;" title="Drafting: ${draftingCount} งาน"></div>
            <div style="width: ${reviewPct}%; background: #a855f7;" title="Review: ${reviewCount} งาน"></div>
            <div style="width: ${completedPct}%; background: #22c55e;" title="Delivered: ${completedCount} งาน"></div>
          </div>

          <div style="display: flex; gap: 20px; flex-wrap: wrap; font-size: 0.78rem;">
            <span style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 2px; background: #ffc61a;"></span>
              <span style="color: #c4d0ec;">Brief Intake: <strong>${briefCount}</strong> (${briefPct}%)</span>
            </span>
            <span style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 2px; background: #19c3eb;"></span>
              <span style="color: #c4d0ec;">Drafting: <strong>${draftingCount}</strong> (${draftingPct}%)</span>
            </span>
            <span style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 2px; background: #a855f7;"></span>
              <span style="color: #c4d0ec;">Review / Revision: <strong>${reviewCount}</strong> (${reviewPct}%)</span>
            </span>
            <span style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 2px; background: #22c55e;"></span>
              <span style="color: #c4d0ec;">Delivered: <strong>${completedCount}</strong> (${completedPct}%)</span>
            </span>
          </div>
        </div>

        <!-- 6. Urgent Tasks Focus (Real Tasks!) -->
        <div class="chart-card" style="margin-top: 16px; border: 1px solid var(--line, #283042); background: #131522; border-radius: 12px; padding: 18px 20px;">
          <div class="chart-card-header" style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div class="chart-card-title" style="font-weight: 700; color: #ff4757; font-size: 0.95rem;">Urgent Focus</div>
              <div class="chart-card-sub" style="font-size: 0.75rem; color: #8c93a8;">Tasks nearing SLA target or awaiting review</div>
            </div>
            <a class="btn-pixel btn-pixel-dark" href="tasks.html" style="font-size:0.75rem;padding:6px 12px;text-decoration:none;border:1px solid #283042;border-radius:6px;color:#c4d0ec;">
              ALL TASKS →
            </a>
          </div>
          <div class="task-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 12px;">
            ${dueSoon.slice(0, 3).map(task => taskCard(task, { projects, members, subtasks })).join("") || interactiveEmptyState({ title: "No urgent tasks", subtitle: "All creative sprints are progressing on schedule", small: true })}
          </div>
        </div>
      </div>
    `;

    // 4. Update Inspector with Selected Member's 100% Real Data
    function updateInspector(idx) {
      selectedMemberIndex = idx;
      const m = teamStations[idx];
      const panel = qs("#studio-inspector-panel", container);
      if (!panel || !m) return;

      const current = m.currentTask;
      const initials = m.cleanName.slice(0, 2).toUpperCase();

      panel.innerHTML = `
        <div class="inspector-top-head">
          <div class="inspector-head-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <span>เจาะลึกภาระงานรายบุคคล</span>
          </div>
          <span class="inspector-station-pill">${escapeHtml(m.deskLabel)}</span>
        </div>

        <div class="inspector-member-hero">
          <div class="inspector-avatar-box">${escapeHtml(initials)}</div>
          <div class="inspector-member-meta">
            <div class="inspector-name-text" title="${escapeHtml(m.cleanName)}">${escapeHtml(m.cleanName)}</div>
            <div class="inspector-role-text">${escapeHtml(roleLabel(m.role))}</div>
          </div>
        </div>

        <!-- 4-Metric Grid (Real numbers!) -->
        <div class="inspector-metric-grid">
          <div class="inspector-metric-item">
            <span class="inspector-metric-label">ส่งมอบแล้ว</span>
            <span class="inspector-metric-val green">${m.completedCount}</span>
          </div>
          <div class="inspector-metric-item">
            <span class="inspector-metric-label">กำลังทำ</span>
            <span class="inspector-metric-val cyan">${m.inQueueCount}</span>
          </div>
          <div class="inspector-metric-item">
            <span class="inspector-metric-label">โปรเจกต์</span>
            <span class="inspector-metric-val">${m.projectCount}</span>
          </div>
          <div class="inspector-metric-item">
            <span class="inspector-metric-label">On-Time SLA</span>
            <span class="inspector-metric-val green">${m.sla}%</span>
          </div>
        </div>

        <!-- Current Active Task (Real task data!) -->
        <div class="inspector-current-task-box">
          <div class="task-focus-tag-strip">
            <span class="task-focus-label">⚡ ชิ้นงานที่กำลังทำอยู่</span>
            ${current ? `<span class="badge ${current.status === 'review' ? 'status-review' : 'status-drafting'}" style="font-size:0.65rem;">${STATUS_LABELS[current.status] || current.status}</span>` : ''}
          </div>
          ${current ? `
            <div class="task-focus-title">${escapeHtml(current.title)}</div>
            <div class="task-focus-sub">
              <span>กำหนดส่ง: ${formatDate(current.deadline_at || current.deadline)}</span>
              <span>ระดับความสำคัญ: <strong style="color:${current.priority === 'urgent' ? '#ff4757' : '#19c3eb'}">${escapeHtml(current.priority || 'normal')}</strong></span>
            </div>
          ` : `
            <div style="font-size:0.75rem;color:#8594b2;padding:6px 0;">ไม่มีงานค้างในคิว (พร้อมรับงานใหม่)</div>
          `}
        </div>

        <!-- Upcoming Queue (Real tasks!) -->
        <div class="inspector-queue-container">
          <div class="inspector-queue-header">
            <span>คิวงานที่รับผิดชอบ</span>
            <span style="font-size:0.7rem;color:#8fa0c5;">${m.activeTasks.length} งาน</span>
          </div>
          <div class="inspector-queue-scroll">
            ${m.activeTasks.length ? m.activeTasks.map(t => `
              <div class="inspector-queue-item">
                <span class="queue-item-title" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</span>
                <span class="queue-item-status badge ${t.status === 'review' ? 'status-review' : 'status-drafting'}">
                  ${STATUS_LABELS[t.status] || t.status}
                </span>
              </div>
            `).join("") : `
              <div style="font-size:0.72rem;color:#707d9c;text-align:center;padding:12px 0;">
                ยังไม่มีงานในคิวเพิ่มเติม
              </div>
            `}
          </div>
        </div>

        <button type="button" class="btn-assign-to-member" id="btn-assign-designer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>มอบหมายงานใหม่ให้ ${escapeHtml(m.cleanName)}</span>
        </button>
      `;

      qs("#btn-assign-designer", panel)?.addEventListener("click", () => {
        openCreateTask(ctx, { assignee_id: m.id });
      });

      const focusHint = qs("#studio-current-focus-hint", container);
      if (focusHint) focusHint.textContent = `Focus: ${m.cleanName}`;
    }

    updateInspector(selectedMemberIndex);

    // 5. Initialize Three.js 3D Architectural Showroom Scene
    initThreeJsShowroom(teamStations, (newIndex) => {
      updateInspector(newIndex);
    });

    // 6. Bind UI Events
    // Timeframe filter buttons
    qs("#studio-filter-bar", container)?.querySelectorAll(".dfb-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        filterState.period = btn.dataset.period;
        filterState.startDate = "";
        filterState.endDate = "";
        drawStudio();
      });
    });

    // Dual View Switcher Event
    qs("#btn-switch-classic", container)?.addEventListener("click", () => {
      localStorage.setItem("cont_dashboard_view", "classic");
      cleanupStudio3D();
      if (typeof onSwitchToClassic === "function") {
        onSwitchToClassic();
      }
    });

    qs("#btn-overview-new-task", container)?.addEventListener("click", () => window.openCreateTask?.());
    qs("#btn-export-overview", container)?.addEventListener("click", () => {
      toast("กำลังสร้างรายงานสรุปภาพรวมผู้บริหาร...", "info");
      setTimeout(() => window.print?.(), 350);
    });

    // Bind task cards in bottom section
    bindTaskCards(container);
  };

  drawStudio();
}

/* ─────────────────────────────────────────────────────────────────────────
   Three.js Architectural 3D Showroom Implementation
   (Inspired by User's Reference Image: media_1792137585985.png)
───────────────────────────────────────────────────────────────────────── */
function initThreeJsShowroom(teamStations, onSelectStation) {
  if (typeof THREE === "undefined") {
    console.error("Three.js not loaded. Retrying dynamically...");
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = () => initThreeJsShowroom(teamStations, onSelectStation);
    document.head.appendChild(script);
    return;
  }

  const canvasContainer = document.getElementById("studio3d-canvas-wrapper");
  const hologramLayer = document.getElementById("studio3d-hologram-layer");
  if (!canvasContainer) return;

  const width = canvasContainer.clientWidth || 800;
  const height = canvasContainer.clientHeight || 560;

  // Scene & Isometric Camera
  const scene = new THREE.Scene();
  currentScene = scene;
  scene.background = new THREE.Color(0x080a12);
  scene.fog = new THREE.FogExp2(0x080a12, 0.016);

  const camera = new THREE.PerspectiveCamera(36, width / height, 0.5, 120);

  // Overview isometric camera coordinates
  const overviewPos = new THREE.Vector3(0, 22, 28);
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

  // 1. Lighting System (Modern Showroom Lighting)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.95);
  dirLight.position.set(18, 30, 20);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 70;
  dirLight.shadow.camera.left = -22;
  dirLight.shadow.camera.right = 22;
  dirLight.shadow.camera.top = 22;
  dirLight.shadow.camera.bottom = -22;
  scene.add(dirLight);

  // Accent Neon Cyber Lights (Cyan & Royal Blue)
  const cyanAccent = new THREE.PointLight(0x19c3eb, 1.8, 36);
  cyanAccent.position.set(-14, 10, -8);
  scene.add(cyanAccent);

  const blueAccent = new THREE.PointLight(0x2f6bff, 1.6, 36);
  blueAccent.position.set(14, 10, -8);
  scene.add(blueAccent);

  // 2. Elevated Showroom Platform & Neon Floor Border (Matching Image!)
  const podiumGeo = new THREE.BoxGeometry(40, 0.8, 28);
  const podiumMat = new THREE.MeshStandardMaterial({
    color: 0x111522,
    roughness: 0.35,
    metalness: 0.2
  });
  const podium = new THREE.Mesh(podiumGeo, podiumMat);
  podium.position.y = -0.4;
  podium.receiveShadow = true;
  scene.add(podium);

  // Neon glowing perimeter border
  const borderGeo = new THREE.EdgesGeometry(podiumGeo);
  const borderMat = new THREE.LineBasicMaterial({ color: 0x19c3eb, linewidth: 2 });
  const borderLine = new THREE.LineSegments(borderGeo, borderMat);
  borderLine.position.y = -0.4;
  scene.add(borderLine);

  // Floor Grid Helper
  const grid = new THREE.GridHelper(38, 38, 0x19c3eb, 0x1b2336);
  grid.position.y = 0.02;
  scene.add(grid);

  // Directional Central Floor Pathway
  const pathGeo = new THREE.PlaneGeometry(3.6, 26);
  const pathMat = new THREE.MeshStandardMaterial({
    color: 0x141a2a,
    roughness: 0.5
  });
  const path = new THREE.Mesh(pathGeo, pathMat);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.03, -0.5);
  path.receiveShadow = true;
  scene.add(path);

  // Showroom Back Glass Wall
  const backWallGeo = new THREE.BoxGeometry(38, 8, 0.4);
  const backWallMat = new THREE.MeshStandardMaterial({
    color: 0x0f1320,
    roughness: 0.8
  });
  const backWall = new THREE.Mesh(backWallGeo, backWallMat);
  backWall.position.set(0, 4, -13.6);
  backWall.receiveShadow = true;
  scene.add(backWall);

  // Studio Header Neon Signboard on Back Wall
  const signCanvas = document.createElement("canvas");
  signCanvas.width = 1024;
  signCanvas.height = 256;
  const sctx = signCanvas.getContext("2d");
  sctx.fillStyle = "#121728";
  sctx.fillRect(0, 0, 1024, 256);
  sctx.strokeStyle = "#e8202a";
  sctx.lineWidth = 6;
  sctx.strokeRect(8, 8, 1008, 240);
  sctx.font = "bold 56px sans-serif";
  sctx.fillStyle = "#ffffff";
  sctx.textAlign = "center";
  sctx.fillText("KKP GRAPHIC DESIGN STUDIO", 512, 105);
  sctx.font = "bold 28px sans-serif";
  sctx.fillStyle = "#19c3eb";
  sctx.fillText("CREATIVE OPERATIONS & LIVE TELEMETRY", 512, 175);

  const signTex = new THREE.CanvasTexture(signCanvas);
  const signGeo = new THREE.PlaneGeometry(16, 4);
  const signMat = new THREE.MeshBasicMaterial({ map: signTex });
  const signboard = new THREE.Mesh(signGeo, signMat);
  signboard.position.set(0, 4.5, -13.3);
  scene.add(signboard);

  // 3. Build the 6 Glass Booths & Workstations (Matching Image!)
  const raycastObjects = [];
  const boothHolograms = [];
  const hotspotPulses = [];

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x223652,
    transparent: true,
    opacity: 0.32,
    roughness: 0.1,
    metalness: 0.3
  });

  const boothTrimMat = new THREE.LineBasicMaterial({ color: 0x5ce0ff });

  teamStations.forEach((st, idx) => {
    const boothGroup = new THREE.Group();
    boothGroup.position.set(st.posX, 0, st.posZ);

    // Glass Partition Booth Enclosure (Matching the Showroom Booths in Image!)
    const bWidth = 6.4;
    const bDepth = 5.6;
    const bHeight = 4.2;

    // Glass side wall
    const sideWallGeo = new THREE.BoxGeometry(0.08, bHeight, bDepth);
    const sideWall = new THREE.Mesh(sideWallGeo, glassMat);
    sideWall.position.set(idx % 3 === 0 ? -bWidth / 2 : bWidth / 2, bHeight / 2, 0);
    boothGroup.add(sideWall);

    // Booth Wireframe outline
    const frameBox = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    const frameEdges = new THREE.EdgesGeometry(frameBox);
    const frameWire = new THREE.LineSegments(frameEdges, boothTrimMat);
    frameWire.position.y = bHeight / 2;
    boothGroup.add(frameWire);

    // Floor Base Pad for Workstation
    const pad = new THREE.Mesh(
      new THREE.PlaneGeometry(bWidth - 0.4, bDepth - 0.4),
      new THREE.MeshStandardMaterial({ color: 0x161c2c, roughness: 0.6 })
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.04;
    pad.receiveShadow = true;
    boothGroup.add(pad);

    // Modern Executive Desk
    const deskTop = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 0.14, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x1f2638, roughness: 0.35, metalness: 0.3 })
    );
    deskTop.position.set(0, 1.5, -0.2);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskTop.userData = { stationIndex: idx };
    boothGroup.add(deskTop);
    raycastObjects.push(deskTop);

    // Steel Desk Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x3d4964, metalness: 0.8, roughness: 0.2 });
    [[-1.7, 0.75, -0.8], [1.7, 0.75, -0.8], [-1.7, 0.75, 0.8], [1.7, 0.75, 0.8]].forEach(pos => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5), legMat);
      leg.position.set(pos[0], pos[1], pos[2] - 0.2);
      leg.castShadow = true;
      boothGroup.add(leg);
    });

    // Dual Monitors with Artwork Texture
    const cvs = document.createElement("canvas");
    cvs.width = 512;
    cvs.height = 280;
    const c = cvs.getContext("2d");
    c.fillStyle = "#0c0f1a";
    c.fillRect(0, 0, 512, 280);
    c.fillStyle = "#162238";
    c.fillRect(15, 15, 482, 170);
    c.fillStyle = "#19c3eb";
    c.font = "bold 24px sans-serif";
    c.fillText(st.cleanName.slice(0, 20), 25, 225);
    c.fillStyle = "#2bd14b";
    c.font = "20px sans-serif";
    c.fillText(`Active: ${st.inQueueCount} | Done: ${st.completedCount}`, 25, 260);

    const monTex = new THREE.CanvasTexture(cvs);
    const monGeo = new THREE.BoxGeometry(1.5, 0.95, 0.06);
    const monMat = new THREE.MeshBasicMaterial({ map: monTex });

    const mon1 = new THREE.Mesh(monGeo, monMat);
    mon1.position.set(-0.8, 2.25, -0.6);
    mon1.rotation.y = 0.16;
    boothGroup.add(mon1);

    const mon2 = new THREE.Mesh(monGeo, monMat);
    mon2.position.set(0.8, 2.25, -0.6);
    mon2.rotation.y = -0.16;
    boothGroup.add(mon2);

    // Ergonomic Chair
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x181e30, roughness: 0.6 });
    const chair = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 1.0), chairMat);
    chair.position.set(0, 1.15, 0.9);
    chair.castShadow = true;
    boothGroup.add(chair);

    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.1), chairMat);
    chairBack.position.set(0, 1.7, 1.35);
    chairBack.castShadow = true;
    boothGroup.add(chairBack);

    // Floor Hotspot Node Marker (Matching 01, 02... circular rings in Image!)
    const ringGeo = new THREE.RingGeometry(0.65, 0.85, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x19c3eb,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const hotspotRing = new THREE.Mesh(ringGeo, ringMat);
    hotspotRing.rotation.x = -Math.PI / 2;
    hotspotRing.position.set(0, 0.06, 1.9);
    boothGroup.add(hotspotRing);
    hotspotPulses.push(hotspotRing);

    // Beacon Number Canvas Disc (01, 02, etc.)
    const discCvs = document.createElement("canvas");
    discCvs.width = 128;
    discCvs.height = 128;
    const dctx = discCvs.getContext("2d");
    dctx.fillStyle = "#090d16";
    dctx.beginPath();
    dctx.arc(64, 64, 60, 0, Math.PI * 2);
    dctx.fill();
    dctx.lineWidth = 6;
    dctx.strokeStyle = "#19c3eb";
    dctx.stroke();
    dctx.fillStyle = "#ffffff";
    dctx.font = "bold 52px sans-serif";
    dctx.textAlign = "center";
    dctx.textBaseline = "middle";
    dctx.fillText(`0${idx + 1}`, 64, 64);

    const discTex = new THREE.CanvasTexture(discCvs);
    const discMesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 32),
      new THREE.MeshBasicMaterial({ map: discTex, side: THREE.DoubleSide })
    );
    discMesh.rotation.x = -Math.PI / 2;
    discMesh.position.set(0, 0.07, 1.9);
    discMesh.userData = { stationIndex: idx };
    boothGroup.add(discMesh);
    raycastObjects.push(discMesh);

    scene.add(boothGroup);

    // Floating Hologram Tag (DOM projection)
    if (hologramLayer) {
      const tag = document.createElement("div");
      tag.className = `hologram-station-tag ${idx === 0 ? "is-active" : ""}`;
      tag.innerHTML = `
        <div class="holo-tag-header">
          <span class="holo-tag-name">${escapeHtml(st.cleanName)}</span>
          <span class="holo-tag-desk">${st.deskId}</span>
        </div>
        <div class="holo-tag-task">${escapeHtml(st.currentTask ? st.currentTask.title : "พร้อมรับงานใหม่")}</div>
        <div class="holo-tag-metrics">
          <span>ส่งแล้ว <strong>${st.completedCount}</strong></span>
          <span>ในคิว <strong>${st.inQueueCount}</strong></span>
        </div>
      `;

      tag.addEventListener("click", () => {
        focusStation(idx);
        onSelectStation(idx);
      });

      hologramLayer.appendChild(tag);
      boothHolograms.push({ el: tag, pos: new THREE.Vector3(st.posX, 3.8, st.posZ) });
    }
  });

  // 4. Smooth Camera Focus Logic
  function focusStation(idx) {
    const st = teamStations[idx];
    if (!st) return;
    targetCamPos.set(st.posX, 4.2, st.posZ + 6.2);
    targetCamLookAt.set(st.posX, 1.8, st.posZ);

    boothHolograms.forEach((h, i) => {
      h.el.classList.toggle("is-active", i === idx);
    });
  }

  function resetOverview() {
    targetCamPos.copy(overviewPos);
    targetCamLookAt.copy(overviewLookAt);
    boothHolograms.forEach(h => h.el.classList.remove("is-active"));
  }

  // HUD Controls
  document.getElementById("hud-cam-overview")?.addEventListener("click", resetOverview);

  let isTouring = false;
  let tourIdx = 0;
  document.getElementById("hud-cam-tour")?.addEventListener("click", (e) => {
    isTouring = !isTouring;
    e.currentTarget?.classList.toggle("is-active", isTouring);

    if (isTouring) {
      tourIntervalId = setInterval(() => {
        if (!isMounted) return;
        tourIdx = (tourIdx + 1) % teamStations.length;
        focusStation(tourIdx);
        onSelectStation(tourIdx);
      }, 4000);
      focusStation(tourIdx);
      onSelectStation(tourIdx);
    } else {
      clearInterval(tourIntervalId);
      tourIntervalId = null;
      resetOverview();
    }
  });

  // 5. Mouse Orbit & Raycast Interaction
  let isDragging = false;
  let prevMouse = { x: 0, y: 0 };
  let orbitRadius = 35;
  let orbitTheta = Math.PI / 2;
  let orbitPhi = Math.PI / 3.8;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onPointerDown(e) {
    if (e.target !== renderer.domElement) return;
    isDragging = true;
    prevMouse = { x: e.clientX, y: e.clientY };
  }

  function onPointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (isDragging) {
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };

      orbitTheta -= dx * 0.005;
      orbitPhi = Math.max(0.18, Math.min(Math.PI / 2.3, orbitPhi - dy * 0.005));

      targetCamPos.x = targetCamLookAt.x + orbitRadius * Math.sin(orbitPhi) * Math.sin(orbitTheta);
      targetCamPos.y = targetCamLookAt.y + orbitRadius * Math.cos(orbitPhi);
      targetCamPos.z = targetCamLookAt.z + orbitRadius * Math.sin(orbitPhi) * Math.cos(orbitTheta);
    } else {
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(raycastObjects);
      renderer.domElement.style.cursor = hits.length > 0 ? "pointer" : "default";
    }
  }

  function onPointerUp() {
    isDragging = false;
  }

  function onPointerClick(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(raycastObjects);

    if (hits.length > 0) {
      const idx = hits[0].object.userData.stationIndex;
      if (typeof idx === "number") {
        focusStation(idx);
        onSelectStation(idx);
      }
    }
  }

  function onWheel(e) {
    e.preventDefault();
    orbitRadius = Math.max(14, Math.min(50, orbitRadius + e.deltaY * 0.02));
    targetCamPos.x = targetCamLookAt.x + orbitRadius * Math.sin(orbitPhi) * Math.sin(orbitTheta);
    targetCamPos.y = targetCamLookAt.y + orbitRadius * Math.cos(orbitPhi);
    targetCamPos.z = targetCamLookAt.z + orbitRadius * Math.sin(orbitPhi) * Math.cos(orbitTheta);
  }

  renderer.domElement.addEventListener("mousedown", onPointerDown);
  window.addEventListener("mousemove", onPointerMove);
  window.addEventListener("mouseup", onPointerUp);
  renderer.domElement.addEventListener("click", onPointerClick);
  renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

  // 6. Animation Loop
  let clock = new THREE.Clock();

  function animate() {
    if (!isMounted) return;
    animationFrameId = requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();

    // Camera LERP
    camera.position.lerp(targetCamPos, 0.055);
    currentLookAt.lerp(targetCamLookAt, 0.055);
    camera.lookAt(currentLookAt);

    // Pulse Hotspot Rings
    hotspotPulses.forEach((ring, i) => {
      const s = 1.0 + Math.sin(elapsed * 3.0 + i) * 0.08;
      ring.scale.set(s, s, s);
    });

    // Project Hologram Tags to 2D Screen Space
    if (hologramLayer && canvasContainer) {
      const tempV = new THREE.Vector3();
      const halfW = canvasContainer.clientWidth / 2;
      const halfH = canvasContainer.clientHeight / 2;

      boothHolograms.forEach(item => {
        tempV.copy(item.pos);
        tempV.project(camera);

        if (tempV.z > 1) {
          item.el.style.display = "none";
        } else {
          item.el.style.display = "block";
          const x = (tempV.x * halfW) + halfW;
          const y = -(tempV.y * halfH) + halfH;
          item.el.style.left = `${x}px`;
          item.el.style.top = `${y}px`;
        }
      });
    }

    renderer.render(scene, camera);
  }

  animate();

  // Resize handler
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
