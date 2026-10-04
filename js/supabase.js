import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./config.js";
import { canTransition } from "./constants.js";

const sessionKey = "cont_session";
const PRODUCTION_ORIGIN = "https://cont-graphic-design-3d3ichkrx-beemkung2922-engs-projects.vercel.app";

export const api = {
  isConfigured: isSupabaseConfigured,

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
    const token = this.getAccessToken();
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    // Keep the core task query flat. PostgREST relationship embedding can fail when
    // Supabase refreshes its schema cache, which previously left Team completely blank.
    const [members, projects, tasks] = await Promise.all([
      this.request("/rest/v1/team_members?select=*&is_active=eq.true&order=name.asc", { headers: authHeader }),
      this.request("/rest/v1/projects?select=*&order=name.asc", { headers: authHeader }),
      this.request("/rest/v1/tasks?select=*&order=deadline.asc.nullslast", { headers: authHeader }),
    ]);

    // These collections are not required to render Team/Dashboard. Load them
    // independently so an empty or restricted child table cannot blank the app.
    const optional = await Promise.allSettled([
      this.request("/rest/v1/subtasks?select=*&order=created_at.asc", { headers: authHeader }),
      this.request("/rest/v1/comments?select=*&order=created_at.asc", { headers: authHeader }),
      this.request("/rest/v1/revisions?select=*&order=created_at.asc", { headers: authHeader }),
      this.request("/rest/v1/task_history?select=*&order=created_at.asc", { headers: authHeader }),
    ]);
    const [subtasks, comments, revisions, history] = optional.map((result) => result.status === "fulfilled" ? result.value : []);
    const projectMap = new Map(projects.map((project) => [project.id, project]));
    const memberMap = new Map(members.map((member) => [member.id, member]));
    const enrichedTasks = tasks.map((task) => ({
      ...task,
      project: task.project || projectMap.get(task.project_id) || null,
      assignee: task.assignee || memberMap.get(task.assignee_id) || null,
      creator: task.creator || memberMap.get(task.created_by) || null,
    }));
    return { members, projects, tasks: enrichedTasks, subtasks, comments, revisions, history };
  },

  async getTask(id) {
    const bundle = await this.loadBundle();
    return { ...bundle, task: bundle.tasks.find((task) => task.id === id) };
  },

  async createTask(input) {
    const token = this.getAccessToken();
    const rows = await this.request("/rest/v1/tasks", { method: "POST", headers: { Authorization: `Bearer ${token}`, Prefer: "return=representation" }, body: JSON.stringify({ ...input, revision_count: 0, status: "brief", item_count: Number(input.item_count || 1), task_type: input.task_type || "new_work" }) });
    return rows[0];
  },

  async updateTask(id, patch) {
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
    const updated = await this.updateTask(id, { status: nextStatus, completed_at: nextStatus === "completed" ? now : null });
    const token = this.getAccessToken();
    await this.request("/rest/v1/task_history", { method: "POST", headers: { Authorization: `Bearer ${token}`, Prefer: "return=minimal" }, body: JSON.stringify({ task_id: id, from_status: task.status, to_status: nextStatus, action, revision_number: task.revision_count || 0, note }) });
    return updated;
  },

  async requestRevision(id, reason) {
    const bundle = await this.loadBundle();
    const task = bundle.tasks.find((item) => item.id === id);
    if (!task) throw new Error("ไม่พบงานนี้");
    if (!canTransition(task.status, "revision")) throw new Error("งานนี้ยังไม่อยู่ในสถานะที่ขอแก้ไขได้");
    const number = Number(task.revision_count || 0) + 1;
    const updated = await this.updateTask(id, { status: "revision", revision_count: number });
    const token = this.getAccessToken();
    const member = await auth.currentMember();
    await Promise.all([
      this.request("/rest/v1/revisions", { method: "POST", headers: { Authorization: `Bearer ${token}`, Prefer: "return=minimal" }, body: JSON.stringify({ task_id: id, revision_number: number, requested_by: member.id, assigned_to: task.assignee_id, reason, status_before: task.status, status_after: "revision" }) }),
      this.request("/rest/v1/task_history", { method: "POST", headers: { Authorization: `Bearer ${token}`, Prefer: "return=minimal" }, body: JSON.stringify({ task_id: id, from_status: task.status, to_status: "revision", action: "revision_requested", revision_number: number, note: reason }) }),
    ]);
    return updated;
  },

  async addSubtask(taskId, title) {
    const token = this.getAccessToken();
    const rows = await this.request("/rest/v1/subtasks", { method: "POST", headers: { Authorization: `Bearer ${token}`, Prefer: "return=representation" }, body: JSON.stringify({ task_id: taskId, title, is_completed: false }) });
    return rows[0];
  },

  async toggleSubtask(id, done) {
    const token = this.getAccessToken();
    const rows = await this.request(`/rest/v1/subtasks?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, Prefer: "return=representation" }, body: JSON.stringify({ is_completed: done }) });
    return rows[0];
  },

  async addComment(taskId, content) {
    const member = await auth.currentMember();
    const token = this.getAccessToken();
    const rows = await this.request("/rest/v1/comments", { method: "POST", headers: { Authorization: `Bearer ${token}`, Prefer: "return=representation" }, body: JSON.stringify({ task_id: taskId, user_id: member.id, content }) });
    return rows[0];
  },

  async deleteTask(id) {
    const token = this.getAccessToken();
    await this.request(`/rest/v1/tasks?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}`, Prefer: "return=minimal" } });
    return true;
  },
};

export const auth = {
  async currentMember() {
    const token = api.getAccessToken();
    const session = JSON.parse(localStorage.getItem(sessionKey) || "null");
    if (!token || !session?.user?.id) return null;
    const rows = await api.request(`/rest/v1/team_members?select=*&auth_user_id=eq.${encodeURIComponent(session.user.id)}&is_active=eq.true&limit=1`, { headers: { Authorization: `Bearer ${token}` } });
    return rows[0] || null;
  },

  async getSession() {
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
    const isLocalhost = /^https?:\/\/localhost(?::\d+)?$/i.test(window.location.origin);
    const origin = isLocalhost ? PRODUCTION_ORIGIN : window.location.origin;
    const redirect = `${origin}/index.html`;
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirect)}`;
  },

  async signOut() {
    const token = api.getAccessToken();
    if (token) await api.authRequest("/logout", { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    localStorage.removeItem(sessionKey);
    window.location.href = "index.html";
  },
};
