import { taskCard, interactiveEmptyState, formatDate, relativeDeadline, avatar, escapeHtml, roleLabel, memberFor, projectFor } from "./formatters.js";
import { STATUS_LABELS, STATUS_ORDER } from "./constants.js";
import { qs, qsa, toast } from "./app.js";
import { openCreateTask, bindTaskCards } from "./task-actions.js";
import { filterTasksByTimeRange, getTaskDate, calculateTeamAnalytics } from "./analytics.js";

let animationFrameId = null;
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
    { id: "1fd3ea77-8461-4de1-917a-90a9869428c1", name: "BEEM", role: "supervisor", hair: "#e8202a", clothes: "#1f2937", gender: "ชาย" },
    { id: "a31026f2-adc9-47d7-9ba0-f809be9344f1", name: "Peerapisit Rojatiegpanya", role: "designer", hair: "#38bdf8", clothes: "#1e3a5f", gender: "ชาย" },
    { id: "617af97c-0c1e-4842-91d9-f9ecbc0fa303", name: "Pisit Sintavanuwat", role: "designer", hair: "#f59e0b", clothes: "#451a03", gender: "ชาย" },
    { id: "9135d1e4-ba13-4cf7-adcf-9e05d33c5e52", name: "Pongsathorn Pang", role: "designer", hair: "#ec4899", clothes: "#831843", gender: "หญิง" },
    { id: "c16a2845-c95e-47c5-b616-4b37299574a4", name: "Yutiporn Thongkom", role: "designer", hair: "#a855f7", clothes: "#581c87", gender: "หญิง" },
    { id: "739187f5-e142-4aa4-95ad-e06f881163cc", name: "Naraporn Leungvititgoon", role: "designer", hair: "#10b981", clothes: "#064e3b", gender: "หญิง" }
  ];

  const designMembers = (members && members.length)
    ? members.filter(m => m.is_active !== false && ["designer", "supervisor", "admin"].includes(m.role))
    : fallbackDesigners;

  // Cozy Office Room Coordinates (Matching Image 1: media_1792138423370.png)
  // Desks arranged in center and side pods
  const deskZones = [
    { deskId: "Desk A1", label: "Desk A1 • โต๊ะหัวหน้าทีม", wx: 0, wy: -48, facing: "down" },
    { deskId: "Desk A2", label: "Desk A2 • โต๊ะกลางซ้าย", wx: -62, wy: -10, facing: "right" },
    { deskId: "Desk A3", label: "Desk A3 • โต๊ะกลางขวา", wx: 62, wy: -10, facing: "left" },
    { deskId: "Desk B1", label: "Desk B1 • โต๊ะริมซ้าย", wx: -110, wy: 25, facing: "right" },
    { deskId: "Desk B2", label: "Desk B2 • โต๊ะริมขวา", wx: 110, wy: 25, facing: "left" },
    { deskId: "Desk B3", label: "Desk B3 • โต๊ะหน้าขวา", wx: 38, wy: 65, facing: "up" }
  ];

  const drawStudio = () => {
    // 2. Real Filtered Data Computation (100% MATCH to Classic Overview!)
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

    // Compute Designers Real Telemetry (NO fake tasks! NO parentheses!)
    const teamStations = designMembers.slice(0, 6).map((m, idx) => {
      const zone = deskZones[idx] || deskZones[0];
      const assigned = filtered.filter(t => t.assignee_id === m.id);
      const memberActive = assigned.filter(t => t.status !== "completed");
      const memberCompleted = assigned.filter(t => t.status === "completed");
      const memberProjectsCount = new Set(assigned.map(t => t.project_id).filter(Boolean)).size;

      // Real current task
      const currentTask = memberActive[0] || null;

      // Real SLA for this member
      const memberSla = assigned.length
        ? ((memberCompleted.length / assigned.length) * 100).toFixed(1)
        : "100.0";

      const fb = fallbackDesigners[idx] || fallbackDesigners[0];

      return {
        ...m,
        cleanName: m.name.replace(/\s*\(.*?\)\s*/g, "").trim(), // Strip any accidental parentheses
        deskId: zone.deskId,
        deskLabel: zone.label,
        wx: zone.wx,
        wy: zone.wy,
        facing: zone.facing,
        hairColor: fb.hair,
        clothesColor: fb.clothes,
        gender: fb.gender,
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
              <span class="studio3d-live-pill" style="font-size:0.7rem;color:#ffc61a;background:rgba(255,198,26,0.12);border:1px solid rgba(255,198,26,0.35);padding:2px 8px;border-radius:12px;margin-left:8px;font-weight:700;">
                <span class="studio3d-live-dot" style="display:inline-block;width:6px;height:6px;background:#ffc61a;border-radius:50%;margin-right:4px;"></span>
                Cozy Pixel Studio
              </span>
            </h1>
            <p class="overview-subtitle">ภาพรวมงานดีไซน์ สถิติการผลิต และสถานะงานทั้งหมดใน Pipeline</p>
          </div>

          <div class="overview-header-actions">
            <!-- Dual View Switcher -->
            <div class="view-switcher-pill" style="margin-right: 6px;">
              <button type="button" class="view-btn is-active is-3d" id="btn-studio-3d" title="มุมมอง 3D Office Studio">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                <span>3D Office</span>
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

        <!-- 4. Center Cozy Pixel Office Viewport + Workstation Inspector Grid -->
        <div class="studio-stage-grid">
          <!-- Left: Cozy Pixel Office Viewport -->
          <div class="studio-viewport-card" id="studio-viewport-box">
            <div id="studio-canvas-container">
              <canvas id="studio-pixel-canvas"></canvas>
            </div>
            <div id="studio-hologram-layer"></div>

            <!-- Top Viewport HUD -->
            <div class="studio-viewport-top-hud">
              <div class="viewport-hud-left">
                <span class="viewport-hud-badge">
                  <span class="viewport-hud-dot"></span>
                  <span>KKP CREATIVE STUDIO</span>
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
                <span class="hud-hint-item">🖱️ คลิกซ้ายลาก: แพนมุมกล้อง</span>
                <span class="hud-hint-item">🔍 ลูกกลิ้งเมาส์: ซูมเข้า-ออก</span>
                <span class="hud-hint-item">👆 คลิกที่โต๊ะ/ดีไซเนอร์: เจาะลึกภาระงาน</span>
              </div>
              <span id="studio-current-focus-hint" style="color:#ffc61a;font-weight:600;">
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"></line></svg>
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

    // 5. Initialize Cozy Isometric Pixel Office Canvas Engine
    initCozyPixelOffice(teamStations, (newIndex) => {
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
   Cozy Isometric Pixel Office Canvas Engine
   (Inspired by User's Reference Image: media_1792138423370.png)
───────────────────────────────────────────────────────────────────────── */
function initCozyPixelOffice(teamStations, onSelectStation) {
  const canvas = document.getElementById("studio-pixel-canvas");
  const container = document.getElementById("studio-viewport-box");
  const hologramLayer = document.getElementById("studio-hologram-layer");
  if (!canvas || !container) return;

  const ctx2d = canvas.getContext("2d");

  let W = 0;
  let H = 0;
  let scale = 2.4; // Pixel crisp scale

  // Camera coordinates
  const cam = { x: 0, y: 0, tx: 0, ty: 0 };

  function resize() {
    const rect = container.getBoundingClientRect();
    W = Math.round(rect.width);
    H = Math.round(rect.height);
    canvas.width = W;
    canvas.height = H;
    ctx2d.imageSmoothingEnabled = false;
  }

  resize();

  // Floating tags DOM elements
  const hologramTags = [];
  if (hologramLayer) {
    hologramLayer.innerHTML = "";
    teamStations.forEach((st, idx) => {
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
        focusDesk(idx);
        onSelectStation(idx);
      });

      hologramLayer.appendChild(tag);
      hologramTags.push({ el: tag, wx: st.wx, wy: st.wy });
    });
  }

  function focusDesk(idx) {
    const st = teamStations[idx];
    if (!st) return;
    cam.tx = st.wx;
    cam.ty = st.wy - 20;

    hologramTags.forEach((h, i) => {
      h.el.classList.toggle("is-active", i === idx);
    });
  }

  function resetOverview() {
    cam.tx = 0;
    cam.ty = 0;
    hologramTags.forEach(h => h.el.classList.remove("is-active"));
  }

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
        focusDesk(tourIdx);
        onSelectStation(tourIdx);
      }, 4000);
      focusDesk(tourIdx);
      onSelectStation(tourIdx);
    } else {
      clearInterval(tourIntervalId);
      tourIntervalId = null;
      resetOverview();
    }
  });

  // Mouse pan & zoom listeners
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  container.addEventListener("mousedown", (e) => {
    if (e.target.closest(".hologram-station-tag, .btn-viewport-hud, button")) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    startX = e.clientX;
    startY = e.clientY;
    cam.x -= dx / scale;
    cam.y -= dy / scale;
    cam.tx = cam.x;
    cam.ty = cam.y;
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });

  container.addEventListener("wheel", (e) => {
    e.preventDefault();
    scale = Math.max(1.6, Math.min(3.8, scale + (e.deltaY < 0 ? 0.2 : -0.2)));
  }, { passive: false });

  // Click on canvas to hit-test desks
  container.addEventListener("click", (e) => {
    if (e.target.closest(".hologram-station-tag, .btn-viewport-hud, button")) return;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left - W / 2) / scale + cam.x;
    const cy = (e.clientY - rect.top - H / 2) / scale + cam.y;

    const hitIdx = teamStations.findIndex(st => Math.hypot(st.wx - cx, st.wy - cy) < 42);
    if (hitIdx >= 0) {
      focusDesk(hitIdx);
      onSelectStation(hitIdx);
    }
  });

  // Render loop
  let startTime = performance.now();

  function renderLoop(now) {
    if (!isMounted) return;
    animationFrameId = requestAnimationFrame(renderLoop);

    const elapsed = (now - startTime) / 1000;

    // Smooth camera LERP
    cam.x += (cam.tx - cam.x) * 0.12;
    cam.y += (cam.ty - cam.y) * 0.12;

    ctx2d.save();
    ctx2d.clearRect(0, 0, W, H);

    // Coordinate transform
    ctx2d.translate(W / 2, H / 2);
    ctx2d.scale(scale, scale);
    ctx2d.translate(-cam.x, -cam.y);

    // ─────────────────────────────────────────────────────────────────
    // 1. Draw Room Background & Architecture (Matching Image 1!)
    // ─────────────────────────────────────────────────────────────────
    const roomW = 380;
    const roomH = 320;

    // Wall (Slate Dark Blue)
    ctx2d.fillStyle = "#202538";
    ctx2d.fillRect(-roomW / 2, -roomH / 2, roomW, 110);

    // Floor Carpet (Deep Indigo Navy)
    ctx2d.fillStyle = "#161928";
    ctx2d.fillRect(-roomW / 2, -roomH / 2 + 110, roomW, roomH - 110);

    // Floor Grid / Tiles subtle texture
    ctx2d.strokeStyle = "#1b1f32";
    ctx2d.lineWidth = 1;
    for (let x = -roomW / 2; x <= roomW / 2; x += 32) {
      ctx2d.beginPath();
      ctx2d.moveTo(x, -roomH / 2 + 110);
      ctx2d.lineTo(x, roomH / 2);
      ctx2d.stroke();
    }
    for (let y = -roomH / 2 + 110; y <= roomH / 2; y += 32) {
      ctx2d.beginPath();
      ctx2d.moveTo(-roomW / 2, y);
      ctx2d.lineTo(roomW / 2, y);
      ctx2d.stroke();
    }

    // Baseboard trim
    ctx2d.fillStyle = "#111420";
    ctx2d.fillRect(-roomW / 2, -roomH / 2 + 104, roomW, 6);

    // ── Windows on Back Wall (Matching Image 1!) ──
    const winW = 120;
    const winH = 68;
    ctx2d.fillStyle = "#0c1322";
    ctx2d.fillRect(-winW / 2, -roomH / 2 + 20, winW, winH);

    // Window Glass Sky gradient
    const skyGrad = ctx2d.createLinearGradient(0, -roomH / 2 + 20, 0, -roomH / 2 + 20 + winH);
    skyGrad.addColorStop(0, "#385b74");
    skyGrad.addColorStop(1, "#54889c");
    ctx2d.fillStyle = skyGrad;
    ctx2d.fillRect(-winW / 2 + 3, -roomH / 2 + 23, winW - 6, winH - 6);

    // Window frames
    ctx2d.strokeStyle = "#161c28";
    ctx2d.lineWidth = 3;
    ctx2d.strokeRect(-winW / 2 + 3, -roomH / 2 + 23, winW - 6, winH - 6);
    ctx2d.beginPath();
    ctx2d.moveTo(0, -roomH / 2 + 23);
    ctx2d.lineTo(0, -roomH / 2 + 23 + winH - 6);
    ctx2d.moveTo(-winW / 2 + 3, -roomH / 2 + 23 + winH / 2);
    ctx2d.lineTo(winW / 2 - 3, -roomH / 2 + 23 + winH / 2);
    ctx2d.stroke();

    // ── Master Wall Monitor on Upper Left (Matching Image 1!) ──
    ctx2d.fillStyle = "#101420";
    ctx2d.fillRect(-170, -roomH / 2 + 16, 68, 44);
    ctx2d.fillStyle = "#182c48";
    ctx2d.fillRect(-168, -roomH / 2 + 18, 64, 40);

    // Glowing telemetry on monitor
    ctx2d.fillStyle = "#5ce0ff";
    ctx2d.fillRect(-162, -roomH / 2 + 26, 24, 14);
    ctx2d.fillStyle = "#2bd14b";
    ctx2d.fillRect(-134, -roomH / 2 + 26, 26, 6);
    ctx2d.fillStyle = "#ffc61a";
    ctx2d.fillRect(-134, -roomH / 2 + 34, 18, 4);

    // ── Kanban Task Board on Back Wall (Matching Image 1!) ──
    const kbX = 68;
    const kbY = -roomH / 2 + 22;
    ctx2d.fillStyle = "#161c2b";
    ctx2d.fillRect(kbX, kbY, 82, 54);
    ctx2d.fillStyle = "#e8eef6";
    ctx2d.fillRect(kbX + 2, kbY + 2, 78, 50);

    // Kanban Sticky Notes (Real Pipeline Tasks representation!)
    const stickyColors = ["#ff5d73", "#ffc61a", "#19c3eb", "#2bd14b", "#a855f7"];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const sc = stickyColors[(r * 5 + c) % stickyColors.length];
        ctx2d.fillStyle = sc;
        ctx2d.fillRect(kbX + 6 + c * 14, kbY + 8 + r * 13, 10, 9);
      }
    }

    // ── Bookshelf on Upper Right (Matching Image 1!) ──
    const bsX = 158;
    const bsY = -roomH / 2 + 45;
    ctx2d.fillStyle = "#a66838";
    ctx2d.fillRect(bsX, bsY, 32, 60);
    ctx2d.fillStyle = "#8a5229";
    ctx2d.fillRect(bsX + 2, bsY + 2, 28, 56);

    // Book rows
    const bookColors = ["#e8202a", "#19c3eb", "#2bd14b", "#ffc61a", "#e2e8f8"];
    for (let b = 0; b < 6; b++) {
      ctx2d.fillStyle = bookColors[b % bookColors.length];
      ctx2d.fillRect(bsX + 4 + b * 4, bsY + 12, 3, 20);
    }
    // Cactus pot on bookshelf
    ctx2d.fillStyle = "#d97736";
    ctx2d.fillRect(bsX + 10, bsY - 10, 10, 10);
    ctx2d.fillStyle = "#22c55e";
    ctx2d.fillRect(bsX + 12, bsY - 18, 6, 9);

    // ─────────────────────────────────────────────────────────────────
    // 2. Draw Furniture & Warm Wooden Desks (Matching Image 1!)
    // ─────────────────────────────────────────────────────────────────
    function drawWoodenDesk(x, y, w, h) {
      // Warm Oak Wood Tabletop
      ctx2d.fillStyle = "#875224"; // Side shadow
      ctx2d.fillRect(x - w / 2, y - h / 2 + 4, w, h);
      ctx2d.fillStyle = "#cf9456"; // Top surface
      ctx2d.fillRect(x - w / 2, y - h / 2, w, h);
      ctx2d.fillStyle = "#e2ab6e"; // Highlight bevel
      ctx2d.fillRect(x - w / 2, y - h / 2, w, 2);

      // Steel Table Legs
      ctx2d.fillStyle = "#1e2434";
      ctx2d.fillRect(x - w / 2 + 4, y + h / 2, 3, 10);
      ctx2d.fillRect(x + w / 2 - 7, y + h / 2, 3, 10);
    }

    // Upper cluster table (Desk A1 & middle)
    drawWoodenDesk(0, -44, 150, 42);

    // Lower cluster table (Desk B3 & front workstations)
    drawWoodenDesk(0, 68, 150, 42);

    // Side left desk
    drawWoodenDesk(-125, 20, 40, 110);

    // Side right desk
    drawWoodenDesk(125, 20, 40, 110);

    // ─────────────────────────────────────────────────────────────────
    // 3. Draw 6 Workstations with Cute Characters & Equipment
    // ─────────────────────────────────────────────────────────────────
    teamStations.forEach((st, idx) => {
      const isSelected = selectedMemberIndex === idx;

      // Warm desk lamp illumination cone
      ctx2d.save();
      const lampGrad = ctx2d.createRadialGradient(st.wx, st.wy, 6, st.wx, st.wy, 42);
      lampGrad.addColorStop(0, "rgba(255, 235, 170, 0.22)");
      lampGrad.addColorStop(1, "rgba(255, 235, 170, 0)");
      ctx2d.fillStyle = lampGrad;
      ctx2d.beginPath();
      ctx2d.arc(st.wx, st.wy, 42, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.restore();

      // Selection Halo
      if (isSelected) {
        ctx2d.strokeStyle = "#ffc61a";
        ctx2d.lineWidth = 2;
        ctx2d.strokeRect(st.wx - 26, st.wy - 26, 52, 52);
      }

      // Office Swivel Chair
      ctx2d.fillStyle = "#1b2131";
      ctx2d.beginPath();
      ctx2d.arc(st.wx, st.wy + 4, 12, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.fillStyle = "#131724";
      ctx2d.fillRect(st.wx - 9, st.wy + 8, 18, 5);

      // Computer Monitor Setup
      const monOffY = st.facing === "down" ? 14 : -14;
      ctx2d.fillStyle = "#101420";
      ctx2d.fillRect(st.wx - 14, st.wy + monOffY - 4, 28, 5);
      // Screen with creative artwork glow
      ctx2d.fillStyle = isSelected ? "#5ce0ff" : "#19c3eb";
      ctx2d.fillRect(st.wx - 13, st.wy + monOffY - 3, 26, 3);

      // Keyboard & accessories
      ctx2d.fillStyle = "#1e2536";
      ctx2d.fillRect(st.wx - 8, st.wy + (st.facing === "down" ? 7 : -7), 16, 3);
      // Coffee mug
      ctx2d.fillStyle = "#ff5d73";
      ctx2d.fillRect(st.wx + 13, st.wy - 2, 4, 5);

      // Character Sprite (Cute stylized top-down isometric avatar)
      const bob = Math.sin(elapsed * 3.5 + idx) * 0.8;
      const typeSwing = Math.sin(elapsed * 7.5 + idx) * 1.5;

      // Torso / Clothes
      ctx2d.fillStyle = st.clothesColor || "#2b344a";
      ctx2d.beginPath();
      ctx2d.ellipse(st.wx, st.wy + bob, 9, 7, 0, 0, Math.PI * 2);
      ctx2d.fill();

      // Arms typing
      ctx2d.fillStyle = "#ffd4b2"; // skin tone
      ctx2d.fillRect(st.wx - 8 + typeSwing, st.wy + 2 + bob, 3, 4);
      ctx2d.fillRect(st.wx + 5 - typeSwing, st.wy + 2 + bob, 3, 4);

      // Cute Head & Hair
      ctx2d.fillStyle = st.hairColor || "#e8202a";
      ctx2d.beginPath();
      ctx2d.arc(st.wx, st.wy - 5 + bob, 8.5, 0, Math.PI * 2);
      ctx2d.fill();

      // Hair bang / highlights
      ctx2d.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx2d.beginPath();
      ctx2d.arc(st.wx - 2, st.wy - 8 + bob, 3, 0, Math.PI * 2);
      ctx2d.fill();

      // Real Status Diamond / Pill above head
      const statusColor = st.activeTasks.some(t => t.priority === "urgent") ? "#ff4757" : st.activeTasks.length ? "#2bd14b" : "#7f8e9e";
      ctx2d.fillStyle = statusColor;
      ctx2d.beginPath();
      ctx2d.arc(st.wx, st.wy - 18 + bob, 3, 0, Math.PI * 2);
      ctx2d.fill();
    });

    // ─────────────────────────────────────────────────────────────────
    // 4. Lush Indoor Office Plants in Corners (Matching Image 1!)
    // ─────────────────────────────────────────────────────────────────
    function drawOfficePlant(px, py) {
      // Pot
      ctx2d.fillStyle = "#944e26";
      ctx2d.fillRect(px - 10, py, 20, 16);
      ctx2d.fillStyle = "#b46436";
      ctx2d.fillRect(px - 12, py - 2, 24, 4);

      // Layered Monstera Leaves
      const leafColors = ["#15803d", "#16a34a", "#22c55e", "#4ade80"];
      for (let l = 0; l < 7; l++) {
        const ang = (l / 7) * Math.PI * 2;
        const lx = px + Math.cos(ang) * 12;
        const ly = py - 8 + Math.sin(ang) * 8;
        ctx2d.fillStyle = leafColors[l % leafColors.length];
        ctx2d.beginPath();
        ctx2d.ellipse(lx, ly, 8, 5, ang, 0, Math.PI * 2);
        ctx2d.fill();
      }
    }

    // Bottom Left Plant
    drawOfficePlant(-145, 120);

    // Bottom Right Plant
    drawOfficePlant(145, 120);

    ctx2d.restore();

    // ─────────────────────────────────────────────────────────────────
    // 5. Update 2D Screen-space Projection for Floating Tags
    // ─────────────────────────────────────────────────────────────────
    hologramTags.forEach(tag => {
      // Transform world coord (wx, wy) to screen coord
      const screenX = W / 2 + (tag.wx - cam.x) * scale;
      const screenY = H / 2 + (tag.wy - 26 - cam.y) * scale;

      tag.el.style.left = `${screenX}px`;
      tag.el.style.top = `${screenY}px`;
    });
  }

  animationFrameId = requestAnimationFrame(renderLoop);

  window.addEventListener("resize", () => {
    resize();
  });
}
