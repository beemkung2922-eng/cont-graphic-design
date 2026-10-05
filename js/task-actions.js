import { openModal, closeModal, toast, qs, qsa } from "./app.js";
import { api } from "./supabase.js";
import { escapeHtml, roleLabel } from "./formatters.js";
import { canManage } from "./auth.js";

export function bindTaskCards(root = document) {
  qsa("[data-task-id]", root).forEach((card) => {
    const open = () => { window.location.href = `task.html?id=${encodeURIComponent(card.dataset.taskId)}`; };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
  });
}

const BRIEF_PRESETS = [
  {
    id: "fb_post",
    label: "Facebook Post",
    sub: "1:1 (1080x1080)",
    dimensions: "1080x1080 px (1:1)",
    channel: "Facebook",
    type: "new_work",
    template: `วัตถุประสงค์ (Objective): ประชาสัมพันธ์ข้อมูลแคมเปญ\nกลุ่มเป้าหมาย: ลูกค้าทั่วไป\nข้อความหลัก (Headline): \nMood & Tone: เรียบหรู ตาม CI แบรนด์ KKP\nลิงก์ Drive / Assets: `
  },
  {
    id: "story_reels",
    label: "Story / Reels",
    sub: "9:16 (1080x1920)",
    dimensions: "1080x1920 px (9:16)",
    channel: "Instagram / FB Story",
    type: "new_work",
    template: `วัตถุประสงค์: Vertical Story ดึงดูดสายตา\nกลุ่มเป้าหมาย: วัยทำงาน / คนรุ่นใหม่\nข้อความสำคัญ (Key Visual): \nMood & Tone: ทันสมัย ชัดเจน กระชับ\nลิงก์ Reference: `
  },
  {
    id: "fb_cover",
    label: "Facebook Cover",
    sub: "16:9 (1920x1080)",
    dimensions: "1920x1080 px",
    channel: "Facebook Page",
    type: "new_work",
    template: `วัตถุประสงค์: อัปเดต Cover Page ประจำเดือน\nHeadline หลัก: \nองค์ประกอบสำคัญ: โลโก้ KKP, ข้อมูลสิทธิประโยชน์\nไฟล์ต้นฉบับ: `
  },
  {
    id: "gdn_banner",
    label: "GDN Web Banner",
    sub: "Standard Sizes",
    dimensions: "300x250, 728x90, 160x600 px",
    channel: "GDN / Online Ads",
    type: "new_work",
    template: `วัตถุประสงค์: แบนเนอร์โฆษณาออนไลน์\nCall-To-Action (ปุ่ม CTA): คลิกดูรายละเอียด\nสัดส่วนที่ต้องทำ: 300x250, 728x90, 160x600 px\nโฟลเดอร์ Key Visual: `
  },
  {
    id: "print_a4",
    label: "สิ่งพิมพ์ / A4",
    sub: "300 DPI (CMYK)",
    dimensions: "210x297 mm (300 DPI)",
    channel: "Print / Brochure",
    type: "new_work",
    template: `วัตถุประสงค์: โบรชัวร์ / ใบปลิว A4 สำหรับสาขา\nข้อมูลและเนื้อหา: \nระบบสี: CMYK (High-Resolution 300 DPI มี Bleed 3mm)\nลิงก์ข้อความ Word / CI: `
  },
  {
    id: "resize_pack",
    label: "ปรับขยาย Size (Resize)",
    sub: "หลายขนาดจากชิ้นเดิม",
    dimensions: "ตามแพ็กเกจสื่อ",
    channel: "Multi-channel",
    type: "resize",
    template: `งานปรับขยาย Size จากชิ้นงานเดิม:\nลิงก์งานต้นแบบ: \nขนาดที่ต้องการเพิ่ม:\n- ขนาด 1:\n- ขนาด 2: `
  }
];

export function openCreateTask(ctx) {
  if (!canManage(ctx.member)) {
    toast("เฉพาะ Team Head of Visual & Design ที่สร้างงานได้", "warn");
    return;
  }

  // Pre-fill tomorrow 18:00 as default deadline
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);
  const defaultDeadline = tomorrow.toISOString().slice(0, 16);

  const presetsHtml = `
    <div class="brief-presets-wrap">
      <div class="brief-presets-label" style="font-weight:600;color:var(--ink-700)">
        <span>เลือกเทมเพลตบรีฟงาน (Smart Brief Presets):</span>
      </div>
      <div class="brief-preset-grid">
        ${BRIEF_PRESETS.map((p) => `
          <button type="button" class="brief-preset-btn" data-preset-id="${p.id}">
            <span style="font-weight:600">${escapeHtml(p.label)}</span>
            <small style="font-weight:400">${escapeHtml(p.sub)}</small>
          </button>
        `).join("")}
      </div>
    </div>
  `;

  const body = `
    <form id="create-task-form" class="stack">
      ${presetsHtml}

      <div class="form-grid">
        <div class="field field-full">
          <label for="task-title" style="font-weight:600;color:var(--ink-900)">ชื่องาน *</label>
          <input id="task-title" name="title" required placeholder="เช่น RRN — แบนเนอร์สินเชื่อบ้าน ก.พ. 2026">
        </div>

        <div class="field">
          <label for="task-project" style="font-weight:600;color:var(--ink-900)">Project / แคมเปญ *</label>
          <select id="task-project" name="project_id" required>
            <option value="">เลือก Project</option>
            ${ctx.projects.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("")}
          </select>
        </div>

        <div class="field">
          <label for="task-type" style="font-weight:600;color:var(--ink-900)">ประเภทงาน *</label>
          <select id="task-type" name="task_type" required>
            <option value="new_work">เริ่มงานใหม่</option>
            <option value="resize">ปรับ Size</option>
            <option value="revision">แก้ไขงาน</option>
            <option value="adaptation">ดัดแปลงจากชิ้นเดิม</option>
            <option value="other">อื่น ๆ</option>
          </select>
        </div>

        <div class="field">
          <label for="task-assignee" style="font-weight:600;color:var(--ink-900)">ผู้รับผิดชอบ (Designer) *</label>
          <select id="task-assignee" name="assignee_id" required>
            <option value="">เลือกสมาชิกในทีม</option>
            ${ctx.members.filter((m) => m.is_active !== false).map((m) => `
              <option value="${escapeHtml(m.id)}">${escapeHtml(m.name)} · ${escapeHtml(roleLabel(m.role))}</option>
            `).join("")}
          </select>
        </div>

        <div class="field">
          <label for="task-deadline" style="font-weight:600;color:var(--ink-900)">กำหนดส่ง *</label>
          <input id="task-deadline" type="datetime-local" name="deadline_at" value="${defaultDeadline}" required>
          <span class="hint" style="font-weight:400;color:var(--ink-500)">ระบบจะคำนวณเวลานับถอยหลังและแจ้งเตือนให้อัตโนมัติ</span>
        </div>

        <div class="field">
          <label for="task-dimensions" style="font-weight:600;color:var(--ink-900)">ขนาด / Dimensions</label>
          <input id="task-dimensions" name="dimensions" placeholder="เช่น 1080x1920 px (9:16)">
        </div>

        <div class="field">
          <label for="task-channel" style="font-weight:600;color:var(--ink-900)">ช่องทางสื่อ (Channel)</label>
          <input id="task-channel" name="channel" placeholder="เช่น Instagram / FB Story, GDN, Print">
        </div>

        <div class="field">
          <label for="task-item-count" style="font-weight:600;color:var(--ink-900)">จำนวนชิ้นงาน *</label>
          <input id="task-item-count" type="number" name="item_count" min="1" max="10000" value="1" required>
        </div>

        <div class="field">
          <label for="task-design-url" style="font-weight:600;color:var(--ink-900)">ลิงก์ไฟล์ออกแบบ (Figma / Drive)</label>
          <input id="task-design-url" name="design_url" placeholder="https://www.figma.com/file/... หรือ ลิงก์ Drive">
          <span class="hint" style="font-weight:400;color:var(--ink-500)">ลิงก์ต้นฉบับเพื่อให้ทีมกดเปิดไฟล์งานจริงได้ทันที</span>
        </div>

        <div class="field field-full">
          <label for="task-preview-url" style="font-weight:600;color:var(--ink-900)">URL รูปภาพตัวอย่างงาน (Artwork Preview Image URL)</label>
          <input id="task-preview-url" name="preview_url" placeholder="https://example.com/artwork.jpg">
          <span class="hint" style="font-weight:400;color:var(--ink-500)">ใส่ลิงก์รูปภาพตัวอย่างงาน (JPG, PNG, WebP) เพื่อให้พรีวิวบนหน้าบอร์ดและหน้ารายละเอียด</span>
        </div>

        <div class="field field-full">
          <label for="task-brief" style="font-weight:600;color:var(--ink-900)">Design Brief (รายละเอียดโจทย์ & สิ่งที่ต้องส่งมอบ)</label>
          <textarea id="task-brief" name="description" rows="5" placeholder="ระบุวัตถุประสงค์ ข้อความหลัก Mood & Tone และลิงก์ไฟล์ที่เกี่ยวข้อง..."></textarea>
        </div>
      </div>

      <div id="create-task-error" class="error-text"></div>
    </form>
  `;

  const modal = openModal({
    title: "สร้างงานใหม่ (Create Design Task)",
    body,
    size: "lg",
    footer: `
      <button class="btn" data-close-modal>ยกเลิก</button>
      <button class="btn btn-primary" id="submit-create-task">สร้างงานและบันทึก</button>
    `
  });

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

  // Handle Form Submission
  qs("#submit-create-task", modal).addEventListener("click", async () => {
    const form = qs("#create-task-form", modal);
    if (!form.reportValidity()) return;

    const data = Object.fromEntries(new FormData(form));
    const errorNode = qs("#create-task-error", modal);
    errorNode.textContent = "";

    try {
      const created = await api.createTask({
        ...data,
        item_count: Number(data.item_count || 1),
        created_by: ctx.member.id,
      });

      closeModal();
      toast("สร้างงานใหม่เรียบร้อยแล้ว", "success");
      window.setTimeout(() => {
        window.location.href = `task.html?id=${encodeURIComponent(created.id)}`;
      }, 350);
    } catch (error) {
      errorNode.textContent = error.message || "ไม่สามารถสร้างงานได้";
    }
  });
}
