import { NAV_ITEMS, STATUS_LABELS } from "./constants.js";
import { ensureAccess, mountUser, canManage, errorMessage } from "./auth.js";
import { api, auth } from "./supabase.js";
import { escapeHtml, avatar, relativeDeadline, formatDateTime } from "./formatters.js";

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
  palette: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.5-1.1-.3-.3-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16c3.3 0 6-2.7 6-6 0-5.5-4.5-10-10-10z"/></svg>`,
};

export const qs = (selector, root = document) => root.querySelector(selector);
export const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];

export function toast(message, type = "info", title = "") {
  const stack = qs("#toast-stack") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "toast-stack", className: "toast-stack" }));
  const node = document.createElement("div");
  node.className = `toast is-${type}`;
  node.innerHTML = `
    <div class="toast-icon">${type === "success" ? "✓" : type === "error" ? "!" : type === "warn" ? "⚠" : "i"}</div>
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

// --- KKP Brand Assets Hub Modal ---
export function openBrandKitModal() {
  const KKP_COLORS = [
    { name: "KKP Primary Purple", hex: "#544C70", desc: "สีม่วงหลักประจำอัตลักษณ์องค์กร KKP" },
    { name: "KKP Deep Purple", hex: "#3F3A56", desc: "สีม่วงเข้ม คอนทราสต์สูงสำหรับข้อความ/หัวข้อ" },
    { name: "KKP Soft Purple", hex: "#6E6790", desc: "สีม่วงละมุน สำหรับเส้นขอบและป้ายกำกับ" },
    { name: "KKP Light Surface", hex: "#F6F5F9", desc: "สีพื้นหลังซอฟต์ของระบบ" },
    { name: "Corporate Green", hex: "#1F7A4D", desc: "สีเขียวสถานะ สำเร็จ/ส่งมอบงาน" },
    { name: "Corporate Gold", hex: "#A9701B", desc: "สีทองพรีเมียม / สถานะรอตรวจแบบ" },
    { name: "Corporate Red", hex: "#B3261E", desc: "สีแดงแจ้งเตือน / งานด่วน / แก้งาน" },
    { name: "KKP Dark Ink", hex: "#1C1A2B", desc: "สีตัวอักษรเนื้อหาหลัก" },
  ];

  const body = `
    <div class="stack">
      <div>
        <div style="font-weight:600;font-size:0.9rem;margin-bottom:4px;color:var(--ink-900)">
          🎨 จานสีประจำแบรนด์ KKP (Official Color Palette)
        </div>
        <p class="text-xs text-muted" style="margin-bottom:12px">คลิกที่การ์ดสีเพื่อคัดลอกรหัส HEX Code ไปใช้งานใน Figma / Photoshop ทันที</p>
      </div>

      <div class="brand-hub-grid">
        ${KKP_COLORS.map((c) => `
          <div class="brand-color-card" data-copy-hex="${c.hex}" title="คลิกเพื่อคัดลอก ${c.hex}">
            <div class="brand-color-swatch" style="background:${c.hex}"></div>
            <div class="brand-color-meta">
              <div class="brand-color-name">${c.name}</div>
              <div class="brand-color-hex">
                <span>${c.hex}</span>
                <span style="font-size:0.65rem;color:var(--kkp-purple)">📋 คัดลอก</span>
              </div>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="divider"></div>

      <div>
        <div style="font-weight:600;font-size:0.9rem;margin-bottom:8px;color:var(--ink-900)">
          🔤 แบบอักษรทางการ (Typography)
        </div>
        <div class="card" style="padding:12px;background:var(--surface-alt)">
          <div style="font-weight:600;color:var(--ink-900)">Primary Web/App Font: IBM Plex Sans Thai</div>
          <div class="text-xs text-muted" style="margin-top:2px">
            น้ำหนักแนะนำ: Regular 400 (เนื้อหาทั่วไป), Medium 500 (ปุ่มและแท็ก), SemiBold 600 (หัวข้อใหญ่)
          </div>
        </div>
      </div>

      <div class="divider"></div>

      <div>
        <div style="font-weight:600;font-size:0.9rem;margin-bottom:8px;color:var(--ink-900)">
          📦 ทรัพยากรและไฟล์ดาวน์โหลด (Official Assets)
        </div>
        <div class="brand-links-list">
          <div class="brand-link-item">
            <div>
              <strong>📐 Standard Dimensions Cheatsheet</strong>
              <div class="text-xs text-muted">ขนาดมาตรฐาน: 1080x1080 (1:1), 1080x1920 (9:16), 1920x1080 (16:9), GDN 300x250</div>
            </div>
            <span class="badge badge-neutral">Standard</span>
          </div>
          <div class="brand-link-item">
            <div>
              <strong>📘 KKP Visual & Design Guidelines 2026</strong>
              <div class="text-xs text-muted">คู่มือการใช้โลโก้ พื้นที่ว่าง และข้อห้ามในการจัดวาง</div>
            </div>
            <span class="badge badge-info">PDF</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const modal = openModal({
    title: "🎨 KKP Brand Assets & Color Kit",
    body,
    size: "lg",
    footer: `<button class="btn btn-primary" data-close-modal>ปิด</button>`
  });

  qsa("[data-copy-hex]", modal).forEach((card) => {
    card.addEventListener("click", () => {
      const hex = card.dataset.copyHex;
      navigator.clipboard.writeText(hex).then(() => {
        toast(`คัดลอกรหัสสี ${hex} เรียบร้อยแล้ว!`, "success");
      }).catch(() => {
        toast(`รหัสสี: ${hex}`, "info");
      });
    });
  });
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
        <div class="nav-label">Brand & Assets</div>
        <a class="nav-item" href="#" id="brand-kit-sidebar">
          ${icons.palette}
          <span>KKP Brand Kit</span>
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

function topbarHtml(page) {
  const titles = {
    dashboard: ["ภาพรวม", "สถานะงานและทีมแบบเรียลไทม์"],
    tasks: ["งานของฉัน", "จัดการงานที่รับผิดชอบและงานของทีม"],
    board: ["บอร์ดงาน", "เห็น workflow ทั้งทีมในมุมมองเดียว"],
    calendar: ["ปฏิทิน", "ติดตามกำหนดส่งและงานที่ชนกัน"],
    team: ["ทีม & กำลังงาน", "ภาพรวมการทำงานของทีม วันนี้ใครทำอะไร กำลังทำอะไรอยู่"],
    reports: ["Performance Report", "รายงานเพื่อปรับปรุงกระบวนการทำงาน"],
    task: ["Task Detail", "รายละเอียด งานย่อย คอมเมนต์ และประวัติ"]
  };
  const [title, sub] = titles[page] || ["CONT", ""];

  return `
    <header class="topbar">
      <button class="icon-btn menu-toggle" id="menu-toggle" aria-label="เปิดเมนู">${icons.menu}</button>
      <div>
        <h1>${title}</h1>
        <div class="topbar-sub">${sub}</div>
      </div>
      <div class="spacer"></div>
      <div class="search-inline">
        ${icons.search}
        <input id="global-search" type="search" placeholder="ค้นหางาน…" />
      </div>

      <!-- KKP Brand Assets Hub Button -->
      <button class="icon-btn" id="brand-kit-topbar" title="🎨 KKP Brand Assets & Colors" aria-label="Brand Kit">
        ${icons.palette}
      </button>

      <!-- In-app Notification Bell -->
      <div class="notif-container">
        <button class="icon-btn" id="notifications-btn" title="การแจ้งเตือน" aria-label="การแจ้งเตือน">
          ${icons.bell}
        </button>
        <span class="notif-badge hidden" id="notif-badge">0</span>
        <div class="notif-dropdown hidden" id="notif-dropdown"></div>
      </div>

      <button class="btn btn-primary btn-sm" id="quick-create">${icons.plus}<span>สร้างงาน</span></button>
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

  // 1. Review status notifications
  bundle.tasks.filter((t) => t.status === "review").forEach((t) => {
    const isMine = t.assignee_id === currentMember.id;
    const assignee = bundle.members.find((m) => m.id === t.assignee_id);
    if (isSupervisor || isMine) {
      notifications.push({
        id: `review_${t.id}`,
        taskId: t.id,
        type: "is-review",
        icon: "👀",
        text: isSupervisor
          ? `งาน "<strong>${escapeHtml(t.title)}</strong>" ส่งตรวจแบบแล้ว (โดย ${escapeHtml(assignee?.name || "สมาชิก")})`
          : `งาน "<strong>${escapeHtml(t.title)}</strong>" อยู่ในขั้นตอนรอคอมเมนต์ตรวจแบบ`,
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
      const requester = bundle.members.find((m) => m.id === rev.requested_by);
      notifications.push({
        id: `rev_${rev.id}`,
        taskId: task.id,
        type: "is-revision",
        icon: "⚠️",
        text: `มีคำขอแก้ Version ${Number(rev.revision_number) + 1} ในงาน "<strong>${escapeHtml(task.title)}</strong>": ${escapeHtml(rev.reason.slice(0, 50))}`,
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
        icon: "🚨",
        text: `งาน "<strong>${escapeHtml(t.title)}</strong>" เลยกำหนดส่งแล้ว! (${escapeHtml(urgency.label)})`,
        time: t.deadline_at || t.deadline,
      });
    } else if (urgency.className === "is-due-soon") {
      notifications.push({
        id: `duesoon_${t.id}_${String(t.deadline_at || t.deadline).slice(0, 10)}`,
        taskId: t.id,
        type: "is-urgent",
        icon: "⏰",
        text: `งาน "<strong>${escapeHtml(t.title)}</strong>" ใกล้ถึงกำหนดส่ง (${escapeHtml(urgency.label)})`,
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
        icon: "💬",
        text: `${escapeHtml(author?.name || "สมาชิก")} คอมเมนต์ใน "<strong>${escapeHtml(task.title)}</strong>": "${escapeHtml(c.content.slice(0, 45))}"`,
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
          <span>🔔 การแจ้งเตือน</span>
          ${data.unreadCount > 0 ? `<span class="chip" style="background:var(--purple-100);color:var(--kkp-purple)">${data.unreadCount} ใหม่</span>` : ""}
        </div>
        <button class="btn-link" id="mark-all-read" style="font-size:0.75rem">✓ อ่านทั้งหมด</button>
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
    document.createRange().createContextualFragment(topbarHtml(page))
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

  // Brand Kit buttons
  qs("#brand-kit-topbar")?.addEventListener("click", openBrandKitModal);
  qs("#brand-kit-sidebar")?.addEventListener("click", (e) => {
    e.preventDefault();
    openBrandKitModal();
  });

  qs("#global-search")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.value.trim()) {
      window.location.href = `tasks.html?q=${encodeURIComponent(event.target.value.trim())}`;
    }
  });

  const bundle = await api.loadBundle();
  const active = bundle.tasks.filter((task) => task.status !== "completed").length;
  qs("#nav-task-count") && (qs("#nav-task-count").textContent = active);

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
