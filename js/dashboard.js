import { taskCard, interactiveEmptyState, formatDate, relativeDeadline, avatar, escapeHtml, roleLabel, memberFor, projectFor } from "./formatters.js";
import { STATUS_LABELS, STATUS_ORDER } from "./constants.js";
import { qs, toast, openModal } from "./app.js";
import { openCreateTask, bindTaskCards } from "./task-actions.js";
import { isRequester, isViewer, canCreateTask } from "./auth.js";
import { filterTasksByTimeRange, getTaskDate, MONTH_NAMES_TH, calculateTeamAnalytics, renderMemberComparisonHtml, bindMemberComparison } from "./analytics.js";
import { pixelIcons } from "./pixel-icons.js";

/* ─────────────────────────────────────────────────────────────────────────
   Brand palette (Neo-Retro Pixel Arcade Tokens)
───────────────────────────────────────────────────────────────────────── */
const BRAND = {
  ink: "#0A0A0A",
  ink2: "#141414",
  cream: "#F5ECD2",
  line: "#3A3A3A",
  red: "#E8202A",
  redDark: "#9E1018",
  cyan: "#19C3EB",
  cyanDark: "#0B7FA0",
  yellow: "#FFC61A",
  yellowDark: "#B58300",
  green: "#2BD14B",
  greenDark: "#198C30",
  blue: "#2F6BFF",
  blueDark: "#1643AF",
  purple: "#8B4DFF",
  purpleDark: "#5824B8",
};

const STATUS_CHART_COLORS = {
  brief:     { bg: BRAND.yellow, border: BRAND.yellowDark },
  drafting:  { bg: BRAND.cyan,   border: BRAND.cyanDark },
  review:    { bg: BRAND.red,    border: BRAND.redDark },
  revision:  { bg: BRAND.purple, border: BRAND.purpleDark },
  completed: { bg: BRAND.green,  border: BRAND.greenDark },
};

const STATUS_TH = {
  brief: "รอรับบรีฟ",
  drafting: "กำลังดราฟต์",
  review: "รอคอมเมนต์",
  revision: "แก้ไขงาน",
  completed: "ส่งมอบสำเร็จ",
};

/* ─── Destroy existing Chart.js instances before redraw ─── */
const _chartInstances = {};
function destroyChart(id) {
  if (_chartInstances[id]) {
    _chartInstances[id].destroy();
    delete _chartInstances[id];
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN RENDER
───────────────────────────────────────────────────────────────────────── */
export async function render(ctx) {
  const { tasks, members, projects, subtasks } = ctx;
  window.openCreateTask = () => openCreateTask(ctx);
  const isReq = isRequester(ctx.member);
  const canCreate = canCreateTask(ctx.member);

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

  const draw = () => {
    const filtered = filterTasksByTimeRange(tasks, filterState);
    const analytics = calculateTeamAnalytics(filtered, members, filterState.memberId);
    const active    = filtered.filter(t => t.status !== "completed");
    const dueSoon   = filtered.filter(t => t.status !== "completed" && relativeDeadline(t.deadline_at || t.deadline).className);
    const review    = filtered.filter(t => t.status === "review");
    const revision  = filtered.filter(t => t.status === "revision");
    const completed = filtered.filter(t => t.status === "completed");
    const lateCount = active.filter(t => relativeDeadline(t.deadline_at || t.deadline).className === "is-overdue").length;
    const onTimeRate = filtered.length ? ((completed.length / filtered.length) * 100).toFixed(1) : "100.0";

    const topTask = active[0] || tasks[0];
    const topMember = topTask ? memberFor(topTask, members) : null;

    /* ── 1. Hero Section (2 Columns, ~700px, Cream Left, Pixel Art City Right) ── */
    const pixelHeroHtml = `
      <section class="pixel-hero crt-scanlines">
        <!-- Left Column: Cream Background -->
        <div class="pixel-hero-cream">
          <div>
            <h1 class="pixel-hero-headline">
              <span>DESIGN</span>
              <span>WORKFLOW.</span>
              <span>TOGETHER.${pixelIcons.heart}</span>
            </h1>
            <p class="pixel-hero-sub">
              ระบบจัดการกระบวนการทำงานกราฟิกดีไซน์ KKP แบบเรียลไทม์<br />
              TRACK BRIEFS, DESIGN ITERATIONS & TEAM CAPACITY IN 8-BIT PRECISION
            </p>
            <div class="pixel-hero-actions">
              <button class="btn-pixel btn-pixel-red" id="hero-create-btn">
                ${pixelIcons.rocket}
                <span>START BUILDING →</span>
              </button>
              <a class="btn-pixel btn-pixel-cyan" href="board.html">
                ${pixelIcons.arrowRight}
                <span>EXPLORE KANBAN</span>
              </a>
            </div>
          </div>

          <!-- News Ticker Bar -->
          <div class="pixel-news-ticker">
            <span class="pixel-news-tag">NEWS</span>
            <span class="pixel-news-text" id="news-ticker-text">
              CONT 2.0 PIXEL WORKFLOW ENGINE IS ONLINE — REAL-TIME SPRINT DISPATCH & REVISION TRACKING
            </span>
            <span class="pixel-news-chevron">›</span>
          </div>
        </div>

        <!-- Right Column: Full-Bleed Isometric Pixel-Art City -->
        <div class="pixel-hero-city-wrap">
          <img
            class="pixel-hero-city-img pixel-bob-animation"
            src="assets/hero-city.png"
            alt="Isometric Pixel City Builder"
            loading="eager"
          />
        </div>
      </section>
    `;

    /* ── 2. Feature Strip (4 Cards on Near-Black, Double-line Pixel Frame) ── */
    const featureStripHtml = `
      <section class="pixel-feature-strip">
        <!-- Card 1: Green Cube -->
        <div class="pixel-feature-card crt-scanlines">
          <div class="pixel-feature-tile is-green">
            ${pixelIcons.cubeGreen}
          </div>
          <div class="pixel-feature-main">
            <h3 class="pixel-feature-title is-green">SMART WORKFLOW</h3>
            <p class="pixel-feature-body">
              ติดตามสถานะงาน 5 ขั้นตอน (Brief → Draft → Review → Revision → Done) ชัดเจนทุกเฟส
            </p>
            <a class="pixel-feature-link is-green" href="#" id="feature-guide-link">
              <span>LEARN MORE</span>
              <span class="feature-arrow-icon">${pixelIcons.arrowRight}</span>
            </a>
          </div>
        </div>

        <!-- Card 2: Blue People -->
        <div class="pixel-feature-card crt-scanlines">
          <div class="pixel-feature-tile is-blue">
            ${pixelIcons.people}
          </div>
          <div class="pixel-feature-main">
            <h3 class="pixel-feature-title is-blue">TEAM CAPACITY</h3>
            <p class="pixel-feature-body">
              วิเคราะห์ Workload และกำลังงานกราฟิกรายบุคคล พร้อมระบบเทียบผลงานย้อนหลัง
            </p>
            <a class="pixel-feature-link is-blue" href="team.html">
              <span>VIEW TEAM</span>
              <span class="feature-arrow-icon">${pixelIcons.arrowRight}</span>
            </a>
          </div>
        </div>

        <!-- Card 3: Yellow Trophy -->
        <div class="pixel-feature-card crt-scanlines">
          <div class="pixel-feature-tile is-yellow">
            ${pixelIcons.trophy}
          </div>
          <div class="pixel-feature-main">
            <h3 class="pixel-feature-title is-yellow">ON-TIME ACCURACY</h3>
            <p class="pixel-feature-body">
              ป้องกันงานชนและเร่งด่วนด้วย Smart Deadline & SLA Monitoring แบบเรียลไทม์
            </p>
            <a class="pixel-feature-link is-yellow" href="#dash-filter-bar">
              <span>VIEW METRICS</span>
              <span class="feature-arrow-icon">${pixelIcons.arrowRight}</span>
            </a>
          </div>
        </div>

        <!-- Card 4: Purple Code -->
        <div class="pixel-feature-card crt-scanlines">
          <div class="pixel-feature-tile is-purple">
            ${pixelIcons.code}
          </div>
          <div class="pixel-feature-main">
            <h3 class="pixel-feature-title is-purple">SUPABASE CLOUD</h3>
            <p class="pixel-feature-body">
              เชื่อมต่อฐานข้อมูลเรียลไทม์ ซิงค์การตรวจงาน คอมเมนต์ และประวัติเวอร์ชันฉับไว
            </p>
            <a class="pixel-feature-link is-purple" href="tasks.html">
              <span>BROWSE TASKS</span>
              <span class="feature-arrow-icon">${pixelIcons.arrowRight}</span>
            </a>
          </div>
        </div>
      </section>
    `;

    /* ── 3. Stats Bar (Double-line Frame, Featured Card Left, 4 Stat Cells Right) ── */
    const statsBarHtml = `
      <section class="pixel-stats-bar crt-scanlines">
        <!-- Left: FEATURED Card -->
        <div class="pixel-featured-card">
          <div class="pixel-featured-thumb">
            <img src="assets/hero-city.png" alt="Featured Preview" />
          </div>
          <div class="pixel-featured-info">
            <div class="pixel-featured-tag">FEATURED JOB</div>
            <h4 class="pixel-featured-title">
              <a href="${topTask ? `task.html?id=${encodeURIComponent(topTask.id)}` : '#'}" style="color:inherit;text-decoration:none;">
                ${escapeHtml(topTask?.title || "KEY VISUAL CAMPAIGN 2026")}
              </a>
            </h4>
            <div class="pixel-featured-author">
              by ${escapeHtml(topMember?.name || "CONT CREATIVE LAB")}
            </div>
          </div>
        </div>

        <!-- Right: 4 Stat Cells with Dotted Dividers -->
        <div class="pixel-stat-cells">
          <!-- Stat 1: Total Tasks -->
          <div class="pixel-stat-cell">
            <div class="pixel-stat-head">
              <span class="pixel-stat-label">TOTAL JOBS</span>
              ${pixelIcons.cubeBlue}
            </div>
            <div class="pixel-stat-num count-up-num" data-final="${filtered.length}">
              0
            </div>
            <div class="pixel-stat-caption">ALL REGISTERED</div>
          </div>

          <!-- Stat 2: Active Tasks -->
          <div class="pixel-stat-cell">
            <div class="pixel-stat-head">
              <span class="pixel-stat-label">IN PROGRESS</span>
              ${pixelIcons.rocket}
            </div>
            <div class="pixel-stat-num count-up-num" data-final="${active.length}" style="color:var(--cyan);">
              0
            </div>
            <div class="pixel-stat-caption">ACTIVE QUEUE</div>
          </div>

          <!-- Stat 3: Completed -->
          <div class="pixel-stat-cell">
            <div class="pixel-stat-head">
              <span class="pixel-stat-label">DELIVERED</span>
              ${pixelIcons.trophy}
            </div>
            <div class="pixel-stat-num count-up-num" data-final="${completed.length}" style="color:var(--green);">
              0
            </div>
            <div class="pixel-stat-caption">SUCCESSFUL JOBS</div>
          </div>

          <!-- Stat 4: On-time SLA Rate -->
          <div class="pixel-stat-cell">
            <div class="pixel-stat-head">
              <span class="pixel-stat-label">ON-TIME SLA</span>
              <span class="pixel-pulse-dot"></span>
            </div>
            <div class="pixel-stat-num count-up-num" data-final="${onTimeRate}" data-is-percent="true" style="color:var(--yellow);">
              0%
            </div>
            <div class="pixel-stat-caption">TIMELY ACCURACY</div>
          </div>
        </div>
      </section>
    `;

    /* ── 4. Build years list for year selector ── */
    const allYears = [...new Set(tasks.map(t => {
      const d = getTaskDate(t, "created_at");
      return d ? d.getFullYear() : null;
    }).filter(Boolean))].sort((a, b) => b - a);

    /* ── Period filter bar HTML ── */
    const periodFilterHtml = `
      <div class="dash-filter-bar" id="dash-filter-bar">
        <div class="dfb-group">
          <label class="dfb-label">ช่วงเวลา</label>
          <div class="dfb-chips">
            ${["all","today","7days","month","year"].map(p => `
              <button class="dfb-chip${filterState.period===p?" is-active":""}" data-period="${p}">
                ${{ all:"ทั้งหมด", today:"วันนี้", "7days":"7 วัน", month:"เดือนนี้", year:"ปีนี้" }[p]}
              </button>`).join("")}
          </div>
        </div>
        <div class="dfb-group">
          <label class="dfb-label">ปี</label>
          <select class="dfb-select" id="dfb-year">
            <option value="all"${filterState.year==="all"?" selected":""}>ทุกปี</option>
            ${allYears.map(y => `<option value="${y}"${filterState.year==y?" selected":""}>${y + 543}</option>`).join("")}
          </select>
        </div>
        <div class="dfb-group">
          <label class="dfb-label">เดือน</label>
          <select class="dfb-select" id="dfb-month">
            <option value="all"${filterState.month==="all"?" selected":""}>ทุกเดือน</option>
            ${MONTH_NAMES_TH.map((m, i) => `<option value="${i+1}"${filterState.month==i+1?" selected":""}>${m}</option>`).join("")}
          </select>
        </div>
        <div class="dfb-group">
          <label class="dfb-label">สมาชิก</label>
          <select class="dfb-select" id="dfb-member">
            <option value="all"${filterState.memberId==="all"?" selected":""}>ทุกคน</option>
            ${members.map(m => `<option value="${m.id}"${filterState.memberId===m.id?" selected":""}>${escapeHtml(m.name)}</option>`).join("")}
          </select>
        </div>
        <div class="dfb-group">
          <label class="dfb-label">สถานะ</label>
          <select class="dfb-select" id="dfb-status">
            <option value="all"${filterState.status==="all"?" selected":""}>ทุกสถานะ</option>
            ${STATUS_ORDER.map(s => `<option value="${s}"${filterState.status===s?" selected":""}>${STATUS_TH[s]}</option>`).join("")}
          </select>
        </div>
        <div class="dfb-group dfb-range">
          <label class="dfb-label">ช่วงวันที่</label>
          <input type="date" class="dfb-input" id="dfb-start" value="${filterState.startDate}" placeholder="วันเริ่ม">
          <span class="dfb-sep">–</span>
          <input type="date" class="dfb-input" id="dfb-end" value="${filterState.endDate}" placeholder="วันสิ้นสุด">
        </div>
        <button class="dfb-reset" id="dfb-reset">× ล้างตัวกรอง</button>
      </div>
    `;

    /* ── Monthly trend data for line chart ── */
    const now = new Date();
    const monthLabels = [];
    const monthCompleted = [];
    const monthActive = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(MONTH_NAMES_TH[d.getMonth()].slice(0, 3) + " " + (d.getFullYear() + 543).toString().slice(2));
      const mComp = tasks.filter(t => {
        const td = getTaskDate(t, "created_at");
        return td && td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth() && t.status === "completed";
      }).length;
      const mActive = tasks.filter(t => {
        const td = getTaskDate(t, "created_at");
        return td && td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth() && t.status !== "completed";
      }).length;
      monthCompleted.push(mComp);
      monthActive.push(mActive);
    }

    /* ── Member workload data for bar chart ── */
    const memberWorkload = members.map(m => ({
      name: m.name,
      active: filtered.filter(t => t.assignee_id === m.id && t.status !== "completed").length,
      completed: filtered.filter(t => t.assignee_id === m.id && t.status === "completed").length,
    })).filter(m => m.active + m.completed > 0);

    /* ── Status distribution for donut chart ── */
    const statusCounts = STATUS_ORDER.map(s => ({
      status: s,
      count: filtered.filter(t => t.status === s).length,
    }));

    /* ── Activity + Deadlines list HTML ── */
    const activityHtml = active.slice(0, 5).map(task => {
      const m = memberFor(task, members);
      return `
        <div class="activity-item">
          <div class="activity-dot" style="background:${STATUS_CHART_COLORS[task.status]?.bg || BRAND.cyan};"></div>
          <div class="activity-main">
            <div class="activity-name"><a href="task.html?id=${encodeURIComponent(task.id)}" style="color:inherit;text-decoration:none;">${escapeHtml(task.title)}</a></div>
            <div class="activity-task">${escapeHtml(m?.name || "ยังไม่ระบุ")} · ${STATUS_TH[task.status] || task.status}</div>
          </div>
          <div class="activity-right">
            <span class="pixel-badge" style="color:var(--text-dim);border-color:var(--line);">${formatDate(task.created_at)}</span>
          </div>
        </div>
      `;
    }).join("") || `<div class="state-empty">ไม่มีความเคลื่อนไหวในช่วงเวลานี้</div>`;

    const deadlinesHtml = dueSoon.slice(0, 5).map(task => {
      const urgency = relativeDeadline(task.deadline_at || task.deadline);
      const d = getTaskDate(task, "deadline");
      return `
        <div class="deadline-item">
          <div class="deadline-date" style="border-color:var(--line);background:#1a1a1a;">
            <span class="day" style="font-family:var(--font-pixel);">${d ? d.getDate() : "—"}</span>
            <span class="month">${d ? MONTH_NAMES_TH[d.getMonth()].slice(0, 3) : "—"}</span>
          </div>
          <div class="deadline-main">
            <div class="deadline-title"><a href="task.html?id=${encodeURIComponent(task.id)}" style="color:inherit;text-decoration:none;">${escapeHtml(task.title)}</a></div>
            <div class="deadline-sub">${escapeHtml(urgency.label)}</div>
          </div>
          <span class="badge ${urgency.className}">${urgency.className === "is-overdue" ? "เกินกำหนด" : "ใกล้ส่ง"}</span>
        </div>
      `;
    }).join("") || `<div class="state-empty">ไม่มีงานเร่งด่วนที่ต้องส่งมอบเร็วๆ นี้</div>`;

    /* ─────────── Render Full Dashboard Page HTML ─────────── */
    qs("#page-content").innerHTML = `
      <!-- 1. Pixel Arcade Hero Section -->
      ${pixelHeroHtml}

      <!-- 2. Feature Strip (4 Pixel Cards) -->
      ${featureStripHtml}

      <!-- 3. Stats Bar (Count-Up Animation) -->
      ${statsBarHtml}

      <!-- 4. Time & Period Filter Toolbar -->
      ${periodFilterHtml}

      <!-- 5. Charts Row: Performance Trend Line + Status Donut -->
      <div class="charts-row" style="margin-bottom:28px;">
        <div class="chart-card chart-card-wide" style="border:2px solid var(--line);box-shadow:inset 0 0 0 2px var(--ink), 0 var(--px) 0 #000;background:var(--ink-2);">
          <div class="chart-card-header">
            <div>
              <div class="chart-card-title" style="font-family:var(--font-pixel);letter-spacing:0.06em;color:var(--cyan);">PERFORMANCE TREND (6 MONTHS)</div>
              <div class="chart-card-sub" style="font-family:var(--font-mono);">COMPARING ACTIVE VS COMPLETED JOBS</div>
            </div>
          </div>
          <div class="chart-wrap">
            <canvas id="chart-trend" height="230"></canvas>
          </div>
        </div>

        <div class="chart-card" style="border:2px solid var(--line);box-shadow:inset 0 0 0 2px var(--ink), 0 var(--px) 0 #000;background:var(--ink-2);">
          <div class="chart-card-header">
            <div>
              <div class="chart-card-title" style="font-family:var(--font-pixel);letter-spacing:0.06em;color:var(--yellow);">STATUS BREAKDOWN</div>
              <div class="chart-card-sub" style="font-family:var(--font-mono);">CURRENT PIPELINE ALLOCATION</div>
            </div>
          </div>
          <div class="chart-wrap chart-wrap-donut">
            <canvas id="chart-donut" height="200"></canvas>
          </div>
          <div class="donut-legend">
            ${STATUS_ORDER.map(s => `
              <div class="donut-legend-item">
                <span class="donut-legend-dot" style="background:${STATUS_CHART_COLORS[s].bg}"></span>
                <span style="font-family:var(--font-mono);">${STATUS_TH[s]}</span>
                <span class="donut-legend-count" style="font-family:var(--font-mono);">${statusCounts.find(x => x.status === s)?.count || 0}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- 6. Member Workload & Deepdive Section -->
      ${renderMemberComparisonHtml({
        memberStats: analytics.memberStats,
        teamTotals: analytics.teamTotals,
        selectedMemberId: filterState.memberId,
        selectedStatus: filterState.status,
        projects,
        filteredTasks: filtered
      })}

      <!-- 7. Activity + Deadlines Row -->
      <div class="dash-two-col" style="margin-top:24px;">
        <div class="chart-card" style="border:2px solid var(--line);background:var(--ink-2);box-shadow:0 var(--px) 0 #000;">
          <div class="chart-card-header">
            <div>
              <div class="chart-card-title" style="font-family:var(--font-pixel);color:#fff;">ความเคลื่อนไหวล่าสุด</div>
              <div class="chart-card-sub">งานที่กำลังดำเนินอยู่ในช่วงเวลานี้</div>
            </div>
            <a class="btn-pixel btn-pixel-dark" href="board.html" style="font-size:0.75rem;padding:6px 12px;">บอร์ด KANBAN →</a>
          </div>
          <div class="feed-list">${activityHtml}</div>
        </div>

        <div class="chart-card" style="border:2px solid var(--line);background:var(--ink-2);box-shadow:0 var(--px) 0 #000;">
          <div class="chart-card-header">
            <div>
              <div class="chart-card-title" style="font-family:var(--font-pixel);color:#fff;">กำหนดส่งใกล้มา</div>
              <div class="chart-card-sub">งานที่ต้องติดตามส่งมอบ</div>
            </div>
            <a class="btn-pixel btn-pixel-dark" href="calendar.html" style="font-size:0.75rem;padding:6px 12px;">ปฏิทิน →</a>
          </div>
          <div class="deadline-list">${deadlinesHtml}</div>
        </div>
      </div>

      <!-- 8. Urgent Tasks Grid -->
      <div class="chart-card" style="margin-top:24px;border:2px solid var(--line);background:var(--ink-2);box-shadow:0 var(--px) 0 #000;">
        <div class="chart-card-header">
          <div>
            <div class="chart-card-title" style="font-family:var(--font-pixel);color:var(--red);">งานที่ต้องจับตา</div>
            <div class="chart-card-sub">งานใกล้กำหนดส่งและรอความเห็น</div>
          </div>
          <a class="btn-pixel btn-pixel-dark" href="tasks.html" style="font-size:0.75rem;padding:6px 12px;">งานทั้งหมด →</a>
        </div>
        <div class="task-grid" style="grid-template-columns:repeat(auto-fill,minmax(290px,1fr))">
          ${dueSoon.slice(0, 3).map(task => taskCard(task, { projects, members, subtasks })).join("") || interactiveEmptyState({ title: "ไม่มีงานเร่งด่วนในช่วงนี้", subtitle: "งานทั้งหมดอยู่ในกำหนดส่งตามแผน", small: true })}
        </div>
      </div>
    `;

    /* ─────────── Event Bindings ─────────── */
    // Hero CTA button
    qs("#hero-create-btn")?.addEventListener("click", () => window.openCreateTask?.());

    // Feature card guide link
    qs("#feature-guide-link")?.addEventListener("click", (e) => {
      e.preventDefault();
      qs("#workflow-guide-link")?.click();
    });

    // Count-up animation on stats bar
    initCountUp();

    // Rotating news ticker announcement
    initNewsTicker();

    // Filter bar event handlers
    const bar = qs("#dash-filter-bar");
    if (bar) {
      bar.querySelectorAll(".dfb-chip").forEach(btn => {
        btn.addEventListener("click", () => {
          filterState.period = btn.dataset.period;
          filterState.startDate = "";
          filterState.endDate = "";
          draw();
        });
      });
      qs("#dfb-year")?.addEventListener("change", e => { filterState.year = e.target.value; draw(); });
      qs("#dfb-month")?.addEventListener("change", e => { filterState.month = e.target.value; draw(); });
      qs("#dfb-member")?.addEventListener("change", e => { filterState.memberId = e.target.value; draw(); });
      qs("#dfb-status")?.addEventListener("change", e => { filterState.status = e.target.value; draw(); });
      qs("#dfb-start")?.addEventListener("change", e => {
        filterState.startDate = e.target.value;
        filterState.period = "custom";
        draw();
      });
      qs("#dfb-end")?.addEventListener("change", e => {
        filterState.endDate = e.target.value;
        filterState.period = "custom";
        draw();
      });
      qs("#dfb-reset")?.addEventListener("click", () => {
        filterState.period = "all";
        filterState.year = "all";
        filterState.month = "all";
        filterState.specificDay = "";
        filterState.startDate = "";
        filterState.endDate = "";
        filterState.memberId = "all";
        filterState.status = "all";
        draw();
      });
    }

    // Bind Member Comparison drilldowns and actions
    bindMemberComparison(qs("#page-content"), {
      onSelectMember: (newMemberId) => {
        filterState.memberId = newMemberId;
        draw();
      },
      onSelectStatus: (newStatus) => {
        filterState.status = newStatus;
        draw();
      }
    });


    // Bind Task Cards
    bindTaskCards(ctx);

    /* ─────────── Chart.js Rendering ─────────── */
    window.setTimeout(() => {
      // 1) Line chart: trend
      destroyChart("trend");
      const trendCtx = document.getElementById("chart-trend");
      if (trendCtx) {
        _chartInstances["trend"] = new Chart(trendCtx, {
          type: "line",
          data: {
            labels: monthLabels,
            datasets: [
              {
                label: "COMPLETED",
                data: monthCompleted,
                borderColor: BRAND.green,
                backgroundColor: "rgba(43, 209, 75, 0.12)",
                fill: true,
                stepped: true,
                pointBackgroundColor: BRAND.green,
                pointBorderColor: BRAND.ink,
                pointRadius: 5,
                borderWidth: 3,
              },
              {
                label: "ACTIVE JOBS",
                data: monthActive,
                borderColor: BRAND.cyan,
                backgroundColor: "rgba(25, 195, 235, 0.12)",
                fill: true,
                stepped: true,
                pointBackgroundColor: BRAND.cyan,
                pointBorderColor: BRAND.ink,
                pointRadius: 5,
                borderWidth: 3,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: {
                position: "top",
                labels: {
                  font: { family: "Space Mono", size: 11 },
                  color: "#a8a8a8",
                  usePointStyle: true,
                  padding: 16
                }
              },
              tooltip: {
                backgroundColor: "#141414",
                titleColor: BRAND.yellow,
                bodyColor: "#f2f2f2",
                padding: 10,
                cornerRadius: 0,
                borderColor: "#3a3a3a",
                borderWidth: 1,
                titleFont: { family: "Space Mono" },
                bodyFont: { family: "Space Mono" },
              },
            },
            scales: {
              x: {
                grid: { color: "#222" },
                ticks: { color: "#777", font: { family: "Space Mono", size: 10 } }
              },
              y: {
                beginAtZero: true,
                grid: { color: "#222" },
                ticks: { color: "#777", font: { family: "Space Mono", size: 10 }, stepSize: 1 }
              },
            },
          },
        });
      }

      // 2) Donut chart: status distribution
      destroyChart("donut");
      const donutCtx = document.getElementById("chart-donut");
      if (donutCtx) {
        _chartInstances["donut"] = new Chart(donutCtx, {
          type: "doughnut",
          data: {
            labels: STATUS_ORDER.map(s => STATUS_TH[s]),
            datasets: [{
              data: STATUS_ORDER.map(s => statusCounts.find(x => x.status === s)?.count || 0),
              backgroundColor: STATUS_ORDER.map(s => STATUS_CHART_COLORS[s].bg),
              borderColor: BRAND.ink2,
              borderWidth: 3,
              hoverOffset: 6,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "64%",
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: "#141414",
                titleColor: "#fff",
                bodyColor: "#f2f2f2",
                padding: 10,
                cornerRadius: 0,
                borderColor: "#3a3a3a",
                borderWidth: 1,
              },
            },
          },
        });
      }
    }, 0);
  };

  draw();
}

/* ─────────────────────────────────────────────────────────────────────────
   Count-Up Animation (IntersectionObserver, 1.2s easeOut)
───────────────────────────────────────────────────────────────────────── */
function initCountUp() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".count-up-num").forEach(el => {
      const isPercent = el.dataset.isPercent === "true";
      el.textContent = isPercent ? `${el.dataset.final}%` : el.dataset.final;
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        observer.unobserve(el);
        const finalVal = parseFloat(el.dataset.final || "0");
        const isPercent = el.dataset.isPercent === "true";
        const duration = 1200;
        const startTime = performance.now();

        function step(now) {
          const progress = Math.min((now - startTime) / duration, 1);
          // easeOutQuad: 1 - (1 - progress) * (1 - progress)
          const ease = 1 - (1 - progress) * (1 - progress);
          const current = finalVal * ease;
          el.textContent = isPercent ? `${current.toFixed(1)}%` : Math.round(current).toLocaleString();
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            el.textContent = isPercent ? `${finalVal.toFixed(1)}%` : Math.round(finalVal).toLocaleString();
          }
        }
        requestAnimationFrame(step);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll(".count-up-num").forEach(el => observer.observe(el));
}

/* ─────────────────────────────────────────────────────────────────────────
   Rotating News Ticker
───────────────────────────────────────────────────────────────────────── */
function initNewsTicker() {
  const el = qs("#news-ticker-text");
  if (!el) return;

  const announcements = [
    "CONT 2.0 PIXEL WORKFLOW ENGINE IS ONLINE — REAL-TIME SPRINT DISPATCH & REVISION TRACKING",
    "NEW: SMART WORKLOAD DRILLDOWN ACTIVE — ANALYZE DESIGN CAPACITY & REVISION CYCLES",
    "REMINDER: SLA REVIEW CYCLE ACTIVE — PLEASE APPROVE OR REQUEST REVISIONS WITHIN 24 HOURS",
    "KKP BRAND GUIDELINES UPDATED — NEW SOCIAL MEDIA BANNER PRESETS AVAILABLE IN TEMPLATES"
  ];

  let idx = 0;
  window.setInterval(() => {
    idx = (idx + 1) % announcements.length;
    el.style.opacity = "0";
    setTimeout(() => {
      el.textContent = announcements[idx];
      el.style.opacity = "1";
    }, 250);
  }, 6000);
}
