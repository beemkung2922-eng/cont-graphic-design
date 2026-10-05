import { STATUS_LABELS, STATUS_DOTS, ROLE_LABELS, ACTION_LABELS, TASK_TYPE_LABELS } from "./constants.js";

export const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));

export function initials(name = "?") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

export function avatar(member, size = "") {
  if (!member) return `<span class="avatar ${size}">?</span>`;
  const image = member.avatar_url ? `<img src="${escapeHtml(member.avatar_url)}" alt="" />` : escapeHtml(initials(member.name));
  return `<span class="avatar ${size}" title="${escapeHtml(member.name)}">${image}</span>`;
}

export function formatDate(value, options = {}) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", ...(options.withYear ? { year: "numeric" } : {}), ...options }).format(date);
}

export function formatDateLong(value) { return formatDate(value, { withYear: true }); }
export function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function relativeDeadline(value) {
  if (!value) return { label: "ไม่มีกำหนด", className: "" };
  const raw = String(value); const deadline = raw.includes("T") ? new Date(raw) : new Date(`${raw}T23:59:59`); const now = new Date(); const minutes = Math.round((deadline - now) / 60000);
  if (minutes < 0) { const late = Math.abs(minutes); const hours = Math.floor(late / 60); const mins = late % 60; return { label: `เลท ${hours} ชม. ${mins} นาที`, className: "is-overdue", lateMinutes: late }; }
  if (minutes <= 120) return { label: minutes < 60 ? `เหลือ ${minutes} นาที` : `เหลือ ${Math.floor(minutes / 60)} ชม. ${minutes % 60} นาที`, className: "is-due-soon", lateMinutes: 0 };
  const days = Math.floor(minutes / 1440); return { label: days ? `อีก ${days} วัน` : `เหลือ ${Math.floor(minutes / 60)} ชม. ${minutes % 60} นาที`, className: "" , lateMinutes: 0};
}

export function statusBadge(status, compact = false) {
  const label = STATUS_LABELS[status] || status || "ไม่ระบุ";
  return `<span class="badge ${compact ? "badge-sm " : ""}${status === "completed" ? "badge-ok" : status === "review" ? "badge-warn" : status === "revision" ? "badge-danger" : status === "drafting" ? "badge-info" : "badge-neutral"}"><span class="badge-dot"></span>${escapeHtml(label)}</span>`;
}

export function priorityBadge() { return ""; }
export function taskTypeLabel(type) { return TASK_TYPE_LABELS[type] || type || "ไม่ระบุประเภท"; }

export function statusDot(status) { return `<span class="badge-dot" style="color:${STATUS_DOTS[status] || "#8f8ca0"}"></span>`; }
export function roleLabel(role) { return ROLE_LABELS[role] || role || "สมาชิก"; }
export function actionLabel(action) { return ACTION_LABELS[action] || action || "อัปเดต"; }

export function workloadInfo(activeTasks = []) { return { tasks: activeTasks.length, items: activeTasks.reduce((sum, task) => sum + Number(task.item_count || 1), 0) }; }

export function progressInfo(subtasks = []) {
  const total = subtasks.length;
  const done = subtasks.filter((item) => item.is_completed).length;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}

export function projectFor(task, projects) { return projects.find((project) => project.id === task.project_id) || task.project || null; }
export function memberFor(task, members) { return members.find((member) => member.id === task.assignee_id) || task.assignee || null; }

export function taskUrgency(task) {
  const deadline = relativeDeadline(task.deadline_at || task.deadline);
  if (task.status === "completed") return "is-done";
  return deadline.className;
}

export function taskCard(task, { projects = [], members = [], subtasks = [], showAssignee = true } = {}) {
  const project = projectFor(task, projects);
  const member = memberFor(task, members);
  const progress = progressInfo(subtasks.filter((item) => item.task_id === task.id));
  const urgency = relativeDeadline(task.deadline_at || task.deadline);
  const previewHtml = task.preview_url ? `<div class="task-card-preview"><img src="${escapeHtml(task.preview_url)}" alt="Artwork" loading="lazy" /></div>` : "";
  const designLinkHtml = task.design_url ? `<a href="${escapeHtml(task.design_url)}" target="_blank" rel="noopener" class="task-card-link-badge" title="เปิดไฟล์งานออกแบบ (Figma/Drive)" onclick="event.stopPropagation()">Design File ↗</a>` : "";
  const formatTagHtml = task.dimensions ? `<span class="task-card-format-tag" title="ขนาด">${escapeHtml(task.dimensions)}</span>` : (task.channel ? `<span class="task-card-format-tag">${escapeHtml(task.channel)}</span>` : "");

  return `<article class="task-card ${urgency.className} ${task.status === "completed" ? "is-done" : ""}" data-task-id="${escapeHtml(task.id)}" tabindex="0" role="button">
    ${previewHtml}
    <div class="row-between">
      <span class="task-card-project">${escapeHtml(project?.name || "ไม่ระบุโปรเจกต์")}</span>
      <div class="row-wrap" style="gap:4px">
        ${designLinkHtml}
        <span class="chip">${escapeHtml(taskTypeLabel(task.task_type))}</span>
      </div>
    </div>
    <div class="task-card-title">${escapeHtml(task.title)}</div>
    <div class="row-wrap" style="gap:5px">
      ${statusBadge(task.status)}
      ${task.revision_count ? `<span class="chip" style="background:var(--danger-bg);color:var(--danger);border-color:var(--danger-line)">v${Number(task.revision_count) + 1} (Rev ${task.revision_count})</span>` : `<span class="chip">v1 (Initial)</span>`}
      ${formatTagHtml}
    </div>
    <div class="task-card-meta">
      <div><div class="k">กำหนดส่ง</div><div class="v ${urgency.className === "is-overdue" ? "text-danger" : ""}">${formatDate(task.deadline_at || task.deadline)}</div><div class="text-xs text-muted">${escapeHtml(urgency.label)}</div></div>
      <div><div class="k">จำนวนชิ้น</div><div class="v">${Number(task.item_count || 1)} <small>ชิ้น</small></div></div>
      <div><div class="k">Progress</div><div class="v">${progress.total ? `${progress.done}/${progress.total}` : "—"}</div></div>
    </div>
    <div class="task-card-footer">${showAssignee && member ? `<span class="user-inline">${avatar(member, "avatar-sm")}<span class="text-sm">${escapeHtml(member.name)}</span></span>` : `<span></span>`}<span class="text-xs text-muted">เปิดรายละเอียด →</span></div>
  </article>`;
}
