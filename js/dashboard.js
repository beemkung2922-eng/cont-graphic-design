import { taskCard, interactiveEmptyState, formatDate, relativeDeadline, avatar, escapeHtml, roleLabel, memberFor, projectFor } from "./formatters.js";
import { STATUS_LABELS, STATUS_ORDER } from "./constants.js";
import { qs, toast } from "./app.js";
import { openCreateTask, bindTaskCards } from "./task-actions.js";
import { isRequester, isViewer, canCreateTask } from "./auth.js";
import { filterTasksByTimeRange, getTaskDate, MONTH_NAMES_TH } from "./analytics.js";

/* ─────────────────────────────────────────────────────────────────────────
   Brand palette (exact hex codes from CI)
───────────────────────────────────────────────────────────────────────── */
const BRAND = {
  legacyPurple: "#594F74",
  royalPurple: "#615B99",
  grandeurGrey: "#ADACB9",
  grandeurGreyLite: "#E7E7ED",
  cyan: "#00A3D9",
  magenta: "#E6007E",
  orange: "#F05A28",
  lime: "#8DC63F",
  violet: "#7F00FF",
  darkSlate: "#3D3550",
  mintNeon: "#00F0B5",
  darkNavy: "#112347",
};

const STATUS_CHART_COLORS = {
  brief:     { bg: "#ADACB9", border: "#8f8ca0" },
  drafting:  { bg: "#615B99", border: "#4d4880" },
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

    /* ── KPI Cards (Sleek Taskio / Messaging style) ── */
    const kpiCards = [
      { label: "งานในกระบวนการ (Active)", value: active.length, trend: "+8%", isDown: false, icon: "⚡" },
      { label: "งานทั้งหมดในระบบ", value: filtered.length, trend: "+12%", isDown: false, icon: "📋" },
      { label: "รอตรวจคอมเมนต์ (Review)", value: review.length, trend: review.length > 0 ? `${review.length}` : "0", isDown: false, icon: "🔍" },
      { label: "ส่งมอบงานสำเร็จ (Done)", value: completed.length, trend: "+24%", isDown: false, icon: "✅" },
    ].map(k => `
      <div class="kpi-card">
        <div class="kpi-top-row">
          <div class="kpi-icon">${k.icon}</div>
          <div class="kpi-trend ${k.isDown ? "is-down" : ""}">${k.trend}</div>
        </div>
        <div class="kpi-body">
          <div class="kpi-value">${k.value}</div>
          <div class="kpi-label">${k.label}</div>
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

    /* ── Activity feed ── */
    const activityHtml = active.slice(0, 6).map(task => {
      const member = memberFor(task, members);
      const project = projectFor(task, projects);
      const urgency = relativeDeadline(task.deadline_at || task.deadline);
      const dotColor = STATUS_CHART_COLORS[task.status]?.bg || "#adacb9";
      return `
        <div class="feed-item">
          <div class="feed-dot" style="background:${dotColor}"></div>
          <div class="feed-body">
            <div class="feed-title"><a href="task.html?id=${encodeURIComponent(task.id)}">${escapeHtml(task.title)}</a></div>
            <div class="feed-meta">
              ${avatar(member, 20)}
              <span>${escapeHtml(member?.name || "—")}</span>
              <span class="feed-dot-sep">·</span>
              <span>${escapeHtml(project?.name || "—")}</span>
              <span class="feed-dot-sep">·</span>
              <span class="badge ${urgency.className === "is-overdue" ? "badge-danger" : urgency.className ? "badge-warn" : "badge-neutral"}" style="font-size:0.68rem">${escapeHtml(STATUS_TH[task.status])}</span>
            </div>
          </div>
          <div class="feed-right">
            <div class="text-xs text-muted">${formatDate(task.deadline_at || task.deadline)}</div>
          </div>
        </div>
      `;
    }).join("") || `<div class="state-empty">ไม่มีงาน Active ในช่วงเวลานี้</div>`;

    /* ── Upcoming deadlines ── */
    const deadlinesHtml = [...filtered]
      .filter(t => t.status !== "completed")
      .sort((a, b) => String(a.deadline_at || a.deadline).localeCompare(String(b.deadline_at || b.deadline)))
      .slice(0, 6)
      .map(task => {
        const project = projectFor(task, projects);
        const member = memberFor(task, members);
        const date = task.deadline_at ? new Date(task.deadline_at) : task.deadline ? new Date(`${task.deadline}T12:00:00`) : null;
        const urgency = relativeDeadline(task.deadline_at || task.deadline);
        return `
          <div class="deadline-row">
            <div class="deadline-date-block">
              <span class="dl-day">${date ? date.getDate() : "—"}</span>
              <span class="dl-month">${date ? date.toLocaleDateString("th-TH", { month: "short" }) : "—"}</span>
            </div>
            <div class="deadline-info">
              <div class="deadline-task-name"><a href="task.html?id=${encodeURIComponent(task.id)}">${escapeHtml(task.title)}</a></div>
              <div class="deadline-task-sub">${escapeHtml(project?.name || "—")} · ${escapeHtml(member?.name || "—")}</div>
            </div>
            <span class="badge ${urgency.className === "is-overdue" ? "badge-danger" : urgency.className ? "badge-warn" : "badge-ok"}">${escapeHtml(urgency.label)}</span>
          </div>
        `;
      }).join("") || `<div class="state-empty">ไม่มี deadline ที่ต้องติดตาม</div>`;

    /* ─────────── Render HTML ─────────── */
    qs("#page-content").innerHTML = `
      <div class="dash-header">
        <div>
          <h2 class="dash-title">ภาพรวมคิวงาน & สถิติทีม</h2>
          <p class="dash-sub">วิเคราะห์ Workflow · กำหนดส่ง · เปรียบเทียบภาระงานของทีม</p>
        </div>
        <div class="row-wrap" style="gap:8px">
          <span class="chip">อัปเดต ${new Intl.DateTimeFormat("th-TH",{hour:"2-digit",minute:"2-digit"}).format(new Date())}</span>
          ${createBtnHtml}
        </div>
      </div>

      ${periodFilterHtml}

      <!-- KPI Cards -->
      <div class="kpi-grid">${kpiCards}</div>

      <!-- Charts Row: Line + Donut -->
      <div class="charts-row">
        <div class="chart-card chart-card-wide">
          <div class="chart-card-header">
            <div>
              <div class="chart-card-title">แนวโน้มงาน 6 เดือน</div>
              <div class="chart-card-sub">เปรียบเทียบงาน Active vs ส่งมอบแล้ว รายเดือน</div>
            </div>
          </div>
          <div class="chart-wrap">
            <canvas id="chart-trend" height="220"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <div class="chart-card-header">
            <div>
              <div class="chart-card-title">สัดส่วนสถานะงาน</div>
              <div class="chart-card-sub">งานในช่วงเวลาที่กรอง</div>
            </div>
          </div>
          <div class="chart-wrap chart-wrap-donut">
            <canvas id="chart-donut" height="220"></canvas>
          </div>
          <div class="donut-legend">
            ${STATUS_ORDER.map(s => `
              <div class="donut-legend-item">
                <span class="donut-legend-dot" style="background:${STATUS_CHART_COLORS[s].bg}"></span>
                <span>${STATUS_TH[s]}</span>
                <span class="donut-legend-count">${statusCounts.find(x => x.status === s)?.count || 0}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- Member Comparison Bar Chart -->
      <div class="chart-card" style="margin-bottom:18px">
        <div class="chart-card-header">
          <div>
            <div class="chart-card-title">เปรียบเทียบภาระงานรายคน</div>
            <div class="chart-card-sub">จำนวนงาน Active และส่งมอบแล้ว แยกตามสมาชิกทีม</div>
          </div>
          <a class="btn btn-ghost btn-sm" href="team.html">ดูทีมทั้งหมด →</a>
        </div>
        <div class="chart-wrap" style="height:260px">
          <canvas id="chart-members" height="260"></canvas>
        </div>
      </div>

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
    bindTaskCards(qs("#page-content"));

    /* ─────────── Render Charts ─────────── */
    setTimeout(() => {
      // 1) Line chart: 6-month trend
      destroyChart("trend");
      const trendCtx = document.getElementById("chart-trend");
      if (trendCtx) {
        // Create glowing gradient for Active tasks
        const ctx = trendCtx.getContext("2d");
        const activeGradient = ctx.createLinearGradient(0, 0, 0, 220);
        activeGradient.addColorStop(0, "rgba(127, 0, 255, 0.4)");
        activeGradient.addColorStop(1, "rgba(127, 0, 255, 0.0)");

        const completedGradient = ctx.createLinearGradient(0, 0, 0, 220);
        completedGradient.addColorStop(0, "rgba(141, 198, 63, 0.2)");
        completedGradient.addColorStop(1, "rgba(141, 198, 63, 0.0)");

        _chartInstances["trend"] = new Chart(trendCtx, {
          type: "line",
          data: {
            labels: monthLabels,
            datasets: [
              {
                label: "ส่งมอบแล้ว",
                data: monthCompleted,
                borderColor: BRAND.lime,
                backgroundColor: completedGradient,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: BRAND.lime,
                pointBorderColor: "#151321",
                pointRadius: 5,
                pointHoverRadius: 7,
                borderWidth: 2.5,
              },
              {
                label: "งาน Active",
                data: monthActive,
                borderColor: BRAND.violet, // Use bright violet for the line
                backgroundColor: activeGradient,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: BRAND.violet,
                pointBorderColor: "#151321",
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
              legend: { position: "top", labels: { font: { family: "IBM Plex Sans Thai", size: 12 }, color: "#a19eac", usePointStyle: true, padding: 16 } },
              tooltip: { backgroundColor: "#1d1a2c", titleColor: "#fff", bodyColor: "#eae8f2", padding: 12, cornerRadius: 8, borderColor: "#2a263e", borderWidth: 1 },
            },
            scales: {
              x: { grid: { display: false }, ticks: { color: "#7e7b89", font: { family: "IBM Plex Sans Thai", size: 11 } } },
              y: { beginAtZero: true, grid: { color: "#211e2f" }, border: { display: false }, ticks: { color: "#7e7b89", font: { family: "IBM Plex Sans Thai", size: 11 }, stepSize: 1 } },
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
