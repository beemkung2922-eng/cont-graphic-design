import { api, auth } from "./supabase.js";
import { roleLabel, avatar } from "./formatters.js";

export async function ensureAccess({ allowPublic = false } = {}) {
  const session = await auth.getSession();
  if (!session && !allowPublic) {
    const mount = document.querySelector("#page-content");
    if (mount) {
      mount.innerHTML = `<div class="card"><div class="state"><div class="state-icon">↪</div><div class="state-title">กรุณาเข้าสู่ระบบก่อน</div><div class="state-text">หน้านี้ต้องใช้บัญชี Google ของสมาชิกทีม ให้กดเข้าสู่ระบบ แล้วเปิดหน้านี้จาก URL เดียวกันอีกครั้ง</div><a class="btn btn-primary" href="index.html">ไปหน้าเข้าสู่ระบบ</a></div></div>`;
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

export function canManage(member) { return ["supervisor", "admin"].includes(member?.role); }
export function isAdmin(member) { return member?.role === "admin"; }
export function canEditTask(member, task) { return canManage(member) || task?.assignee_id === member?.id; }
export function canDeleteTask(member) { return canManage(member); }

export function errorMessage(error) {
  if (error?.status === 401) return "Supabase ไม่ยอมรับ API key นี้ (401) — ตรวจสอบว่าเป็น publishable/anon key ของ project นี้และ API ยังเปิดใช้งาน";
  if (error?.status === 403) return "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้ตาม RLS policy";
  return error?.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}
