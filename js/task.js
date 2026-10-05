import { STATUS_LABELS, STATUS_ORDER, TRANSITIONS, canTransition } from "./constants.js";
import { formatDateLong, formatDateTime, statusBadge, avatar, escapeHtml, progressInfo, projectFor, memberFor, roleLabel, taskTypeLabel, relativeDeadline } from "./formatters.js";
import { qs, toast, openModal, closeModal, errorState } from "./app.js";
import { api } from "./supabase.js";
import { canManage, canEditTask, canDeleteTask } from "./auth.js";

export async function render(ctx) {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) {
    qs("#page-content").innerHTML = errorState(new Error("ไม่พบ Task ID"));
    return;
  }

  let bundle = ctx;
  let task = bundle.tasks.find((item) => item.id === id);
  if (!task) {
    qs("#page-content").innerHTML = errorState(new Error("ไม่พบงานนี้"));
    return;
  }

  const openLightbox = (imgSrc, title) => {
    const existing = qs(".lightbox-modal");
    if (existing) existing.remove();

    const box = document.createElement("div");
    box.className = "lightbox-modal";
    box.innerHTML = `
      <button class="lightbox-close" aria-label="ปิด">×</button>
      <div class="lightbox-img-wrap">
        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(title)}" />
      </div>
      <div style="color:#fff;font-size:0.85rem;margin-top:14px;opacity:0.9;">
        ${escapeHtml(title)} · กดที่ไหนก็ได้หรือกด [×] เพื่อปิด
      </div>
    `;
    box.addEventListener("click", (e) => {
      if (e.target.tagName !== "IMG") box.remove();
    });
    box.querySelector(".lightbox-close")?.addEventListener("click", () => box.remove());
    document.body.appendChild(box);
  };

  const openEditArtworkModal = () => {
    const body = `
      <form id="artwork-form" class="stack">
        <div class="field">
          <label>URL รูปภาพตัวอย่างงาน (Artwork Preview Image URL)</label>
          <input name="preview_url" placeholder="https://example.com/mockup.png" value="${escapeHtml(task.preview_url || "")}">
          <span class="hint">ใส่ลิงก์รูปภาพตัวอย่างงาน (JPG, PNG, WebP) เพื่อให้พรีวิวบนหน้าบอร์ดและหน้ารายละเอียด</span>
        </div>
        <div class="field">
          <label>ลิงก์ไฟล์ออกแบบ (Figma / Google Drive / OneDrive)</label>
          <input name="design_url" placeholder="https://www.figma.com/file/... หรือ ลิงก์ Drive" value="${escapeHtml(task.design_url || "")}">
          <span class="hint">ลิงก์ต้นฉบับเพื่อให้ทีมกดเปิดไฟล์งานจริงได้ทันที</span>
        </div>
        <div class="form-grid">
          <div class="field">
            <label>ขนาด / Dimensions</label>
            <input name="dimensions" placeholder="เช่น 1080x1080 px (1:1)" value="${escapeHtml(task.dimensions || "")}">
          </div>
          <div class="field">
            <label>ช่องทางเผยแพร่ / Channel</label>
            <input name="channel" placeholder="เช่น Facebook, IG Story, GDN, Print" value="${escapeHtml(task.channel || "")}">
          </div>
        </div>
      </form>
    `;
    const modal = openModal({
      title: "🎨 จัดการ Artwork & ลิงก์ไฟล์งาน",
      body,
      footer: `
        <button class="btn" data-close-modal>ยกเลิก</button>
        <button class="btn btn-primary" id="save-artwork">บันทึกข้อมูล</button>
      `
    });

    qs("#save-artwork", modal).addEventListener("click", async () => {
      const form = qs("#artwork-form", modal);
      const data = Object.fromEntries(new FormData(form));
      try {
        await api.updateTask(task.id, {
          preview_url: data.preview_url.trim() || null,
          design_url: data.design_url.trim() || null,
          dimensions: data.dimensions.trim() || null,
          channel: data.channel.trim() || null,
        });
        closeModal();
        toast("อัปเดตข้อมูล Artwork เรียบร้อยแล้ว", "success");
        bundle = await api.loadBundle();
        draw();
      } catch (err) {
        toast(err.message, "error");
      }
    });
  };

  const draw = () => {
    task = bundle.tasks.find((item) => item.id === id) || task;
    const project = projectFor(task, bundle.projects);
    const member = memberFor(task, bundle.members);
    const creator = bundle.members.find((item) => item.id === task.created_by);
    const subtasks = bundle.subtasks.filter((item) => item.task_id === task.id);
    const comments = bundle.comments.filter((item) => item.task_id === task.id);
    const revisions = bundle.revisions
      .filter((item) => item.task_id === task.id)
      .sort((a, b) => Number(b.revision_number) - Number(a.revision_number));
    const history = bundle.history
      .filter((item) => item.task_id === task.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const progress = progressInfo(subtasks);
    const allowed = TRANSITIONS[task.status] || [];

    const stepper = STATUS_ORDER.map((status, index) => `
      <div class="status-step ${status === task.status ? "is-current" : STATUS_ORDER.indexOf(task.status) > index ? "is-completed" : ""}">
        <span class="circle">${STATUS_ORDER.indexOf(task.status) > index ? "✓" : index + 1}</span>
        <span>${STATUS_LABELS[status]}</span>
      </div>
    `).join("");

    const actions = allowed.map((next) => `
      <button class="btn ${next === "completed" ? "btn-success" : ""} btn-sm" data-next-status="${next}">
        ${next === "completed" ? "✓ " : ""}${STATUS_LABELS[next]}
      </button>
    `).join("");

    const subtaskRows = subtasks.map((item) => `
      <div class="subtask ${item.is_completed ? "is-done" : ""}">
        <input type="checkbox" data-subtask-id="${item.id}" ${item.is_completed ? "checked" : ""}>
        <label>${escapeHtml(item.title)}</label>
      </div>
    `).join("");

    const commentRows = comments.map((comment) => {
      const author = bundle.members.find((m) => m.id === comment.user_id);
      return `
        <div class="comment">
          ${avatar(author, "avatar-sm")}
          <div class="comment-body">
            <div class="comment-head">
              <span class="comment-author">${escapeHtml(author?.name || "สมาชิก")}</span>
              <span class="comment-time">${formatDateTime(comment.created_at)}</span>
            </div>
            <div class="comment-text">${escapeHtml(comment.content)}</div>
          </div>
        </div>
      `;
    }).join("");

    const revisionRows = revisions.map((revision) => {
      const requester = bundle.members.find((m) => m.id === revision.requested_by);
      return `
        <div class="list-item">
          <div class="avatar avatar-sm" style="background:var(--danger-bg);color:var(--danger);font-weight:700">
            R${revision.revision_number}
          </div>
          <div class="list-item-main">
            <div class="list-item-title">
              <strong>Version ${Number(revision.revision_number) + 1} (Revision #${revision.revision_number})</strong>
              <div style="margin-top:2px;color:var(--ink-800)">${escapeHtml(revision.reason || "ไม่ได้ระบุเหตุผล")}</div>
            </div>
            <div class="list-item-sub">
              ขอแก้ไขโดย ${escapeHtml(requester?.name || "—")} · ${formatDateTime(revision.created_at)}
            </div>
          </div>
          ${revision.completed_at ? `<span class="badge badge-ok">จบแล้ว</span>` : `<span class="badge badge-danger">กำลังแก้</span>`}
        </div>
      `;
    }).join("");

    const timeline = history.map((item) => {
      const actor = bundle.members.find((m) => m.id === item.user_id);
      return `
        <div class="timeline-item ${item.to_status === "completed" ? "is-completed" : item.action?.includes("revision") ? "is-revision" : item.to_status === task.status ? "is-current" : ""}">
          <div class="timeline-title">${escapeHtml(item.action === "status_changed" ? `${item.from_status ? STATUS_LABELS[item.from_status] : "เริ่มงาน"} → ${STATUS_LABELS[item.to_status]}` : item.action === "created" ? "สร้างงาน" : item.action === "completed" ? "ส่งมอบไฟล์สำเร็จ" : item.action === "revision_requested" ? `Revision #${item.revision_number} · ขอแก้ไข` : item.action || "อัปเดต")}</div>
          <div class="timeline-meta">${escapeHtml(actor?.name || "สมาชิก")} · ${formatDateTime(item.created_at)}</div>
          ${item.note ? `<div class="timeline-note">${escapeHtml(item.note)}</div>` : ""}
        </div>
      `;
    }).join("");

    // Visual Proofing Artwork Box HTML
    const proofingHtml = task.preview_url ? `
      <div class="artwork-proof-box">
        <div class="artwork-proof-header">
          <div class="row-wrap" style="gap:8px">
            <strong>🎨 Artwork Proofing</strong>
            ${task.revision_count ? `<span class="chip" style="background:var(--danger-bg);color:var(--danger);font-weight:600">v${Number(task.revision_count) + 1} (Rev #${task.revision_count})</span>` : `<span class="chip">v1 (Initial Draft)</span>`}
            ${task.dimensions ? `<span class="task-card-format-tag">📐 ${escapeHtml(task.dimensions)}</span>` : ""}
            ${task.channel ? `<span class="task-card-format-tag">📢 ${escapeHtml(task.channel)}</span>` : ""}
          </div>
          <div class="row-wrap" style="gap:8px">
            ${task.design_url ? `<a href="${escapeHtml(task.design_url)}" target="_blank" rel="noopener" class="btn btn-sm">🎨 เปิดไฟล์งาน (Figma/Drive) ↗</a>` : ""}
            <button class="btn btn-sm" id="btn-edit-artwork">✏️ เปลี่ยนภาพ / ลิงก์</button>
          </div>
        </div>
        <div class="artwork-proof-img-wrap" id="artwork-proof-wrap" title="คลิกเพื่อขยายดูภาพขนาดเต็ม (Zoom)">
          <img src="${escapeHtml(task.preview_url)}" alt="${escapeHtml(task.title)}" />
          <div class="artwork-proof-zoom-hint">🔍 คลิกเพื่อขยายเต็มจอ (Zoom)</div>
        </div>
      </div>
    ` : `
      <div class="card" style="border: 2px dashed var(--line-strong); background: var(--surface-alt); text-align: center; padding: 22px 16px;">
        <div style="font-size: 2rem; margin-bottom: 6px;">🎨</div>
        <div style="font-weight: 600; color: var(--ink-900); font-size: 0.95rem; margin-bottom: 4px;">ยังไม่ได้แนบภาพตัวอย่างงาน (Artwork Preview)</div>
        <p class="text-xs text-muted" style="max-width: 420px; margin: 0 auto 14px;">แนบภาพตัวอย่างเพื่อให้ทีมและหัวหน้าตรวจแบบได้ทันที พร้อมระบุลิงก์ Figma หรือ Google Drive</p>
        <button class="btn btn-primary btn-sm" id="btn-add-artwork">＋ แนบภาพพรีวิว & ลิงก์ไฟล์งาน</button>
      </div>
    `;

    qs("#page-content").innerHTML = `
      <div class="page-header">
        <div>
          <div class="row-wrap">
            <a class="text-sm" href="tasks.html">← กลับไปหน้ารวมงาน</a>
            ${statusBadge(task.status)}
          </div>
          <h2 class="detail-title" style="margin-top:8px">${escapeHtml(task.title)}</h2>
          <p class="page-desc">${escapeHtml(project?.name || "ไม่ระบุโปรเจกต์")} · อัปเดตล่าสุด ${formatDateTime(task.updated_at)}</p>
        </div>
        <div class="detail-actions">
          ${actions}
          ${task.status === "completed" ? `<button class="btn btn-sm" data-reopen>เปิดกลับมาแก้</button>` : ""}
          ${canDeleteTask(ctx.member) ? `<button class="btn btn-danger btn-sm" data-delete-task>ลบงาน</button>` : ""}
        </div>
      </div>

      <div class="card card-tight" style="margin-bottom:16px">
        <div class="status-stepper">${stepper}</div>
        <div class="row-wrap" style="justify-content:space-between">
          <span class="small-note">Workflow CONT · Version ${Number(task.revision_count || 0) + 1} (แก้แล้ว ${task.revision_count || 0} ครั้ง)</span>
          ${task.completed_at ? `<span class="badge badge-ok">ส่งมอบสำเร็จเมื่อ ${formatDateLong(task.completed_at)}</span>` : ""}
        </div>
      </div>

      <!-- Main Proofing & Content Grid -->
      <div class="detail-grid">
        <div class="stack">
          <!-- Artwork Proofing Box -->
          ${proofingHtml}

          <!-- Brief Section -->
          <section class="card">
            <div class="card-header">
              <div class="card-title">Design Brief</div>
              <div class="row-wrap" style="gap:6px">
                <span class="chip">${escapeHtml(taskTypeLabel(task.task_type))}</span>
                ${task.dimensions ? `<span class="chip">${escapeHtml(task.dimensions)}</span>` : ""}
              </div>
            </div>
            <p style="white-space:pre-wrap;color:var(--ink-700);line-height:1.6">${escapeHtml(task.description || "ยังไม่มี Brief")}</p>
            <div class="divider"></div>
            <div class="kv-list">
              <div><div class="k">Project</div><div class="v">${escapeHtml(project?.name || "—")}</div></div>
              <div><div class="k">Deadline</div><div class="v">${formatDateTime(task.deadline_at || task.deadline)}</div></div>
              <div><div class="k">Assignee</div><div class="v">${member ? `<span class="user-inline">${avatar(member, "avatar-sm")}${escapeHtml(member.name)}</span>` : "—"}</div></div>
              <div><div class="k">ผู้มอบหมาย</div><div class="v">${escapeHtml(creator?.name || "—")}</div></div>
              <div><div class="k">ประเภทงาน</div><div class="v">${escapeHtml(taskTypeLabel(task.task_type))}</div></div>
              <div><div class="k">จำนวนชิ้นงาน</div><div class="v">${Number(task.item_count || 1)} ชิ้น</div></div>
              <div><div class="k">ขนาด / Format</div><div class="v">${escapeHtml(task.dimensions || "—")}</div></div>
              <div><div class="k">ช่องทาง (Channel)</div><div class="v">${escapeHtml(task.channel || "—")}</div></div>
              <div><div class="k">สถานะเวลา</div><div class="v">${escapeHtml(relativeDeadline(task.deadline_at || task.deadline).label)}</div></div>
              <div><div class="k">Version ปัจจุบัน</div><div class="v">v${Number(task.revision_count || 0) + 1} (แก้แล้ว ${task.revision_count || 0} รอบ)</div></div>
            </div>
          </section>

          <!-- Subtasks Section -->
          <section class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Subtasks / Checklist</div>
                <div class="card-sub">${progress.done}/${progress.total} completed · ${progress.percent}%</div>
              </div>
              <button class="btn btn-sm" id="add-subtask">＋ เพิ่ม</button>
            </div>
            <div class="progress ${progress.percent === 100 ? "is-ok" : ""}" style="margin-bottom:10px">
              <span style="width:${progress.percent}%"></span>
            </div>
            ${subtaskRows || `<div class="state" style="padding:18px">ยังไม่มี Subtask</div>`}
          </section>

          <!-- Comments Section -->
          <section class="card">
            <div class="card-header">
              <div class="card-title">Comment / Feedback ในทีม</div>
            </div>
            <div>
              ${commentRows || `<div class="text-sm text-muted" style="padding:10px 0">ยังไม่มีคอมเมนต์ในงานนี้</div>`}
            </div>
            <form id="comment-form" class="inline-form" style="margin-top:12px">
              <div class="field">
                <label class="sr-only">เพิ่ม Comment</label>
                <input name="content" required placeholder="เขียน Feedback ตรวจแบบ หรืออัปเดตสั้น ๆ…">
              </div>
              <button class="btn btn-primary btn-sm">ส่ง</button>
            </form>
          </section>
        </div>

        <!-- Right Column: Versions & History -->
        <div class="stack">
          <section class="card">
            <div class="card-header">
              <div>
                <div class="card-title">ประวัติรอบการแก้งาน (Versions)</div>
                <div class="card-sub">ปัจจุบัน: Version ${Number(task.revision_count || 0) + 1}</div>
              </div>
              ${task.status === "review" || task.status === "completed" ? `<button class="btn btn-danger btn-sm" id="request-revision">ขอแก้ไขงาน</button>` : ""}
            </div>
            <div class="stack" style="gap:8px">
              ${revisionRows || `<div class="state" style="padding:18px">ยังไม่มีการขอแก้ไข (ยังอยู่รอบ Version 1)</div>`}
              <div class="list-item" style="border-top:1px dashed var(--line);padding-top:8px">
                <div class="avatar avatar-sm" style="background:var(--purple-100);color:var(--kkp-purple);font-weight:700">v1</div>
                <div class="list-item-main">
                  <div class="list-item-title">Version 1 (Initial Draft)</div>
                  <div class="list-item-sub">สร้างงานโดย ${escapeHtml(creator?.name || "—")} · ${formatDateTime(task.created_at)}</div>
                </div>
                <span class="badge badge-neutral">ดราฟต์แรก</span>
              </div>
            </div>
          </section>

          <section class="card">
            <div class="card-header">
              <div class="card-title">Work History & Activity</div>
              <span class="chip">${history.length} events</span>
            </div>
            <div class="timeline">
              ${timeline || `<div class="state" style="padding:18px">ยังไม่มีประวัติ</div>`}
            </div>
          </section>
        </div>
      </div>
    `;

    // Event listeners
    qs("#artwork-proof-wrap")?.addEventListener("click", () => {
      openLightbox(task.preview_url, task.title);
    });

    qs("#btn-edit-artwork")?.addEventListener("click", openEditArtworkModal);
    qs("#btn-add-artwork")?.addEventListener("click", openEditArtworkModal);

    document.querySelectorAll("[data-next-status]").forEach((button) =>
      button.addEventListener("click", async () => {
        try {
          await api.changeStatus(id, button.dataset.nextStatus, "อัปเดตจาก Task Detail");
          toast("เปลี่ยนสถานะเรียบร้อยแล้ว", "success");
          bundle = await api.loadBundle();
          draw();
        } catch (error) {
          toast(error.message, "error");
        }
      })
    );

    qs("[data-reopen]")?.addEventListener("click", async () => {
      try {
        await api.changeStatus(id, "revision", "Reopen งานที่ส่งมอบแล้ว");
        toast("เปิดงานกลับมาแก้แล้ว", "success");
        bundle = await api.loadBundle();
        draw();
      } catch (error) {
        toast(error.message, "error");
      }
    });

    qs("[data-delete-task]")?.addEventListener("click", async () => {
      if (!window.confirm("ยืนยันลบงานนี้? ข้อมูล History ที่เกี่ยวข้องจะถูกลบด้วย")) return;
      try {
        await api.deleteTask(id);
        toast("ลบงานแล้ว", "success");
        window.location.href = "tasks.html";
      } catch (error) {
        toast(error.message, "error");
      }
    });

    document.querySelectorAll("[data-subtask-id]").forEach((checkbox) =>
      checkbox.addEventListener("change", async () => {
        try {
          await api.toggleSubtask(checkbox.dataset.subtaskId, checkbox.checked);
          bundle = await api.loadBundle();
          draw();
        } catch (error) {
          toast(error.message, "error");
        }
      })
    );

    qs("#add-subtask")?.addEventListener("click", () => {
      const modal = openModal({
        title: "เพิ่ม Subtask",
        body: `<form id="subtask-form"><div class="field"><label>ชื่องานย่อย *</label><input name="title" required placeholder="เช่น ตรวจ CI, ปรับขนาด Story"></div></form>`,
        footer: `<button class="btn" data-close-modal>ยกเลิก</button><button class="btn btn-primary" id="save-subtask">เพิ่ม Subtask</button>`
      });
      qs("#save-subtask", modal).addEventListener("click", async () => {
        const form = qs("#subtask-form", modal);
        if (!form.reportValidity()) return;
        try {
          await api.addSubtask(id, new FormData(form).get("title"));
          closeModal();
          bundle = await api.loadBundle();
          draw();
        } catch (error) {
          toast(error.message, "error");
        }
      });
    });

    qs("#comment-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const content = new FormData(event.currentTarget).get("content");
      try {
        await api.addComment(id, content);
        event.currentTarget.reset();
        bundle = await api.loadBundle();
        draw();
      } catch (error) {
        toast(error.message, "error");
      }
    });

    qs("#request-revision")?.addEventListener("click", () => {
      const modal = openModal({
        title: `ขอแก้ไขงาน (สร้าง Version ${Number(task.revision_count || 0) + 2})`,
        body: `
          <form id="revision-form" class="stack">
            <div class="field">
              <label>เหตุผลและจุดที่ต้องปรับแก้ *</label>
              <textarea name="reason" required placeholder="ระบุสิ่งที่ต้องการให้ดีไซเนอร์ปรับแก้ให้ละเอียดและชัดเจน..."></textarea>
            </div>
          </form>
        `,
        footer: `
          <button class="btn" data-close-modal>ยกเลิก</button>
          <button class="btn btn-danger" id="save-revision">ยืนยันขอแก้ไข (Revision)</button>
        `
      });
      qs("#save-revision", modal).addEventListener("click", async () => {
        const form = qs("#revision-form", modal);
        if (!form.reportValidity()) return;
        try {
          await api.requestRevision(id, new FormData(form).get("reason"));
          closeModal();
          toast("สร้างคำขอแก้ไข (Revision) เรียบร้อยแล้ว", "success");
          bundle = await api.loadBundle();
          draw();
        } catch (error) {
          toast(error.message, "error");
        }
      });
    });
  };

  draw();
}
