import { escapeHtml, avatar, roleLabel, formatDateTime, formatDate, statusBadge, projectFor } from "./formatters.js";
import { STATUS_LABELS, STATUS_ORDER } from "./constants.js";

export const MONTH_NAMES_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export const STATUS_COLORS = {
  brief: { color: "var(--status-brief, #adacb9)", label: "รอรับบรีฟ", hex: "#adacb9" },
  drafting: { color: "var(--status-drafting, #615b99)", label: "กำลังดราฟต์", hex: "#615b99" },
  review: { color: "var(--status-review, #f25c2b)", label: "รอคอมเมนต์", hex: "#f25c2b" },
  revision: { color: "var(--status-revision, #e6007e)", label: "แก้ไขงาน", hex: "#e6007e" },
  completed: { color: "var(--status-completed, #8cc63f)", label: "ส่งมอบสำเร็จ", hex: "#8cc63f" },
};

/**
 * Extracts a comparable Date object from a task
 */
export function getTaskDate(task, dateField = "created_at") {
  if (dateField === "deadline") {
    if (task.deadline_at) return new Date(task.deadline_at);
    if (task.deadline) return new Date(`${task.deadline}T12:00:00`);
    if (task.created_at) return new Date(task.created_at);
    return null;
  }
  // created_at or default
  if (task.created_at) return new Date(task.created_at);
  if (task.deadline_at) return new Date(task.deadline_at);
  if (task.deadline) return new Date(`${task.deadline}T12:00:00`);
  return null;
}

/**
 * Filters tasks by Date, Month, Year, Custom Range, Member, and Status
 */
export function filterTasksByTimeRange(tasks, filter = {}) {
  const {
    period = "all", // "all" | "today" | "7days" | "month" | "year" | "specific_day" | "custom"
    year = "all",
    month = "all",
    specificDay = "",
    startDate = "",
    endDate = "",
    dateField = "created_at", // "created_at" | "deadline"
    memberId = "all", // "all" | uuid
    status = "all", // "all" | status key
  } = filter;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  return tasks.filter((task) => {
    // 1. Member filter
    if (memberId && memberId !== "all" && task.assignee_id !== memberId) {
      return false;
    }

    // 2. Status filter
    if (status && status !== "all" && task.status !== status) {
      return false;
    }

    // 3. Date filter
    const taskDate = getTaskDate(task, dateField);
    if (!taskDate || isNaN(taskDate.getTime())) {
      return period === "all" && year === "all" && month === "all";
    }

    const taskDateStr = taskDate.toISOString().slice(0, 10);
    const taskYear = taskDate.getFullYear();
    const taskMonth = taskDate.getMonth() + 1; // 1-12

    // Quick periods
    if (period === "today") {
      return taskDateStr === todayStr;
    }

    if (period === "7days") {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      return taskDate >= sevenDaysAgo && taskDate <= now;
    }

    if (period === "month") {
      const targetYear = year !== "all" ? Number(year) : now.getFullYear();
      const targetMonth = month !== "all" ? Number(month) : now.getMonth() + 1;
      return taskYear === targetYear && taskMonth === targetMonth;
    }

    if (period === "year") {
      const targetYear = year !== "all" ? Number(year) : now.getFullYear();
      return taskYear === targetYear;
    }

    if (period === "specific_day") {
      if (!specificDay) return true;
      return taskDateStr === specificDay;
    }

    if (period === "custom") {
      if (startDate && taskDateStr < startDate) return false;
      if (endDate && taskDateStr > endDate) return false;
      return true;
    }

    // "all" period with specific dropdown overrides
    if (year !== "all" && taskYear !== Number(year)) return false;
    if (month !== "all" && taskMonth !== Number(month)) return false;

    return true;
  });
}

/**
 * Computes workload and status statistics per member and overall
 */
export function calculateTeamAnalytics(tasks, members, selectedMemberId = "all") {
  const designMembers = members.filter((m) =>
    ["designer", "supervisor", "admin"].includes(m.role)
  );

  const memberStats = designMembers.map((member) => {
    const memberTasks = tasks.filter((t) => t.assignee_id === member.id);
    const total = memberTasks.length;
    const items = memberTasks.reduce((acc, t) => acc + Number(t.item_count || 1), 0);
    const revisions = memberTasks.reduce((acc, t) => acc + Number(t.revision_count || 0), 0);

    const statusCounts = {
      brief: memberTasks.filter((t) => t.status === "brief").length,
      drafting: memberTasks.filter((t) => t.status === "drafting").length,
      review: memberTasks.filter((t) => t.status === "review").length,
      revision: memberTasks.filter((t) => t.status === "revision").length,
      completed: memberTasks.filter((t) => t.status === "completed").length,
    };

    const completed = statusCounts.completed;
    const active = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      member,
      tasks: memberTasks,
      total,
      items,
      revisions,
      avgRevision: total > 0 ? (revisions / total).toFixed(1) : "0.0",
      statusCounts,
      completed,
      active,
      completionRate
    };
  });

  const teamTotals = {
    totalTasks: tasks.length,
    totalItems: tasks.reduce((acc, t) => acc + Number(t.item_count || 1), 0),
    totalCompleted: tasks.filter((t) => t.status === "completed").length,
    totalActive: tasks.filter((t) => t.status !== "completed").length,
    totalReview: tasks.filter((t) => t.status === "review").length,
    totalRevision: tasks.filter((t) => t.status === "revision").length,
    statusCounts: {
      brief: tasks.filter((t) => t.status === "brief").length,
      drafting: tasks.filter((t) => t.status === "drafting").length,
      review: tasks.filter((t) => t.status === "review").length,
      revision: tasks.filter((t) => t.status === "revision").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }
  };

  return { memberStats, teamTotals };
}

/**
 * Generates human-friendly summary text for active date filter
 */
export function getFilterSummaryLabel(filter, matchCount = 0) {
  const { period = "all", year = "all", month = "all", specificDay = "", startDate = "", endDate = "" } = filter;

  let label = "งานทั้งหมด";
  if (period === "today") label = "งานของวันนี้";
  else if (period === "7days") label = "งาน 7 วันล่าสุด";
  else if (period === "month") {
    const mName = month !== "all" ? MONTH_NAMES_TH[Number(month) - 1] : "เดือนนี้";
    const yName = year !== "all" ? year : "ปีนี้";
    label = `${mName} ${yName}`;
  } else if (period === "year") {
    label = `ปี ${year !== "all" ? year : new Date().getFullYear()}`;
  } else if (period === "specific_day" && specificDay) {
    label = `วันที่ ${formatDate(specificDay)}`;
  } else if (period === "custom" && (startDate || endDate)) {
    label = `${startDate ? formatDate(startDate) : "เริ่ม"} — ${endDate ? formatDate(endDate) : "ปัจจุบัน"}`;
  } else if (year !== "all" || month !== "all") {
    const mStr = month !== "all" ? MONTH_NAMES_TH[Number(month) - 1] : "";
    const yStr = year !== "all" ? `ปี ${year}` : "";
    label = [mStr, yStr].filter(Boolean).join(" ");
  }

  return `${label} (${matchCount} งาน)`;
}

/**
 * Generates the HTML for the Time & Date Filter Card
 */
export function renderTimeFilterBarHtml(state = {}) {
  const {
    period = "all",
    year = "all",
    month = "all",
    specificDay = "",
    startDate = "",
    endDate = "",
    dateField = "created_at",
    matchCount = 0,
  } = state;

  const summary = getFilterSummaryLabel(state, matchCount);
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return `
    <div class="time-filter-card" id="time-filter-widget">
      <div class="time-filter-header">
        <div class="time-filter-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>เลือกวัน เดือน ปี หรือช่วงเวลาที่ต้องการดูงาน</span>
        </div>
        <div class="time-filter-badge" id="filter-summary-badge">
          <span>📅</span> <span>${escapeHtml(summary)}</span>
        </div>
      </div>

      <!-- Quick Period Pills -->
      <div class="time-pills" style="margin-bottom:12px;">
        <button type="button" class="time-pill ${period === "all" ? "is-active" : ""}" data-period="all">ทั้งหมด (All)</button>
        <button type="button" class="time-pill ${period === "today" ? "is-active" : ""}" data-period="today">วันนี้</button>
        <button type="button" class="time-pill ${period === "7days" ? "is-active" : ""}" data-period="7days">7 วันล่าสุด</button>
        <button type="button" class="time-pill ${period === "month" ? "is-active" : ""}" data-period="month">เดือนนี้</button>
        <button type="button" class="time-pill ${period === "year" ? "is-active" : ""}" data-period="year">ปีนี้ (${currentYear})</button>
        <button type="button" class="time-pill ${period === "specific_day" ? "is-active" : ""}" data-period="specific_day">เลือกเฉพาะวัน</button>
        <button type="button" class="time-pill ${period === "custom" ? "is-active" : ""}" data-period="custom">ระบุช่วงวัน ▾</button>
      </div>

      <!-- Detail Selectors Grid -->
      <div class="time-controls-grid">
        <div class="time-control-group">
          <label for="tf-year">เลือกปี (Year)</label>
          <select id="tf-year">
            <option value="all" ${year === "all" ? "selected" : ""}>ทุกปี</option>
            ${years.map((y) => `<option value="${y}" ${String(year) === String(y) ? "selected" : ""}>${y}</option>`).join("")}
          </select>
        </div>

        <div class="time-control-group">
          <label for="tf-month">เลือกเดือน (Month)</label>
          <select id="tf-month">
            <option value="all" ${month === "all" ? "selected" : ""}>ทุกเดือน</option>
            ${MONTH_NAMES_TH.map((name, idx) => `<option value="${idx + 1}" ${String(month) === String(idx + 1) ? "selected" : ""}>${name}</option>`).join("")}
          </select>
        </div>

        <div class="time-control-group" id="tf-specific-day-wrap" style="${period === "specific_day" ? "" : "display:none;"}">
          <label for="tf-day">เลือกวันที่เจาะจง (Day)</label>
          <input type="date" id="tf-day" value="${escapeHtml(specificDay || "")}">
        </div>

        <div class="time-control-group" id="tf-custom-start-wrap" style="${period === "custom" ? "" : "display:none;"}">
          <label for="tf-start-date">ตั้งแต่วันที่</label>
          <input type="date" id="tf-start-date" value="${escapeHtml(startDate || "")}">
        </div>

        <div class="time-control-group" id="tf-custom-end-wrap" style="${period === "custom" ? "" : "display:none;"}">
          <label for="tf-end-date">ถึงวันที่</label>
          <input type="date" id="tf-end-date" value="${escapeHtml(endDate || "")}">
        </div>

        <div class="time-control-group">
          <label for="tf-date-field">อิงจากวันที่</label>
          <select id="tf-date-field">
            <option value="created_at" ${dateField === "created_at" ? "selected" : ""}>วันที่สร้าง/ส่งบรีฟ (Created)</option>
            <option value="deadline" ${dateField === "deadline" ? "selected" : ""}>กำหนดส่ง (Deadline)</option>
          </select>
        </div>

        <div class="time-control-group" style="align-self:flex-end;">
          <button type="button" class="btn btn-sm" id="tf-reset-btn" style="width:100%;height:38px;">ล้างตัวกรองวันที่</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Generates the HTML for the Member Workload & Status Comparison Section
 */
export function renderMemberComparisonHtml({
  memberStats = [],
  teamTotals = {},
  selectedMemberId = "all",
  selectedStatus = "all",
  projects = [],
  filteredTasks = []
} = {}) {
  const isIndividual = selectedMemberId !== "all";
  const activeMember = isIndividual ? memberStats.find((s) => s.member.id === selectedMemberId) : null;

  // Status Legend Bar
  const legendHtml = `
    <div class="status-legend-bar">
      <span style="font-size:0.75rem; font-weight:700; color:var(--ink-500); text-transform:uppercase;">สถานะงาน:</span>
      ${Object.entries(STATUS_COLORS).map(([key, item]) => `
        <div class="legend-item" style="cursor:pointer;" data-legend-status="${key}">
          <span class="legend-dot" style="background:${item.color};"></span>
          <span>${item.label} (${teamTotals.statusCounts?.[key] || 0})</span>
        </div>
      `).join("")}
    </div>
  `;

  // Member Selection Pills
  const memberPillsHtml = `
    <div class="member-select-pills">
      <button type="button" class="member-pill-btn ${selectedMemberId === "all" ? "is-active" : ""}" data-select-member="all">
        <span>👥</span> <span>ทุกคนในทีม (${memberStats.length})</span>
      </button>
      ${memberStats.map((stat) => `
        <button type="button" class="member-pill-btn ${selectedMemberId === stat.member.id ? "is-active" : ""}" data-select-member="${stat.member.id}">
          <span>${stat.member.avatar_url ? avatar(stat.member, "avatar-xs") : "👤"}</span>
          <span>${escapeHtml(stat.member.name)}</span>
          <span class="chart-count-pill">${stat.total}</span>
        </button>
      `).join("")}
    </div>
  `;

  // Comparison View: All Members Stacked Bars
  let chartBodyHtml = "";
  if (!isIndividual) {
    chartBodyHtml = `
      <div class="chart-rows-container">
        ${memberStats.map((stat) => {
          const total = stat.total;
          const counts = stat.statusCounts;
          
          return `
            <div class="chart-member-row" data-member-row-id="${stat.member.id}">
              <div class="chart-member-top">
                <div class="chart-member-info">
                  ${avatar(stat.member, "avatar-sm")}
                  <div>
                    <div class="chart-member-name">${escapeHtml(stat.member.name)}</div>
                    <div class="chart-member-role">${escapeHtml(roleLabel(stat.member.role))} · รวม ${total} งาน (${stat.items} ชิ้น)</div>
                  </div>
                </div>
                <div class="chart-member-stat-chips">
                  ${counts.brief ? `<span class="chart-count-pill" style="border-left:3px solid var(--status-brief)">รอรับบรีฟ ${counts.brief}</span>` : ""}
                  ${counts.drafting ? `<span class="chart-count-pill" style="border-left:3px solid var(--status-drafting)">ดราฟต์ ${counts.drafting}</span>` : ""}
                  ${counts.review ? `<span class="chart-count-pill" style="border-left:3px solid var(--status-review)">รอตรวจ ${counts.review}</span>` : ""}
                  ${counts.revision ? `<span class="chart-count-pill" style="border-left:3px solid var(--status-revision);color:var(--danger)">แก้ไข ${counts.revision}</span>` : ""}
                  ${counts.completed ? `<span class="chart-count-pill" style="border-left:3px solid var(--status-completed);color:var(--ok)">สำเร็จ ${counts.completed}</span>` : ""}
                  <button type="button" class="btn btn-ghost btn-sm" data-drilldown-member="${stat.member.id}" style="padding:4px 8px;font-size:0.75rem;">ดูงานคนนี้ →</button>
                </div>
              </div>

              <!-- Stacked Status Bar -->
              <div class="chart-stacked-bar" title="${stat.member.name}: ${total} งาน">
                ${total === 0 ? `<div style="width:100%;height:100%;background:var(--purple-100);display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:var(--ink-400);">ไม่มีงานในช่วงนี้</div>` : `
                  ${counts.brief ? `<div class="chart-segment seg-brief" style="width:${(counts.brief / total) * 100}%;" title="รอรับบรีฟ: ${counts.brief}">${counts.brief}</div>` : ""}
                  ${counts.drafting ? `<div class="chart-segment seg-drafting" style="width:${(counts.drafting / total) * 100}%;" title="กำลังดราฟต์: ${counts.drafting}">${counts.drafting}</div>` : ""}
                  ${counts.review ? `<div class="chart-segment seg-review" style="width:${(counts.review / total) * 100}%;" title="รอคอมเมนต์: ${counts.review}">${counts.review}</div>` : ""}
                  ${counts.revision ? `<div class="chart-segment seg-revision" style="width:${(counts.revision / total) * 100}%;" title="แก้ไขงาน: ${counts.revision}">${counts.revision}</div>` : ""}
                  ${counts.completed ? `<div class="chart-segment seg-completed" style="width:${(counts.completed / total) * 100}%;" title="ส่งมอบสำเร็จ: ${counts.completed}">${counts.completed}</div>` : ""}
                `}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  } else if (activeMember) {
    // Individual Deep Dive View
    const total = activeMember.total;
    const counts = activeMember.statusCounts;

    chartBodyHtml = `
      <div class="member-drilldown-card">
        <div class="row-between" style="align-items:center; margin-bottom:14px;">
          <div class="chart-member-info">
            ${avatar(activeMember.member, "avatar-md")}
            <div>
              <div style="font-size:1.1rem; font-weight:700; color:var(--ink-900);">${escapeHtml(activeMember.member.name)}</div>
              <div class="text-xs text-muted">${escapeHtml(roleLabel(activeMember.member.role))} · ภาระงานตามช่วงเวลาที่เลือก</div>
            </div>
          </div>
          <button type="button" class="btn btn-sm" data-select-member="all">← กลับไปดูกราฟทุกคน</button>
        </div>

        <!-- KPI Grid for Selected Person -->
        <div class="member-deepdive-grid">
          <div class="deepdive-stat-card">
            <div class="deepdive-stat-value" style="color:var(--ink-900);">${total}</div>
            <div class="deepdive-stat-label">งานทั้งหมดในงวด</div>
          </div>
          <div class="deepdive-stat-card">
            <div class="deepdive-stat-value" style="color:var(--status-drafting);">${counts.drafting}</div>
            <div class="deepdive-stat-label">กำลังดราฟต์</div>
          </div>
          <div class="deepdive-stat-card">
            <div class="deepdive-stat-value" style="color:var(--status-review);">${counts.review}</div>
            <div class="deepdive-stat-label">รอตรวจ/คอมเมนต์</div>
          </div>
          <div class="deepdive-stat-card">
            <div class="deepdive-stat-value" style="color:var(--status-revision);">${counts.revision}</div>
            <div class="deepdive-stat-label">แก้ไขงาน</div>
          </div>
          <div class="deepdive-stat-card">
            <div class="deepdive-stat-value" style="color:var(--status-completed);">${counts.completed}</div>
            <div class="deepdive-stat-label">สำเร็จแล้ว (${activeMember.completionRate}%)</div>
          </div>
          <div class="deepdive-stat-card">
            <div class="deepdive-stat-value" style="color:var(--ink-700);">${activeMember.avgRevision}</div>
            <div class="deepdive-stat-label">รอบแก้เฉลี่ย/งาน</div>
          </div>
        </div>

        <!-- Task Distribution Bar -->
        <div style="margin-top:16px;">
          <div class="chart-stacked-bar">
            ${total === 0 ? `<div style="width:100%;height:100%;background:var(--purple-100);display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:var(--ink-400);">ไม่มีงานในช่วงนี้</div>` : `
              ${counts.brief ? `<div class="chart-segment seg-brief" style="width:${(counts.brief / total) * 100}%;">${counts.brief}</div>` : ""}
              ${counts.drafting ? `<div class="chart-segment seg-drafting" style="width:${(counts.drafting / total) * 100}%;">${counts.drafting}</div>` : ""}
              ${counts.review ? `<div class="chart-segment seg-review" style="width:${(counts.review / total) * 100}%;">${counts.review}</div>` : ""}
              ${counts.revision ? `<div class="chart-segment seg-revision" style="width:${(counts.revision / total) * 100}%;">${counts.revision}</div>` : ""}
              ${counts.completed ? `<div class="chart-segment seg-completed" style="width:${(counts.completed / total) * 100}%;">${counts.completed}</div>` : ""}
            `}
          </div>
        </div>

        <!-- Drilldown Task List for this Person -->
        <div style="margin-top:20px;">
          <div style="font-weight:700;font-size:0.92rem;color:var(--ink-900);margin-bottom:10px;">
            รายการงานของ ${escapeHtml(activeMember.member.name)} ในช่วงเวลานี้ (${activeMember.tasks.length} รายการ)
          </div>
          <div class="drilldown-task-list">
            ${activeMember.tasks.length === 0 ? `<div class="state" style="padding:16px;">ไม่มีงานในหมวดหมู่นี้</div>` : activeMember.tasks.map((task) => {
              const project = projectFor(task, projects);
              return `
                <a class="drilldown-task-row" href="task.html?id=${encodeURIComponent(task.id)}">
                  <div class="drilldown-task-left">
                    ${task.preview_url ? `<img class="drilldown-task-thumb" src="${escapeHtml(task.preview_url)}" alt="thumbnail">` : `<div class="drilldown-task-thumb" style="display:flex;align-items:center;justify-content:center;font-size:0.75rem;color:var(--ink-400);">Artwork</div>`}
                    <div style="min-width:0;">
                      <div class="drilldown-task-title">${escapeHtml(task.title)}</div>
                      <div class="drilldown-task-meta">${escapeHtml(project?.name || "ไม่ระบุโปรเจกต์")} · ${Number(task.item_count || 1)} ชิ้น · กำหนดส่ง: ${formatDate(task.deadline_at || task.deadline)}</div>
                    </div>
                  </div>
                  <div>
                    ${statusBadge(task.status)}
                  </div>
                </a>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    `;
  }

  return `
    <section class="comparison-card" id="member-comparison-section">
      <div class="comparison-header">
        <div class="comparison-title-wrap">
          <div class="comparison-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--royal-purple);">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            <span>กราฟเปรียบเทียบงานของแต่ละคน & สถานะงาน (Workload & Status Comparison)</span>
          </div>
          <div class="comparison-sub">เลือกดูภาระงานแบบรายคนหรือทั้งทีม และวิเคราะห์สถานะงานตามวัน/เดือน/ปีที่ระบุ</div>
        </div>
        <div class="comparison-toolbar">
          ${memberPillsHtml}
        </div>
      </div>

      ${legendHtml}
      ${chartBodyHtml}
    </section>
  `;
}

/**
 * Initializes and binds event listeners for the Time Filter widget
 */
export function bindTimeFilterBar(container, { state, onChange }) {
  const root = container.querySelector("#time-filter-widget");
  if (!root) return;

  const pills = root.querySelectorAll(".time-pill");
  const yearSelect = root.querySelector("#tf-year");
  const monthSelect = root.querySelector("#tf-month");
  const dayInput = root.querySelector("#tf-day");
  const startDateInput = root.querySelector("#tf-start-date");
  const endDateInput = root.querySelector("#tf-end-date");
  const dateFieldSelect = root.querySelector("#tf-date-field");
  const resetBtn = root.querySelector("#tf-reset-btn");

  const specificDayWrap = root.querySelector("#tf-specific-day-wrap");
  const customStartWrap = root.querySelector("#tf-custom-start-wrap");
  const customEndWrap = root.querySelector("#tf-custom-end-wrap");

  // Handle Quick Period Pill Clicks
  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const p = pill.dataset.period;
      state.period = p;

      // Toggle display of custom inputs
      if (specificDayWrap) specificDayWrap.style.display = p === "specific_day" ? "" : "none";
      if (customStartWrap) customStartWrap.style.display = p === "custom" ? "" : "none";
      if (customEndWrap) customEndWrap.style.display = p === "custom" ? "" : "none";

      if (p === "today") {
        state.year = "all";
        state.month = "all";
      } else if (p === "month") {
        const now = new Date();
        state.year = String(now.getFullYear());
        state.month = String(now.getMonth() + 1);
        if (yearSelect) yearSelect.value = state.year;
        if (monthSelect) monthSelect.value = state.month;
      } else if (p === "year") {
        state.year = String(new Date().getFullYear());
        state.month = "all";
        if (yearSelect) yearSelect.value = state.year;
        if (monthSelect) monthSelect.value = "all";
      } else if (p === "all") {
        state.year = "all";
        state.month = "all";
        state.specificDay = "";
        state.startDate = "";
        state.endDate = "";
        if (yearSelect) yearSelect.value = "all";
        if (monthSelect) monthSelect.value = "all";
        if (dayInput) dayInput.value = "";
      }

      onChange(state);
    });
  });

  // Handle Dropdowns
  yearSelect?.addEventListener("change", () => {
    state.year = yearSelect.value;
    onChange(state);
  });

  monthSelect?.addEventListener("change", () => {
    state.month = monthSelect.value;
    onChange(state);
  });

  dayInput?.addEventListener("change", () => {
    state.specificDay = dayInput.value;
    state.period = "specific_day";
    onChange(state);
  });

  startDateInput?.addEventListener("change", () => {
    state.startDate = startDateInput.value;
    state.period = "custom";
    onChange(state);
  });

  endDateInput?.addEventListener("change", () => {
    state.endDate = endDateInput.value;
    state.period = "custom";
    onChange(state);
  });

  dateFieldSelect?.addEventListener("change", () => {
    state.dateField = dateFieldSelect.value;
    onChange(state);
  });

  resetBtn?.addEventListener("click", () => {
    state.period = "all";
    state.year = "all";
    state.month = "all";
    state.specificDay = "";
    state.startDate = "";
    state.endDate = "";
    state.memberId = "all";
    state.status = "all";
    onChange(state);
  });
}

/**
 * Initializes and binds event listeners for the Member Comparison section
 */
export function bindMemberComparison(container, { onSelectMember, onSelectStatus }) {
  const root = container.querySelector("#member-comparison-section");
  if (!root) return;

  // Member select pills
  root.querySelectorAll("[data-select-member]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const memberId = btn.dataset.selectMember;
      onSelectMember(memberId);
    });
  });

  // Drilldown buttons in member rows
  root.querySelectorAll("[data-drilldown-member]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const memberId = btn.dataset.drilldownMember;
      onSelectMember(memberId);
    });
  });

  // Status legend click
  root.querySelectorAll("[data-legend-status]").forEach((el) => {
    el.addEventListener("click", () => {
      const statusKey = el.dataset.legendStatus;
      if (typeof onSelectStatus === "function") {
        onSelectStatus(statusKey);
      }
    });
  });
}
