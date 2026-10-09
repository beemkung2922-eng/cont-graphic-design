import { taskCard, interactiveEmptyState, formatDate, relativeDeadline, avatar, escapeHtml, roleLabel, memberFor, projectFor } from "./formatters.js";
import { STATUS_LABELS, STATUS_ORDER } from "./constants.js";
import { qs, toast } from "./app.js";
import { openCreateTask, bindTaskCards } from "./task-actions.js";
import { isRequester, isViewer, canCreateTask } from "./auth.js";
import { filterTasksByTimeRange, getTaskDate, MONTH_NAMES_TH, calculateTeamAnalytics, renderMemberComparisonHtml, bindMemberComparison } from "./analytics.js";

/* ─────────────────────────────────────────────────────────────────────────
   Brand palette (KKP Purple Palette from user request)
───────────────────────────────────────────────────────────────────────── */
const BRAND = {
  primary: "#544c70",      // --kkp-purple
  deep: "#3f3a56",         // --kkp-purple-deep
  soft: "#6e6790",         // --kkp-purple-soft
  purple300: "#bdb7d1",    // --purple-300
  purple200: "#d9d5e6",    // --purple-200
  purple100: "#eceaf3",    // --purple-100
  purple50: "#f6f5f9",     // --purple-50
  cyan: "#00A3D9",
  magenta: "#E6007E",
  orange: "#F05A28",
  lime: "#8DC63F",
  violet: "#7F00FF",
  mintNeon: "#00F0B5",
};

const STATUS_CHART_COLORS = {
  brief:     { bg: "#bdb7d1", border: "#8f8ca0" },
  drafting:  { bg: "#544c70", border: "#3f3a56" },
  review:    { bg: "#F05A28", border: "#c44016" },
  revision:  { bg: "#E6007E", border: "#b3005f" },
  completed: { bg: "#8DC63F", border: "#6a9f2a" },
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
    const myTasks   = filtered.filter(t =>
      (t.assignee_id === ctx.member?.id || (isReq && t.created_by === ctx.member?.id))
      && t.status !== "completed"
    );
    const lateCount = active.filter(t => relativeDeadline(t.deadline_at || t.deadline).className === "is-overdue").length;

    const createBtnHtml = canCreate
      ? `<button class="btn btn-primary" id="dashboard-create">${isReq ? "＋ ส่งคำของาน" : "＋ สร้างงานใหม่"}</button>`
      : "";

    /* ── Build years list for year selector ── */
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

    /* ── KPI Cards (UrbanRail Live Telemetry style) ── */
    const onTimeRate = filtered.length ? ((completed.length / filtered.length) * 100).toFixed(1) : "100.0";
    const kpiCards = [
      { label: "TRAINS RUNNING (ACTIVE)", value: active.length, trend: "NORMAL", isDown: false, icon: "⚡", isAmber: false },
      { label: "LINES ACTIVE (TOTAL)", value: filtered.length, trend: "+12%", isDown: false, icon: "☷", isAmber: false },
      { label: "INSPECTION / REVIEWS", value: review.length, trend: "PENDING", isDown: review.length > 3, icon: "⚠", isAmber: review.length > 0 },
      { label: "ON-TIME PERFORMANCE", value: `${onTimeRate}%`, trend: "98.4%", isDown: false, icon: "✦", isAmber: true },
    ].map(k => `
      <div class="kpi-card" style="font-family:var(--font-mono);">
        <div class="kpi-top-row">
          <div class="kpi-icon" style="color:${k.isAmber ? "#e59324" : "#10b981"};">${k.icon}</div>
          <div class="kpi-trend ${k.isDown ? "is-down" : ""}" style="${k.isAmber ? "background:rgba(229,147,36,0.12);color:#e59324;" : ""}">${k.trend}</div>
        </div>
        <div class="kpi-body">
          <div class="kpi-value" style="font-family:var(--font-flap);font-size:2.2rem;letter-spacing:0.04em;color:${k.isAmber ? "#e59324" : "#ffffff"};">${k.value}</div>
          <div class="kpi-label" style="font-family:var(--font-mono);letter-spacing:0.08em;text-transform:uppercase;">${k.label}</div>
        </div>
      </div>
    `).join("");

    /* ── Build monthly trend data for line chart ── */
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

    /* ── Split-Flap Helper Functions ── */
    const renderFlapWord = (text, isAmber = false) => {
      return text.toUpperCase().split("").map(ch => {
        if (ch === " ") return `<span class="flap-char is-space"></span>`;
        return `<span class="flap-char ${isAmber ? "is-amber" : ""}">${escapeHtml(ch)}</span>`;
      }).join("");
    };

    const renderFlapMini = (text, colorClass = "") => {
      return text.toUpperCase().split("").map(ch => {
        return `<span class="flap-mini ${colorClass}">${escapeHtml(ch)}</span>`;
      }).join("");
    };

    /* ── Live Departures Board Rows (Flight/Rail Timetable Style) ── */
    const departureRows = filtered.slice(0, 8).map(task => {
      const member = memberFor(task, members);
      const project = projectFor(task, projects);
      const d = getTaskDate(task, "deadline");
      const timeStr = d ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "09:00";
      
      let statusText = "ON TIME";
      let statusClass = "on-time";
      let statusColor = "is-green";
      
      if (task.status === "revision") {
        statusText = "REVISION";
        statusClass = "cancelled";
        statusColor = "is-red";
      } else if (relativeDeadline(task.deadline_at || task.deadline).className === "is-overdue") {
        statusText = "DELAYED";
        statusClass = "delayed";
        statusColor = "is-amber";
      } else if (task.status === "review") {
        statusText = "IN REVIEW";
        statusClass = "delayed";
        statusColor = "is-amber";
      } else if (task.status === "completed") {
        statusText = "DELIVERED";
        statusClass = "on-time";
        statusColor = "is-green";
      }

      const platformCode = String(task.item_count || 1).padStart(2, "0");
      const trackCode = task.status === "drafting" ? "A" : task.status === "review" ? "B" : "C";

      return `
        <tr>
          <td><span class="flap-cell">${renderFlapMini(timeStr, "is-amber")}</span></td>
          <td><strong style="color:#ffffff;"><a href="task.html?id=${encodeURIComponent(task.id)}" style="color:inherit;text-decoration:none;">${escapeHtml(task.title.slice(0, 24))}</a></strong></td>
          <td><span style="color:#8c90a1;">${escapeHtml(project?.name?.slice(0, 16) || "GENERAL")}</span></td>
          <td><span class="flap-cell">${renderFlapMini(platformCode)}</span></td>
          <td>
            <span class="status-rail-pill ${statusClass}">
              <span class="flap-cell">${renderFlapMini(statusText, statusColor)}</span>
            </span>
          </td>
          <td><span class="flap-cell">${renderFlapMini(trackCode)}</span></td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="6" style="text-align:center;padding:24px;color:#515463;">NO ACTIVE SCHEDULED TRAINS / TASKS</td></tr>`;

    /* ── Split-flap Hero Banner HTML ── */
    const flapHeroHtml = `
      <div class="flap-hero-board">
        <div class="flap-headline-container">
          <div class="flap-text-row">
            ${renderFlapWord("ONE BOARD.")}
          </div>
          <div class="flap-text-row">
            ${renderFlapWord("EVERY JOURNEY.")}
          </div>
          <div class="flap-text-row">
            ${renderFlapWord("STAY INFORMED.", true)}
          </div>
        </div>
        <div class="flap-subtext">
          CONT OPERATIONS CLOUD UNIFIES LIVE DATA, ALERTS, AND WORKFLOW ANALYTICS SO DESIGN TEAMS CAN KEEP PROJECTS MOVING AND CLIENTS INFORMED.
        </div>
        <div class="flap-action-bar">
          ${canCreate ? `<button class="btn-rail-amber" id="flap-create-btn"><span>⚡ REQUEST ACCESS / CREATE TASK</span> <span>›</span></button>` : ""}
          <a class="btn-rail-dark" href="board.html"><span>SEE LIVE BOARD</span> <span>☷</span></a>
        </div>
      </div>
    `;

    /* ── Live Departures Timetable Card HTML ── */
    const departuresBoardHtml = `
      <div class="departures-board-card">
        <div class="departures-header">
          <div class="departures-title">
            <span>LIVE DISPATCH & WORKFLOW DEPARTURES</span>
            <div class="led-bar">
              <span class="led-pip is-on"></span>
              <span class="led-pip is-on"></span>
              <span class="led-pip is-on"></span>
              <span class="led-pip is-amber"></span>
            </div>
          </div>
          <a href="board.html" class="btn-rail-dark" style="padding:4px 10px;font-size:0.75rem;">VIEW FULL BOARD ☷</a>
        </div>
        <div class="departures-table-wrap">
          <table class="departures-table">
            <thead>
              <tr>
                <th style="width:90px;">TIME</th>
                <th>WORKFLOW / TASK DESTINATION</th>
                <th>PROJECT</th>
                <th style="width:80px;">ITEMS</th>
                <th style="width:160px;">STATUS</th>
                <th style="width:70px;">TRACK</th>
              </tr>
            </thead>
            <tbody>
              ${departureRows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    /* ─────────── Render HTML ─────────── */
    qs("#page-content").innerHTML = `
      <div class="dash-header">
        <div>
          <h2 class="dash-title" style="font-family:var(--font-mono);letter-spacing:0.12em;text-transform:uppercase;color:#f1f2f6;">
            URBANRAIL · OPERATIONS CONTROL CLOUD
          </h2>
          <p class="dash-sub" style="font-family:var(--font-mono);letter-spacing:0.06em;color:#8c90a1;">
            REAL-TIME WORKFLOW DISPATCH · TIMETABLES · TEAM PERFORMANCE METRICS
          </p>
        </div>
        <div class="row-wrap" style="gap:8px">
          <span class="chip" style="font-family:var(--font-mono);background:#16181f;border:1px solid #292b36;color:#e59324;">
            ● LIVE FEED: ${new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit"}).format(new Date())}
          </span>
          ${createBtnHtml}
        </div>
      </div>

      <!-- Split-Flap Destination Hero Banner -->
      ${flapHeroHtml}

      <!-- Time & Period Filter Toolbar -->
      ${periodFilterHtml}

      <!-- Live Network KPI Cards -->
      <div class="kpi-grid">${kpiCards}</div>

      <!-- Live Dispatch Timetable (Airport / Train Station Departures) -->
      ${departuresBoardHtml}

      <!-- Charts Row: Line + Donut -->
      <div class="charts-row">
        <div class="chart-card chart-card-wide">
          <div class="chart-card-header">
            <div>
              <div class="chart-card-title" style="font-family:var(--font-mono);letter-spacing:0.08em;">PERFORMANCE TREND (6 MONTHS)</div>
              <div class="chart-card-sub">COMPARING ACTIVE VS DELIVERED CREATIVE TRAINS</div>
            </div>
          </div>
          <div class="chart-wrap">
            <canvas id="chart-trend" height="220"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-card-header">
            <div>
              <div class="chart-card-title" style="font-family:var(--font-mono);letter-spacing:0.08em;">STATUS BREAKDOWN & SIGNALS</div>
              <div class="chart-card-sub">CURRENT ROUTE ALLOCATION</div>
            </div>
          </div>
          <div class="chart-wrap chart-wrap-donut">
            <canvas id="chart-donut" height="220"></canvas>
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

      <!-- Member Workload & Deepdive Section -->
      ${renderMemberComparisonHtml({
        memberStats: analytics.memberStats,
        teamTotals: analytics.teamTotals,
        selectedMemberId: filterState.memberId,
        selectedStatus: filterState.status,
        projects,
        filteredTasks: filtered
      })}

      <!-- Activity + Deadlines -->
      <div class="dash-two-col">
        <div class="chart-card">
          <div class="chart-card-header">
            <div>
              <div class="chart-card-title">ความเคลื่อนไหวล่าสุด</div>
              <div class="chart-card-sub">งานที่กำลังดำเนินอยู่ในช่วงเวลานี้</div>
            </div>
            <a class="btn btn-ghost btn-sm" href="board.html">บอร์ด Kanban →</a>
          </div>
          <div class="feed-list">${activityHtml}</div>
        </div>
        <div class="chart-card">
          <div class="chart-card-header">
            <div>
              <div class="chart-card-title">กำหนดส่งใกล้มา</div>
              <div class="chart-card-sub">งานที่ต้องติดตามส่งมอบ</div>
            </div>
            <a class="btn btn-ghost btn-sm" href="calendar.html">ปฏิทิน →</a>
          </div>
          <div class="deadline-list">${deadlinesHtml}</div>
        </div>
      </div>

      <!-- Urgent Tasks -->
      <div class="chart-card" style="margin-top:0">
        <div class="chart-card-header">
          <div>
            <div class="chart-card-title">งานที่ต้องจับตา</div>
            <div class="chart-card-sub">งานใกล้กำหนดส่งและรอความเห็น</div>
          </div>
          <a class="btn btn-ghost btn-sm" href="tasks.html">งานทั้งหมด →</a>
        </div>
        <div class="task-grid" style="grid-template-columns:repeat(auto-fill,minmax(290px,1fr))">
          ${dueSoon.slice(0, 3).map(task => taskCard(task, { projects, members, subtasks })).join("") || interactiveEmptyState({ title: "ไม่มีงานเร่งด่วนในช่วงนี้", subtitle: "งานทั้งหมดอยู่ในกำหนดส่งตามแผน", small: true })}
        </div>
      </div>
    `;

    /* ─────────── Bind filter events ─────────── */
    const bar = qs("#dash-filter-bar");

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
      if (filterState.startDate || filterState.endDate) filterState.period = "custom";
      draw();
    });
    qs("#dfb-end")?.addEventListener("change", e => {
      filterState.endDate = e.target.value;
      if (filterState.startDate || filterState.endDate) filterState.period = "custom";
      draw();
    });
    qs("#dfb-reset")?.addEventListener("click", () => {
      Object.assign(filterState, { period:"all", year:"all", month:"all", specificDay:"", startDate:"", endDate:"", memberId:"all", status:"all" });
      draw();
    });

    qs("#dashboard-create")?.addEventListener("click", () => openCreateTask(ctx));
    qs("#flap-create-btn")?.addEventListener("click", () => openCreateTask(ctx));
    bindTaskCards(qs("#page-content"));
    bindMemberComparison(qs("#page-content"), {
      onSelectMember: (memberId) => {
        filterState.memberId = memberId;
        draw();
      },
      onSelectStatus: (statusKey) => {
        filterState.status = filterState.status === statusKey ? "all" : statusKey;
        draw();
      }
    });

    /* ─────────── Render Charts ─────────── */
    setTimeout(() => {
      // 1) Line chart: 6-month trend
      destroyChart("trend");
      const trendCtx = document.getElementById("chart-trend");
      if (trendCtx) {
        // Create UrbanRail amber / purple glowing gradient for Active tasks
        const ctx = trendCtx.getContext("2d");
        const activeGradient = ctx.createLinearGradient(0, 0, 0, 220);
        activeGradient.addColorStop(0, "rgba(229, 147, 36, 0.35)");
        activeGradient.addColorStop(1, "rgba(229, 147, 36, 0.0)");

        const completedGradient = ctx.createLinearGradient(0, 0, 0, 220);
        completedGradient.addColorStop(0, "rgba(84, 76, 112, 0.35)");
        completedGradient.addColorStop(1, "rgba(84, 76, 112, 0.0)");

        _chartInstances["trend"] = new Chart(trendCtx, {
          type: "line",
          data: {
            labels: monthLabels,
            datasets: [
              {
                label: "DELIVERED (ON TIME)",
                data: monthCompleted,
                borderColor: "#544c70",
                backgroundColor: completedGradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: "#544c70",
                pointBorderColor: "#15161b",
                pointRadius: 5,
                pointHoverRadius: 7,
                borderWidth: 2.5,
              },
              {
                label: "RUNNING TRAINS / ACTIVE",
                data: monthActive,
                borderColor: "#e59324",
                backgroundColor: activeGradient,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: "#e59324",
                pointBorderColor: "#ffffff",
                pointRadius: 5,
                pointHoverRadius: 7,
                borderWidth: 3,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: { position: "top", labels: { font: { family: "Share Tech Mono, IBM Plex Sans Thai", size: 11 }, color: "#8c90a1", usePointStyle: true, padding: 16 } },
              tooltip: { backgroundColor: "#15161b", titleColor: "#e59324", bodyColor: "#d6d8e1", padding: 12, cornerRadius: 4, borderColor: "#282a32", borderWidth: 1 },
            },
            scales: {
              x: { grid: { display: false }, ticks: { color: "#6a6e7f", font: { family: "Share Tech Mono", size: 11 } } },
              y: { beginAtZero: true, grid: { color: "#1f2129" }, border: { display: false }, ticks: { color: "#6a6e7f", font: { family: "Share Tech Mono", size: 11 }, stepSize: 1 } },
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
              borderColor: "#151321", // Match card surface background
              borderWidth: 3,
              hoverOffset: 8,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%", // slightly thinner donut looks more modern
            plugins: {
              legend: { display: false },
              tooltip: { backgroundColor: "#1d1a2c", titleColor: "#fff", bodyColor: "#eae8f2", padding: 12, cornerRadius: 8, borderColor: "#2a263e", borderWidth: 1 },
            },
          },
        });
      }

      // 3) Bar chart: member workload
      destroyChart("members");
      const membersCtx = document.getElementById("chart-members");
      if (membersCtx && memberWorkload.length > 0) {
        _chartInstances["members"] = new Chart(membersCtx, {
          type: "bar",
          data: {
            labels: memberWorkload.map(m => m.name),
            datasets: [
              {
                label: "Active",
                data: memberWorkload.map(m => m.active),
                backgroundColor: BRAND.violet,
                borderRadius: 4,
              },
              {
                label: "ส่งมอบแล้ว",
                data: memberWorkload.map(m => m.completed),
                backgroundColor: BRAND.lime,
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: { position: "top", labels: { font: { family: "IBM Plex Sans Thai", size: 12 }, color: "#a19eac", usePointStyle: true, padding: 16 } },
              tooltip: { backgroundColor: "#1d1a2c", titleColor: "#fff", bodyColor: "#eae8f2", padding: 12, cornerRadius: 8, borderColor: "#2a263e", borderWidth: 1 },
            },
            scales: {
              x: { grid: { display: false }, ticks: { color: "#7e7b89", font: { family: "IBM Plex Sans Thai", size: 11 } } },
              y: { beginAtZero: true, grid: { color: "#211e2f" }, border: { display: false }, ticks: { color: "#7e7b89", font: { family: "IBM Plex Sans Thai", size: 11 }, stepSize: 1 } },
            },
          },
        });
      } else if (membersCtx) {
        membersCtx.parentElement.innerHTML = `<div class="state-empty">ยังไม่มีข้อมูลสมาชิกทีมในช่วงเวลานี้</div>`;
      }
    }, 0);
  };

  draw();
}
