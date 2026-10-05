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
    label: "📱 Facebook Post",
    sub: "1:1 (1080x1080)",
    dimensions: "1080x1080 px (1:1)",
    channel: "Facebook",
    type: "new_work",
    template: `📌 วัตถุประสงค์ (Objective): ประชาสัมพันธ์ข้อมูลแคมเปญ\n🎯 กลุ่มเป้าหมาย: ลูกค้าทั่วไป\n💬 ข้อความหลัก (Headline): \n🎨 Mood & Tone: เรียบหรู ตาม CI แบรนด์ KKP\n📁 ลิงก์ Drive / Assets: `
  },
  {
    id: "story_reels",
    label: "📱 Story / Reels",
    sub: "9:16 (1080x1920)",
    dimensions: "1080x1920 px (9:16)",
    channel: "Instagram / FB Story",
    type: "new_work",
    template: `📌 วัตถุประสงค์: Vertical Story ดึงดูดสายตา\n🎯 กลุ่มเป้าหมาย: วัยทำงาน / คนรุ่นใหม่\n💬 ข้อความสำคัญ (Key Visual): \n🎨 โทนสีและสไตล์: ทันสมัย ชัดเจน กระชับ\n📁 ลิงก์ Reference: `
  },
  {
    id: "fb_cover",
    label: "🖥️ Facebook Cover",
    sub: "1920x1080",
    dimensions: "1920x1080 px",
    channel: "Facebook Page",
    type: "new_work",
    template: `📌 วัตถุประสงค์: อัปเดต Cover Page ประจำเดือน\n💬 Headline หลัก: \n🎨 องค์ประกอบสำคัญ: โลโก้ KKP, ข้อมูลสิทธิประโยชน์\n📁 ไฟล์ต้นฉบับ: `
  },
  {
    id: "gdn_banner",
    label: "💻 GDN Web Banner",
    sub: "Standard Sizes",
    dimensions: "300x250, 728x90, 160x600 px",
    channel: "GDN / Online Ads",
    type: "new_work",
    template: `📌 วัตถุประสงค์: แบนเนอร์โฆษณาออนไลน์\n💬 Call-To-Action (ปุ่ม CTA): คลิกดูรายละเอียด\n🎨 สัดส่วนที่ต้องทำ: 300x250, 728x90, 160x600 px\n📁 โฟลเดอร์ Key Visual: `
  },
  {
    id: "print_a4",
    label: "🖨️ สิ่งพิมพ์ / A4",
    sub: "300 DPI (CMYK)",
    dimensions: "210x297 mm (300 DPI)",
    channel: "Print / Brochure",
    type: "new_work",
    template: `📌 วัตถุประสงค์: โบรชัวร์ / ใบปลิว A4 สำหรับสาขา\n💬 ข้อมูลและเนื้อหา: \n🎨 ระบบสี: CMYK (High-Resolution 300 DPI มี Bleed 3mm)\n📁 ลิงก์ข้อความ Word / CI: `
  },
  {
    id: "resize_pack",
    label: "📐 ปรับ Size / Resize",
    sub: "หลายขนาดจากชิ้นเดิม",
    dimensions: "ตามแพ็กเกจสื่อ",
    channel: "Multi-channel",
    type: "resize",
    template: `📌 งานปรับขยาย Size จากชิ้นงานเดิม:\n🔗 ลิงก์งานต้นแบบ: \n📐 ขนาดที่ต้องการเพิ่ม:\n- ขนาด 1:\n- ขนาด 2: `
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
      <div class="brief-presets-label">
        <span>⚡ เลือกเทมเพลตบรีฟด่วน (Smart Brief Presets):</span>
      </div>
      <div class="brief-preset-grid">
        ${BRIEF_PRESETS.map((p) => `
          <button type="button" class="brief-preset-btn" data-preset-id="${p.id}">
            <span>${p.label}</span>
            <small>${p.sub}</small>
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
          <label for="task-title">ชื่องาน *</label>
          <input id="task-title" name="title" required placeholder="เช่น RRN — แบนเนอร์สินเชื่อบ้าน ก.พ. 2026">
        </div>

        <div class="field">
          <label for="task-project">Project / แคมเปญ *</label>
          <select id="task-project" name="project_id" required>
            <option value="">เลือก Project</option>
            ${ctx.projects.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("")}
          </select>
        </div>

        <div class="field">
          <label for="task-type">ประเภทงาน *</label>
          <select id="task-type" name="task_type" required>
            <option value="new_work">เริ่มงานใหม่</option>
            <option value="resize">ปรับ Size</option>
            <option value="revision">แก้ไขงาน</option>
            <option value="adaptation">ดัดแปลงจากชิ้นเดิม</option>
            <option value="other">อื่น ๆ</option>
          </select>
        </div>

        <div class="field">
          <label for="task-assignee">ผู้รับผิดชอบ (Designer) *</label>
          <select id="task-assignee" name="assignee_id" required>
            <option value="">เลือกสมาชิกในทีม</option>
            ${ctx.members.filter((m) => m.is_active !== false).map((m) => `
              <option value="${escapeHtml(m.id)}">${escapeHtml(m.name)} · ${escapeHtml(roleLabel(m.role))}</option>
            `).join("")}
          </select>
        </div>

        <div class="field">
          <label for="task-deadline">กำหนดส่ง *</label>
          <input id="task-deadline" type="datetime-local" name="deadline_at" value="${defaultDeadline}" required>
          <span class="hint">ระบบจะคำนวณเวลานับถอยหลังและแจ้งเตือนให้อัตโนมัติ</span>
        </div>

        <div class="field">
          <label for="task-dimensions">ขนาด / Dimensions</label>
          <input id="task-dimensions" name="dimensions" placeholder="เช่น 1080x1080 px (1:1)">
        </div>

        <div class="field">
          <label for="task-channel">ช่องทางสื่อ (Channel)</label>
          <input id="task-channel" name="channel" placeholder="เช่น Facebook, IG Story, GDN, Print">
        </div>

        <div class="field">
          <label for="task-item-count">จำนวนชิ้นงาน *</label>
          <input id="task-item-count" type="number" name="item_count" min="1" max="10000" value="1" required>
        </div>

        <div class="field">
          <label for="task-design-url">ลิงก์ Figma / Drive (ถ้ามี)</label>
          <input id="task-design-url" name="design_url" placeholder="https://www.figma.com/file/... หรือ ลิงก์ Drive">
        </div>

        <div class="field field-full">
          <label for="task-preview-url">ลิงก์ภาพตัวอย่าง / Mockup (ถ้ามี)</label>
          <input id="task-preview-url" name="preview_url" placeholder="https://example.com/artwork.jpg">
          <span class="hint">รูปภาพจะถูกนำไปพรีวิวบนหน้าบอร์ดและหน้ารายละเอียด</span>
        </div>

        <div class="field field-full">
          <label for="task-brief">Design Brief (รายละเอียดโจทย์ & สิ่งที่ต้องส่งมอบ)</label>
          <textarea id="task-brief" name="description" rows="5" placeholder="ระบุวัตถุประสงค์ ข้อความหลัก Mood & Tone และลิงก์ไฟล์ที่เกี่ยวข้อง..."></textarea>
        </div>
      </div>

      <div id="create-task-error" class="error-text"></div>
    </form>
  `;

  const modal = openModal({
    title: "✨ สร้างงานใหม่ (Create Design Task)",
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
      toast("สร้างงานใหม่เรียบร้อยแล้ว!", "success");
      window.setTimeout(() => {
        window.location.href = `task.html?id=${encodeURIComponent(created.id)}`;
      }, 350);
    } catch (error) {
      errorNode.textContent = error.message || "ไม่สามารถสร้างงานได้";
    }
  });
}
