import { openModal, closeModal, toast, qs, qsa } from "./app.js";
import { api } from "./supabase.js";
import { escapeHtml, roleLabel } from "./formatters.js";
import { canManage, canCreateTask, isRequester, isViewer } from "./auth.js";
import { renderImageUploaderHtml, bindImageUploader } from "./image-uploader.js";

export function bindTaskCards(root = document) {
  const node = (root && typeof root.querySelectorAll === "function") ? root : document;
  qsa("[data-task-id]", node).forEach((card) => {
    const open = () => { window.location.href = `task.html?id=${encodeURIComponent(card.dataset.taskId)}`; };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
  });
}

const BRIEF_PRESETS = [
  {
    id: "fb_post",
    label: "Facebook Post",
    sub: "1:1 (1080×1080 px)",
    tag: "Feed / Ads",
    dimensions: "1080x1080 px (1:1)",
    channel: "Facebook",
    type: "new_work",
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    template: `วัตถุประสงค์ (Objective): ประชาสัมพันธ์ข้อมูลแคมเปญ\nกลุ่มเป้าหมาย (Target Audience): ลูกค้าทั่วไป\nข้อความหลัก (Headline / Copy): \nMood & Tone: เรียบหรู ตาม CI แบรนด์ KKP\nลิงก์โฟลเดอร์ Asset ต้นฉบับ / Reference: `
  },
  {
    id: "story_reels",
    label: "Story / Reels",
    sub: "9:16 (1080×1920 px)",
    tag: "Vertical Screen",
    dimensions: "1080x1920 px (9:16)",
    channel: "Instagram / FB Story",
    type: "new_work",
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
    template: `วัตถุประสงค์ (Objective): Vertical Story ดึงดูดสายตา\nกลุ่มเป้าหมาย (Target Audience): วัยทำงาน / คนรุ่นใหม่\nข้อความสำคัญ (Key Message / Call-to-Action): \nMood & Tone: ทันสมัย ชัดเจน กระชับ\nลิงก์ไฟล์รูปภาพ / Reference: `
  },
  {
    id: "fb_cover",
    label: "Facebook Cover",
    sub: "16:9 (1920×1080 px)",
    tag: "Header Banner",
    dimensions: "1920x1080 px (16:9)",
    channel: "Facebook Page",
    type: "new_work",
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/></svg>`,
    template: `วัตถุประสงค์: อัปเดต Cover Page ประจำเดือน\nHeadline หลัก: \nองค์ประกอบสำคัญ: โลโก้ KKP, ข้อมูลสิทธิประโยชน์แคมเปญ\nลิงก์ไฟล์ Key Visual ต้นฉบับ: `
  },
  {
    id: "gdn_banner",
    label: "GDN Web Banner",
    sub: "Display Ad Package",
    tag: "Standard Sizes",
    dimensions: "300x250, 728x90, 160x600 px",
    channel: "GDN / Online Ads",
    type: "new_work",
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    template: `วัตถุประสงค์: แบนเนอร์โฆษณาออนไลน์ (GDN)\nCall-To-Action (ปุ่ม CTA): คลิกดูรายละเอียด\nสัดส่วนที่ต้องทำ: 300x250 (Medium Rectangle), 728x90 (Leaderboard), 160x600 px\nลิงก์โฟลเดอร์ภาพ Key Visual: `
  },
  {
    id: "print_a4",
    label: "สื่อสิ่งพิมพ์ / A4",
    sub: "300 DPI (CMYK)",
    tag: "Brochure / Leaflet",
    dimensions: "210x297 mm (300 DPI)",
    channel: "Print / Branch",
    type: "new_work",
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>`,
    template: `วัตถุประสงค์: โบรชัวร์ / ใบปลิว A4 สำหรับสาขาธนาคาร\nข้อมูลและเนื้อหา (Word / Text): \nระบบสี: CMYK (High-Resolution 300 DPI มี Bleed 3mm)\nลิงก์โฟลเดอร์ CI และโลโก้ความละเอียดสูง: `
  },
  {
    id: "resize_pack",
    label: "ปรับขยาย Size (Resize)",
    sub: "Adaptation Package",
    tag: "Multi-channel",
    dimensions: "ตามแพ็กเกจสื่อ",
    channel: "Multi-channel",
    type: "resize",
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
    template: `งานปรับขยาย Size จากชิ้นงานเดิม:\nลิงก์งานต้นแบบ (Master Key Visual): \nขนาดที่ต้องการเพิ่ม:\n- ขนาด 1 (เช่น 1200x628 px):\n- ขนาด 2 (เช่น 1080x1920 px): `
  }
];

export function openCreateTask(ctx = {}, defaults = {}) {
  const currentMember = ctx?.member || window.CONT_MEMBER || (ctx?.members && ctx.members[0]);
  if (!canCreateTask(currentMember)) {
    toast("ไม่มีสิทธิ์สร้างงาน (Read-only / Viewer)", "warn");
    return;
  }

  // Pre-fill tomorrow 18:00 as default deadline
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);
  const defaultDeadline = tomorrow.toISOString().slice(0, 16);

  const projects = (ctx?.projects && ctx.projects.length) ? ctx.projects : [
    { id: "41e8989d-185a-4ae0-9579-b8572001f1dc", name: "CONT — Graphic Design" },
    { id: "7ab9334d-97ed-4532-a85e-615a32bc8edd", name: "KKP Auto และแคมเปญรถ" },
    { id: "b2e7f9db-e520-4e72-a4a1-80078f27ef03", name: "รถเรียกเงิน (RRN)" },
    { id: "a43dfd54-16e9-4f43-b148-17dc9ea09082", name: "KKP Loan Sure" },
    { id: "154b0b5b-7123-4f9c-84df-6b099be1f995", name: "สินเชื่อบ้านอื่น ๆ" }
  ];

  const designMembers = (ctx?.members && ctx.members.length)
    ? ctx.members.filter((m) => m.is_active !== false && ["designer", "supervisor", "admin"].includes(m.role))
    : [
        { id: "1fd3ea77-8461-4de1-917a-90a9869428c1", name: "BEEM", role: "supervisor" },
        { id: "a31026f2-adc9-47d7-9ba0-f809be9344f1", name: "Peerapisit Rojatiegpanya", role: "designer" },
        { id: "617af97c-0c1e-4842-91d9-f9ecbc0fa303", name: "Pisit Sintavanuwat", role: "designer" },
        { id: "9135d1e4-ba13-4cf7-adcf-9e05d33c5e52", name: "Pongsathorn Pang", role: "designer" },
        { id: "c16a2845-c95e-47c5-b616-4b37299574a4", name: "Yutiporn Thongkom", role: "designer" },
        { id: "739187f5-e142-4aa4-95ad-e06f881163cc", name: "Naraporn Leungvititgoon", role: "designer" }
      ];

  const presetsHtml = `
    <div class="task-quick-presets-bar">
      <div class="quick-preset-head">
        <span class="quick-preset-title">⚡ เทมเพลตบรีฟด่วน</span>
        <span class="quick-preset-desc">คลิกเพื่อเลือกขนาดและประเภทงานสำเร็จรูปอัตโนมัติ</span>
      </div>
      <div class="quick-preset-pills">
        ${BRIEF_PRESETS.map((p) => `
          <button type="button" class="btn-brief-pill brief-preset-btn" data-preset-id="${p.id}" title="${escapeHtml(p.label)} (${escapeHtml(p.sub)})">
            <span class="pill-icon">${p.icon}</span>
            <span class="pill-label">${escapeHtml(p.label)}</span>
            <span class="pill-dim">${escapeHtml(p.sub)}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;

  const body = `
    <form id="create-task-form" class="task-modal-form">
      ${presetsHtml}

      <!-- ส่วนที่ 1: ข้อมูลงาน & โปรเจกต์ -->
      <div class="form-card-group">
        <div class="form-group-header">
          <span class="group-icon">📌</span>
          <span class="group-title">1. ข้อมูลงานและแคมเปญ</span>
        </div>

        <!-- ชื่องาน (Main Title) -->
        <div class="field field-full">
          <label for="task-title" class="field-label-prominent">
            <span>ชื่องาน / อาร์ตเวิร์ก</span>
            <span class="required-star">*</span>
          </label>
          <input id="task-title" name="title" class="input-task-title" required placeholder="เช่น RRN — แบนเนอร์สินเชื่อบ้าน ก.พ. 2026">
        </div>

        <!-- โปรเจกต์ & ประเภทงาน -->
        <div class="form-grid-2">
          <div class="field">
            <label for="task-project" class="field-label-clean">
              <span>Project / แคมเปญ</span>
              <span class="required-star">*</span>
            </label>
            <select id="task-project" name="project_id" class="input-clean" required>
              <option value="">เลือก Project / แคมเปญ...</option>
              ${projects.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("")}
            </select>
          </div>

          <div class="field">
            <label for="task-type" class="field-label-clean">
              <span>ประเภทงาน</span>
              <span class="required-star">*</span>
            </label>
            <select id="task-type" name="task_type" class="input-clean" required>
              <option value="new_work">เริ่มงานใหม่ (New Creative)</option>
              <option value="resize">ปรับขยาย Size (Resize)</option>
              <option value="revision">แก้ไขงานเดิม (Revision)</option>
              <option value="adaptation">ดัดแปลงจากชิ้นเดิม (Derivative)</option>
              <option value="other">อื่น ๆ (Other)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- ส่วนที่ 2: ผู้รับผิดชอบ & กำหนดส่งมอบ -->
      <div class="form-card-group">
        <div class="form-group-header">
          <span class="group-icon">👥</span>
          <span class="group-title">2. ผู้รับผิดชอบและกำหนดส่งมอบ</span>
        </div>

        <div class="form-grid-2">
          <div class="field">
            <label for="task-assignee" class="field-label-clean">
              <span>ผู้รับผิดชอบ (Designer)</span>
              <span class="required-star">*</span>
            </label>
            <select id="task-assignee" name="assignee_id" class="input-clean" required>
              <option value="">เลือกดีไซเนอร์ในทีม...</option>
              ${designMembers.map((m) => `
                <option value="${escapeHtml(m.id)}" ${defaults?.assignee_id === m.id ? "selected" : ""}>${escapeHtml(m.name)} · ${escapeHtml(roleLabel(m.role))}</option>
              `).join("")}
            </select>
          </div>

          <div class="field">
            <label for="task-deadline" class="field-label-clean">
              <span>กำหนดส่งมอบ (Target Deadline)</span>
              <span class="required-star">*</span>
            </label>
            <input id="task-deadline" type="datetime-local" name="deadline_at" class="input-clean" value="${defaultDeadline}" required>
          </div>
        </div>
      </div>

      <!-- ส่วนที่ 3: สเปกชิ้นงาน -->
      <div class="form-card-group">
        <div class="form-group-header">
          <span class="group-icon">📐</span>
          <span class="group-title">3. สเปกชิ้นงานและช่องทางสื่อ</span>
        </div>

        <div class="form-grid-3">
          <div class="field">
            <label for="task-dimensions" class="field-label-clean">ขนาด (Dimensions)</label>
            <input id="task-dimensions" name="dimensions" class="input-clean" placeholder="เช่น 1080x1080 px (1:1)">
          </div>

          <div class="field">
            <label for="task-channel" class="field-label-clean">ช่องทางสื่อ (Channel)</label>
            <input id="task-channel" name="channel" class="input-clean" placeholder="เช่น Facebook, IG Story, GDN">
          </div>

          <div class="field">
            <label for="task-item-count" class="field-label-clean">
              <span>จำนวนชิ้นงาน</span>
              <span class="required-star">*</span>
            </label>
            <input id="task-item-count" type="number" name="item_count" class="input-clean" min="1" max="10000" value="1" required>
          </div>
        </div>
      </div>

      <!-- ส่วนที่ 4: รายละเอียดบรีฟ & ภาพอ้างอิง -->
      <div class="form-card-group">
        <div class="form-group-header">
          <span class="group-icon">📝</span>
          <span class="group-title">4. รายละเอียดบรีฟและไฟล์อ้างอิง</span>
        </div>

        <div class="field field-full">
          <label for="task-brief" class="field-label-clean">
            <span>รายละเอียดบรีฟ / สิ่งที่ต้องส่งมอบ (Brief Details)</span>
          </label>
          <textarea id="task-brief" name="description" class="textarea-clean" rows="4" placeholder="ระบุวัตถุประสงค์, ข้อความหลัก (Copy / Headline), หรือลิงก์ Asset อ้างอิง..."></textarea>
        </div>

        <div class="field field-full">
          ${renderImageUploaderHtml({
            id: "create-task-artwork-uploader",
            label: "รูปภาพตัวอย่างงาน / Reference Artwork (ถ้ามี)",
            hint: "แนบไฟล์ภาพจากในเครื่อง หรือใส่ลิงก์รูปภาพเว็บ เพื่อแสดงพรีวิวบนหน้าบอร์ด",
            initialUrl: "",
            fieldName: "preview_url"
          })}
        </div>
      </div>

      <div id="create-task-error" class="error-text"></div>
    </form>
  `;

  const isReq = isRequester(ctx.member);
  const modal = openModal({
    title: `
      <div class="create-task-modal-header">
        <div class="modal-header-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
        <div class="modal-header-text">
          <div class="modal-header-title">${isReq ? "ส่งคำของานออกแบบใหม่ (Request Design Work)" : "สร้างงานใหม่ (Create Design Task)"}</div>
          <div class="modal-header-subtitle">กรอกรายละเอียดบรีฟเพื่อเปิดคำขอและลงทะเบียนคิวงานของทีม Creative Operations</div>
        </div>
      </div>
    `,
    body: (isReq ? `<div class="requester-info-strip"><span>👤 ผู้ส่งบรีฟ (Requester): <strong>${escapeHtml(ctx.member?.name || "")}</strong></span></div>` : "") + body,
    size: "lg",
    footer: `
      <div class="modal-footer-wrap">
        <div class="modal-footer-note">
          <span class="dot"></span> <span>ข้อมูลจะลงทะเบียนเข้าสู่คิวงาน Creative Operations ทันที</span>
        </div>
        <div class="modal-footer-actions">
          <button class="btn btn-secondary" data-close-modal>ยกเลิก</button>
          <button class="btn btn-primary btn-save-task" id="submit-create-task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            <span>${isReq ? "ส่งคำของานออกแบบ" : "สร้างงานและบันทึก"}</span>
          </button>
        </div>
      </div>
    `
  });

  // Initialize Dual Image Uploader
  const uploader = bindImageUploader(modal, { id: "create-task-artwork-uploader" });

  // Handle Preset Clicks
  qsa(".brief-preset-btn", modal).forEach((btn) => {
    btn.addEventListener("click", () => {
      qsa(".brief-preset-btn", modal).forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      const preset = BRIEF_PRESETS.find((p) => p.id === btn.dataset.presetId);
      if (!preset) return;

      const typeSelect = qs("#task-type", modal);
      const dimensionsInput = qs("#task-dimensions", modal);
      const channelInput = qs("#task-channel", modal);
      const briefTextarea = qs("#task-brief", modal);

      if (typeSelect) typeSelect.value = preset.type;
      if (dimensionsInput) dimensionsInput.value = preset.dimensions;
      if (channelInput) channelInput.value = preset.channel;
      if (briefTextarea && !briefTextarea.value.trim()) {
        briefTextarea.value = preset.template;
      }
    });
  });

  // Apply Defaults if provided (e.g. from Trends AI Curator)
  if (defaults && typeof defaults === "object" && Object.keys(defaults).length > 0) {
    const titleInput = qs("#task-title", modal);
    const briefInput = qs("#task-brief", modal);
    const channelInput = qs("#task-channel", modal);
    const dimensionsInput = qs("#task-dimensions", modal);
    const projectSelect = qs("#task-project", modal);
    const typeSelect = qs("#task-type", modal);

    if (defaults.title && titleInput) titleInput.value = defaults.title;
    if (defaults.description && briefInput) briefInput.value = defaults.description;
    if (defaults.channel && channelInput) channelInput.value = defaults.channel;
    if (defaults.dimensions && dimensionsInput) dimensionsInput.value = defaults.dimensions;
    if (defaults.project_id && projectSelect) projectSelect.value = defaults.project_id;
    if (defaults.task_type && typeSelect) typeSelect.value = defaults.task_type;
    if (defaults.preview_url && uploader) uploader.setValue(defaults.preview_url);
  }

  // Handle Form Submission
  qs("#submit-create-task", modal).addEventListener("click", async () => {
    const form = qs("#create-task-form", modal);
    if (!form.reportValidity()) return;

    const submitBtn = qs("#submit-create-task", modal);
    const originalHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>⏳ กำลังบันทึกงาน...</span>`;

    const data = Object.fromEntries(new FormData(form));
    const previewUrl = uploader ? uploader.getValue() : (data.preview_url || "");
    const errorNode = qs("#create-task-error", modal);
    errorNode.textContent = "";

    try {
      const creatorId = currentMember?.id || designMembers[0]?.id || "1fd3ea77-8461-4de1-917a-90a9869428c1";
      const created = await api.createTask({
        ...data,
        preview_url: previewUrl ? previewUrl.trim() : null,
        item_count: Math.min(10000, Math.max(1, Number(data.item_count || 1))),
        created_by: creatorId,
      });

      closeModal();
      toast("สร้างงานใหม่เรียบร้อยแล้ว", "success");
      window.setTimeout(() => {
        window.location.href = `task.html?id=${encodeURIComponent(created.id)}`;
      }, 350);
    } catch (error) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
      errorNode.textContent = error.message || "ไม่สามารถสร้างงานได้";
      toast(error.message || "ไม่สามารถสร้างงานได้", "error");
    }
  });
}
