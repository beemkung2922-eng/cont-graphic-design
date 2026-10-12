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

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "MB";
}

function getAvatarColor(name = "") {
  const colors = [
    "linear-gradient(135deg, #f59e0b, #d97706)",
    "linear-gradient(135deg, #10b981, #059669)",
    "linear-gradient(135deg, #06b6d4, #0891b2)",
    "linear-gradient(135deg, #3b82f6, #2563eb)",
    "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    "linear-gradient(135deg, #ec4899, #db2777)"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
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

  let currentView = "cards"; // "cards" | "table"
  let currentFilter = "all"; // "all" | "working" | "today" | "review" | "overdue" | "available"
  let currentSearch = "";

  const todayThai = "วันจันทร์ที่ 12 ตุลาคม 2569";

  /* ── 1. People Rows (Left Panel in Reference Layout) ── */
  const renderPeopleRowsHtml = () => {
    return members.map((m) => {
      const data = analyzed.find((a) => a.member.id === m.id);
      const isHead = ["supervisor", "admin"].includes(m.role);
      const isDes = m.role === "designer";
      const initials = getInitials(m.name);
      const bgGradient = getAvatarColor(m.name);

      let statusText = "พร้อมรับงาน";
      let statusColorClass = "text-green";
      if (data) {
        if (data.overdueTasks.length > 0) {
          statusText = `มีงานเลท (${data.overdueTasks.length})`;
          statusColorClass = "text-red";
        } else if (data.draftingTasks.length > 0 || data.revisionTasks.length > 0) {
          statusText = "กำลังทำชิ้นงาน";
          statusColorClass = "text-yellow";
        } else if (data.reviewTasks.length > 0) {
          statusText = "รอรีวิว";
          statusColorClass = "";
        }
      } else {
        statusText = "ผู้ขอรับบริการ";
        statusColorClass = "";
      }

      return `
        <div class="people-row">
          <div class="people-profile">
            <div class="people-avatar-circle" style="background:${bgGradient};">
              ${escapeHtml(initials)}
            </div>
            <div class="people-details">
              <div class="people-name">${escapeHtml(m.name)}</div>
              <div class="people-email">${escapeHtml(m.email || `${m.name.toLowerCase().replace(/\\s+/g, '.')}@kkpfg.com`)}</div>
            </div>
          </div>
          <div class="people-meta">
            <span class="people-role-badge ${isHead ? 'is-head' : ''}">
              ${isHead ? '👑 ' : isDes ? '🎨 ' : '📝 '}${escapeHtml(roleLabel(m.role))}
            </span>
            <span class="people-status-text ${statusColorClass}">
              ● ${escapeHtml(statusText)}
            </span>
            ${canManage(ctx.member) && isDes ? `
              <button type="button" class="btn btn-sm btn-ghost btn-quick-assign" data-member-id="${escapeHtml(m.id)}" title="มอบหมายงานให้ ${escapeHtml(m.name)}" style="padding:4px 8px;font-size:0.72rem;">
                + งาน
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join("");
  };

  /* ── 2. What Each Role Can Do (Permissions Matrix in Thai) ── */
  const permissionsList = [
    {
      action: "สร้างและเปิดบรีฟงานใหม่ (Create Tasks)",
      desc: "เปิดคำขอชิ้นงานใหม่ และระบุสเปกบรีฟ",
      head: true,
      designer: true,
      requester: true,
      viewer: false
    },
    {
      action: "รับงานและลงมือผลิต (Drafting & Work)",
      desc: "เปลี่ยนสถานะเป็นกำลังดราฟต์ และแก้งาน",
      head: true,
      designer: true,
      requester: false,
      viewer: false
    },
    {
      action: "ตรวจสอบ อนุมัติ และส่งมอบงาน (Review & Deliver)",
      desc: "ตรวจคุณภาพงาน อนุมัติแบบ และปิดจ๊อบ",
      head: true,
      designer: false,
      requester: false,
      viewer: false
    },
    {
      action: "มอบหมายงานและเปลี่ยนคนทำ (Assign Team)",
      desc: "แจกจ่ายงานให้ดีไซเนอร์ในทีมอย่างเหมาะสม",
      head: true,
      designer: false,
      requester: false,
      viewer: false
    },
    {
      action: "ส่งข้อเสนอแนะและขอแก้ไขงาน (Request Revisions)",
      desc: "คอมเมนต์จุดแก้ไข และระบุรอบแก้ไข",
      head: true,
      designer: true,
      requester: true,
      viewer: false
    },
    {
      action: "ดูรายงานสถิติและประสิทธิภาพทีม (View Reports)",
      desc: "เข้าถึงแดชบอร์ด Throughput และ SLA",
      head: true,
      designer: true,
      requester: false,
      viewer: false
    },
    {
      action: "จัดการสมาชิกและกำหนดบทบาท (Manage Roles)",
      desc: "เพิ่ม/ลบสมาชิก และตั้งค่าสิทธิ์ระบบ",
      head: true,
      designer: false,
      requester: false,
      viewer: false
    },
    {
      action: "ดาวน์โหลดชิ้นงานและไฟล์แนบ (Download Assets)",
      desc: "ดาวน์โหลดไฟล์ภาพและ Export ข้อมูล",
      head: true,
      designer: true,
      requester: true,
      viewer: true
    }
  ];

  const renderPermissionsTableHtml = () => {
    return permissionsList.map((p) => {
      return `
        <tr>
          <td>
            <div>${escapeHtml(p.action)}</div>
            <div style="font-size:0.71rem;color:#7b839f;margin-top:1px;">${escapeHtml(p.desc)}</div>
          </td>
          <td>
            ${p.head ? '<span class="perm-toggle-on" title="มีสิทธิ์ใช้งาน">✓</span>' : '<span class="perm-toggle-off">✕</span>'}
          </td>
          <td>
            ${p.designer ? '<span class="perm-toggle-on" title="มีสิทธิ์ใช้งาน">✓</span>' : '<span class="perm-toggle-off">✕</span>'}
          </td>
          <td>
            ${p.requester ? '<span class="perm-toggle-on" title="มีสิทธิ์ใช้งาน">✓</span>' : '<span class="perm-toggle-off">✕</span>'}
          </td>
          <td>
            ${p.viewer ? '<span class="perm-toggle-on" title="มีสิทธิ์ใช้งาน">✓</span>' : '<span class="perm-toggle-off">✕</span>'}
          </td>
        </tr>
      `;
    }).join("");
  };

  const renderMemberCard = (data) => {
    const { member, activeTasks, completedTasks, todayTasks, overdueTasks, currentTask, todayStatus, projectsForMember, totalItems } = data;
    const isWorkingNow = currentTask && ["drafting", "revision"].includes(currentTask.status);
    const due = currentTask ? relativeDeadline(currentTask.deadline_at || currentTask.deadline) : null;
    const isDueToday = currentTask && isToday(currentTask.deadline_at || currentTask.deadline);
    const isOverdue = due && due.className === "is-overdue";
    const extraTodayTasks = todayTasks.filter((t) => !currentTask || t.id !== currentTask.id);

    if (activeTasks.length === 0) {
      return `
        <section class="member-card is-available">
          <div class="member-head">
            ${avatar(member, "avatar-lg")}
            <div style="flex:1; min-width:0">
              <div class="member-name">${escapeHtml(member.name)}</div>
              <div class="member-role">${escapeHtml(roleLabel(member.role))}</div>
            </div>
            <span class="member-status-pill is-idle" style="background:rgba(43,209,75,0.12);color:var(--green,#2bd14b);border:1px solid var(--green,#2bd14b);">
              <span class="${todayStatus.dotClass}"></span>
              ว่าง / พร้อมรับงาน
            </span>
          </div>

          <div class="spotlight-box is-idle" style="padding:12px 14px;border-left:4px solid var(--green,#2bd14b);background:rgba(43,209,75,0.04);">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <span style="font-size:0.86rem;font-weight:600;color:var(--text-on-dark,#ffffff);">
                🟢 พร้อมรับมอบหมายงานใหม่
              </span>
              <span class="badge badge-ok">0 งานค้าง</span>
            </div>
            <div style="font-size:0.78rem;color:var(--text-dim,#a8a8a8);margin-top:6px;">
              ประวัติส่งมอบสำเร็จสะสม: <strong style="color:var(--text-on-dark,#ffffff);">${completedTasks.length} งาน</strong>
            </div>
          </div>

          <div style="margin-top:2px;">
            <button class="btn btn-primary btn-sm btn-assign-member" data-member-id="${escapeHtml(member.id)}" style="width:100%;justify-content:center;font-size:0.82rem;padding:8px 12px;">
              ＋ มอบหมายงานให้ ${escapeHtml((member?.name || "สมาชิก").split(" ")[0])}
            </button>
          </div>
        </section>
      `;
    }

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

        <div class="spotlight-box ${isOverdue ? "is-alert" : isDueToday ? "is-today" : !currentTask ? "is-idle" : ""}">
          <div class="spotlight-head">
            <span class="spotlight-tag">
              ${currentTask ? `${isWorkingNow ? "กำลังทำอยู่ตอนนี้" : "งานหลักที่กำลังโฟกัส"}` : "พร้อมรับงานใหม่"}
            </span>
            ${currentTask ? `
              <div class="row-wrap" style="gap:4px">
                ${isDueToday ? `<span class="badge badge-warn">กำหนดส่งวันนี้</span>` : ""}
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

        <div>
          <div class="text-xs text-muted" style="margin-bottom:6px; font-weight:600">
            รายการงานที่กำลังทำ (${activeTasks.length})
          </div>
          ${activeTasks.length ? activeTasks.slice(0, 5).map((task) => {
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

    let designersHtml = "";
    if (currentView === "cards") {
      designersHtml = `<div class="grid grid-2">${list.map(renderMemberCard).join("")}</div>`;
    } else {
      designersHtml = renderTableView(list);
    }

    resultsContainer.innerHTML = designersHtml;

    resultsContainer.querySelectorAll(".btn-assign-member").forEach((btn) => {
      btn.addEventListener("click", () => {
        openCreateTask(ctx, { assignee_id: btn.dataset.memberId });
      });
    });
  };

  /* ─────────── Full Page Layout ─────────── */
  qs("#page-content").innerHTML = `
    <!-- Top Header -->
    <div class="page-header">
      <div>
        <h2>ทีม & ภาพรวมการทำงาน</h2>
        <p class="page-desc">ดูภาพรวมทั้งหมดของทีมว่าแต่ละคนวันนี้ทำอะไร หรือกำลังทำอะไรอยู่ พร้อมสรุปภาระงาน</p>
      </div>
      <div class="row-wrap" style="gap:8px">
        <span class="chip" style="background:#181b2a;border:1px solid #2e334a;color:#cdd3e8;">
          <span class="pulse-circle"></span>
          ${todayThai}
        </span>
        ${canManage(ctx.member) ? `
          <button class="btn btn-secondary btn-sm" id="team-manage-members">จัดการสิทธิ์ & สมาชิก</button>
          <button class="btn btn-primary btn-sm" id="team-create-task">＋ มอบหมายงานใหม่</button>
        ` : ""}
      </div>
    </div>

    <!-- Overview Stats (5 Cards Preserved as Requested) -->
    <div class="grid grid-4" style="margin-bottom:20px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))">
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

    <!-- NEW DUAL-PANEL BENTO: People (Left) + What Each Role Can Do (Right) -->
    <div class="team-bento-dual">
      <!-- Left: People List -->
      <div class="team-bento-panel">
        <div class="team-panel-head">
          <div>
            <h3 class="team-panel-title">รายชื่อสมาชิก (People)</h3>
            <p class="team-panel-sub">${designers.length} จาก ${members.length} ที่นั่งใช้งาน (${members.length} seats registered)</p>
          </div>
          ${canManage(ctx.member) ? `
            <button type="button" class="btn btn-sm btn-ghost" id="btn-quick-manage-people" style="font-size:0.75rem;">
              จัดการสิทธิ์ ›
            </button>
          ` : ''}
        </div>
        <div class="people-rows-wrap">
          ${renderPeopleRowsHtml()}
        </div>
      </div>

      <!-- Right: What Each Role Can Do (Permissions Matrix in Thai) -->
      <div class="team-bento-panel">
        <div class="team-panel-head">
          <div>
            <h3 class="team-panel-title">สิทธิ์การใช้งานแต่ละบทบาท (What each role can do)</h3>
            <p class="team-panel-sub">หัวหน้าทีมมีสิทธิ์สูงสุดทุกด้าน; กำหนดสิทธิ์ตามหน้าที่รับผิดชอบของแต่ละบทบาท</p>
          </div>
        </div>

        <div class="perm-matrix-wrap">
          <table class="perm-matrix-table">
            <thead>
              <tr>
                <th style="width:40%;">สิทธิ์การใช้งาน (Permissions)</th>
                <th>หัวหน้าทีม</th>
                <th>ดีไซเนอร์</th>
                <th>ผู้ขอรับบริการ</th>
                <th>ผู้ชมทั่วไป</th>
              </tr>
            </thead>
            <tbody>
              ${renderPermissionsTableHtml()}
            </tbody>
          </table>
        </div>

        <!-- Role Explanations in Thai -->
        <div class="perm-roles-guide">
          <div class="perm-role-card">
            <div class="perm-role-head">
              <span>👑 หัวหน้าทีม (Team Head)</span>
            </div>
            <p class="perm-role-desc">
              ควบคุมคิวงานทั้งหมด ตรวจสอบ อนุมัติ ส่งมอบงาน มอบหมายงาน และจัดการสมาชิกในระบบ
            </p>
          </div>

          <div class="perm-role-card">
            <div class="perm-role-head">
              <span>🎨 ดีไซเนอร์ (Visual & Design)</span>
            </div>
            <p class="perm-role-desc">
              รับบรีฟงาน ลงมือดราฟต์ แก้ไขงาน ส่งงานตรวจ และดูรายงานประสิทธิภาพของตนเอง
            </p>
          </div>

          <div class="perm-role-card">
            <div class="perm-role-head">
              <span>📝 ผู้ขอรับบริการ (Requester)</span>
            </div>
            <p class="perm-role-desc">
              เปิดบรีฟงานใหม่ ติดตามสถานะชิ้นงาน และส่งข้อเสนอแนะรอบแก้ไข (Revision)
            </p>
          </div>

          <div class="perm-role-card">
            <div class="perm-role-head">
              <span>👁️ ผู้ชมทั่วไป (Viewer)</span>
            </div>
            <p class="perm-role-desc">
              ดูภาพรวมสถานะความคืบหน้าของงาน และดาวน์โหลดชิ้นงานที่เสร็จแล้ว (Read-only)
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter & View Controls for Workload Details -->
    <div style="margin-top:28px;margin-bottom:12px;">
      <h3 style="font-size:1.15rem;font-weight:700;color:#fff;margin:0 0 4px;">ภาพรวมภาระงานและรายการงานปัจจุบัน (Workload & Tasks)</h3>
      <p style="font-size:0.8rem;color:#8b92ad;margin:0;">คลิกตรวจสอบงานที่กำลังทำ หรือมอบหมายงานใหม่ให้ดีไซเนอร์</p>
    </div>

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
          กำลังทำอยู่ <span class="pill-count">(${workingMembersAll.length})</span>
        </button>
        <button class="filter-pill" data-filter="today">
          ส่งวันนี้ <span class="pill-count">(${analyzed.filter((a) => a.todayTasks.length > 0).length})</span>
        </button>
        <button class="filter-pill" data-filter="review">
          รอตรวจ <span class="pill-count">(${analyzed.filter((a) => a.reviewTasks.length > 0).length})</span>
        </button>
        <button class="filter-pill" data-filter="overdue">
          งานเลท <span class="pill-count">(${analyzed.filter((a) => a.overdueTasks.length > 0).length})</span>
        </button>
        <button class="filter-pill" data-filter="available">
          พร้อมรับงาน <span class="pill-count">(${idleMembersAll.length})</span>
        </button>
      </div>

      <div class="team-view-toggle">
        <button class="team-view-btn is-active" data-view="cards" title="มุมมองการ์ดรายละเอียด">
          การ์ดสมาชิก
        </button>
        <button class="team-view-btn" data-view="table" title="มุมมองตารางภาพรวม">
          ตารางภาพรวม
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

  qs("#team-manage-members")?.addEventListener("click", () => openManageTeamModal(ctx));
  qs("#btn-quick-manage-people")?.addEventListener("click", () => openManageTeamModal(ctx));
  qs("#team-create-task")?.addEventListener("click", () => openCreateTask(ctx));

  // Quick Assign on people list rows
  qsa(".btn-quick-assign").forEach((btn) => {
    btn.addEventListener("click", () => {
      openCreateTask(ctx, { assignee_id: btn.dataset.memberId });
    });
  });

  renderContent();
}

export function openManageTeamModal(ctx) {
  if (!canManage(ctx.member)) {
    toast("เฉพาะ Team Head of Visual & Design เท่านั้นที่จัดการสิทธิ์ได้", "warn");
    return;
  }

  const memberRows = ctx.members.map((m) => `
    <tr data-member-row="${escapeHtml(m.id)}">
      <td>
        <div class="row" style="gap:10px; align-items:center">
          ${avatar(m, "avatar-sm")}
          <div>
            <div style="font-weight:600">${escapeHtml(m.name)}</div>
            <div class="text-xs text-muted">${escapeHtml(m.email)}</div>
          </div>
        </div>
      </td>
      <td>
        <select class="input-sm" data-role-select="${escapeHtml(m.id)}" style="min-width:210px">
          <option value="designer" ${m.role === "designer" ? "selected" : ""}>Visual & Design (ดีไซเนอร์)</option>
          <option value="supervisor" ${["supervisor", "admin"].includes(m.role) ? "selected" : ""}>Team Head (หัวหน้าทีม)</option>
          <option value="requester" ${m.role === "requester" ? "selected" : ""}>ผู้ขอรับบริการ (Requester)</option>
          <option value="viewer" ${m.role === "viewer" ? "selected" : ""}>ผู้เข้าชมทั่วไป (Viewer)</option>
        </select>
      </td>
      <td>
        <button class="btn btn-primary btn-sm" data-save-member="${escapeHtml(m.id)}">บันทึก</button>
      </td>
    </tr>
  `).join("");

  const body = `
    <div class="stack" style="gap:20px">
      <!-- Member Roles List -->
      <div>
        <div style="font-weight:700; margin-bottom:4px">รายชื่อสมาชิกและสิทธิ์การใช้งาน</div>
        <div class="text-xs text-muted" style="margin-bottom:12px">
          กำหนดสิทธิ์ระหว่าง <strong>Visual & Design</strong>, <strong>Team Head</strong>, <strong>ผู้ขอรับบริการ (Requester)</strong> หรือ <strong>ผู้เข้าชม (Viewer)</strong> ได้ทันที
        </div>
        <div style="overflow-x:auto; border:1px solid var(--border); border-radius:8px">
          <table class="table" style="width:100%; font-size:0.88rem; margin:0">
            <thead>
              <tr style="background:var(--bg-muted, #f8fafc)">
                <th>สมาชิก</th>
                <th>สิทธิ์การใช้งาน</th>
                <th style="width:90px">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${memberRows}
            </tbody>
          </table>
        </div>
      </div>

      <hr style="border:0; border-top:1px solid var(--border)"/>

      <!-- Pre-configure New Member Form -->
      <div>
        <div style="font-weight:700; margin-bottom:4px">＋ เพิ่มสมาชิกล่วงหน้า (Pre-configure Member)</div>
        <div class="text-xs text-muted" style="margin-bottom:12px">
          ระบุอีเมลบริษัทไว้ล่วงหน้า เมื่อสมาชิกท่านนั้นล็อกอินด้วยรหัส OTP จะได้รับชื่อและสิทธิ์ที่กำหนดไว้ทันที
        </div>
        <form id="pre-add-member-form" class="stack" style="gap:12px">
          <div class="form-grid">
            <div class="field field-full">
              <label for="new-member-email">อีเมลบริษัท (@kkpfg.com) *</label>
              <input id="new-member-email" type="email" placeholder="เช่น somchai.p@kkpfg.com" required />
            </div>
            <div class="field">
              <label for="new-member-name">ชื่อ-นามสกุล (เว้นว่างไว้จะดึงจากอีเมล)</label>
              <input id="new-member-name" placeholder="เช่น Somchai Prasert" />
            </div>
            <div class="field">
              <label for="new-member-role">สิทธิ์การใช้งาน</label>
              <select id="new-member-role">
                <option value="designer">Visual & Design (Designer)</option>
                <option value="supervisor">Team Head of Visual & Design</option>
                <option value="requester" selected>ผู้ขอรับบริการ (Requester)</option>
                <option value="viewer">ผู้เข้าชมทั่วไป (Viewer)</option>
              </select>
            </div>
          </div>
          <div id="pre-add-error" class="error-text"></div>
          <button type="button" class="btn btn-secondary" id="submit-pre-add-member" style="align-self:flex-start">
            ＋ เพิ่มสมาชิกล่วงหน้า
          </button>
        </form>
      </div>
    </div>
  `;

  const modal = openModal({
    title: "จัดการสิทธิ์ & สมาชิกทีม",
    body,
    footer: `<button class="btn" data-close-modal>ปิด</button>`,
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
        toast("อัปเดตสิทธิ์เรียบร้อยแล้ว", "success");
        btn.textContent = "สำเร็จ ✓";
        window.setTimeout(() => { window.location.reload(); }, 600);
      } catch (err) {
        toast(err.message || "ไม่สามารถอัปเดตสิทธิ์ได้", "danger");
        btn.disabled = false;
        btn.textContent = "บันทึก";
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
      if (errNode) errNode.textContent = "กรุณากรอกอีเมลบริษัทให้ถูกต้อง";
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
    submitBtn.textContent = "กำลังเพิ่มสมาชิก…";
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
      toast("เพิ่มสมาชิกล่วงหน้าเรียบร้อยแล้ว", "success");
      closeModal();
      window.setTimeout(() => { window.location.reload(); }, 500);
    } catch (err) {
      if (errNode) errNode.textContent = err.message || "ไม่สามารถเพิ่มสมาชิกได้";
      submitBtn.disabled = false;
      submitBtn.textContent = "＋ เพิ่มสมาชิกล่วงหน้า";
    }
  });
}
