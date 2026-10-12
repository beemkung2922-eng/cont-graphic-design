import { avatar, escapeHtml, roleLabel, projectFor, formatDate, relativeDeadline, taskTypeLabel, statusBadge } from "./formatters.js";
import { qs, qsa, openModal, closeModal, toast } from "./app.js";
import { STATUS_LABELS } from "./constants.js";
import { openCreateTask, bindTaskCards } from "./task-actions.js";
import { canManage } from "./auth.js";
import { api } from "./supabase.js";

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

  let todayStatus = {
    key: "available",
    label: "ว่าง / พร้อมรับงาน",
    pillClass: "is-idle",
    dotClass: "pulse-circle",
    dotColor: "#22c55e",
    type: "idle",
  };

  if (overdueTasks.length > 0) {
    todayStatus = {
      key: "overdue",
      label: `มีงานเลท (${overdueTasks.length})`,
      pillClass: "is-alert",
      dotClass: "pulse-circle dot-alert",
      dotColor: "#ef4444",
      type: "alert",
    };
  } else if (revisionTasks.length > 0) {
    todayStatus = {
      key: "revision",
      label: `กำลังแก้งาน (${revisionTasks.length})`,
      pillClass: "is-alert",
      dotClass: "pulse-circle dot-alert",
      dotColor: "#ef4444",
      type: "working",
    };
  } else if (draftingTasks.length > 0) {
    todayStatus = {
      key: "drafting",
      label: `กำลังดราฟต์ (${draftingTasks.length})`,
      pillClass: "is-working",
      dotClass: "pulse-circle dot-working",
      dotColor: "#0ea5e9",
      type: "working",
    };
  } else if (reviewTasks.length > 0) {
    todayStatus = {
      key: "review",
      label: `รอตรวจ / รีวิว (${reviewTasks.length})`,
      pillClass: "is-waiting",
      dotClass: "pulse-circle",
      dotColor: "#f59e0b",
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

  const designers = members.filter((m) => ["designer", "supervisor", "admin"].includes(m.role));
  const requesters = members.filter((m) => ["requester", "viewer"].includes(m.role));

  const analyzed = designers.map((m) => analyzeMember(m, tasks, projects));

  const activeAll = tasks.filter((task) => task.status !== "completed");
  const lateAll = activeAll.filter((task) => relativeDeadline(task.deadline_at || task.deadline).className === "is-overdue");
  const todayTasksAll = activeAll.filter((task) => isToday(task.deadline_at || task.deadline));
  const reviewAll = activeAll.filter((task) => task.status === "review");
  const workingMembersAll = analyzed.filter((a) => a.draftingTasks.length > 0 || a.revisionTasks.length > 0);
  const idleMembersAll = analyzed.filter((a) => a.activeTasks.length === 0);
  const totalItemsAll = activeAll.reduce((sum, task) => sum + Number(task.item_count || 1), 0);

  let currentView = "table"; // "table" | "cards"
  let currentFilter = "all"; // "all" | "working" | "today" | "review" | "overdue" | "available"
  let currentSearch = "";

  const todayThai = "วันจันทร์ที่ 12 ตุลาคม 2569";



  /* ─── 3. Member Cards View ─── */
  const renderMemberCard = (data) => {
    const { member, activeTasks, completedTasks, todayTasks, overdueTasks, currentTask, todayStatus, projectsForMember, totalItems } = data;
    const isWorkingNow = currentTask && ["drafting", "revision"].includes(currentTask.status);
    const due = currentTask ? relativeDeadline(currentTask.deadline_at || currentTask.deadline) : null;
    const isDueToday = currentTask && isToday(currentTask.deadline_at || currentTask.deadline);
    const isOverdue = due && due.className === "is-overdue";

    return `
      <section class="card" style="background:#141828;border:1px solid #2b344c;border-radius:12px;padding:18px;">
        <div class="member-head" style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;border-bottom:1px solid #242c40;padding-bottom:12px;">
          <div style="display:flex;align-items:center;gap:10px;">
            ${avatar(member, "avatar-md")}
            <div>
              <div style="font-size:0.95rem;font-weight:700;color:#ffffff;">${escapeHtml(member.name)}</div>
              <div style="font-size:0.75rem;color:#94a3b8;">${escapeHtml(roleLabel(member.role))}</div>
            </div>
          </div>
          <span class="member-status-pill ${todayStatus.pillClass}">
            <span class="${todayStatus.dotClass}"></span>
            ${escapeHtml(todayStatus.label)}
          </span>
        </div>

        <div style="background:#1a2034;border:1px solid #2d3650;border-radius:8px;padding:12px 14px;margin-bottom:14px;">
          <div style="font-size:0.75rem;color:#94a3b8;margin-bottom:4px;font-weight:600;">
            ${currentTask ? (isWorkingNow ? "กำลังทำอยู่ตอนนี้" : "งานหลักที่กำลังโฟกัส") : "พร้อมรับงานใหม่"}
          </div>
          ${currentTask ? `
            <a href="task.html?id=${encodeURIComponent(currentTask.id)}" style="font-size:0.92rem;font-weight:700;color:#38bdf8;text-decoration:none;">
              ${escapeHtml(currentTask.title)}
            </a>
            <div style="font-size:0.76rem;color:#cbd5e1;margin-top:4px;">
              ${escapeHtml(projectFor(currentTask, projects)?.name || "—")} · ${Number(currentTask.item_count || 1)} ชิ้น · กำหนดส่ง: ${formatDeadlineLabel(currentTask.deadline_at || currentTask.deadline)}
            </div>
          ` : `
            <div style="font-size:0.8rem;color:#94a3b8;">ขณะนี้ไม่มีงานค้าง พร้อมรับมอบหมายงานใหม่ทันที</div>
          `}
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid #242c40;">
          <div style="font-size:0.82rem;color:#cbd5e1;">
            งานค้าง: <strong style="color:#ffffff;">${activeTasks.length} งาน</strong> (${totalItems} ชิ้น)
          </div>
          ${currentTask ? `
            <a class="btn btn-sm btn-ghost" href="task.html?id=${encodeURIComponent(currentTask.id)}" style="font-size:0.78rem;">
              ดูงาน →
            </a>
          ` : `
            <button class="btn btn-sm btn-primary btn-assign-member" data-member-id="${escapeHtml(member.id)}" style="font-size:0.78rem;">
              + มอบหมายงาน
            </button>
          `}
        </div>
      </section>
    `;
  };

  /* ─── 4. High-Contrast Workload Table View ─── */
  const renderTableView = (list) => {
    return `
      <div class="team-table-card">
        <div class="table-wrap">
          <table class="data team-table">
            <thead>
              <tr>
                <th style="width:220px;">สมาชิก</th>
                <th style="width:170px;">สถานะวันนี้</th>
                <th>งานที่กำลังทำอยู่ตอนนี้</th>
                <th style="width:160px;">Project</th>
                <th style="width:150px;">กำหนดส่ง</th>
                <th style="width:120px;">งานค้าง / ชิ้น</th>
                <th style="width:100px;text-align:right;">Action</th>
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
                      <div class="user-inline" style="gap:10px;">
                        ${avatar(member, "avatar-sm")}
                        <div>
                          <strong style="color:#ffffff;font-size:0.88rem;">${escapeHtml(member.name)}</strong>
                          <div style="font-size:0.74rem;color:#94a3b8;">${escapeHtml(roleLabel(member.role))}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="member-status-pill ${todayStatus.pillClass}">
                        <span class="${todayStatus.dotClass}"></span>
                        ${escapeHtml(todayStatus.label)}
                      </span>
                    </td>
                    <td>
                      ${currentTask ? `
                        <div>
                          <a class="team-task-link" href="task.html?id=${encodeURIComponent(currentTask.id)}">
                            ${escapeHtml(currentTask.title)}
                          </a>
                          <div class="row-wrap" style="gap:4px; margin-top:3px">
                            ${statusBadge(currentTask.status, true)}
                            <span class="chip" style="font-size:0.68rem; padding:2px 6px">${escapeHtml(taskTypeLabel(currentTask.task_type))}</span>
                            <span style="font-size:0.75rem;color:#94a3b8;">${Number(currentTask.item_count || 1)} ชิ้น</span>
                          </div>
                        </div>
                      ` : `<span style="color:#94a3b8;font-size:0.82rem;">— พร้อมรับงานใหม่ —</span>`}
                    </td>
                    <td>
                      <span style="color:#cbd5e1;font-size:0.82rem;">${currentTask ? escapeHtml(projectFor(currentTask, projects)?.name || "—") : "—"}</span>
                    </td>
                    <td>
                      ${currentTask ? `
                        <div>
                          <div style="font-size:0.8rem; font-weight:600; color:#ffffff;">${formatDeadlineLabel(currentTask.deadline_at || currentTask.deadline)}</div>
                          <span class="badge ${due.className === "is-overdue" ? "badge-danger" : isDueToday ? "badge-warn" : "badge-neutral"}" style="margin-top:2px">
                            ${escapeHtml(due.label)}
                          </span>
                        </div>
                      ` : '<span style="color:#64748b;">—</span>'}
                    </td>
                    <td>
                      <div>
                        <strong style="color:#ffffff;">${activeTasks.length} งาน</strong> <span style="font-size:0.75rem;color:#94a3b8;">(${totalItems} ชิ้น)</span>
                      </div>
                      ${todayTasks.length ? `
                        <div style="margin-top:2px">
                          <span class="badge badge-warn badge-sm">ส่งวันนี้ ${todayTasks.length}</span>
                        </div>
                      ` : ""}
                    </td>
                    <td style="text-align:right">
                      ${currentTask ? `
                        <a class="btn btn-sm btn-ghost" href="task.html?id=${encodeURIComponent(currentTask.id)}" style="padding:5px 12px;font-size:0.78rem;">
                          ดูงาน →
                        </a>
                      ` : `
                        <button class="btn btn-sm btn-ghost btn-assign-member" data-member-id="${escapeHtml(member.id)}" style="padding:5px 10px;font-size:0.75rem;color:#38bdf8;">
                          + งาน
                        </button>
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

  /* ─── 5. Filter & Render Content ─── */
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

  /* ─── 6. Workload Slot Renderer ─── */
  const renderWorkloadSlot = () => {
    const container = qs("#team-workload-results-slot");
    if (!container) return;

    const list = getFilteredData();
    if (!list.length) {
      container.innerHTML = `
        <div class="card" style="background:#141828;border:1px solid #2b344c;text-align:center;padding:36px 20px;">
          <div style="font-size:1.5rem;margin-bottom:8px;">○</div>
          <div style="font-size:1rem;font-weight:700;color:#ffffff;margin-bottom:4px;">ไม่พบสมาชิกตามตัวกรองที่เลือก</div>
          <div style="font-size:0.82rem;color:#94a3b8;">ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองสถานะอื่น</div>
          <button class="btn btn-sm btn-secondary" id="reset-team-filter" style="margin-top:14px;">ล้างตัวกรองทั้งหมด</button>
        </div>
      `;
      qs("#reset-team-filter", container)?.addEventListener("click", () => {
        currentFilter = "all";
        currentSearch = "";
        const searchInput = qs("#team-search-input");
        if (searchInput) searchInput.value = "";
        qsa(".filter-pills .filter-pill").forEach((btn) => {
          btn.classList.toggle("is-active", btn.dataset.filter === "all");
        });
        renderWorkloadSlot();
      });
      return;
    }

    if (currentView === "cards") {
      container.innerHTML = `<div class="grid grid-2">${list.map(renderMemberCard).join("")}</div>`;
    } else {
      container.innerHTML = renderTableView(list);
    }

    container.querySelectorAll(".btn-assign-member").forEach((btn) => {
      btn.addEventListener("click", () => {
        openCreateTask(ctx, { assignee_id: btn.dataset.memberId });
      });
    });
  };

  /* ─────────── Full Page Shell (Tabs removed per request; Full Unified View) ─────────── */
  qs("#page-content").innerHTML = `
    <!-- Top Header -->
    <div class="page-header" style="margin-bottom:20px;">
      <div>
        <h2 style="font-size:1.9rem;font-weight:700;color:#ffffff;margin:0 0 4px;">ทีม & ภาพรวมการทำงาน</h2>
        <p class="page-desc" style="color:#94a3b8;font-size:0.88rem;margin:0;">ดูภาพรวมทั้งหมดของทีมว่าแต่ละคนวันนี้ทำอะไร หรือกำลังทำอะไรอยู่ พร้อมสรุปภาระงาน</p>
      </div>
      <div class="row-wrap" style="gap:10px;">
        <span class="chip" style="background:#141828;border:1px solid #2b344c;color:#ffffff;padding:8px 14px;border-radius:8px;font-weight:600;">
          <span class="pulse-circle"></span>
          ${todayThai}
        </span>
        ${canManage(ctx.member) ? `
          <button class="btn btn-secondary btn-sm" id="team-manage-members">จัดการสิทธิ์ & สมาชิก</button>
          <button class="btn btn-primary btn-sm" id="team-create-task">+ มอบหมายงานใหม่</button>
        ` : ""}
      </div>
    </div>

    <!-- Overview Stats: 5 High-Contrast Bento Cards (Preserved exactly) -->
    <div class="team-stats-grid">
      <div class="team-stat-card card-white">
        <div class="stat-label">สมาชิกในทีม</div>
        <div class="stat-num">${members.length} <small>คน</small></div>
        <div class="stat-sub">กำลังทำ ${workingMembersAll.length} · พร้อมรับงาน ${idleMembersAll.length}</div>
      </div>

      <div class="team-stat-card card-cyan">
        <div class="stat-label">กำลังลงมือทำอยู่ตอนนี้</div>
        <div class="stat-num">${workingMembersAll.length} <small>คน</small></div>
        <div class="stat-sub">ดราฟต์ ${activeAll.filter((t) => t.status === "drafting").length} · แก้ไข ${activeAll.filter((t) => t.status === "revision").length}</div>
      </div>

      <div class="team-stat-card card-amber">
        <div class="stat-label">กำหนดส่งวันนี้</div>
        <div class="stat-num">${todayTasksAll.length} <small>งาน</small></div>
        <div class="stat-sub">${todayTasksAll.reduce((sum, t) => sum + Number(t.item_count || 1), 0)} ชิ้นงานที่ต้องเสร็จ</div>
      </div>

      <div class="team-stat-card card-purple">
        <div class="stat-label">รอตรวจ / รีวิว</div>
        <div class="stat-num">${reviewAll.length} <small>งาน</small></div>
        <div class="stat-sub">รอ Feedback จากทีม</div>
      </div>

      <div class="team-stat-card card-red">
        <div class="stat-label">งานเลท / เลยกำหนด</div>
        <div class="stat-num">${lateAll.length} <small>งาน</small></div>
        <div class="stat-sub">ต้องติดตามเร่งด่วน</div>
      </div>
    </div>

    <!-- Section Header for Workload -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin:28px 0 16px;">
      <div>
        <h3 style="font-size:1.25rem;font-weight:700;color:#ffffff;margin:0 0 4px;">ภาพรวมภาระงานและรายการงานปัจจุบัน (Workload & Tasks)</h3>
        <p style="color:#94a3b8;font-size:0.82rem;margin:0;">ติดตามสถานะงาน กำหนดส่ง และการกระจายงานของสมาชิกแต่ละคน</p>
      </div>
    </div>

    <!-- Filter Bar for Workload -->
    <div class="filter-bar" style="justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div class="field grow" style="min-width:240px">
        <div class="search-inline" style="min-width:0">
          <span>⌕</span>
          <input id="team-search-input" type="search" value="${escapeHtml(currentSearch)}" placeholder="ค้นหาชื่อสมาชิก ชื่องาน หรือ Project..." />
        </div>
      </div>

      <div class="filter-pills" style="margin:4px 0">
        <button class="filter-pill ${currentFilter === 'all' ? 'is-active' : ''}" data-filter="all">
          ทั้งหมด <span class="pill-count">(${members.length})</span>
        </button>
        <button class="filter-pill ${currentFilter === 'working' ? 'is-active' : ''}" data-filter="working">
          กำลังทำอยู่ <span class="pill-count">(${workingMembersAll.length})</span>
        </button>
        <button class="filter-pill ${currentFilter === 'today' ? 'is-active' : ''}" data-filter="today">
          ส่งวันนี้ <span class="pill-count">(${analyzed.filter((a) => a.todayTasks.length > 0).length})</span>
        </button>
        <button class="filter-pill ${currentFilter === 'review' ? 'is-active' : ''}" data-filter="review">
          รอตรวจ <span class="pill-count">(${analyzed.filter((a) => a.reviewTasks.length > 0).length})</span>
        </button>
        <button class="filter-pill ${currentFilter === 'overdue' ? 'is-active' : ''}" data-filter="overdue">
          งานเลท <span class="pill-count">(${analyzed.filter((a) => a.overdueTasks.length > 0).length})</span>
        </button>
        <button class="filter-pill ${currentFilter === 'available' ? 'is-active' : ''}" data-filter="available">
          พร้อมรับงาน <span class="pill-count">(${idleMembersAll.length})</span>
        </button>
      </div>

      <div class="team-view-toggle">
        <button class="team-view-btn ${currentView === 'table' ? 'is-active' : ''}" data-view="table" title="มุมมองตารางภาพรวม">
          ตารางภาพรวม
        </button>
        <button class="team-view-btn ${currentView === 'cards' ? 'is-active' : ''}" data-view="cards" title="มุมมองการ์ดรายละเอียด">
          การ์ดสมาชิก
        </button>
      </div>
    </div>

    <!-- Main Workload Table or Cards -->
    <div id="team-workload-results-slot"></div>
  `;

  // Top header buttons
  qs("#team-manage-members")?.addEventListener("click", () => openManageTeamModal(ctx));
  qs("#team-create-task")?.addEventListener("click", () => openCreateTask(ctx));

  // Workload search input
  qs("#team-search-input")?.addEventListener("input", (e) => {
    currentSearch = e.target.value.trim();
    renderWorkloadSlot();
  });

  // Workload filter pills
  qsa(".filter-pills .filter-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      qsa(".filter-pills .filter-pill").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentFilter = btn.dataset.filter;
      renderWorkloadSlot();
    });
  });

  // Workload view toggle (table vs cards)
  qsa(".team-view-toggle .team-view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      qsa(".team-view-toggle .team-view-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentView = btn.dataset.view;
      renderWorkloadSlot();
    });
  });

  // Initial render of workload slot
  renderWorkloadSlot();
}

/* ─── Manage Team & Roles Modal (Matching Image 1 & Image 2) ─── */
const MODAL_PERMISSIONS_LIST = [
  { key: "create_task", name: "Create and edit tasks", desc: "Open new artwork requests and fill briefs" },
  { key: "work_task",   name: "Draft and work on tasks", desc: "Change status to drafting and update artwork" },
  { key: "review_task", name: "Review and approve", desc: "Quality check, review proof and approve work" },
  { key: "assign_task", name: "Assign team members", desc: "Distribute tasks and assign designers" },
  { key: "request_rev", name: "Request revisions", desc: "Leave feedback comments and revision points" },
  { key: "view_report", name: "See reports and analytics", desc: "Access throughput, heatmap and SLA metrics" },
  { key: "manage_role", name: "Invite and remove people", desc: "Manage member roles and system permissions" },
  { key: "download",    name: "Download assets and files", desc: "Download high-res exports and project files" },
];

const MODAL_DEFAULT_PERMS = {
  create_task: { head: true, designer: true, requester: true, viewer: false },
  work_task:   { head: true, designer: true, requester: false, viewer: false },
  review_task: { head: true, designer: false, requester: false, viewer: false },
  assign_task: { head: true, designer: false, requester: false, viewer: false },
  request_rev: { head: true, designer: true, requester: true, viewer: false },
  view_report: { head: true, designer: true, requester: false, viewer: false },
  manage_role: { head: true, designer: false, requester: false, viewer: false },
  download:    { head: true, designer: true, requester: true, viewer: true },
};

function getSavedModalPerms() {
  try {
    const raw = localStorage.getItem("CONT_ROLE_PERMS");
    if (!raw) return { ...MODAL_DEFAULT_PERMS };
    return { ...MODAL_DEFAULT_PERMS, ...JSON.parse(raw) };
  } catch {
    return { ...MODAL_DEFAULT_PERMS };
  }
}

function saveModalPerms(perms) {
  try {
    localStorage.setItem("CONT_ROLE_PERMS", JSON.stringify(perms));
  } catch (e) {
    console.error("Save perms error", e);
  }
}

function renderModalPermsRows() {
  const perms = getSavedModalPerms();
  return MODAL_PERMISSIONS_LIST.map((p) => {
    const row = perms[p.key] || MODAL_DEFAULT_PERMS[p.key];
    return `
      <tr>
        <td>
          <div style="font-weight:600;color:#f8fafc;font-size:0.86rem;">${escapeHtml(p.name)}</div>
          <div style="font-size:0.74rem;color:#94a3b8;margin-top:2px;">${escapeHtml(p.desc)}</div>
        </td>
        <td>
          <span class="owner-perm-check" title="Owner has full access">✓</span>
        </td>
        <td>
          <label class="role-perm-switch" title="Toggle Designer">
            <input type="checkbox" class="modal-perm-toggle" data-key="${p.key}" data-role="designer" ${row.designer ? "checked" : ""}>
            <span class="role-perm-slider"></span>
          </label>
        </td>
        <td>
          <label class="role-perm-switch" title="Toggle Requester">
            <input type="checkbox" class="modal-perm-toggle" data-key="${p.key}" data-role="requester" ${row.requester ? "checked" : ""}>
            <span class="role-perm-slider"></span>
          </label>
        </td>
        <td>
          <label class="role-perm-switch" title="Toggle Viewer">
            <input type="checkbox" class="modal-perm-toggle" data-key="${p.key}" data-role="viewer" ${row.viewer ? "checked" : ""}>
            <span class="role-perm-slider"></span>
          </label>
        </td>
      </tr>
    `;
  }).join("");
}

export function openManageTeamModal(ctx) {
  if (!canManage(ctx.member)) {
    toast("เฉพาะ Team Head เท่านั้นที่จัดการสิทธิ์ได้", "warn");
    return;
  }

  const memberRows = ctx.members.map((m) => `
    <tr data-member-row="${escapeHtml(m.id)}">
      <td>
        <div class="row" style="gap:10px; align-items:center;">
          ${avatar(m, "avatar-sm")}
          <div>
            <div style="font-weight:600;color:#ffffff;font-size:0.88rem;">${escapeHtml(m.name)}</div>
            <div style="font-size:0.75rem;color:#94a3b8;">${escapeHtml(m.email)}</div>
          </div>
        </div>
      </td>
      <td>
        <select class="modal-role-select" data-role-select="${escapeHtml(m.id)}">
          <option value="supervisor" ${["supervisor", "admin"].includes(m.role) ? "selected" : ""}>👑 Team Head (Owner)</option>
          <option value="designer" ${m.role === "designer" ? "selected" : ""}>🎨 Designer</option>
          <option value="requester" ${m.role === "requester" ? "selected" : ""}>📝 Requester</option>
          <option value="viewer" ${m.role === "viewer" ? "selected" : ""}>👁️ Viewer</option>
        </select>
      </td>
      <td style="text-align:right;">
        <button class="btn-modal-save" data-save-member="${escapeHtml(m.id)}">Save</button>
      </td>
    </tr>
  `).join("");

  const body = `
    <div>
      <!-- Modal Navigation Tabs -->
      <div class="modal-nav-tabs">
        <button type="button" class="modal-nav-tab is-active" data-modal-tab="roles">
          👥 Member Roles
        </button>
        <button type="button" class="modal-nav-tab" data-modal-tab="perms">
          🛡️ What each role can do
        </button>
        <button type="button" class="modal-nav-tab" data-modal-tab="add">
          ＋ Add Member
        </button>
      </div>

      <!-- Tab 1: Member Roles (Image 2) -->
      <div data-modal-tab-content="roles">
        <div style="font-weight:700;color:#ffffff;font-size:0.95rem;margin-bottom:4px;">Member Roles & Assignments</div>
        <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:14px;">
          Assign roles: <strong>Team Head (Owner)</strong>, <strong>Designer</strong>, <strong>Requester</strong>, or <strong>Viewer</strong>
        </div>
        <div style="overflow-x:auto; border:1px solid #283148; border-radius:8px;">
          <table class="modal-role-table" style="width:100%; margin:0;">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th style="width:100px;text-align:right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${memberRows}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 2: What each role can do (Image 1) -->
      <div data-modal-tab-content="perms" style="display:none;">
        <div class="role-matrix-card">
          <div class="role-matrix-head">
            <div>
              <div class="role-matrix-title">What each role can do</div>
              <div class="role-matrix-sub">Owners can do everything; switch the rest</div>
            </div>
            <button type="button" class="btn btn-sm btn-ghost" id="btn-modal-reset-perms" style="font-size:0.75rem;color:#94a3b8;padding:4px 8px;" title="Reset to default">
              ↺ Reset to default
            </button>
          </div>
          <div style="overflow-x:auto;">
            <table class="role-matrix-table">
              <thead>
                <tr>
                  <th style="width:42%;">Permission</th>
                  <th>Owner</th>
                  <th>Designer</th>
                  <th>Requester</th>
                  <th>Viewer</th>
                </tr>
              </thead>
              <tbody id="modal-matrix-body">
                ${renderModalPermsRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab 3: Pre-configure New Member -->
      <div data-modal-tab-content="add" style="display:none;">
        <div style="font-weight:700;color:#ffffff;font-size:0.95rem;margin-bottom:4px;">Pre-configure New Member</div>
        <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:14px;">
          Specify company email in advance. When the member logs in via OTP, their name and role will be assigned automatically.
        </div>
        <form id="pre-add-member-form" class="stack" style="gap:12px;">
          <div class="form-grid">
            <div class="field field-full">
              <label for="new-member-email" style="color:#cbd5e1;font-size:0.8rem;font-weight:600;">Company Email (@kkpfg.com) *</label>
              <input id="new-member-email" type="email" placeholder="e.g. somchai.p@kkpfg.com" class="input-clean" required />
            </div>
            <div class="field">
              <label for="new-member-name" style="color:#cbd5e1;font-size:0.8rem;font-weight:600;">Full Name (optional)</label>
              <input id="new-member-name" placeholder="e.g. Somchai Prasert" class="input-clean" />
            </div>
            <div class="field">
              <label for="new-member-role" style="color:#cbd5e1;font-size:0.8rem;font-weight:600;">Role</label>
              <select id="new-member-role" class="modal-role-select">
                <option value="designer">🎨 Designer</option>
                <option value="supervisor">👑 Team Head (Owner)</option>
                <option value="requester" selected>📝 Requester</option>
                <option value="viewer">👁️ Viewer</option>
              </select>
            </div>
          </div>
          <div id="pre-add-error" class="error-text"></div>
          <button type="button" class="btn btn-secondary" id="submit-pre-add-member" style="align-self:flex-start;margin-top:6px;">
            ＋ Pre-configure Member
          </button>
        </form>
      </div>
    </div>
  `;

  const modal = openModal({
    title: "Manage Team & Roles",
    size: "lg",
    body,
    footer: `<button class="btn btn-ghost" data-close-modal>Close</button>`,
  });

  // Tab switching
  qsa(".modal-nav-tab", modal).forEach((tabBtn) => {
    tabBtn.addEventListener("click", () => {
      qsa(".modal-nav-tab", modal).forEach((b) => b.classList.remove("is-active"));
      tabBtn.classList.add("is-active");
      const target = tabBtn.dataset.modalTab;
      qsa("[data-modal-tab-content]", modal).forEach((content) => {
        content.style.display = content.dataset.modalTabContent === target ? "block" : "none";
      });
    });
  });

  // Bind role matrix switches
  const bindModalMatrixToggles = () => {
    qsa(".modal-perm-toggle", modal).forEach((toggle) => {
      toggle.addEventListener("change", (e) => {
        const key = e.target.dataset.key;
        const role = e.target.dataset.role;
        const isChecked = e.target.checked;
        const perms = getSavedModalPerms();
        if (!perms[key]) perms[key] = { ...MODAL_DEFAULT_PERMS[key] };
        perms[key][role] = isChecked;
        saveModalPerms(perms);

        const permDef = MODAL_PERMISSIONS_LIST.find((p) => p.key === key);
        const permName = permDef ? permDef.name : key;
        const roleName = role === "designer" ? "Designer" : role === "requester" ? "Requester" : "Viewer";
        toast(`Updated "${permName}" for ${roleName} to ${isChecked ? 'Enabled' : 'Disabled'}`, "success");
      });
    });
  };
  bindModalMatrixToggles();

  // Reset matrix listener
  qs("#btn-modal-reset-perms", modal)?.addEventListener("click", () => {
    localStorage.removeItem("CONT_ROLE_PERMS");
    const tbody = qs("#modal-matrix-body", modal);
    if (tbody) tbody.innerHTML = renderModalPermsRows();
    bindModalMatrixToggles();
    toast("Reset permissions to default", "info");
  });

  // Bind role save buttons
  qsa("[data-save-member]", modal).forEach((btn) => {
    btn.addEventListener("click", async () => {
      const memberId = btn.dataset.saveMember;
      const select = qs(`[data-role-select="${memberId}"]`, modal);
      const newRole = select?.value;
      if (!newRole) return;

      btn.disabled = true;
      btn.textContent = "…";
      try {
        const cap = ["requester", "viewer"].includes(newRole) ? 0 : 10;
        await api.updateMember(memberId, { role: newRole, capacity_points: cap });
        toast("Updated member role successfully", "success");
        btn.textContent = "Saved ✓";
        window.setTimeout(() => { window.location.reload(); }, 600);
      } catch (err) {
        toast(err.message || "Failed to update role", "danger");
        btn.disabled = false;
        btn.textContent = "Save";
      }
    });
  });

  // Bind pre-add member
  qs("#submit-pre-add-member", modal)?.addEventListener("click", async () => {
    const emailInput = qs("#new-member-email", modal);
    const nameInput = qs("#new-member-name", modal);
    const roleInput = qs("#new-member-role", modal);
    const errNode = qs("#pre-add-error", modal);

    const email = emailInput?.value.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      if (errNode) errNode.textContent = "Please enter a valid company email (@kkpfg.com)";
      emailInput?.focus();
      return;
    }

    let name = nameInput?.value.trim();
    if (!name) {
      const local = email.split("@")[0].replace(/[_-]/g, ".");
      name = local.split(".").filter(Boolean).map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(" ");
    }
    const role = roleInput?.value || "designer";

    const submitBtn = qs("#submit-pre-add-member", modal);
    submitBtn.disabled = true;
    submitBtn.textContent = "Adding member…";
    if (errNode) errNode.textContent = "";

    try {
      const cap = ["requester", "viewer"].includes(role) ? 0 : 10;
      await api.createMember({
        email,
        name: name || "Team Member",
        role,
        capacity_points: cap,
        is_active: true,
      });
      toast("Pre-configured member successfully", "success");
      closeModal();
      window.setTimeout(() => { window.location.reload(); }, 500);
    } catch (err) {
      if (errNode) errNode.textContent = err.message || "Failed to add member";
      submitBtn.disabled = false;
      submitBtn.textContent = "＋ Pre-configure Member";
    }
  });
}
