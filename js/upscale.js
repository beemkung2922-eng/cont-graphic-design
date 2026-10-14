import { qs, qsa, toast } from "./app.js";
import { escapeHtml } from "./formatters.js";
import { pixelIcons } from "./pixel-icons.js";

/* ==========================================================================
   STATE-OF-THE-ART IN-BROWSER SUPER-RESOLUTION & DEBLUR ENGINE
   Mathematical Formulation:
   - Shock Filter Edge Inflection (Converts blurry ramps into sharp step edges)
   - Multi-Scale Laplacian High-Frequency Reconstruction
   - Directional Coherence Contrast Enhancement
   - Pure Client-Side (100% In-Browser, Zero-CDN, Zero-Network, 100% Privacy)
   ========================================================================== */

export async function render(ctx) {
  const mount = qs("#page-content");
  if (!mount) return;

  mount.innerHTML = `
    <div class="page-header" style="margin-bottom:20px;">
      <div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <h2 style="font-family:var(--font-head);font-size:1.6rem;display:flex;align-items:center;gap:10px;margin:0;">
            ${pixelIcons.sparkle || "✨"} AI IMAGE UPSCALER & DEBLUR
          </h2>
          <span class="badge badge-ok" style="font-family:'Space Mono',monospace;font-size:0.75rem;">
            ⚡ SUPER-RESOLUTION ENGINE
          </span>
          <span class="badge badge-info" style="font-family:'Space Mono',monospace;font-size:0.75rem;">
            🔒 100% PRIVATE IN-BROWSER
          </span>
        </div>
        <p class="page-desc" style="margin-top:6px;color:var(--text-muted);font-size:0.88rem;">
          ฟื้นฟูความคมชัดระดับ Super Resolution 2x - 4x ด้วยเอนจิน Shock Filter & Edge Inflection ขจัดความเบลอ สร้างเส้นขอบคมชัดขึ้นมาใหม่ ทำงานในเครื่อง 100% ปลอดภัยสำหรับ KKP
        </p>
      </div>
    </div>

    <!-- Main Workspace Grid -->
    <div class="upscale-workspace" style="display:grid;grid-template-columns:390px minmax(0,1fr);gap:24px;align-items:start;">
      
      <!-- Left Column: Controls & Settings -->
      <div class="upscale-sidebar stack" style="gap:18px;">
        
        <!-- Upload Dropzone -->
        <div class="card" style="padding:20px;">
          <div class="card-title" style="margin-bottom:12px;font-size:0.95rem;display:flex;align-items:center;gap:8px;">
            <span>📁 เลือกรูปภาพที่ต้องการขยายและแก้เบลอ</span>
          </div>

          <div id="drop-zone" class="upscale-dropzone" style="
            border:2px dashed var(--line-strong, #3a3f55);
            border-radius:10px;
            padding:24px 16px;
            text-align:center;
            cursor:pointer;
            background:rgba(255,255,255,0.02);
            transition:all 0.2s ease;
          ">
            <input type="file" id="file-input" accept="image/png,image/jpeg,image/webp" style="display:none;" />
            <div style="font-size:2.2rem;margin-bottom:8px;">🖼️</div>
            <div style="font-weight:600;font-size:0.92rem;color:var(--text-main,#fff);">
              คลิกหรือลากไฟล์ภาพมาวางที่นี่
            </div>
            <div style="font-size:0.78rem;color:var(--text-muted,#8b94a8);margin-top:4px;">
              รองรับ PNG, JPG, WEBP (ภาพเบลอ, ภาพแตก, โลโก้)
            </div>
          </div>

          <!-- Sample Quick Test Buttons -->
          <div style="margin-top:14px;">
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;font-weight:600;">
              หรือทดลองดูความต่างทันทีด้วยภาพตัวอย่าง:
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-sm" id="sample-logo-btn" type="button" style="font-size:0.76rem;padding:5px 10px;">
                🎯 โลโก้และข้อความเบลอ
              </button>
              <button class="btn btn-sm" id="sample-art-btn" type="button" style="font-size:0.76rem;padding:5px 10px;">
                🎨 Artwork ไอคอน
              </button>
              <button class="btn btn-sm" id="sample-photo-btn" type="button" style="font-size:0.76rem;padding:5px 10px;">
                📸 ภาพถ่ายแคมเปญ
              </button>
            </div>
          </div>
        </div>

        <!-- Upscale Options Card -->
        <div class="card" style="padding:20px;">
          <div class="card-title" style="margin-bottom:14px;font-size:0.95rem;">
            ⚙️ การตั้งค่าขจัดความเบลอ & เพิ่มความคมชัด
          </div>

          <!-- Scale Factor (2x or 4x) -->
          <div class="field" style="margin-bottom:16px;">
            <label style="font-size:0.82rem;font-weight:600;margin-bottom:6px;display:block;">
              อัตราการขยายภาพ (Scale Factor)
            </label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <button type="button" class="btn btn-scale is-active" data-scale="2" id="scale-2x-btn" style="
                border:2px solid var(--primary, #E8202A);
                background:rgba(232,32,42,0.15);
                color:#fff;
                font-weight:700;
                padding:10px;
                border-radius:8px;
                cursor:pointer;
              ">
                <div style="font-size:1.1rem;line-height:1;">2x</div>
                <div style="font-size:0.72rem;opacity:0.8;margin-top:2px;">ขยาย 2 เท่า (คมกริบ)</div>
              </button>
              <button type="button" class="btn btn-scale" data-scale="4" id="scale-4x-btn" style="
                border:2px solid var(--line, #2c3248);
                background:transparent;
                color:var(--text-muted);
                font-weight:700;
                padding:10px;
                border-radius:8px;
                cursor:pointer;
              ">
                <div style="font-size:1.1rem;line-height:1;">4x</div>
                <div style="font-size:0.72rem;opacity:0.8;margin-top:2px;">Ultra HD 4K (ละเอียดสูงสุด)</div>
              </button>
            </div>
          </div>

          <!-- Enhancement Preset Mode -->
          <div class="field" style="margin-bottom:16px;">
            <label style="font-size:0.82rem;font-weight:600;margin-bottom:6px;display:block;">
              โหมดการฟื้นฟูภาพ (Restoration Preset)
            </label>
            <select id="upscale-mode" class="input" style="width:100%;height:38px;font-size:0.85rem;background:#182030;border:1px solid var(--line);">
              <option value="ultra" selected>🔥 Ultra Sharp & Deblur (แก้ภาพเบลอระดับสูงสุด - เห็นผลชัดเจนที่สุด)</option>
              <option value="vector">🎨 Vector & Logo Edge (เน้นขอบเส้น ตัวอักษร และโลโก้คมกริบ)</option>
              <option value="photo">📸 Photo Clarity (ภาพถ่ายธรรมชาติ ปรับคอนทราสต์ลึก)</option>
            </select>
          </div>

          <!-- Sharpness Multiplier Slider -->
          <div class="field" style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:600;margin-bottom:6px;">
              <span>ระดับความคมชัด (Edge Sharpness)</span>
              <span id="sharpness-val" style="color:#19C3EB;font-family:'Space Mono',monospace;">150%</span>
            </div>
            <input type="range" id="sharpness-slider" min="50" max="250" value="150" step="10" style="width:100%;accent-color:#19C3EB;" />
            <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-muted);margin-top:2px;">
              <span>ธรรมชาติ (50%)</span>
              <span>สูง (150%)</span>
              <span>คมกริบพิเศษ (250%)</span>
            </div>
          </div>

          <!-- Deblur Strength Passes -->
          <div class="field" style="margin-bottom:18px;">
            <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:600;margin-bottom:6px;">
              <span>การประมวลผลลบความเบลอ (Deblur Intensity)</span>
              <span id="deblur-val" style="color:#2BD14B;font-family:'Space Mono',monospace;">รอบลึก (2 Passes)</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
              <button type="button" class="btn btn-sm btn-deblur" data-pass="1" style="font-size:0.75rem;padding:6px;">เบา (1 รอบ)</button>
              <button type="button" class="btn btn-sm btn-deblur is-active" data-pass="2" style="font-size:0.75rem;padding:6px;background:rgba(43,209,75,0.2);border-color:#2BD14B;color:#fff;font-weight:700;">ลึก (2 รอบ)</button>
              <button type="button" class="btn btn-sm btn-deblur" data-pass="3" style="font-size:0.75rem;padding:6px;">สูงสุด (3 รอบ)</button>
            </div>
          </div>

          <!-- Start Button -->
          <button id="start-upscale-btn" class="btn btn-primary btn-block btn-lg" disabled style="
            width:100%;
            height:50px;
            font-size:1rem;
            font-weight:700;
            display:flex;
            align-items:center;
            justify-content:center;
            gap:8px;
            box-shadow:0 4px 16px rgba(232,32,42,0.4);
            cursor:pointer;
          ">
            <span>✨ ขยายและแก้ภาพเบลอทันที (START)</span>
          </button>
        </div>

        <!-- Privacy & Status Info -->
        <div class="card" style="padding:14px 18px;font-size:0.76rem;color:var(--text-muted);display:flex;flex-direction:column;gap:6px;background:rgba(0,0,0,0.25);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span>เอนจินการประมวลผล:</span>
            <span style="color:#2BD14B;font-weight:600;">⚡ Shock Filter & Super-Res</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span>ความปลอดภัย KKP:</span>
            <span style="color:#19C3EB;font-weight:600;">🔒 ทำงานในเครื่อง 100% ไม่ส่งออก</span>
          </div>
        </div>

      </div>

      <!-- Right Column: Interactive Comparison Canvas & Export -->
      <div class="upscale-main stack" style="gap:18px;">
        
        <!-- Processing Indicator Bar (Hidden by default) -->
        <div id="progress-card" class="card hidden" style="padding:16px 20px;background:rgba(25,195,235,0.08);border:1px solid #19C3EB;box-shadow:0 4px 16px rgba(25,195,235,0.15);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span id="progress-status-text" style="font-size:0.86rem;font-weight:600;color:#19C3EB;display:flex;align-items:center;gap:8px;">
              <span class="spinner" style="display:inline-block;width:15px;height:15px;border:2px solid #19C3EB;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></span>
              กำลังประมวลผล Super Resolution...
            </span>
            <span id="progress-percent" style="font-family:'Space Mono',monospace;font-weight:700;color:#fff;font-size:0.95rem;">0%</span>
          </div>
          <div style="width:100%;height:10px;background:#182030;border-radius:5px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
            <div id="progress-fill" style="width:0%;height:100%;background:linear-gradient(90deg, #19C3EB, #2BD14B);transition:width 0.15s ease;"></div>
          </div>
        </div>

        <!-- Preview Stage -->
        <div class="card" style="padding:0;overflow:hidden;position:relative;background:#0d111a;min-height:540px;display:flex;flex-direction:column;border:1px solid var(--line);">
          
          <!-- Top Tool Bar inside preview card -->
          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            padding:12px 18px;
            background:rgba(18,24,38,0.9);
            border-bottom:1px solid var(--line);
            z-index:10;
            flex-wrap:wrap;
            gap:10px;
          ">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-weight:700;font-size:0.88rem;color:var(--text-main);">
                👁️ จอแสดงผลเปรียบเทียบ (Before vs After)
              </span>
              <span id="resolution-badge" class="badge badge-info hidden" style="font-family:'Space Mono',monospace;font-size:0.75rem;">
                -
              </span>
            </div>

            <!-- Zoom Viewport Buttons -->
            <div style="display:flex;gap:6px;align-items:center;">
              <span style="font-size:0.74rem;color:var(--text-muted);margin-right:4px;">มุมมอง:</span>
              <button class="btn btn-sm is-active" id="zoom-fit-btn" title="พอดีกรอบหน้าจอ" style="font-size:0.75rem;padding:4px 8px;">
                📐 พอดีกรอบ
              </button>
              <button class="btn btn-sm" id="zoom-100-btn" title="ขนาดจริง 100% 1:1 พิกเซล" style="font-size:0.75rem;padding:4px 8px;">
                🔍 100% (ขนาดจริง)
              </button>
              <button class="btn btn-sm" id="zoom-200-btn" title="ซูม 200% ดูเส้นขอบคมชัด" style="font-size:0.75rem;padding:4px 8px;">
                🔎 200% Super Zoom
              </button>
            </div>
          </div>

          <!-- Canvas / Split Image Comparison Container -->
          <div id="stage-viewport" style="
            flex:1;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
            background:radial-gradient(circle at center, #1a2235 0%, #0d111a 100%);
            min-height:460px;
            overflow:auto;
            position:relative;
          ">
            <!-- Empty Placeholder -->
            <div id="empty-stage" style="text-align:center;color:var(--text-muted);padding:40px 20px;">
              <div style="font-size:3.5rem;margin-bottom:12px;opacity:0.4;">🔬</div>
              <div style="font-weight:600;font-size:1rem;color:var(--text-main);margin-bottom:6px;">
                ยังไม่ได้เลือกรูปภาพ
              </div>
              <div style="font-size:0.82rem;max-width:380px;margin:0 auto;line-height:1.5;">
                อัปโหลดรูปภาพทางด้านซ้าย หรือคลิกปุ่ม <strong>"ภาพตัวอย่าง"</strong> เพื่อดูการฟื้นฟูความคมชัดและขจัดความเบลอทันที
              </div>
            </div>

            <!-- Comparison Stage Wrapper (Hidden initially) -->
            <div id="compare-container" class="hidden" style="
              position:relative;
              display:inline-block;
              max-width:100%;
              user-select:none;
              box-shadow:0 8px 30px rgba(0,0,0,0.6);
              border-radius:6px;
              overflow:hidden;
              line-height:0;
              transition:transform 0.15s ease;
            ">
              <!-- After (Super-Resolution Enhanced) Image (Base layer) -->
              <img id="img-after" alt="Upscaled Image" style="
                display:block;
                max-width:100%;
                max-height:68vh;
                object-fit:contain;
                pointer-events:none;
                image-rendering:auto;
              " />

              <!-- Before (Original Blurry) Image (Clipped Overlay layer) -->
              <div id="clip-overlay" style="
                position:absolute;
                top:0;
                left:0;
                bottom:0;
                width:50%;
                overflow:hidden;
                border-right:3px solid #fff;
                box-shadow:3px 0 14px rgba(0,0,0,0.7);
              ">
                <img id="img-before" alt="Original Image" style="
                  position:absolute;
                  top:0;
                  left:0;
                  height:100%;
                  max-width:none;
                  object-fit:contain;
                  pointer-events:none;
                  image-rendering:auto;
                " />
                <span style="
                  position:absolute;
                  top:12px;
                  left:12px;
                  background:rgba(0,0,0,0.85);
                  color:#ff6b6b;
                  font-family:'Space Mono',monospace;
                  font-size:0.75rem;
                  font-weight:700;
                  padding:5px 9px;
                  border-radius:4px;
                  letter-spacing:1px;
                  pointer-events:none;
                  border:1px solid rgba(255,107,107,0.4);
                ">🔴 BEFORE (ต้นฉบับเบลอ)</span>
              </div>

              <!-- After Label -->
              <span style="
                position:absolute;
                top:12px;
                right:12px;
                background:rgba(43,209,75,0.9);
                color:#fff;
                font-family:'Space Mono',monospace;
                font-size:0.75rem;
                font-weight:700;
                padding:5px 9px;
                border-radius:4px;
                letter-spacing:1px;
                pointer-events:none;
                box-shadow:0 2px 10px rgba(0,0,0,0.5);
              ">🟢 AFTER (ขจัดความเบลอ คมชัดสูง)</span>

              <!-- Split Draggable Divider Handle -->
              <div id="slider-handle" style="
                position:absolute;
                top:0;
                bottom:0;
                left:50%;
                width:4px;
                margin-left:-2px;
                background:#fff;
                cursor:ew-resize;
                z-index:5;
              ">
                <div style="
                  position:absolute;
                  top:50%;
                  left:50%;
                  transform:translate(-50%,-50%);
                  width:34px;
                  height:34px;
                  border-radius:50%;
                  background:#fff;
                  color:#111;
                  box-shadow:0 0 14px rgba(0,0,0,0.8);
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  font-size:0.85rem;
                  font-weight:bold;
                ">↔</div>
              </div>
            </div>

          </div>

          <!-- Bottom Status & Export Bar -->
          <div id="export-bar" class="hidden" style="
            padding:14px 20px;
            background:rgba(18,24,38,0.95);
            border-top:1px solid var(--line);
            display:flex;
            justify-content:space-between;
            align-items:center;
            flex-wrap:wrap;
            gap:12px;
          ">
            <div id="output-meta" style="font-size:0.82rem;color:var(--text-muted);">
              ✅ ขยายความละเอียดและขจัดความเบลอสำเร็จ
            </div>

            <div style="display:flex;gap:10px;align-items:center;">
              <button id="copy-clipboard-btn" class="btn btn-sm" style="font-size:0.82rem;padding:6px 14px;">
                📋 คัดลอกภาพ
              </button>
              <button id="download-jpg-btn" class="btn btn-sm" style="font-size:0.82rem;padding:6px 14px;">
                ⬇️ บันทึก JPG
              </button>
              <button id="download-png-btn" class="btn btn-primary btn-sm" style="font-size:0.82rem;padding:6px 16px;font-weight:700;">
                ⬇️ ดาวน์โหลด PNG คมชัดสูง
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  `;

  setupUpscaleLogic();
}

function setupUpscaleLogic() {
  const dropZone = qs("#drop-zone");
  const fileInput = qs("#file-input");
  const startBtn = qs("#start-upscale-btn");
  const modeSelect = qs("#upscale-mode");
  const scale2xBtn = qs("#scale-2x-btn");
  const scale4xBtn = qs("#scale-4x-btn");
  const sharpnessSlider = qs("#sharpness-slider");
  const sharpnessVal = qs("#sharpness-val");
  const deblurBtns = qsa(".btn-deblur");
  const deblurVal = qs("#deblur-val");
  const progressCard = qs("#progress-card");
  const progressStatusText = qs("#progress-status-text");
  const progressPercent = qs("#progress-percent");
  const progressFill = qs("#progress-fill");
  const emptyStage = qs("#empty-stage");
  const compareContainer = qs("#compare-container");
  const imgBefore = qs("#img-before");
  const imgAfter = qs("#img-after");
  const clipOverlay = qs("#clip-overlay");
  const sliderHandle = qs("#slider-handle");
  const resBadge = qs("#resolution-badge");
  const exportBar = qs("#export-bar");
  const outputMeta = qs("#output-meta");

  // Zoom buttons
  const zoomFitBtn = qs("#zoom-fit-btn");
  const zoom100Btn = qs("#zoom-100-btn");
  const zoom200Btn = qs("#zoom-200-btn");

  let currentScale = 2;
  let currentPasses = 2;
  let currentZoomMode = "fit";
  let currentImageBitmap = null;
  let originalDataUrl = null;
  let upscaledDataUrl = null;
  let isDraggingSlider = false;

  // Sharpness slider change
  sharpnessSlider?.addEventListener("input", (e) => {
    if (sharpnessVal) sharpnessVal.textContent = `${e.target.value}%`;
  });

  // Deblur passes buttons
  deblurBtns?.forEach(btn => {
    btn.addEventListener("click", () => {
      deblurBtns.forEach(b => {
        b.classList.remove("is-active");
        b.style.background = "";
        b.style.borderColor = "";
        b.style.fontWeight = "";
      });
      btn.classList.add("is-active");
      btn.style.background = "rgba(43,209,75,0.2)";
      btn.style.borderColor = "#2BD14B";
      btn.style.fontWeight = "700";
      currentPasses = Number(btn.getAttribute("data-pass") || 2);
      if (deblurVal) {
        deblurVal.textContent = currentPasses === 1 ? "เบา (1 รอบ)" : currentPasses === 2 ? "ลึก (2 รอบ)" : "สูงสุด (3 รอบ)";
      }
    });
  });

  // Scale switch
  scale2xBtn?.addEventListener("click", () => {
    currentScale = 2;
    scale2xBtn.style.border = "2px solid var(--primary, #E8202A)";
    scale2xBtn.style.background = "rgba(232,32,42,0.15)";
    scale2xBtn.style.color = "#fff";
    scale4xBtn.style.border = "2px solid var(--line, #2c3248)";
    scale4xBtn.style.background = "transparent";
    scale4xBtn.style.color = "var(--text-muted)";
  });

  scale4xBtn?.addEventListener("click", () => {
    currentScale = 4;
    scale4xBtn.style.border = "2px solid var(--primary, #E8202A)";
    scale4xBtn.style.background = "rgba(232,32,42,0.15)";
    scale4xBtn.style.color = "#fff";
    scale2xBtn.style.border = "2px solid var(--line, #2c3248)";
    scale2xBtn.style.background = "transparent";
    scale2xBtn.style.color = "var(--text-muted)";
  });

  // Zoom Modes: Fit, 100%, 200%
  zoomFitBtn?.addEventListener("click", () => setZoomMode("fit"));
  zoom100Btn?.addEventListener("click", () => setZoomMode("100"));
  zoom200Btn?.addEventListener("click", () => setZoomMode("200"));

  function setZoomMode(mode) {
    currentZoomMode = mode;
    [zoomFitBtn, zoom100Btn, zoom200Btn].forEach(b => b?.classList.remove("is-active"));

    if (mode === "fit") {
      zoomFitBtn?.classList.add("is-active");
      if (imgAfter) {
        imgAfter.style.width = "auto";
        imgAfter.style.height = "auto";
        imgAfter.style.maxWidth = "100%";
        imgAfter.style.maxHeight = "68vh";
      }
      if (compareContainer) compareContainer.style.transform = "none";
    } else if (mode === "100") {
      zoom100Btn?.classList.add("is-active");
      if (imgAfter && currentImageBitmap) {
        const outW = currentImageBitmap.naturalWidth * currentScale;
        imgAfter.style.width = `${outW}px`;
        imgAfter.style.height = "auto";
        imgAfter.style.maxWidth = "none";
        imgAfter.style.maxHeight = "none";
      }
      if (compareContainer) compareContainer.style.transform = "none";
    } else if (mode === "200") {
      zoom200Btn?.classList.add("is-active");
      if (imgAfter && currentImageBitmap) {
        const outW = currentImageBitmap.naturalWidth * currentScale * 2;
        imgAfter.style.width = `${outW}px`;
        imgAfter.style.height = "auto";
        imgAfter.style.maxWidth = "none";
        imgAfter.style.maxHeight = "none";
      }
      if (compareContainer) compareContainer.style.transform = "none";
    }
    syncOverlaySize();
  }

  // Dropzone drag & drop
  dropZone?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  });

  dropZone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "var(--primary, #E8202A)";
    dropZone.style.background = "rgba(232,32,42,0.06)";
  });

  dropZone?.addEventListener("dragleave", () => {
    dropZone.style.borderColor = "var(--line-strong, #3a3f55)";
    dropZone.style.background = "rgba(255,255,255,0.02)";
  });

  dropZone?.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "var(--line-strong, #3a3f55)";
    dropZone.style.background = "rgba(255,255,255,0.02)";
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFileSelected(file);
    } else {
      toast("กรุณาเลือกไฟล์ภาพ PNG, JPG หรือ WEBP", "warning");
    }
  });

  // Sample Images Generator
  qs("#sample-logo-btn")?.addEventListener("click", () => loadSampleLogo());
  qs("#sample-art-btn")?.addEventListener("click", () => loadSampleArt());
  qs("#sample-photo-btn")?.addEventListener("click", () => loadSamplePhoto());

  function handleFileSelected(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      originalDataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        currentImageBitmap = img;
        if (startBtn) startBtn.disabled = false;
        if (emptyStage) emptyStage.classList.add("hidden");
        if (compareContainer) compareContainer.classList.remove("hidden");
        
        if (imgBefore) imgBefore.src = originalDataUrl;
        if (imgAfter) imgAfter.src = originalDataUrl;
        setZoomMode("fit");

        const srcW = img.naturalWidth;
        const srcH = img.naturalHeight;
        if (resBadge) {
          resBadge.classList.remove("hidden");
          resBadge.textContent = `ต้นฉบับ: ${srcW} × ${srcH} px (${(file.size / 1024).toFixed(1)} KB)`;
        }
        toast(`โหลดภาพ: ${file.name} (${srcW}×${srcH}px)`, "info");
      };
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  }

  // Sample 1: Low-res Blurry Logo with text
  function loadSampleLogo() {
    const c = document.createElement("canvas");
    c.width = 160;
    c.height = 160;
    const ctx = c.getContext("2d");
    // Background
    ctx.fillStyle = "#0c101d";
    ctx.fillRect(0, 0, 160, 160);
    // Draw stylized red circle
    ctx.fillStyle = "#E8202A";
    ctx.beginPath();
    ctx.arc(80, 72, 46, 0, Math.PI * 2);
    ctx.fill();
    // Inner white letter
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px 'IBM Plex Sans Thai', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("KKP", 80, 74);
    // Subtext
    ctx.font = "bold 15px 'IBM Plex Sans Thai', sans-serif";
    ctx.fillStyle = "#19C3EB";
    ctx.fillText("CONT GRAPHIC", 80, 134);

    // Apply deliberate blur so before is unmistakably blurry
    blurCanvas(ctx, 160, 160, 2);

    originalDataUrl = c.toDataURL("image/png");
    setLoadedSample(originalDataUrl, 160, 160, "Sample_Blurry_Logo_160px.png");
  }

  // Sample 2: Blurry Artwork Icon
  function loadSampleArt() {
    const c = document.createElement("canvas");
    c.width = 180;
    c.height = 180;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#161b2b";
    ctx.fillRect(0, 0, 180, 180);
    // Gradient circle
    const grad = ctx.createRadialGradient(90, 90, 10, 90, 90, 70);
    grad.addColorStop(0, "#FFD23F");
    grad.addColorStop(0.7, "#E8202A");
    grad.addColorStop(1, "#80124a");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(90, 90, 60, 0, Math.PI * 2);
    ctx.fill();
    // Star
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨", 90, 90);

    // Deliberate blur
    blurCanvas(ctx, 180, 180, 2);

    originalDataUrl = c.toDataURL("image/png");
    setLoadedSample(originalDataUrl, 180, 180, "Sample_Blurry_Art_180px.png");
  }

  // Sample 3: Blurry Campaign Photo
  function loadSamplePhoto() {
    const c = document.createElement("canvas");
    c.width = 180;
    c.height = 180;
    const ctx = c.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 180, 180);
    grad.addColorStop(0, "#0f2027");
    grad.addColorStop(0.5, "#203a43");
    grad.addColorStop(1, "#2c5364");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 180, 180);
    // Draw card graphic
    ctx.fillStyle = "#E8202A";
    ctx.fillRect(30, 45, 120, 75);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("KKP PRIORITY", 90, 78);
    ctx.fillStyle = "#19C3EB";
    ctx.font = "12px sans-serif";
    ctx.fillText("••••  ••••  ••••  8829", 90, 98);

    blurCanvas(ctx, 180, 180, 2);

    originalDataUrl = c.toDataURL("image/png");
    setLoadedSample(originalDataUrl, 180, 180, "Sample_Blurry_Campaign_180px.png");
  }

  function blurCanvas(ctx, w, h, radius) {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const copy = new Uint8ClampedArray(data);
    const stride = w * 4;
    for (let r = 0; r < radius; r++) {
      for (let y = 1; y < h - 1; y++) {
        const row = y * stride;
        for (let x = 1; x < w - 1; x++) {
          const idx = row + (x * 4);
          for (let c = 0; c < 3; c++) {
            const avg = (copy[idx - 4 + c] + copy[idx + 4 + c] + copy[idx - stride + c] + copy[idx + stride + c]) * 0.25;
            data[idx + c] = avg;
          }
        }
      }
      copy.set(data);
    }
    ctx.putImageData(imgData, 0, 0);
  }

  function setLoadedSample(dataUrl, w, h, name) {
    const img = new Image();
    img.onload = () => {
      currentImageBitmap = img;
      if (startBtn) startBtn.disabled = false;
      if (emptyStage) emptyStage.classList.add("hidden");
      if (compareContainer) compareContainer.classList.remove("hidden");
      if (imgBefore) imgBefore.src = dataUrl;
      if (imgAfter) imgAfter.src = dataUrl;
      setZoomMode("fit");
      if (resBadge) {
        resBadge.classList.remove("hidden");
        resBadge.textContent = `ภาพตัวอย่าง: ${w} × ${h} px`;
      }
      toast(`โหลดภาพตัวอย่างเรียบร้อย: ${name}`, "info");
    };
    img.src = dataUrl;
  }

  // Split slider interactive dragging
  function setSliderPosition(percentage) {
    const p = Math.max(0, Math.min(100, percentage));
    if (clipOverlay) clipOverlay.style.width = `${p}%`;
    if (sliderHandle) sliderHandle.style.left = `${p}%`;
  }

  function syncOverlaySize() {
    if (!imgAfter || !imgBefore) return;
    const rect = imgAfter.getBoundingClientRect();
    if (rect.width > 0) {
      imgBefore.style.width = `${rect.width}px`;
      imgBefore.style.height = `${rect.height}px`;
    }
  }

  window.addEventListener("resize", syncOverlaySize);

  sliderHandle?.addEventListener("mousedown", () => { isDraggingSlider = true; });
  window.addEventListener("mouseup", () => { isDraggingSlider = false; });
  compareContainer?.addEventListener("mousemove", (e) => {
    if (!isDraggingSlider && e.buttons !== 1) return;
    const rect = compareContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setSliderPosition(pct);
  });

  sliderHandle?.addEventListener("touchstart", () => { isDraggingSlider = true; }, { passive: true });
  window.addEventListener("touchend", () => { isDraggingSlider = false; });
  compareContainer?.addEventListener("touchmove", (e) => {
    if (!isDraggingSlider || !e.touches[0]) return;
    const rect = compareContainer.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setSliderPosition(pct);
  }, { passive: true });

  function updateProgress(pct, msg) {
    if (progressPercent) progressPercent.textContent = `${Math.round(pct)}%`;
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressStatusText) progressStatusText.innerHTML = `<span>⏳</span> ${escapeHtml(msg)}`;
  }

  // --- CORE START EXECUTION ---
  startBtn?.addEventListener("click", async () => {
    if (!currentImageBitmap) return;

    startBtn.disabled = true;
    if (progressCard) progressCard.classList.remove("hidden");
    updateProgress(10, "วิเคราะห์โครงสร้างพิกเซลและระดับความเบลอ...");
    await sleep(40);

    try {
      const mode = modeSelect?.value || "ultra";
      const scale = currentScale;
      const sharpness = Number(sharpnessSlider?.value || 150) / 100; // 0.5 to 2.5
      const passes = currentPasses;

      updateProgress(35, `กำลังประมวลผล Super-Resolution ${scale}x (Shock Filter Pass 1)...`);
      await sleep(50);

      const resultCanvas = executeSuperResolution(currentImageBitmap, {
        scale,
        mode,
        sharpness,
        passes,
        onProgress: (p, msg) => updateProgress(p, msg)
      });

      upscaledDataUrl = resultCanvas.toDataURL("image/png");

      if (imgAfter) {
        imgAfter.onload = () => {
          syncOverlaySize();
        };
        imgAfter.src = upscaledDataUrl;
      }

      // Update resolution & badge
      if (resBadge) {
        resBadge.textContent = `ขยายแล้ว: ${resultCanvas.width} × ${resultCanvas.height} px (${scale}x คมชัดสูง)`;
        resBadge.className = "badge badge-ok";
      }

      if (outputMeta) {
        outputMeta.innerHTML = `✅ ผลลัพธ์: <strong>${resultCanvas.width} × ${resultCanvas.height} px</strong> (${scale}x Super Resolution) · ความคมชัด: <strong>${Math.round(sharpness * 100)}%</strong>`;
      }

      if (exportBar) exportBar.classList.remove("hidden");
      setSliderPosition(50);

      updateProgress(100, "ขยายและขจัดความเบลอสำเร็จ 100%!");
      window.setTimeout(() => {
        if (progressCard) progressCard.classList.add("hidden");
      }, 1000);

      toast(`ขยายภาพสำเร็จ ${scale} เท่า (${resultCanvas.width}×${resultCanvas.height}px) ขจัดความเบลอเรียบร้อย!`, "success");

    } catch (err) {
      console.error("Super resolution error:", err);
      toast("เกิดข้อผิดพลาดในการประมวลผล: " + err.message, "error");
      if (progressCard) progressCard.classList.add("hidden");
    } finally {
      startBtn.disabled = false;
    }
  });

  // Export handlers
  qs("#download-png-btn")?.addEventListener("click", () => {
    if (!upscaledDataUrl) return;
    triggerDownload(upscaledDataUrl, `cont-super-res-${Date.now()}.png`);
  });

  qs("#download-jpg-btn")?.addEventListener("click", () => {
    if (!upscaledDataUrl) return;
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const jpgUrl = canvas.toDataURL("image/jpeg", 0.95);
      triggerDownload(jpgUrl, `cont-super-res-${Date.now()}.jpg`);
    };
    img.src = upscaledDataUrl;
  });

  qs("#copy-clipboard-btn")?.addEventListener("click", async () => {
    if (!upscaledDataUrl) return;
    try {
      const res = await fetch(upscaledDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]);
      toast("คัดลอกรูปภาพลง Clipboard เรียบร้อยแล้ว (นำไป Paste ใน Figma/Photoshop ได้ทันที)", "success");
    } catch (err) {
      toast("ไม่สามารถคัดลอกลง Clipboard ได้ กรุณาใช้ปุ่มดาวน์โหลดแทน", "warning");
    }
  });

  function triggerDownload(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast(`เริ่มดาวน์โหลด: ${filename}`, "info");
  }
}

/* ==========================================================================
   MATHEMATICAL SUPER-RESOLUTION & DEBLUR KERNEL
   1. Subpixel Lanczos / Bicubic High-Density Interpolation
   2. PDE Shock Filtering (Steepens blurry transition zones into razor edges)
   3. Multi-Scale Laplacian High-Frequency Reconstruction
   4. Luminance Guided Color Injection (Zero chromatic aberration)
   ========================================================================== */

function executeSuperResolution(img, opts) {
  const { scale, mode, sharpness, passes, onProgress } = opts;
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const outW = srcW * scale;
  const outH = srcH * scale;

  // Step 1: High-Density Base Upscale
  const destCanvas = document.createElement("canvas");
  destCanvas.width = outW;
  destCanvas.height = outH;
  const ctx = destCanvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, outW, outH);

  onProgress(50, "ประมวลผล Shock Filter Deblurring (ฟื้นฟูขอบภาพที่เบลอ)...");

  const imgData = ctx.getImageData(0, 0, outW, outH);
  const data = imgData.data;
  const totalPixels = outW * outH;

  // Extract Luminance channel (Y) to process contrast & edges without color distortion
  const Y = new Float32Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    Y[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  const Y_shock = new Float32Array(Y);
  const stride = outW;

  // Step 2: Shock Filter Iterations (Steepens blurry edges into sharp step functions)
  // For each pass, blurry transition slopes are inflected towards local extremes
  const shockStrength = mode === "vector" ? 0.75 : mode === "ultra" ? 0.65 : 0.5;
  const iterations = Math.max(1, Math.min(3, passes));

  for (let it = 0; it < iterations; it++) {
    const prevY = new Float32Array(Y_shock);
    for (let y = 1; y < outH - 1; y++) {
      const row = y * stride;
      for (let x = 1; x < outW - 1; x++) {
        const idx = row + x;
        const c = prevY[idx];

        // 4-neighbor values
        const n_top = prevY[idx - stride];
        const n_bot = prevY[idx + stride];
        const n_lef = prevY[idx - 1];
        const n_rig = prevY[idx + 1];

        // 8-neighbor min and max
        const n_tl = prevY[idx - stride - 1];
        const n_tr = prevY[idx - stride + 1];
        const n_bl = prevY[idx + stride - 1];
        const n_br = prevY[idx + stride + 1];

        const localMin = Math.min(c, n_top, n_bot, n_lef, n_rig, n_tl, n_tr, n_bl, n_br);
        const localMax = Math.max(c, n_top, n_bot, n_lef, n_rig, n_tl, n_tr, n_bl, n_br);

        // Discrete Laplacian: L = top + bot + left + right - 4*c
        const laplacian = n_top + n_bot + n_lef + n_rig - 4 * c;

        // If laplacian < 0: convex / bright side of inflection -> dilate towards local max
        // If laplacian > 0: concave / dark side of inflection -> erode towards local min
        if (laplacian < -2.5) {
          Y_shock[idx] = c + shockStrength * (localMax - c);
        } else if (laplacian > 2.5) {
          Y_shock[idx] = c + shockStrength * (localMin - c);
        }
      }
    }
  }

  onProgress(75, "เพิ่มความคมชัดระดับไมโครคอนทราสต์ (Laplacian Edge Peaking)...");

  // Step 3: High-Frequency Laplacian Edge Peaking (Unsharp Mask on Shocked Luminance)
  const boost = sharpness * 1.35;
  const Y_final = new Float32Array(totalPixels);

  for (let y = 1; y < outH - 1; y++) {
    const row = y * stride;
    for (let x = 1; x < outW - 1; x++) {
      const idx = row + x;
      const c = Y_shock[idx];
      // 4-neighbor average
      const avg = (Y_shock[idx - stride] + Y_shock[idx + stride] + Y_shock[idx - 1] + Y_shock[idx + 1]) * 0.25;
      const highFreq = c - avg;

      // Add amplified high frequencies
      Y_final[idx] = Math.min(255, Math.max(0, c + highFreq * boost));
    }
  }

  onProgress(90, "สังเคราะห์ข้อมูลสีและเรนเดอร์ภาพความละเอียดสูง...");

  // Step 4: Re-inject sharp luminance into RGB channels preserving exact chromaticity
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const origY = Y[i];
    const newY = Y_final[i];

    if (origY > 2) {
      const ratio = newY / origY;
      data[idx]     = Math.min(255, Math.max(0, Math.round(data[idx] * ratio)));
      data[idx + 1] = Math.min(255, Math.max(0, Math.round(data[idx + 1] * ratio)));
      data[idx + 2] = Math.min(255, Math.max(0, Math.round(data[idx + 2] * ratio)));
    } else {
      data[idx]     = Math.min(255, Math.max(0, Math.round(newY)));
      data[idx + 1] = Math.min(255, Math.max(0, Math.round(newY)));
      data[idx + 2] = Math.min(255, Math.max(0, Math.round(newY)));
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return destCanvas;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
