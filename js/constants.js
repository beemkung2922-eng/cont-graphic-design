export const STATUS_ORDER = ["brief", "drafting", "review", "revision", "completed"];
export const ACTIVE_STATUSES = STATUS_ORDER.filter((status) => status !== "completed");

export const STATUS_LABELS = {
  brief: "รอรับบรีฟ",
  drafting: "กำลังดราฟต์",
  review: "รอคอมเมนต์",
  revision: "แก้ไขงาน",
  completed: "ส่งมอบไฟล์สำเร็จ",
};

export const STATUS_BADGES = {
  brief: "badge-neutral",
  drafting: "badge-info",
  review: "badge-warn",
  revision: "badge-danger",
  completed: "badge-ok",
};

export const STATUS_DOTS = {
  brief: "#8f8ca0",
  drafting: "#2a5fa8",
  review: "#a9701b",
  revision: "#b3261e",
  completed: "#1f7a4d",
};

export const TASK_TYPE_LABELS = { new_work: "เริ่มงานใหม่", resize: "ปรับ Size", revision: "แก้ไขงาน", adaptation: "ดัดแปลงจากชิ้นเดิม", other: "อื่น ๆ" };
export const PRIORITY_LABELS = {};
export const PRIORITY_BADGES = {};
export const ROLE_LABELS = {
  designer: "Visual & Design",
  supervisor: "Team Head of Visual & Design",
  admin: "Team Head of Visual & Design",
  requester: "ผู้ขอรับบริการ (Requester)",
  viewer: "ผู้เข้าชม (Viewer)",
};
export const PROJECT_STATUS_LABELS = { active: "กำลังดำเนินการ", archived: "เก็บถาวร", completed: "เสร็จแล้ว" };

export const TRANSITIONS = {
  brief: ["drafting"],
  drafting: ["review"],
  review: ["revision", "completed"],
  revision: ["review", "completed"],
  completed: ["revision"],
};

export const ACTION_LABELS = {
  created: "สร้างงาน",
  assigned: "มอบหมายงาน",
  status_changed: "เปลี่ยนสถานะ",
  revision_requested: "ขอแก้ไข",
  reopened: "เปิดงานกลับมาแก้",
  completed: "ส่งมอบงาน",
  comment_added: "เพิ่มคอมเมนต์",
  subtask_updated: "อัปเดต Subtask",
};

export function canTransition(from, to) {
  return Boolean(TRANSITIONS[from]?.includes(to));
}

export function statusClass(status) {
  return STATUS_BADGES[status] || "badge-neutral";
}

export function priorityClass(priority) {
  return PRIORITY_BADGES[priority] || "badge-neutral";
}

export function workloadState(percent) {
  if (percent >= 100) return { key: "overloaded", label: "Overloaded", className: "danger" };
  if (percent >= 80) return { key: "high", label: "High", className: "warn" };
  if (percent >= 50) return { key: "normal", label: "Normal", className: "info" };
  return { key: "low", label: "Low", className: "ok" };
}

export const NAV_ITEMS = [
  { href: "dashboard.html", page: "dashboard", label: "ภาพรวม", icon: "grid" },
  { href: "tasks.html", page: "tasks", label: "งานของฉัน", icon: "check" },
  { href: "board.html", page: "board", label: "บอร์ดงาน", icon: "columns" },
  { href: "calendar.html", page: "calendar", label: "ปฏิทิน", icon: "calendar" },
  { href: "team.html", page: "team", label: "ทีม & กำลังงาน", icon: "users" },
];
