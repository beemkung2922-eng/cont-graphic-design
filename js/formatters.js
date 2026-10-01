import { STATUS_LABELS, STATUS_DOTS, PRIORITY_LABELS, PRIORITY_BADGES, ROLE_LABELS, workloadState, ACTION_LABELS } from "./constants.js";

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
  const deadline = new Date(`${value}T23:59:59`);
  const now = new Date();
  const diff = Math.ceil((deadline - now) / 86400000);
  if (diff < 0) return { label: `เลยกำหนด ${Math.abs(diff)} วัน`, className: "is-overdue" };
  if (diff === 0) return { label: "ครบกำหนดวันนี้", className: "is-due-soon" };
  if (diff <= 2) return { label: `อีก ${diff} วัน`, className: "is-due-soon" };
  return { label: `อีก ${diff} วัน`, className: "" };
}

export function statusBadge(status, compact = false) {
  const label = STATUS_LABELS[status] || status || "ไม่ระบุ";
  return `<span class="badge ${compact ? "badge-sm " : ""}${status === "completed" ? "badge-ok" : status === "review" ? "badge-warn" : status === "revision" ? "badge-danger" : status === "drafting" ? "badge-info" : "badge-neutral"}"><span class="badge-dot"></span>${escapeHtml(label)}</span>`;
}

export function priorityBadge(priority) {
  return `<span class="badge ${PRIORITY_BADGES[priority] || "badge-neutral"}">${escapeHtml(PRIORITY_LABELS[priority] || priority || "—")}</span>`;
}

export function statusDot(status) { return `<span class="badge-dot" style="color:${STATUS_DOTS[status] || "#8f8ca0"}"></span>`; }
export function roleLabel(role) { return ROLE_LABELS[role] || role || "สมาชิก"; }
export function actionLabel(action) { return ACTION_LABELS[action] || action || "อัปเดต"; }

export function workloadInfo(activeTasks = [], capacity = 10) {
  const points = activeTasks.reduce((total, task) => total + Number(task.workload_points || 0), 0);
  const percent = capacity ? Math.round((points / capacity) * 100) : 0;
  return { points, capacity, percent, state: workloadState(percent) };
}

export function progressInfo(subtasks = []) {
  const total = subtasks.length;
  const done = subtasks.filter((item) => item.is_completed).length;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}

export function projectFor(task, projects) { return projects.find((project) => project.id === task.project_id) || task.project || null; }
export function memberFor(task, members) { return members.find((member) => member.id === task.assignee_id) || task.assignee || null; }

export function taskUrgency(task) {
  const deadline = relativeDeadline(task.deadline);
  if (task.status === "completed") return "is-done";
  return deadline.className;
}

export function taskCard(task, { projects = [], members = [], subtasks = [], showAssignee = true } = {}) {
  const project = projectFor(task, projects);
  const member = memberFor(task, members);
  const progress = progressInfo(subtasks.filter((item) => item.task_id === task.id));
  const urgency = relativeDeadline(task.deadline);
  return `<article class="task-card ${urgency.className} ${task.status === "completed" ? "is-done" : ""}" data-task-id="${escapeHtml(task.id)}" tabindex="0" role="button">
    <div class="row-between"><span class="task-card-project">${escapeHtml(project?.name || "ไม่ระบุโปรเจกต์")}</span>${priorityBadge(task.priority)}</div>
    <div class="task-card-title">${escapeHtml(task.title)}</div>
    <div class="row-wrap">${statusBadge(task.status)} ${task.revision_count ? `<span class="chip">Revision ${task.revision_count}</span>` : ""}</div>
    <div class="task-card-meta">
      <div><div class="k">กำหนดส่ง</div><div class="v ${urgency.className === "is-overdue" ? "text-danger" : ""}">${formatDate(task.deadline)}</div><div class="text-xs text-muted">${escapeHtml(urgency.label)}</div></div>
      <div><div class="k">Workload</div><div class="v">${Number(task.workload_points || 0)} <small>pts</small></div></div>
      <div><div class="k">Progress</div><div class="v">${progress.total ? `${progress.done}/${progress.total}` : "—"}</div></div>
    </div>
    <div class="task-card-footer">${showAssignee && member ? `<span class="user-inline">${avatar(member, "avatar-sm")}<span class="text-sm">${escapeHtml(member.name)}</span></span>` : `<span></span>`}<span class="text-xs text-muted">เปิดรายละเอียด →</span></div>
  </article>`;
}
