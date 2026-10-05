import { avatar, escapeHtml, roleLabel, projectFor, formatDate, relativeDeadline, taskTypeLabel, statusBadge } from "./formatters.js";
import { qs, qsa } from "./app.js";
import { STATUS_LABELS } from "./constants.js";
import { openCreateTask, bindTaskCards } from "./task-actions.js";
import { canManage } from "./auth.js";

function parseDeadline(value) {
  if (!value) return null;
  const raw = String(value);
  const d = raw.includes("T") ? new Date(raw) : new Date(`${raw}T23:59:59`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isToday(value) {
  const d = parseDeadline(value);
  if (!d) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth() === now.getMonth() &&
         d.getDate() === now.getDate();
}

function formatDeadlineLabel(value) {
  const d = parseDeadline(value);
  if (!d) return "ไม่มีกำหนด";
  const now = new Date();
  const isSameDay = d.getFullYear() === now.getFullYear() &&
                    d.getMonth() === now.getMonth() &&
                    d.getDate() === now.getDate();
  const timeStr = new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" }).format(d);
  if (isSameDay) {
    return `วันนี้ ${timeStr} น.`;
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.getFullYear() === tomorrow.getFullYear() &&
                     d.getMonth() === tomorrow.getMonth() &&
                     d.getDate() === tomorrow.getDate();
  if (isTomorrow) {
    return `พรุ่งนี้ ${timeStr} น.`;
  }
  return formatDate(value);
}

function analyzeMember(member, tasks, projects) {
  const memberTasks = tasks.filter((task) => task.assignee_id === member.id);
  const activeTasks = memberTasks.filter((task) => task.status !== "completed");
  const completedTasks = memberTasks.filter((task) => task.status === "completed");

  const todayTasks = activeTasks.filter((task) => isToday(task.deadline_at || task.deadline));
  const overdueTasks = activeTasks.filter((task) => relativeDeadline(task.deadline_at || task.deadline).className === "is-overdue");

  const draftingTasks = activeTasks.filter((task) => task.status === "drafting");
  const revisionTasks = activeTasks.filter((task) => task.status === "revision");
  const reviewTasks = activeTasks.filter((task) => task.status === "review");
  const briefTasks = activeTasks.filter((task) => task.status === "brief");

  // Determine current focus task (priority: Overdue > Revision > Drafting > Review > Brief > Closest Deadline)
  const sortedActive = [...activeTasks].sort((a, b) => {
    const aDue = relativeDeadline(a.deadline_at || a.deadline);
    const bDue = relativeDeadline(b.deadline_at || b.deadline);
    const aOverdue = aDue.className === "is-overdue" ? 1 : 0;
    const bOverdue = bDue.className === "is-overdue" ? 1 : 0;
    if (aOverdue !== bOverdue) return bOverdue - aOverdue;

    const statusWeight = { revision: 4, drafting: 3, review: 2, brief: 1 };
    const aWeight = statusWeight[a.status] || 0;
    const bWeight = statusWeight[b.status] || 0;
    if (aWeight !== bWeight) return bWeight - aWeight;

    const aTime = (a.deadline_at || a.deadline) ? new Date(a.deadline_at || a.deadline).getTime() : Infinity;
    const bTime = (b.deadline_at || b.deadline) ? new Date(b.deadline_at || b.deadline).getTime() : Infinity;
    return aTime - bTime;
  });

  const currentTask = sortedActive[0] || null;
  const secondaryTasks = sortedActive.slice(1);

  // Status classification for today
  let todayStatus = {
    key: "available",
    label: "ว่าง / พร้อมรับงาน",
    pillClass: "is-idle",
    dotClass: "pulse-circle",
    dotColor: "#1f7a4d",
    type: "idle",
  };

  if (overdueTasks.length > 0) {
    todayStatus = {
      key: "overdue",
      label: `มีงานเลท (${overdueTasks.length})`,
      pillClass: "is-alert",
      dotClass: "pulse-circle dot-alert",
      dotColor: "#b3261e",
      type: "alert",
    };
  } else if (revisionTasks.length > 0) {
    todayStatus = {
      key: "revision",
      label: `กำลังแก้งาน (${revisionTasks.length})`,
      pillClass: "is-alert",
      dotClass: "pulse-circle dot-alert",
      dotColor: "#b3261e",
      type: "working",
    };
  } else if (draftingTasks.length > 0) {
    todayStatus = {
      key: "drafting",
      label: `กำลังดราฟต์ (${draftingTasks.length})`,
      pillClass: "is-working",
      dotClass: "pulse-circle dot-working",
      dotColor: "#2a5fa8",
      type: "working",
    };
  } else if (reviewTasks.length > 0) {
    todayStatus = {
      key: "review",
      label: `รอตรวจ / รีวิว (${reviewTasks.length})`,
      pillClass: "is-waiting",
      dotClass: "pulse-circle",
      dotColor: "#a9701b",
      type: "waiting",
    };
  } else if (briefTasks.length > 0) {
    todayStatus = {
      key: "brief",
      label: `รอรับบรีฟ (${briefTasks.length})`,
      pillClass: "is-queued",
      dotClass: "pulse-circle",
      dotColor: "#8f8ca0",
      type: "queued",
    };
  }

  const projectsForMember = [...new Map(activeTasks.map((task) => {
    const project = projectFor(task, projects);
    return [project?.id, project];
  }).filter(([, project]) => project)).values()];

  const totalItems = activeTasks.reduce((sum, task) => sum + Number(task.item_count || 1), 0);

  return {
    member,
    memberTasks,
    activeTasks,
    completedTasks,
    todayTasks,
    overdueTasks,
    draftingTasks,
    revisionTasks,
    reviewTasks,
    briefTasks,
    currentTask,
    secondaryTasks,
    todayStatus,
    projectsForMember,
    totalItems,
  };
}

export async function render(ctx) {
  const tasks = Array.isArray(ctx.tasks) ? ctx.tasks : [];
  const members = Array.isArray(ctx.members) ? ctx.members : [];
  const projects = Array.isArray(ctx.projects) ? ctx.projects : [];

  const analyzed = members.map((m) => analyzeMember(m, tasks, projects));

  const activeAll = tasks.filter((task) => task.status !== "completed");
  const lateAll = activeAll.filter((task) => relativeDeadline(task.deadline_at || task.deadline).className === "is-overdue");
  const todayTasksAll = activeAll.filter((task) => isToday(task.deadline_at || task.deadline));
  const reviewAll = activeAll.filter((task) => task.status === "review");
  const workingMembersAll = analyzed.filter((a) => a.draftingTasks.length > 0 || a.revisionTasks.length > 0);
  const idleMembersAll = analyzed.filter((a) => a.activeTasks.length === 0);
  const totalItemsAll = activeAll.reduce((sum, task) => sum + Number(task.item_count || 1), 0);

  let currentView = "cards"; // "cards" | "table"
  let currentFilter = "all"; // "all" | "working" | "today" | "review" | "overdue" | "available"
  let currentSearch = "";

  const todayThai = new Intl.DateTimeFormat("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const renderMemberCard = (data) => {
    const { member, activeTasks, completedTasks, todayTasks, overdueTasks, currentTask, todayStatus, projectsForMember, totalItems } = data;
    const isWorkingNow = currentTask && ["drafting", "revision"].includes(currentTask.status);
    const due = currentTask ? relativeDeadline(currentTask.deadline_at || currentTask.deadline) : null;
    const isDueToday = currentTask && isToday(currentTask.deadline_at || currentTask.deadline);
    const isOverdue = due && due.className === "is-overdue";

    // Extra tasks due today besides current
    const extraTodayTasks = todayTasks.filter((t) => !currentTask || t.id !== currentTask.id);

    return `
      <section class="member-card">
        <div class="member-head">
          ${avatar(member, "avatar-lg")}
          <div style="flex:1; min-width:0">
            <div class="member-name">${escapeHtml(member.name)}</div>
            <div class="member-role">${escapeHtml(roleLabel(member.role))}</div>
          </div>
          <span class="member-status-pill ${todayStatus.pillClass}">
            <span class="${todayStatus.dotClass}"></span>
            ${escapeHtml(todayStatus.label)}
          </span>
        </div>

        <!-- Spotlight: ตอนนี้ทำอะไรอยู่ -->
        <div class="spotlight-box ${isOverdue ? "is-alert" : isDueToday ? "is-today" : !currentTask ? "is-idle" : ""}">
          <div class="spotlight-head">
            <span class="spotlight-tag">
              ${currentTask ? `⚡ ${isWorkingNow ? "กำลังทำอยู่ตอนนี้" : "งานหลักที่กำลังโฟกัส"}` : "✨ พร้อมรับงานใหม่"}
            </span>
            ${currentTask ? `
              <div class="row-wrap" style="gap:4px">
                ${isDueToday ? `<span class="badge badge-warn">🎯 กำหนดส่งวันนี้</span>` : ""}
                ${statusBadge(currentTask.status, true)}
              </div>
            ` : `<span class="badge badge-ok">ว่าง</span>`}
          </div>

          ${currentTask ? `
            <a class="spotlight-title" href="task.html?id=${encodeURIComponent(currentTask.id)}">
              ${escapeHtml(currentTask.title)}
            </a>
            <div class="spotlight-meta">
              <span class="chip">${escapeHtml(projectFor(currentTask, projects)?.name || "—")}</span>
              <span class="chip">${escapeHtml(taskTypeLabel(currentTask.task_type))}</span>
              <span class="text-xs text-muted">${Number(currentTask.item_count || 1)} ชิ้นงาน</span>
              ${currentTask.revision_count ? `<span class="chip">Rev ${currentTask.revision_count}</span>` : ""}
            </div>
            <div class="spotlight-due">
              <span class="text-xs text-muted">กำหนดส่ง: <strong>${formatDeadlineLabel(currentTask.deadline_at || currentTask.deadline)}</strong></span>
              <span class="badge ${isOverdue ? "badge-danger" : due.className ? "badge-warn" : "badge-neutral"}">
                ${escapeHtml(due.label)}
              </span>
            </div>
          ` : `
            <div class="text-xs text-muted" style="line-height:1.4">
              ขณะนี้ไม่มีงานค้างในระบบ พร้อมรับมอบหมายงานใหม่ได้ทันที
            </div>
          `}
        </div>

        ${extraTodayTasks.length ? `
          <div class="today-extra-alert">
            <span>⏰</span>
            <div>
              <strong>มีอีก ${extraTodayTasks.length} งานที่ต้องส่งวันนี้:</strong>
              ${extraTodayTasks.map((t) => `<a class="team-table-link" href="task.html?id=${encodeURIComponent(t.id)}">${escapeHtml(t.title)}</a>`).join(", ")}
            </div>
          </div>
        ` : ""}

        <!-- Metrics Bar -->
        <div class="member-metrics">
          <div class="metric"><div class="k">รอรับบรีฟ</div><div class="v">${data.briefTasks.length}</div></div>
          <div class="metric"><div class="k">กำลังดราฟต์</div><div class="v">${data.draftingTasks.length}</div></div>
          <div class="metric"><div class="k">รอรีวิว / แก้</div><div class="v">${data.reviewTasks.length + data.revisionTasks.length}</div></div>
          <div class="metric"><div class="k">เสร็จแล้ว</div><div class="v">${completedTasks.length}</div></div>
        </div>

        <div class="summary-line">
          <span class="text-xs text-muted">ภาระงานปัจจุบัน</span>
          <strong class="text-sm">
            ${activeTasks.length ? `${activeTasks.length} งาน (${totalItems} ชิ้นกำลังเดินอยู่)` : "ไม่มีงานค้าง"}
          </strong>
        </div>

        <!-- Task List -->
        <div>
          <div class="text-xs text-muted" style="margin-bottom:6px; font-weight:600">
            รายการงานที่กำลังทำ (${activeTasks.length})
          </div>
          ${activeTasks.length ? activeTasks.slice(0, 6).map((task) => {
            const taskDue = relativeDeadline(task.deadline_at || task.deadline);
            const isTaskToday = isToday(task.deadline_at || task.deadline);
            return `
              <a class="list-item" style="padding:7px 0" href="task.html?id=${encodeURIComponent(task.id)}">
                <div class="list-item-main">
                  <div class="list-item-title">
                    ${escapeHtml(task.title)}
                    <span class="chip" style="font-size:0.68rem; padding:2px 6px">${escapeHtml(taskTypeLabel(task.task_type))}</span>
                    ${isTaskToday ? `<span class="badge badge-warn badge-sm">ส่งวันนี้</span>` : ""}
                  </div>
                  <div class="list-item-sub">
                    ${escapeHtml(projectFor(task, projects)?.name || "—")} · ${Number(task.item_count || 1)} ชิ้น · ${formatDeadlineLabel(task.deadline_at || task.deadline)}
                  </div>
                </div>
                <div class="row-wrap" style="gap:4px">
                  ${statusBadge(task.status, true)}
                  <span class="badge ${taskDue.className === "is-overdue" ? "badge-danger" : taskDue.className ? "badge-warn" : "badge-neutral"}">
                    ${escapeHtml(taskDue.label)}
                  </span>
                </div>
              </a>
            `;
          }).join("") : `<div class="text-sm text-muted">ไม่มีงานค้าง</div>`}
        </div>

        <!-- Tag list of active projects -->
        <div class="tag-list">
          ${projectsForMember.length ? projectsForMember.map((project) => `
            <span class="chip">${escapeHtml(project.name)}</span>
          `).join("") : `<span class="text-xs text-muted">ยังไม่มี Active Project</span>`}
        </div>
      </section>
    `;
  };

  const renderTableView = (list) => {
    return `
      <div class="card" style="padding:0; overflow:hidden">
        <div class="table-wrap">
          <table class="data team-table">
            <thead>
              <tr>
                <th>สมาชิก</th>
                <th>สถานะวันนี้</th>
                <th>งานที่กำลังทำอยู่ตอนนี้</th>
                <th>Project</th>
                <th>กำหนดส่ง</th>
                <th>งานค้าง / วันนี้</th>
                <th style="text-align:right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${list.map((data) => {
                const { member, activeTasks, todayTasks, currentTask, todayStatus, totalItems } = data;
                const due = currentTask ? relativeDeadline(currentTask.deadline_at || currentTask.deadline) : null;
                const isDueToday = currentTask && isToday(currentTask.deadline_at || currentTask.deadline);
                return `
                  <tr>
                    <td>
                      <div class="user-inline" style="gap:9px">
                        ${avatar(member, "avatar-sm")}
                        <div>
                          <strong>${escapeHtml(member.name)}</strong>
                          <div class="text-xs text-muted">${escapeHtml(roleLabel(member.role))}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="member-status-pill ${todayStatus.pillClass}">
                        <span class="${todayStatus.dotClass}"></span>
                        ${escapeHtml(todayStatus.label)}
                      </span>
                    </td>
                    <td style="max-width:280px">
                      ${currentTask ? `
                        <div>
                          <a class="team-task-link" href="task.html?id=${encodeURIComponent(currentTask.id)}">
                            ${escapeHtml(currentTask.title)}
                          </a>
                          <div class="row-wrap" style="gap:4px; margin-top:3px">
                            ${statusBadge(currentTask.status, true)}
                            <span class="chip" style="font-size:0.68rem; padding:2px 6px">${escapeHtml(taskTypeLabel(currentTask.task_type))}</span>
                            <span class="text-xs text-muted">${Number(currentTask.item_count || 1)} ชิ้น</span>
                          </div>
                        </div>
                      ` : `<span class="text-muted text-sm">— พร้อมรับงานใหม่ —</span>`}
                    </td>
                    <td>
                      ${currentTask ? escapeHtml(projectFor(currentTask, projects)?.name || "—") : "—"}
                    </td>
                    <td>
                      ${currentTask ? `
                        <div>
                          <div style="font-size:0.8rem; font-weight:600">${formatDeadlineLabel(currentTask.deadline_at || currentTask.deadline)}</div>
                          <span class="badge ${due.className === "is-overdue" ? "badge-danger" : isDueToday ? "badge-warn" : "badge-neutral"}" style="margin-top:2px">
                            ${escapeHtml(due.label)}
                          </span>
                        </div>
                      ` : "—"}
                    </td>
                    <td>
                      <div>
                        <strong>${activeTasks.length} งาน</strong> <span class="text-xs text-muted">(${totalItems} ชิ้น)</span>
                      </div>
                      ${todayTasks.length ? `
                        <div style="margin-top:2px">
                          <span class="badge badge-warn badge-sm">ส่งวันนี้ ${todayTasks.length}</span>
                        </div>
                      ` : ""}
                    </td>
                    <td style="text-align:right">
                      ${currentTask ? `
                        <a class="btn btn-sm btn-ghost" href="task.html?id=${encodeURIComponent(currentTask.id)}">
                          ดูงาน →
                        </a>
                      ` : `
                        <span class="text-xs text-muted">ว่าง</span>
                      `}
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  const getFilteredData = () => {
    let list = [...analyzed];
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      list = list.filter((a) => {
        const memberName = (a.member.name || "").toLowerCase();
        const role = (a.member.role || "").toLowerCase();
        const tasksMatch = a.activeTasks.some((t) =>
          (t.title || "").toLowerCase().includes(q) ||
          (projectFor(t, projects)?.name || "").toLowerCase().includes(q)
        );
        return memberName.includes(q) || role.includes(q) || tasksMatch;
      });
    }

    if (currentFilter === "working") {
      list = list.filter((a) => a.draftingTasks.length > 0 || a.revisionTasks.length > 0);
    } else if (currentFilter === "today") {
      list = list.filter((a) => a.todayTasks.length > 0);
    } else if (currentFilter === "review") {
      list = list.filter((a) => a.reviewTasks.length > 0);
    } else if (currentFilter === "overdue") {
      list = list.filter((a) => a.overdueTasks.length > 0);
    } else if (currentFilter === "available") {
      list = list.filter((a) => a.activeTasks.length === 0);
    }

    return list;
  };

  const renderContent = () => {
    const list = getFilteredData();
    const resultsContainer = qs("#team-view-results");
    if (!resultsContainer) return;

    if (!list.length) {
      resultsContainer.innerHTML = `
        <div class="card">
          <div class="state">
            <div class="state-icon">○</div>
            <div class="state-title">ไม่พบสมาชิกตามตัวกรองที่เลือก</div>
            <div class="state-text">ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองสถานะอื่น</div>
            <button class="btn btn-sm" id="reset-team-filter" style="margin-top:10px">ล้างตัวกรองทั้งหมด</button>
          </div>
        </div>
      `;
      qs("#reset-team-filter")?.addEventListener("click", () => {
        currentFilter = "all";
        currentSearch = "";
        qs("#team-search-input").value = "";
        qsa(".filter-pill").forEach((p) => p.classList.toggle("is-active", p.dataset.filter === "all"));
        renderContent();
      });
      return;
    }

    if (currentView === "cards") {
      resultsContainer.innerHTML = `<div class="grid grid-2">${list.map(renderMemberCard).join("")}</div>`;
    } else {
      resultsContainer.innerHTML = renderTableView(list);
    }
  };

  // Main Page Layout
  qs("#page-content").innerHTML = `
    <!-- Top Header -->
    <div class="page-header">
      <div>
        <h2>ทีม & ภาพรวมการทำงาน</h2>
        <p class="page-desc">ดูภาพรวมทั้งหมดของทีมว่าแต่ละคนวันนี้ทำอะไร หรือกำลังทำอะไรอยู่ พร้อมสรุปภาระงาน</p>
      </div>
      <div class="row-wrap" style="gap:8px">
        <span class="chip">
          <span class="pulse-circle"></span>
          ${todayThai}
        </span>
        ${canManage(ctx.member) ? `<button class="btn btn-primary btn-sm" id="team-create-task">＋ มอบหมายงานใหม่</button>` : ""}
      </div>
    </div>

    <!-- Overview Stats (Grid 5) -->
    <div class="grid grid-4" style="margin-bottom:16px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))">
      <div class="card report-card">
        <div class="text-xs text-muted">สมาชิกในทีม</div>
        <div class="report-number">${members.length} <small>คน</small></div>
        <div class="text-xs text-muted">กำลังทำ ${workingMembersAll.length} · พร้อมรับงาน ${idleMembersAll.length}</div>
      </div>
      <div class="card report-card">
        <div class="text-xs text-muted">กำลังลงมือทำอยู่ตอนนี้</div>
        <div class="report-number" style="color:var(--info)">${workingMembersAll.length} <small>คน</small></div>
        <div class="text-xs text-muted">ดราฟต์ ${activeAll.filter((t) => t.status === "drafting").length} · แก้ไข ${activeAll.filter((t) => t.status === "revision").length}</div>
      </div>
      <div class="card report-card">
        <div class="text-xs text-muted">กำหนดส่งวันนี้</div>
        <div class="report-number" style="color:var(--warn)">${todayTasksAll.length} <small>งาน</small></div>
        <div class="text-xs text-muted">${todayTasksAll.reduce((sum, t) => sum + Number(t.item_count || 1), 0)} ชิ้นงานที่ต้องเสร็จ</div>
      </div>
      <div class="card report-card">
        <div class="text-xs text-muted">รอตรวจ / รีวิว</div>
        <div class="report-number">${reviewAll.length} <small>งาน</small></div>
        <div class="text-xs text-muted">รอ Feedback จากทีม</div>
      </div>
      <div class="card report-card">
        <div class="text-xs text-muted">งานเลท / เลยกำหนด</div>
        <div class="report-number" style="color:var(--danger)">${lateAll.length} <small>งาน</small></div>
        <div class="text-xs text-muted">ต้องติดตามเร่งด่วน</div>
      </div>
    </div>

    <!-- Filter & View Controls -->
    <div class="filter-bar" style="justify-content:space-between; align-items:center">
      <div class="field grow" style="min-width:240px">
        <div class="search-inline" style="min-width:0">
          <span>⌕</span>
          <input id="team-search-input" type="search" placeholder="ค้นหาชื่อสมาชิก ชื่องาน หรือ Project..." />
        </div>
      </div>

      <div class="filter-pills" style="margin:4px 0">
        <button class="filter-pill is-active" data-filter="all">
          ทั้งหมด <span class="pill-count">(${members.length})</span>
        </button>
        <button class="filter-pill" data-filter="working">
          ⚡ กำลังทำอยู่ <span class="pill-count">(${workingMembersAll.length})</span>
        </button>
        <button class="filter-pill" data-filter="today">
          🎯 ส่งวันนี้ <span class="pill-count">(${analyzed.filter((a) => a.todayTasks.length > 0).length})</span>
        </button>
        <button class="filter-pill" data-filter="review">
          💬 รอตรวจ <span class="pill-count">(${analyzed.filter((a) => a.reviewTasks.length > 0).length})</span>
        </button>
        <button class="filter-pill" data-filter="overdue">
          ⚠️ งานเลท <span class="pill-count">(${analyzed.filter((a) => a.overdueTasks.length > 0).length})</span>
        </button>
        <button class="filter-pill" data-filter="available">
          ✨ พร้อมรับงาน <span class="pill-count">(${idleMembersAll.length})</span>
        </button>
      </div>

      <div class="team-view-toggle">
        <button class="team-view-btn is-active" data-view="cards" title="มุมมองการ์ดรายละเอียด">
          🗂️ การ์ดสมาชิก
        </button>
        <button class="team-view-btn" data-view="table" title="มุมมองตารางภาพรวม">
          📋 ตารางภาพรวม
        </button>
      </div>
    </div>

    <!-- Dynamic Content Slot -->
    <div id="team-view-results"></div>
  `;

  // Bind Listeners
  qs("#team-search-input")?.addEventListener("input", (e) => {
    currentSearch = e.target.value.trim();
    renderContent();
  });

  qsa(".filter-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      qsa(".filter-pill").forEach((p) => p.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentFilter = btn.dataset.filter;
      renderContent();
    });
  });

  qsa(".team-view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      qsa(".team-view-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentView = btn.dataset.view;
      renderContent();
    });
  });

  qs("#team-create-task")?.addEventListener("click", () => openCreateTask(ctx));

  renderContent();
}
