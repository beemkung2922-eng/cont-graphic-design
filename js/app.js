import { NAV_ITEMS, STATUS_LABELS } from "./constants.js";
import { ensureAccess, mountUser, canManage, errorMessage } from "./auth.js";
import { api, auth } from "./supabase.js";
import { escapeHtml, avatar, relativeDeadline, formatDateTime } from "./formatters.js";
import { pixelIcons } from "./pixel-icons.js";

const icons = {
  grid: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>`,
  check: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m5 12 4 4L19 6"/><path d="M4 4h16v16H4z" opacity=".25"/></svg>`,
  columns: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="4" width="6" height="16" rx="1"/><rect x="14" y="4" width="6" height="16" rx="1"/></svg>`,
  calendar: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>`,
  users: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="8" r="3"/><path d="M3 20c.4-3.1 2.3-5 6-5s5.6 1.9 6 5M16 5.2a3 3 0 0 1 0 5.6M17 15.2c2.3.5 3.7 2.1 4 4.8"/></svg>`,
  chart: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 19V5M4 19h17"/><path d="m7 15 3-4 3 2 5-7"/></svg>`,
  plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`,
  menu: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
  search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>`,
  bell: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>`,
  logout: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-5"/></svg>`,
  close: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 6 12 12M18 6 6 18"/></svg>`,
};

export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

export function toast(message, type = "info", title = "") {
  const stack = qs("#toast-stack") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "toast-stack", className: "toast-stack" }));
  const node = document.createElement("div");
  node.className = `toast is-${type}`;
  node.innerHTML = `
    <div class="toast-icon">${type === "success" ? "✓" : type === "error" ? "!" : type === "warn" ? "!" : "i"}</div>
    <div class="toast-content">
      ${title ? `<div class="toast-title">${escapeHtml(title)}</div>` : ""}
      <div>${escapeHtml(message)}</div>
    </div>
    <button class="toast-close" aria-label="ปิด">×</button>
  `;
  node.querySelector(".toast-close").addEventListener("click", () => node.remove());
  stack.appendChild(node);
  window.setTimeout(() => node.remove(), 4800);
}

export function setLoading(container, label = "กำลังโหลดข้อมูล…") {
  if (!container) return;
  container.innerHTML = `<div class="state"><div class="state-icon">◌</div><div class="state-title">${escapeHtml(label)}</div><div class="skeleton skeleton-line" style="width:220px"></div></div>`;
}

export function emptyState(title = "ยังไม่มีข้อมูล", text = "ลองเปลี่ยนตัวกรองหรือสร้างรายการใหม่") {
  return `<div class="state"><div class="state-icon">○</div><div class="state-title">${escapeHtml(title)}</div><div class="state-text">${escapeHtml(text)}</div></div>`;
}

export function errorState(error, retry = "") {
  return `<div class="state"><div class="state-icon">!</div><div class="state-title">ไม่สามารถโหลดข้อมูลได้</div><div class="state-text">${escapeHtml(errorMessage(error))}</div>${retry ? `<button class="btn btn-sm" data-retry>${escapeHtml(retry)}</button>` : ""}</div>`;
}

export function openModal({ title, body, footer = "", size = "" }) {
  closeModal();
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.id = "modal-backdrop";
  backdrop.innerHTML = `
    <section class="modal ${size ? `modal-${size}` : ""}" role="dialog" aria-modal="true">
      <div class="modal-head">
        <div class="modal-title">${title}</div>
        <button class="icon-btn" data-close-modal aria-label="ปิด">${icons.close}</button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-foot">${footer}</div>` : ""}
    </section>
  `;
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop || event.target.closest("[data-close-modal]")) closeModal();
  });
  document.body.appendChild(backdrop);
  return backdrop;
}

export function closeModal() {
  qs("#modal-backdrop")?.remove();
}

function sidebarHtml(page, member) {
  const links = NAV_ITEMS.map((item) => `
    <a class="nav-item ${item.page === page ? "is-active" : ""}" href="${item.href}">
      ${icons[item.icon]}
      <span>${item.label}</span>
      ${item.page === "tasks" ? `<span class="nav-count" id="nav-task-count">—</span>` : ""}
    </a>
  `).join("");

  return `
    <aside class="sidebar" id="sidebar">
      <div class="brand">
        <div class="brand-mark">
          <div class="brand-logo">C</div>
          <div>
            <div class="brand-name">CONT</div>
            <div class="brand-sub">Graphic Design Workflow<br />Management System</div>
          </div>
        </div>
      </div>
      <nav class="nav">
        <div class="nav-label">Workspace</div>
        ${links}
        <div class="nav-label">Help & Guide</div>
        <a class="nav-item" href="#" id="workflow-guide-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span>คู่มือ CONT Workflow</span>
        </a>
        <div class="nav-label">Account</div>
        <a class="nav-item" href="#" id="logout-link">${icons.logout}<span>ออกจากระบบ</span></a>
      </nav>
      <div class="nav-footer">
        <div class="sidebar-user">
          ${avatar(member)}
          <div>
            <div class="sidebar-user-name" data-user-name>${escapeHtml(member?.name || "Guest")}</div>
            <div class="sidebar-user-role" data-user-role>${escapeHtml(member?.role || "")}</div>
          </div>
        </div>
      </div>
    </aside>
  `;
}

function topbarHtml(page, member) {
  return `
    <header class="topbar pixel-topbar">
      <button class="icon-btn menu-toggle" id="menu-toggle" aria-label="เปิดเมนู">${pixelIcons.menu}</button>

      <!-- Left: Logo = Red rounded-square badge with white pixel skull + wordmark CONT -->
      <a class="pixel-brand" href="dashboard.html" title="CONT Graphic Design Workflow">
        <div class="pixel-logo-badge">
          ${pixelIcons.skull}
        </div>
        <span class="pixel-brand-name">CONT</span>
      </a>

      <!-- Center-left: Nav links with colored pixel icon + uppercase label -->
      <nav class="pixel-nav-links">
        <a class="pixel-nav-link ${page === "tasks" ? "is-active" : ""}" href="tasks.html" title="งานของฉัน">
          ${pixelIcons.cubeBlue}
          <span>TASKS</span>
          <span class="nav-count-badge" id="nav-task-count-top">0</span>
        </a>
        <a class="pixel-nav-link ${page === "board" ? "is-active" : ""}" href="board.html" title="บอร์ด Kanban">
          ${pixelIcons.cubeGreen}
          <span>BOARD</span>
        </a>
        <a class="pixel-nav-link ${page === "calendar" ? "is-active" : ""}" href="calendar.html" title="ปฏิทินงาน">
          ${pixelIcons.smiley}
          <span>CALENDAR</span>
        </a>
        <a class="pixel-nav-link ${page === "team" ? "is-active" : ""}" href="team.html" title="ทีม & กำลังงาน">
          ${pixelIcons.code}
          <span>TEAM</span>
        </a>
        <a class="pixel-nav-link" href="#" id="top-workflow-guide-link" title="คู่มือเวิร์กโฟลว์">
          ${pixelIcons.book}
          <span>GUIDE</span>
        </a>
      </nav>

      <!-- Right: Green dot + 1287 ONLINE counter, divider, search, notifications, red CTA button -->
      <div class="pixel-topbar-right">
        <div class="pixel-live-status">
          <span class="pixel-pulse-dot"></span>
          <span id="pixel-live-online-counter">1,287 ONLINE</span>
        </div>

        <div class="pixel-v-divider"></div>

        <div class="search-inline" style="background:#141414;border:1px solid var(--line);border-radius:0;">
          ${pixelIcons.search}
          <input id="global-search" type="search" placeholder="SEARCH..." style="background:transparent;border:0;color:#fff;font-family:var(--font-mono);font-size:0.75rem;" />
        </div>

        <!-- In-app Notification Bell -->
        <div class="notif-container">
          <button class="icon-btn" id="notifications-btn" title="การแจ้งเตือน" aria-label="การแจ้งเตือน">
            ${pixelIcons.bell}
          </button>
          <span class="notif-badge hidden" id="notif-badge">0</span>
          <div class="notif-dropdown hidden" id="notif-dropdown"></div>
        </div>

        <button class="btn-pixel btn-pixel-red" id="quick-create">
          ${pixelIcons.rocket}
          <span>JOIN FREE →</span>
        </button>
      </div>
    </header>
  `;
}


// --- Notification Center Engine ---
function buildNotifications(bundle, currentMember) {
  const notifications = [];
  const readKey = `cont_read_notifs_${currentMember.id}`;
  let readIds = [];
  try {
    readIds = JSON.parse(localStorage.getItem(readKey) || "[]");
  } catch {
    readIds = [];
  }

  const isSupervisor = currentMember.role === "supervisor" || currentMember.role === "admin";

  // SVG Icons for clean professional look (no excessive emojis)
  const notifIcons = {
    review: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    revision: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
    urgent: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`,
    comment: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
  };

  // 1. Review status notifications
  bundle.tasks.filter((t) => t.status === "review").forEach((t) => {
    const isMine = t.assignee_id === currentMember.id;
    const assignee = bundle.members.find((m) => m.id === t.assignee_id);
    if (isSupervisor || isMine) {
      notifications.push({
        id: `review_${t.id}`,
        taskId: t.id,
        type: "is-review",
        icon: notifIcons.review,
        text: isSupervisor
          ? `งาน <strong>${escapeHtml(t.title)}</strong> ส่งตรวจแบบแล้ว (โดย ${escapeHtml(assignee?.name || "สมาชิก")})`
          : `งาน <strong>${escapeHtml(t.title)}</strong> อยู่ในขั้นตอนรอคอมเมนต์ตรวจแบบ`,
        time: t.updated_at || t.created_at,
      });
    }
  });

  // 2. Revision requested notifications
  bundle.revisions.forEach((rev) => {
    const task = bundle.tasks.find((t) => t.id === rev.task_id);
    if (!task) return;
    const isMine = task.assignee_id === currentMember.id;
    if (isMine || isSupervisor) {
      notifications.push({
        id: `rev_${rev.id}`,
        taskId: task.id,
        type: "is-revision",
        icon: notifIcons.revision,
        text: `มีคำขอแก้ Version ${Number(rev.revision_number) + 1} ในงาน <strong>${escapeHtml(task.title)}</strong>: ${escapeHtml(rev.reason.slice(0, 50))}`,
        time: rev.created_at,
      });
    }
  });

  // 3. Urgent / Due soon tasks (active tasks only)
  bundle.tasks.filter((t) => t.status !== "completed").forEach((t) => {
    const isMine = t.assignee_id === currentMember.id;
    if (!isMine && !isSupervisor) return;

    const urgency = relativeDeadline(t.deadline_at || t.deadline);
    if (urgency.className === "is-overdue") {
      notifications.push({
        id: `overdue_${t.id}_${String(t.deadline_at || t.deadline).slice(0, 10)}`,
        taskId: t.id,
        type: "is-urgent",
        icon: notifIcons.urgent,
        text: `งาน <strong>${escapeHtml(t.title)}</strong> เลยกำหนดส่งแล้ว (${escapeHtml(urgency.label)})`,
        time: t.deadline_at || t.deadline,
      });
    } else if (urgency.className === "is-due-soon") {
      notifications.push({
        id: `duesoon_${t.id}_${String(t.deadline_at || t.deadline).slice(0, 10)}`,
        taskId: t.id,
        type: "is-urgent",
        icon: notifIcons.urgent,
        text: `งาน <strong>${escapeHtml(t.title)}</strong> ใกล้ถึงกำหนดส่ง (${escapeHtml(urgency.label)})`,
        time: t.deadline_at || t.deadline,
      });
    }
  });

  // 4. Recent comments (within last 3 days, from others)
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
  bundle.comments.filter((c) => c.created_at >= threeDaysAgo && c.user_id !== currentMember.id).forEach((c) => {
    const task = bundle.tasks.find((t) => t.id === c.task_id);
    if (!task) return;
    const author = bundle.members.find((m) => m.id === c.user_id);
    if (task.assignee_id === currentMember.id || isSupervisor) {
      notifications.push({
        id: `cmt_${c.id}`,
        taskId: task.id,
        type: "is-comment",
        icon: notifIcons.comment,
        text: `${escapeHtml(author?.name || "สมาชิก")} คอมเมนต์ใน <strong>${escapeHtml(task.title)}</strong>: "${escapeHtml(c.content.slice(0, 45))}"`,
        time: c.created_at,
      });
    }
  });

  // Sort by time descending
  notifications.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

  // Mark is_read
  const items = notifications.map((n) => ({
    ...n,
    is_read: readIds.includes(n.id),
  }));

  const unreadCount = items.filter((n) => !n.is_read).length;
  return { items, unreadCount, readKey, readIds };
}

function mountNotificationCenter(bundle, currentMember) {
  const notifBtn = qs("#notifications-btn");
  const badge = qs("#notif-badge");
  const dropdown = qs("#notif-dropdown");
  if (!notifBtn || !badge || !dropdown) return;

  const data = buildNotifications(bundle, currentMember);

  // Update badge
  if (data.unreadCount > 0) {
    badge.textContent = data.unreadCount > 9 ? "9+" : data.unreadCount;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }

  // Render dropdown contents
  const renderDropdown = () => {
    dropdown.innerHTML = `
      <div class="notif-header">
        <div class="notif-header-title">
          <span>การแจ้งเตือน</span>
          ${data.unreadCount > 0 ? `<span class="chip" style="background:var(--purple-100);color:var(--kkp-purple);font-weight:600">${data.unreadCount} ใหม่</span>` : ""}
        </div>
        <button class="btn-link" id="mark-all-read" style="font-size:0.75rem">ทำเครื่องหมายว่าอ่านทั้งหมด</button>
      </div>
      <div class="notif-list">
        ${data.items.length ? data.items.map((n) => `
          <a class="notif-item ${n.is_read ? "" : "is-unread"}" href="task.html?id=${encodeURIComponent(n.taskId)}" data-notif-id="${n.id}">
            <div class="notif-icon ${n.type}">${n.icon}</div>
            <div class="notif-body">
              <div class="notif-text">${n.text}</div>
              <div class="notif-time">${formatDateTime(n.time)}</div>
            </div>
          </a>
        `).join("") : `<div class="notif-empty">ไม่มีการแจ้งเตือนใหม่ในขณะนี้</div>`}
      </div>
    `;

    // Mark all as read click
    qs("#mark-all-read", dropdown)?.addEventListener("click", (e) => {
      e.stopPropagation();
      const allIds = data.items.map((i) => i.id);
      localStorage.setItem(data.readKey, JSON.stringify(allIds));
      data.items.forEach((i) => { i.is_read = true; });
      data.unreadCount = 0;
      badge.classList.add("hidden");
      renderDropdown();
      toast("ทำเครื่องหมายว่าอ่านแล้วทั้งหมด", "info");
    });

    // Individual item click: mark read
    qsa(".notif-item", dropdown).forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.dataset.notifId;
        if (id && !data.readIds.includes(id)) {
          data.readIds.push(id);
          localStorage.setItem(data.readKey, JSON.stringify(data.readIds));
        }
      });
    });
  };

  renderDropdown();

  // Toggle Dropdown
  notifBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("hidden");
  });

  // Close when clicked outside
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !notifBtn.contains(e.target)) {
      dropdown.classList.add("hidden");
    }
  });
}

export async function initShell() {
  const page = document.body.dataset.page || "dashboard";
  const access = await ensureAccess();
  if (!access.member) return null;

  document.querySelector("#sidebar-slot")?.replaceWith(
    document.createRange().createContextualFragment(sidebarHtml(page, access.member))
  );
  document.querySelector("#topbar-slot")?.replaceWith(
    document.createRange().createContextualFragment(topbarHtml(page, access.member))
  );

  mountUser(access.member);

  qsa("#logout-link").forEach((link) =>
    link.addEventListener("click", (event) => {
      event.preventDefault();
      auth.signOut();
    })
  );

  qs("#menu-toggle")?.addEventListener("click", () => {
    qs("#sidebar")?.classList.toggle("is-open");
    if (qs(".sidebar-backdrop")) qs(".sidebar-backdrop").remove();
    else {
      const backdrop = document.createElement("div");
      backdrop.className = "sidebar-backdrop";
      backdrop.addEventListener("click", () => {
        qs("#sidebar")?.classList.remove("is-open");
        backdrop.remove();
      });
      document.body.appendChild(backdrop);
    }
  });

  qs("#quick-create")?.addEventListener("click", () => window.openCreateTask?.());

  qs("#global-search")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.value.trim()) {
      window.location.href = `tasks.html?q=${encodeURIComponent(event.target.value.trim())}`;
    }
  });

  const openWorkflowGuide = (event) => {
    event?.preventDefault();
    openModal({
      title: "CONT Design Workflow Guide",
      body: `
        <div class="stack" style="gap:14px">
          <img class="workflow-modal-img" src="assets/illustrations/cont-workflow.jpg" alt="CONT Workflow Guide" />
          <div style="font-size:0.86rem;color:var(--ink-700);line-height:1.6">
            <strong style="color:var(--ink-900)">กระบวนการทำงานของระบบ CONT (Graphic Design Team):</strong><br/>
            • <strong>บรีฟเข้า (Brief):</strong> รับบรีฟ ความต้องการ ขนาด และช่องทางจัดส่งจาก Requester<br/>
            • <strong>ดัดเส้น (Drafting):</strong> ดีไซเนอร์เริ่มออกแบบ ดัดเส้น Bézier และเตรียมดราฟต์ชิ้นงาน<br/>
            • <strong>ตรวจงาน (Review):</strong> ตรวจเช็คคุณภาพ ความถูกต้อง และคอมเมนต์ขอแก้ไข (Revision) หากจำเป็น<br/>
            • <strong>ไฟนอล (Completed):</strong> ชิ้นงานผ่านเกณฑ์ ปิดจ๊อบสำเร็จ พร้อมส่งมอบไฟล์เพื่อนำไปใช้งาน
          </div>
        </div>
      `
    });
  };

  qs("#workflow-guide-link")?.addEventListener("click", openWorkflowGuide);
  qs("#top-workflow-guide-link")?.addEventListener("click", openWorkflowGuide);

  const bundle = await api.loadBundle();
  const active = bundle.tasks.filter((task) => task.status !== "completed").length;
  qs("#nav-task-count") && (qs("#nav-task-count").textContent = active);
  qs("#nav-task-count-top") && (qs("#nav-task-count-top").textContent = active);

  // Live Online Counter simulator
  const onlineEl = qs("#pixel-live-online-counter");
  if (onlineEl) {
    const baseCount = 1280;
    const updateOnline = () => {
      const count = baseCount + Math.floor(Math.random() * 15);
      onlineEl.textContent = `${count.toLocaleString()} ONLINE`;
    };
    updateOnline();
    window.setInterval(updateOnline, 8000);
  }

  // Mount In-app Notification Center
  mountNotificationCenter(bundle, access.member);


  return { ...access, ...bundle };
}

export async function boot(pageModule) {
  try {
    const context = await initShell();
    if (!context) return;
    await pageModule(context);
  } catch (error) {
    console.error(error);
    const mount = qs("#page-content");
    if (mount) mount.innerHTML = errorState(error, "ลองโหลดข้อมูลใหม่");
    toast(errorMessage(error), "error", "โหลดข้อมูลไม่สำเร็จ");
  }
}

export { icons, canManage, STATUS_LABELS };

// Interactive Mascot Motion Handler: Nong CONT Wake & Nap
window.wakeNongCont = function(container) {
  if (!container) return;
  const bubble = container.querySelector(".bubble-text");
  const wrapper = container.querySelector(".empty-img-wrapper");
  const zzz = container.querySelector(".zzz-container");
  
  if (wrapper) {
    wrapper.classList.remove("is-woken");
    void wrapper.offsetWidth; // trigger reflow
    wrapper.classList.add("is-woken");
  }
  if (zzz) zzz.style.display = "none";
  if (bubble) {
    bubble.innerHTML = "✨ ตื่นแล้ว! น้อง CONT พร้อมช่วยลุยบรีฟใหม่เสมอ กดสร้างงานได้เลย 🚀";
    bubble.parentElement.style.borderColor = "var(--ok)";
    bubble.parentElement.style.color = "var(--ok)";
    bubble.parentElement.style.background = "var(--ok-bg)";
  }
  
  clearTimeout(container._wakeTimer);
  container._wakeTimer = setTimeout(() => {
    if (bubble) {
      bubble.innerHTML = "ฮ้าวว... ยังไม่มีงานใหม่ ขอแอบงีบต่ออีกนิดนะ~ 💤";
      bubble.parentElement.style.borderColor = "";
      bubble.parentElement.style.color = "";
      bubble.parentElement.style.background = "";
    }
    if (zzz) zzz.style.display = "";
  }, 4500);
};

const currentPage = document.body.dataset.page;
const pageModules = {
  dashboard: "dashboard",
  tasks: "tasks",
  board: "board",
  task: "task",
  calendar: "calendar",
  team: "team",
  reports: "reports"
};

if (currentPage && pageModules[currentPage]) {
  import(`./${pageModules[currentPage]}.js`).then(({ render }) => boot(render));
}
