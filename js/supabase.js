import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured, isDemoRequested } from "./config.js";
import { canTransition } from "./constants.js";
import { createDemoBundle, DEMO_CURRENT_USER } from "./demo-data.js";

const DEMO_KEY = "cont_demo_store_v1";
const sessionKey = "cont_session";

function readDemoStore() {
  try {
    const saved = localStorage.getItem(DEMO_KEY);
    return saved ? JSON.parse(saved) : createDemoBundle();
  } catch {
    return createDemoBundle();
  }
}

function writeDemoStore(store) { localStorage.setItem(DEMO_KEY, JSON.stringify(store)); }

export const api = {
  isConfigured: isSupabaseConfigured,
  isDemo: () => localStorage.getItem("cont_demo") === "1" || isDemoRequested(),
  setDemo(enabled) {
    if (enabled) localStorage.setItem("cont_demo", "1");
    else localStorage.removeItem("cont_demo");
  },
  get demoUserId() { return localStorage.getItem("cont_demo_user") || DEMO_CURRENT_USER; },
  setDemoUser(id) { localStorage.setItem("cont_demo_user", id); },

  async request(path, options = {}) {
    if (!isSupabaseConfigured) throw new Error("ยังไม่ได้ตั้งค่า Supabase URL หรือ public key");
    const headers = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
    const response = await fetch(`${SUPABASE_URL}${path}`, { ...options, headers });
    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
    if (!response.ok) {
      const message = payload?.message || payload?.error_description || payload?.error || `Supabase request failed (${response.status})`;
      const error = new Error(message);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  },

  async authRequest(path, options = {}) {
    if (!isSupabaseConfigured) throw new Error("ยังไม่ได้ตั้งค่า Supabase Auth");
    const headers = { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json", ...(options.headers || {}) };
    const response = await fetch(`${SUPABASE_URL}/auth/v1${path}`, { ...options, headers });
    const text = await response.text();
    let payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
    if (!response.ok) {
      const error = new Error(payload?.msg || payload?.message || payload?.error_description || "Supabase Auth request failed");
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  },

  getAccessToken() {
    try {
      const session = JSON.parse(localStorage.getItem(sessionKey) || "null");
      return session?.access_token || "";
    } catch { return ""; }
  },

  async loadBundle() {
    if (this.isDemo()) return readDemoStore();
    const token = this.getAccessToken();
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    const select = encodeURIComponent("*,project:projects(*),assignee:team_members!tasks_assignee_id_fkey(*),creator:team_members!tasks_created_by_fkey(*)");
    const [members, projects, tasks, subtasks, comments, revisions, history] = await Promise.all([
      this.request("/rest/v1/team_members?select=*&is_active=eq.true&order=name.asc", { headers: authHeader }),
      this.request("/rest/v1/projects?select=*&order=name.asc", { headers: authHeader }),
      this.request(`/rest/v1/tasks?select=${select}&order=deadline.asc.nullslast`, { headers: authHeader }),
      this.request("/rest/v1/subtasks?select=*&order=created_at.asc", { headers: authHeader }),
      this.request("/rest/v1/comments?select=*&order=created_at.asc", { headers: authHeader }),
      this.request("/rest/v1/revisions?select=*&order=created_at.asc", { headers: authHeader }),
      this.request("/rest/v1/task_history?select=*&order=created_at.asc", { headers: authHeader }),
    ]);
    return { members, projects, tasks, subtasks, comments, revisions, history };
  },

  async getTask(id) {
    const bundle = await this.loadBundle();
    return { ...bundle, task: bundle.tasks.find((task) => task.id === id) };
  },

  async createTask(input) {
    const now = new Date().toISOString();
    if (this.isDemo()) {
      const store = readDemoStore();
      const id = `demo_${Date.now()}`;
      const task = { id, ...input, revision_count: 0, completed_at: null, created_at: now, updated_at: now };
      store.tasks.unshift(task);
      store.history.push({ id: `h_${Date.now()}`, task_id: id, user_id: this.demoUserId, from_status: null, to_status: "brief", action: "created", revision_number: 0, note: "สร้างงาน", created_at: now });
      writeDemoStore(store);
      return task;
    }
    const token = this.getAccessToken();
    const rows = await this.request("/rest/v1/tasks", { method: "POST", headers: { Authorization: `Bearer ${token}`, Prefer: "return=representation" }, body: JSON.stringify({ ...input, revision_count: 0, status: "brief" }) });
    return rows[0];
  },

  async updateTask(id, patch) {
    if (this.isDemo()) {
      const store = readDemoStore();
      const index = store.tasks.findIndex((task) => task.id === id);
      if (index < 0) throw new Error("ไม่พบงานนี้");
      store.tasks[index] = { ...store.tasks[index], ...patch, updated_at: new Date().toISOString() };
      writeDemoStore(store);
      return store.tasks[index];
    }
    const token = this.getAccessToken();
    const rows = await this.request(`/rest/v1/tasks?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, Prefer: "return=representation" }, body: JSON.stringify(patch) });
    return rows[0];
  },

  async changeStatus(id, nextStatus, note = "") {
    const bundle = await this.loadBundle();
    const task = bundle.tasks.find((item) => item.id === id);
    if (!task) throw new Error("ไม่พบงานนี้");
    if (!canTransition(task.status, nextStatus)) throw new Error(`ไม่สามารถเปลี่ยนจาก ${task.status} ไป ${nextStatus} ได้ตาม Workflow`);
    const now = new Date().toISOString();
    const action = nextStatus === "completed" ? "completed" : task.status === "completed" ? "reopened" : "status_changed";
    if (this.isDemo()) {
      const store = readDemoStore();
      const item = store.tasks.find((row) => row.id === id);
      item.status = nextStatus;
      item.completed_at = nextStatus === "completed" ? now : null;
      item.updated_at = now;
      store.history.push({ id: `h_${Date.now()}`, task_id: id, user_id: this.demoUserId, from_status: task.status, to_status: nextStatus, action, revision_number: item.revision_count || 0, note, created_at: now });
      writeDemoStore(store);
      return item;
    }
    const updated = await this.updateTask(id, { status: nextStatus, completed_at: nextStatus === "completed" ? now : null });
    const token = this.getAccessToken();
    await this.request("/rest/v1/task_history", { method: "POST", headers: { Authorization: `Bearer ${token}`, Prefer: "return=minimal" }, body: JSON.stringify({ task_id: id, from_status: task.status, to_status: nextStatus, action, revision_number: task.revision_count || 0, note }) });
    return updated;
  },

  async requestRevision(id, reason) {
    const bundle = await this.loadBundle();
    const task = bundle.tasks.find((item) => item.id === id);
    if (!task) throw new Error("ไม่พบงานนี้");
    const number = Number(task.revision_count || 0) + 1;
    const now = new Date().toISOString();
    if (!this.isDemo() && !canTransition(task.status, "revision")) throw new Error("งานนี้ยังไม่อยู่ในสถานะที่ขอแก้ไขได้");
    if (this.isDemo()) {
      const store = readDemoStore();
      const item = store.tasks.find((row) => row.id === id);
      item.status = "revision";
      item.revision_count = number;
      item.updated_at = now;
      store.revisions.push({ id: `r_${Date.now()}`, task_id: id, revision_number: number, requested_by: this.demoUserId, assigned_to: item.assignee_id, reason, status_before: task.status, status_after: "revision", created_at: now, completed_at: null });
      store.history.push({ id: `h_${Date.now()}`, task_id: id, user_id: this.demoUserId, from_status: task.status, to_status: "revision", action: "revision_requested", revision_number: number, note: reason, created_at: now });
      writeDemoStore(store);
      return item;
    }
    const updated = await this.updateTask(id, { status: "revision", revision_count: number });
    const token = this.getAccessToken();
    await Promise.all([
      this.request("/rest/v1/revisions", { method: "POST", headers: { Authorization: `Bearer ${token}`, Prefer: "return=minimal" }, body: JSON.stringify({ task_id: id, revision_number: number, requested_by: (await auth.currentMember()).id, assigned_to: task.assignee_id, reason, status_before: task.status, status_after: "revision" }) }),
      this.request("/rest/v1/task_history", { method: "POST", headers: { Authorization: `Bearer ${token}`, Prefer: "return=minimal" }, body: JSON.stringify({ task_id: id, from_status: task.status, to_status: "revision", action: "revision_requested", revision_number: number, note: reason }) }),
    ]);
    return updated;
  },

  async addSubtask(taskId, title) {
    const now = new Date().toISOString();
    if (this.isDemo()) {
      const store = readDemoStore();
      const row = { id: `s_${Date.now()}`, task_id: taskId, title, is_completed: false, created_at: now, updated_at: now };
      store.subtasks.push(row);
      writeDemoStore(store);
      return row;
    }
    const token = this.getAccessToken();
    const rows = await this.request("/rest/v1/subtasks", { method: "POST", headers: { Authorization: `Bearer ${token}`, Prefer: "return=representation" }, body: JSON.stringify({ task_id: taskId, title, is_completed: false }) });
    return rows[0];
  },

  async toggleSubtask(id, done) {
    if (this.isDemo()) {
      const store = readDemoStore();
      const row = store.subtasks.find((item) => item.id === id);
      if (row) row.is_completed = done;
      writeDemoStore(store);
      return row;
    }
    const token = this.getAccessToken();
    const rows = await this.request(`/rest/v1/subtasks?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, Prefer: "return=representation" }, body: JSON.stringify({ is_completed: done }) });
    return rows[0];
  },

  async addComment(taskId, content) {
    const now = new Date().toISOString();
    if (this.isDemo()) {
      const store = readDemoStore();
      const row = { id: `c_${Date.now()}`, task_id: taskId, user_id: this.demoUserId, content, created_at: now };
      store.comments.push(row);
      writeDemoStore(store);
      return row;
    }
    const member = await auth.currentMember();
    const token = this.getAccessToken();
    const rows = await this.request("/rest/v1/comments", { method: "POST", headers: { Authorization: `Bearer ${token}`, Prefer: "return=representation" }, body: JSON.stringify({ task_id: taskId, user_id: member.id, content }) });
    return rows[0];
  },

  async deleteTask(id) {
    if (this.isDemo()) {
      const store = readDemoStore();
      store.tasks = store.tasks.filter((task) => task.id !== id);
      store.subtasks = store.subtasks.filter((row) => row.task_id !== id);
      store.comments = store.comments.filter((row) => row.task_id !== id);
      store.revisions = store.revisions.filter((row) => row.task_id !== id);
      store.history = store.history.filter((row) => row.task_id !== id);
      writeDemoStore(store);
      return true;
    }
    const token = this.getAccessToken();
    await this.request(`/rest/v1/tasks?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}`, Prefer: "return=minimal" } });
    return true;
  },
};

export const auth = {
  async currentMember() {
    if (api.isDemo()) {
      const store = readDemoStore();
      return store.members.find((member) => member.id === api.demoUserId) || store.members[0];
    }
    const token = api.getAccessToken();
    const session = JSON.parse(localStorage.getItem(sessionKey) || "null");
    if (!token || !session?.user?.id) return null;
    const rows = await api.request(`/rest/v1/team_members?select=*&auth_user_id=eq.${encodeURIComponent(session.user.id)}&is_active=eq.true&limit=1`, { headers: { Authorization: `Bearer ${token}` } });
    return rows[0] || null;
  },
  async getSession() {
    if (api.isDemo()) return { demo: true, user: await this.currentMember() };
    const token = api.getAccessToken();
    if (!token) return null;
    try {
      const session = JSON.parse(localStorage.getItem(sessionKey) || "null");
      if (session && !session.user?.id) {
        const user = await api.authRequest("/user", { headers: { Authorization: `Bearer ${token}` } });
        session.user = user;
        localStorage.setItem(sessionKey, JSON.stringify(session));
      }
      return session;
    } catch { return null; }
  },
  async signInWithGoogle() {
    const redirect = `${window.location.origin}${window.location.pathname.replace(/index\.html$/, "")}`;
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirect)}`;
  },
  enterDemo(memberId = DEMO_CURRENT_USER) {
    api.setDemo(true);
    api.setDemoUser(memberId);
    window.location.href = "dashboard.html?demo=1";
  },
  async signOut() {
    if (!api.isDemo()) {
      const token = api.getAccessToken();
      if (token) await api.authRequest("/logout", { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
    localStorage.removeItem(sessionKey);
    api.setDemo(false);
    window.location.href = "index.html";
  },
};
