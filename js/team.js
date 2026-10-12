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

  let currentMainTab = "workload"; // "workload" | "permissions" | "people"
  let currentView = "table"; // "table" | "cards"
  let currentFilter = "all"; // "all" | "working" | "today" | "review" | "overdue" | "available"
  let currentSearch = "";

  const todayThai = "วันจันทร์ที่ 12 ตุลาคม 2569";

  /* ─── 1. People Rows (High-Contrast Clean Rows) ─── */
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
        statusText = "ผู้ขอรับบริการ (Requester)";
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
              <button type="button" class="btn btn-sm btn-ghost btn-quick-assign" data-member-id="${escapeHtml(m.id)}" title="มอบหมายงานให้ ${escapeHtml(m.name)}" style="padding:5px 10px;font-size:0.75rem;">
                + มอบหมายงาน
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join("");
  };

  /* ─── 2. Permissions Matrix Table (Thai) ─── */
  const permissionsList = [
    {
      action: "สร้างและเปิดบรีฟงานใหม่ (Create Tasks)",
      desc: "เปิดคำขอชิ้นงานใหม่ กรอกขนาด ช่องทาง และสเปกบรีฟ",
      head: true,
      designer: true,
      requester: true,
      viewer: false
    },
    {
      action: "รับงานและลงมือผลิต (Drafting & Work)",
      desc: "เปลี่ยนสถานะเป็นกำลังดราฟต์ ทำอาร์ตเวิร์ก และแก้งาน",
      head: true,
      designer: true,
      requester: false,
      viewer: false
    },
    {
      action: "ตรวจสอบ อนุมัติ และส่งมอบงาน (Review & Deliver)",
      desc: "ตรวจคุณภาพงาน อนุมัติแบบ และส่งมอบงานสำเร็จ",
      head: true,
      designer: false,
      requester: false,
      viewer: false
    },
    {
      action: "มอบหมายงานและเปลี่ยนคนทำ (Assign Team)",
      desc: "แจกจ่ายงานให้ดีไซเนอร์ในทีมตามคิวงานที่เหมาะสม",
      head: true,
      designer: false,
      requester: false,
      viewer: false
    },
    {
      action: "ส่งข้อเสนอแนะและขอแก้ไขงาน (Request Revisions)",
      desc: "คอมเมนต์จุดแก้ไข และระบุรอบแก้ไขงาน",
      head: true,
      designer: true,
      requester: true,
      viewer: false
    },
    {
      action: "ดูรายงานสถิติและประสิทธิภาพทีม (View Reports)",
      desc: "เข้าถึงแดชบอร์ดสรุป Throughput, Heatmap และ SLA",
      head: true,
      designer: true,
      requester: false,
      viewer: false
    },
    {
      action: "จัดการสมาชิกและกำหนดบทบาท (Manage Roles)",
      desc: "เพิ่ม/ลบสมาชิก และตั้งค่าสิทธิ์ผู้ใช้งานในระบบ",
      head: true,
      designer: false,
      requester: false,
      viewer: false
    },
    {
      action: "ดาวน์โหลดชิ้นงานและไฟล์แนบ (Download Assets)",
      desc: "ดาวน์โหลดไฟล์ภาพที่เสร็จแล้ว และ Export ข้อมูลรายงาน",
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
            <div style="font-weight:600;color:#f8fafc;">${escapeHtml(p.action)}</div>
            <div style="font-size:0.75rem;color:#94a3b8;margin-top:2px;">${escapeHtml(p.desc)}</div>
          </td>
          <td>
            ${p.head ? '<span class="perm-toggle-on" title="มีสิทธิ์">✓</span>' : '<span class="perm-toggle-off">✕</span>'}
          </td>
          <td>
            ${p.designer ? '<span class="perm-toggle-on" title="มีสิทธิ์">✓</span>' : '<span class="perm-toggle-off">✕</span>'}
          </td>
          <td>
            ${p.requester ? '<span class="perm-toggle-on" title="มีสิทธิ์">✓</span>' : '<span class="perm-toggle-off">✕</span>'}
          </td>
          <td>
            ${p.viewer ? '<span class="perm-toggle-on" title="มีสิทธิ์">✓</span>' : '<span class="perm-toggle-off">✕</span>'}
          </td>
        </tr>
      `;
    }).join("");
  };

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

  const renderActiveTabContent = () => {
    const container = qs("#team-tab-content-slot");
    if (!container) return;

    if (currentMainTab === "permissions") {
      // Permissions Matrix View
      container.innerHTML = `
        <div class="team-bento-panel" style="margin-bottom:24px;">
          <div class="team-panel-head">
            <div>
              <h3 class="team-panel-title">สิทธิ์การใช้งานแต่ละบทบาท (What each role can do)</h3>
              <p class="team-panel-sub">หัวหน้าทีมมีสิทธิ์สูงสุดทุกด้าน; กำหนดสิทธิ์ตามหน้าที่รับผิดชอบของแต่ละบทบาท</p>
            </div>
            ${canManage(ctx.member) ? `
              <button type="button" class="btn btn-sm btn-secondary" id="btn-perm-manage-members">
                ⚙️ แก้ไขสิทธิ์สมาชิก
              </button>
            ` : ''}
          </div>

          <div class="perm-matrix-wrap">
            <table class="perm-matrix-table">
              <thead>
                <tr>
                  <th style="width:42%;">สิทธิ์การใช้งาน (Permissions)</th>
                  <th>👑 หัวหน้าทีม (Head)</th>
                  <th>🎨 ดีไซเนอร์ (Designer)</th>
                  <th>📝 ผู้ขอรับบริการ (Requester)</th>
                  <th>👁️ ผู้ชมทั่วไป (Viewer)</th>
                </tr>
              </thead>
              <tbody>
                ${renderPermissionsTableHtml()}
              </tbody>
            </table>
          </div>

          <div class="perm-roles-guide">
            <div class="perm-role-card">
              <div class="perm-role-head">
                <span>👑 หัวหน้าทีม (Team Head / Supervisor)</span>
              </div>
              <p class="perm-role-desc">
                มีสิทธิ์สูงสุดในการควบคุมคิวงานทั้งหมด ตรวจสอบ อนุมัติ ส่งมอบงาน มอบหมายงาน และจัดการสมาชิกในระบบ
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
      `;
      qs("#btn-perm-manage-members")?.addEventListener("click", () => openManageTeamModal(ctx));
      return;
    }

    if (currentMainTab === "people") {
      // People List View
      container.innerHTML = `
        <div class="team-bento-panel" style="margin-bottom:24px;">
          <div class="team-panel-head">
            <div>
              <h3 class="team-panel-title">สมาชิกในทีมทั้งหมด (People List)</h3>
              <p class="team-panel-sub">${members.length} สมาชิกที่ลงทะเบียนในระบบ (${designers.length} ดีไซเนอร์ · ${requesters.length} ผู้ขอรับบริการ)</p>
            </div>
            ${canManage(ctx.member) ? `
              <button type="button" class="btn btn-sm btn-secondary" id="btn-people-manage-members">
                ⚙️ จัดการสิทธิ์ & สมาชิก
              </button>
            ` : ''}
          </div>
          <div class="people-rows-wrap">
            ${renderPeopleRowsHtml()}
          </div>
        </div>
      `;
      qs("#btn-people-manage-members")?.addEventListener("click", () => openManageTeamModal(ctx));
      container.querySelectorAll(".btn-quick-assign").forEach((btn) => {
        btn.addEventListener("click", () => {
          openCreateTask(ctx, { assignee_id: btn.dataset.memberId });
        });
      });
      return;
    }

    // Default: Workload & Tasks View
    const list = getFilteredData();
    let workloadContent = "";

    if (!list.length) {
      workloadContent = `
        <div class="card" style="background:#141828;border:1px solid #2b344c;text-align:center;padding:36px 20px;">
          <div style="font-size:1.5rem;margin-bottom:8px;">○</div>
          <div style="font-size:1rem;font-weight:700;color:#ffffff;margin-bottom:4px;">ไม่พบสมาชิกตามตัวกรองที่เลือก</div>
          <div style="font-size:0.82rem;color:#94a3b8;">ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองสถานะอื่น</div>
          <button class="btn btn-sm btn-secondary" id="reset-team-filter" style="margin-top:14px;">ล้างตัวกรองทั้งหมด</button>
        </div>
      `;
    } else if (currentView === "cards") {
      workloadContent = `<div class="grid grid-2">${list.map(renderMemberCard).join("")}</div>`;
    } else {
      workloadContent = renderTableView(list);
    }

    container.innerHTML = `
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
      <div id="team-workload-results-slot">
        ${workloadContent}
      </div>
    `;

    // Bind workload search and filters
    qs("#team-search-input")?.addEventListener("input", (e) => {
      currentSearch = e.target.value.trim();
      renderActiveTabContent();
    });

    qsa(".filter-pills .filter-pill", container).forEach((btn) => {
      btn.addEventListener("click", () => {
        currentFilter = btn.dataset.filter;
        renderActiveTabContent();
      });
    });

    qsa(".team-view-toggle .team-view-btn", container).forEach((btn) => {
      btn.addEventListener("click", () => {
        currentView = btn.dataset.view;
        renderActiveTabContent();
      });
    });

    qs("#reset-team-filter", container)?.addEventListener("click", () => {
      currentFilter = "all";
      currentSearch = "";
      renderActiveTabContent();
    });

    container.querySelectorAll(".btn-assign-member").forEach((btn) => {
      btn.addEventListener("click", () => {
        openCreateTask(ctx, { assignee_id: btn.dataset.memberId });
      });
    });
  };

  /* ─────────── Full Page Shell ─────────── */
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

    <!-- Overview Stats: 5 High-Contrast Bento Cards (Preserved exactly as requested) -->
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

    <!-- Modern Segmented Navigation Tabs (Solves cluttered view) -->
    <div class="team-nav-tabs">
      <button type="button" class="team-nav-tab is-active" data-main-tab="workload">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        <span>ภาพรวมภาระงานวันนี้ (Workload & Tasks)</span>
      </button>
      <button type="button" class="team-nav-tab" data-main-tab="permissions">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span>สิทธิ์การใช้งานแต่ละบทบาท (What each role can do)</span>
      </button>
      <button type="button" class="team-nav-tab" data-main-tab="people">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span>รายชื่อสมาชิกในทีม (People List)</span>
      </button>
    </div>

    <!-- Active Tab Content Container -->
    <div id="team-tab-content-slot"></div>
  `;

  // Bind Main Navigation Tabs
  qsa(".team-nav-tabs .team-nav-tab").forEach((tabBtn) => {
    tabBtn.addEventListener("click", () => {
      qsa(".team-nav-tabs .team-nav-tab").forEach((b) => b.classList.remove("is-active"));
      tabBtn.classList.add("is-active");
      currentMainTab = tabBtn.dataset.mainTab;
      renderActiveTabContent();
    });
  });

  // Top header button listeners
  qs("#team-manage-members")?.addEventListener("click", () => openManageTeamModal(ctx));
  qs("#team-create-task")?.addEventListener("click", () => openCreateTask(ctx));

  renderActiveTabContent();
}

/* ─── Manage Team Modal (Fixes white box & invisible text in Image 3) ─── */
export function openManageTeamModal(ctx) {
  if (!canManage(ctx.member)) {
    toast("เฉพาะ Team Head of Visual & Design เท่านั้นที่จัดการสิทธิ์ได้", "warn");
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
          <option value="designer" ${m.role === "designer" ? "selected" : ""}>🎨 Visual & Design (ดีไซเนอร์)</option>
          <option value="supervisor" ${["supervisor", "admin"].includes(m.role) ? "selected" : ""}>👑 Team Head (หัวหน้าทีม)</option>
          <option value="requester" ${m.role === "requester" ? "selected" : ""}>📝 ผู้ขอรับบริการ (Requester)</option>
          <option value="viewer" ${m.role === "viewer" ? "selected" : ""}>👁️ ผู้เข้าชมทั่วไป (Viewer)</option>
        </select>
      </td>
      <td style="text-align:right;">
        <button class="btn-modal-save" data-save-member="${escapeHtml(m.id)}">บันทึก</button>
      </td>
    </tr>
  `).join("");

  const body = `
    <div class="stack" style="gap:20px;">
      <!-- Member Roles List -->
      <div>
        <div style="font-weight:700;color:#ffffff;font-size:0.95rem;margin-bottom:4px;">รายชื่อสมาชิกและสิทธิ์การใช้งาน</div>
        <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:14px;">
          กำหนดสิทธิ์ระหว่าง <strong>Visual & Design (ดีไซเนอร์)</strong>, <strong>Team Head (หัวหน้าทีม)</strong>, <strong>ผู้ขอรับบริการ (Requester)</strong> หรือ <strong>ผู้เข้าชม (Viewer)</strong>
        </div>
        <div style="overflow-x:auto; border:1px solid #283148; border-radius:8px;">
          <table class="modal-role-table" style="width:100%; margin:0;">
            <thead>
              <tr>
                <th>สมาชิก</th>
                <th>สิทธิ์การใช้งาน</th>
                <th style="width:100px;text-align:right;">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${memberRows}
            </tbody>
          </table>
        </div>
      </div>

      <hr style="border:0; border-top:1px solid #283148; margin:4px 0;"/>

      <!-- Pre-configure New Member Form -->
      <div>
        <div style="font-weight:700;color:#ffffff;font-size:0.95rem;margin-bottom:4px;">＋ เพิ่มสมาชิกล่วงหน้า (Pre-configure Member)</div>
        <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:12px;">
          ระบุอีเมลบริษัทไว้ล่วงหน้า เมื่อสมาชิกท่านนั้นล็อกอินด้วยรหัส OTP จะได้รับชื่อและสิทธิ์ที่กำหนดไว้ทันที
        </div>
        <form id="pre-add-member-form" class="stack" style="gap:12px;">
          <div class="form-grid">
            <div class="field field-full">
              <label for="new-member-email" style="color:#cbd5e1;font-size:0.8rem;font-weight:600;">อีเมลบริษัท (@kkpfg.com) *</label>
              <input id="new-member-email" type="email" placeholder="เช่น somchai.p@kkpfg.com" class="input-clean" required />
            </div>
            <div class="field">
              <label for="new-member-name" style="color:#cbd5e1;font-size:0.8rem;font-weight:600;">ชื่อ-นามสกุล (เว้นว่างไว้จะดึงจากอีเมล)</label>
              <input id="new-member-name" placeholder="เช่น Somchai Prasert" class="input-clean" />
            </div>
            <div class="field">
              <label for="new-member-role" style="color:#cbd5e1;font-size:0.8rem;font-weight:600;">สิทธิ์การใช้งาน</label>
              <select id="new-member-role" class="modal-role-select">
                <option value="designer">🎨 Visual & Design (ดีไซเนอร์)</option>
                <option value="supervisor">👑 Team Head (หัวหน้าทีม)</option>
                <option value="requester" selected>📝 ผู้ขอรับบริการ (Requester)</option>
                <option value="viewer">👁️ ผู้เข้าชมทั่วไป (Viewer)</option>
              </select>
            </div>
          </div>
          <div id="pre-add-error" class="error-text"></div>
          <button type="button" class="btn btn-secondary" id="submit-pre-add-member" style="align-self:flex-start;margin-top:6px;">
            ＋ เพิ่มสมาชิกล่วงหน้า
          </button>
        </form>
      </div>
    </div>
  `;

  const modal = openModal({
    title: "จัดการสิทธิ์ & สมาชิกทีม",
    body,
    footer: `<button class="btn btn-ghost" data-close-modal>ปิด</button>`,
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
