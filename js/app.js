import { NAV_ITEMS, STATUS_LABELS } from "./constants.js";
import { ensureAccess, mountUser, canManage, errorMessage } from "./auth.js";
import { api, auth } from "./supabase.js";
import { escapeHtml, avatar } from "./formatters.js";

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
  node.innerHTML = `<div class="toast-icon">${type === "success" ? "✓" : type === "error" ? "!" : type === "warn" ? "⚠" : "i"}</div><div class="toast-content">${title ? `<div class="toast-title">${escapeHtml(title)}</div>` : ""}<div>${escapeHtml(message)}</div></div><button class="toast-close" aria-label="ปิด">×</button>`;
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
  backdrop.innerHTML = `<section class="modal ${size ? `modal-${size}` : ""}" role="dialog" aria-modal="true"><div class="modal-head"><div class="modal-title">${title}</div><button class="icon-btn" data-close-modal aria-label="ปิด">${icons.close}</button></div><div class="modal-body">${body}</div>${footer ? `<div class="modal-foot">${footer}</div>` : ""}</section>`;
  backdrop.addEventListener("click", (event) => { if (event.target === backdrop || event.target.closest("[data-close-modal]")) closeModal(); });
  document.body.appendChild(backdrop);
  return backdrop;
}

export function closeModal() { qs("#modal-backdrop")?.remove(); }

function sidebarHtml(page, member) {
  const links = NAV_ITEMS.map((item) => `<a class="nav-item ${item.page === page ? "is-active" : ""}" href="${item.href}">${icons[item.icon]}<span>${item.label}</span>${item.page === "tasks" ? `<span class="nav-count" id="nav-task-count">—</span>` : ""}</a>`).join("");
  return `<aside class="sidebar" id="sidebar"><div class="brand"><div class="brand-mark"><div class="brand-logo">C</div><div><div class="brand-name">CONT</div><div class="brand-sub">Graphic Design Workflow<br />Management System</div></div></div></div><nav class="nav"><div class="nav-label">Workspace</div>${links}<div class="nav-label">Account</div><a class="nav-item" href="#" id="logout-link">${icons.logout}<span>ออกจากระบบ</span></a></nav><div class="nav-footer"><div class="sidebar-user">${avatar(member)}<div><div class="sidebar-user-name" data-user-name>${escapeHtml(member?.name || "Guest")}</div><div class="sidebar-user-role" data-user-role>${escapeHtml(member?.role || "")}</div></div></div></div></aside>`;
}

function topbarHtml(page) {
  const titles = { dashboard: ["ภาพรวม", "สถานะงานและทีมแบบเรียลไทม์"], tasks: ["งานของฉัน", "จัดการงานที่รับผิดชอบและงานของทีม"], board: ["บอร์ดงาน", "เห็น workflow ทั้งทีมในมุมมองเดียว"], calendar: ["ปฏิทิน", "ติดตามกำหนดส่งและงานที่ชนกัน"], team: ["ทีม & สรุปงาน", "ดูงานและจำนวนชิ้นงานของแต่ละคน"], reports: ["Performance Report", "รายงานเพื่อปรับปรุงกระบวนการทำงาน"], task: ["Task Detail", "รายละเอียด งานย่อย คอมเมนต์ และประวัติ"] };
  const [title, sub] = titles[page] || ["CONT", ""];
  return `<header class="topbar"><button class="icon-btn menu-toggle" id="menu-toggle" aria-label="เปิดเมนู">${icons.menu}</button><div><h1>${title}</h1><div class="topbar-sub">${sub}</div></div><div class="spacer"></div><div class="search-inline">${icons.search}<input id="global-search" type="search" placeholder="ค้นหางาน…" /></div><button class="icon-btn" id="notifications-btn" aria-label="การแจ้งเตือน">${icons.bell}</button><button class="btn btn-primary btn-sm" id="quick-create">${icons.plus}<span>สร้างงาน</span></button></header>`;
}

export async function initShell() {
  const page = document.body.dataset.page || "dashboard";
  const access = await ensureAccess();
  if (!access.member) return null;
  document.querySelector("#sidebar-slot")?.replaceWith(document.createRange().createContextualFragment(sidebarHtml(page, access.member)));
  document.querySelector("#topbar-slot")?.replaceWith(document.createRange().createContextualFragment(topbarHtml(page)));
  mountUser(access.member);
  qsa("#logout-link").forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); auth.signOut(); }));
  qs("#menu-toggle")?.addEventListener("click", () => {
    qs("#sidebar")?.classList.toggle("is-open");
    if (qs(".sidebar-backdrop")) qs(".sidebar-backdrop").remove();
    else { const backdrop = document.createElement("div"); backdrop.className = "sidebar-backdrop"; backdrop.addEventListener("click", () => { qs("#sidebar")?.classList.remove("is-open"); backdrop.remove(); }); document.body.appendChild(backdrop); }
  });
  qs("#quick-create")?.addEventListener("click", () => window.openCreateTask?.());
  qs("#global-search")?.addEventListener("keydown", (event) => { if (event.key === "Enter" && event.target.value.trim()) window.location.href = `tasks.html?q=${encodeURIComponent(event.target.value.trim())}`; });
  const bundle = await api.loadBundle();
  const active = bundle.tasks.filter((task) => task.status !== "completed").length;
  qs("#nav-task-count") && (qs("#nav-task-count").textContent = active);
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
const pageModules = { dashboard: "dashboard", tasks: "tasks", board: "board", task: "task", calendar: "calendar", team: "team", reports: "reports" };
if (currentPage && pageModules[currentPage]) {
  import(`./${pageModules[currentPage]}.js`).then(({ render }) => boot(render));
}
