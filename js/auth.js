import { api, auth } from "./supabase.js";
import { roleLabel, avatar } from "./formatters.js";

export async function ensureAccess({ allowPublic = false } = {}) {
  const session = await auth.getSession();
  if (!session && !allowPublic) {
    window.location.href = "index.html";
    return { member: null };
  }
  if (!session) return { member: null };
  try {
    const member = await auth.currentMember();
    if (!member && !allowPublic) throw new Error("ไม่พบสมาชิกในทีม กรุณาติดต่อผู้ดูแลระบบ");
    return { member };
  } catch (error) {
    if (!allowPublic) {
      window.location.href = `index.html?error=${encodeURIComponent(error.message)}`;
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
