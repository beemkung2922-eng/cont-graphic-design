import { api, auth } from "./supabase.js";
import { roleLabel, avatar } from "./formatters.js";

/* ─────────────────────────────────────────────────────────────────────────
   Role Permissions Matrix Integration (CONT_ROLE_PERMS)
───────────────────────────────────────────────────────────────────────── */
export const DEFAULT_ROLE_PERMS = {
  create_task: { head: true, designer: true, viewer: false },
  work_task:   { head: true, designer: true, viewer: false },
  review_task: { head: true, designer: false, viewer: false },
  assign_task: { head: true, designer: false, viewer: false },
  request_rev: { head: true, designer: true, viewer: false },
  view_report: { head: true, designer: true, viewer: false },
  manage_role: { head: true, designer: false, viewer: false },
  download:    { head: true, designer: true, viewer: false },
};

export function getRolePermissions() {
  try {
    const raw = localStorage.getItem("CONT_ROLE_PERMS");
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged = { ...DEFAULT_ROLE_PERMS };
      for (const [key, val] of Object.entries(parsed)) {
        if (merged[key] && typeof val === "object") {
          merged[key] = { ...merged[key], ...val };
          delete merged[key].requester;
        }
      }
      return merged;
    }
  } catch {}
  return { ...DEFAULT_ROLE_PERMS };
}

export function hasPermission(member, permKey) {
  if (!member) return false;
  let role = member.role || "viewer";
  if (role === "requester") role = "viewer"; // Normalize legacy requester to viewer
  if (["supervisor", "admin"].includes(role)) return true; // Team Head has omnipotent access
  const perms = getRolePermissions();
  const row = perms[permKey] || DEFAULT_ROLE_PERMS[permKey];
  if (!row) return false;
  return Boolean(row[role]);
}

export async function ensureAccess({ allowPublic = false } = {}) {
  const session = await auth.getSession();
  if (!session && !allowPublic) {
    const mount = document.querySelector("#page-content");
    if (mount) {
      mount.innerHTML = `<div class="card"><div class="state"><div class="state-icon">↪</div><div class="state-title">กรุณาเข้าสู่ระบบก่อน</div><div class="state-text">หน้านี้ต้องใช้บัญชี Google หรืออีเมลบริษัทของสมาชิกทีม ให้กดเข้าสู่ระบบ แล้วเปิดหน้านี้จาก URL เดียวกันอีกครั้ง</div><a class="btn btn-primary" href="index.html">ไปหน้าเข้าสู่ระบบ</a></div></div>`;
    }
    return { member: null };
  }
  if (!session) return { member: null };
  try {
    const member = await auth.currentMember();
    if (!member && !allowPublic) {
      localStorage.removeItem("cont_session");
      throw new Error("ไม่พบสมาชิกในทีม หรือเซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
    }

    // Role-based Page Route Guards
    if (member && !allowPublic) {
      const currentPage = document.body.dataset.page;
      const role = member.role || "viewer";
      if (role === "viewer" || role === "requester") {
        // Viewer allowed: dashboard, tasks, calendar, task (detail), intro (reel)
        // Disallowed: board, team
        if (["board", "team"].includes(currentPage)) {
          window.location.replace("dashboard.html");
          return { member: null };
        }
      }
    }

    return { member };
  } catch (error) {
    localStorage.removeItem("cont_session");
    if (!allowPublic) {
      const mount = document.querySelector("#page-content");
      if (mount) {
        mount.innerHTML = `<div class="card"><div class="state"><div class="state-icon">!</div><div class="state-title">ไม่สามารถยืนยันสมาชิกได้</div><div class="state-text">${errorMessage(error)}</div><a class="btn btn-primary" href="index.html" onclick="localStorage.removeItem('cont_session')">กลับไปหน้า Login</a></div></div>`;
      }
      return { member: null };
    }
    return { member: null, error };
  }
}

export function mountUser(member) {
  document.querySelectorAll("[data-user-name]").forEach((node) => { node.textContent = member?.name || "Guest"; });
  document.querySelectorAll("[data-user-role]").forEach((node) => { node.textContent = roleLabel(member?.role); });
  document.querySelectorAll("[data-user-avatar]").forEach((node) => { node.outerHTML = avatar(member, "avatar").replace("title=", "data-user-avatar title="); });
  window.CONT_MEMBER = member;
}

export function isDesigner(member) { return ["designer", "supervisor", "admin"].includes(member?.role); }
export function canManage(member) { return ["supervisor", "admin"].includes(member?.role); }
export function isAdmin(member) { return member?.role === "admin"; }
export function isRequester(member) { return false; } // Deprecated; treated as viewer
export function isViewer(member) { return !member || member.role === "viewer" || member.role === "requester"; }
export function canMoveTask(member) {
  if (isViewer(member)) return false;
  return hasPermission(member, "work_task");
}
export function canChangeTaskStatus(member, task) {
  if (isViewer(member)) return false;
  if (canManage(member)) return true;
  if (!hasPermission(member, "work_task")) return false;
  if (isDesigner(member) && task?.assignee_id === member?.id) return true;
  return false;
}
export function canCreateTask(member) {
  if (isViewer(member)) return false;
  return hasPermission(member, "create_task");
}
export function canEditTask(member, task) {
  if (isViewer(member)) return false;
  if (canManage(member)) return true;
  if (isDesigner(member) && task?.assignee_id === member?.id && hasPermission(member, "work_task")) return true;
  return false;
}
export function canDeleteTask(member, task) {
  if (isViewer(member)) return false;
  if (canManage(member)) return true;
  return false;
}
export function canUploadArtwork(member, task) {
  if (isViewer(member)) return false;
  if (!hasPermission(member, "work_task")) return false;
  return canManage(member) || (isDesigner(member) && task?.assignee_id === member?.id);
}
export function canDownload(member) {
  if (!member) return false;
  return hasPermission(member, "download");
}
export function canRequestRevision(member, task) {
  if (!member || isViewer(member)) return false;
  if (canManage(member)) return true;
  return hasPermission(member, "request_rev");
}
export function canViewReport(member) {
  return hasPermission(member, "view_report");
}

export function errorMessage(error) {
  if (error?.status === 401) return "Supabase ไม่ยอมรับ API key นี้ (401) — ตรวจสอบว่าเป็น publishable/anon key ของ project นี้และ API ยังเปิดใช้งาน";
  if (error?.status === 403) return "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้ตาม RLS policy";
  return error?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}
