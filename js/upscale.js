import { qs, qsa, toast } from "./app.js";
import { escapeHtml } from "./formatters.js";
import { pixelIcons } from "./pixel-icons.js";

/* ==========================================================================
   ESRGAN AI SUPER RESOLUTION ENGINE (POWERED BY TENSORFLOW.JS & UPSCALERJS)
   - Neural Model: ESRGAN (Enhanced Super-Resolution GAN) Residual-Dense Network
   - Model Weight Size: Only 888 KB (Fast 1-second load, no 60MB stall)
   - Hardware Backend: WebGL GPU Compute Acceleration (Google TensorFlow.js)
   - Tiled Patch Processing (64x64 patches with 6px border seam suppression)
   ========================================================================== */

let cachedUpscaler = null;
let isInitializing = false;

/* --- Dynamic Library Loader (Guarantees execution even via SPA navigation) --- */
async function ensureUpscalerEngine(onProgress) {
  if (cachedUpscaler) return cachedUpscaler;

  if (isInitializing) {
    while (isInitializing) {
      await sleep(100);
    }
    if (cachedUpscaler) return cachedUpscaler;
  }

  isInitializing = true;
  try {
    // 1. Load TensorFlow.js WebGL Engine
    if (!window.tf) {
      if (onProgress) onProgress(15, "กำลังเริ่มต้น Google TensorFlow.js (WebGL GPU Engine)...");
      await loadScriptPromise("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js");
    }

    // 2. Load ESRGAN 888KB Neural Weights
    if (!window.DefaultUpscalerJSModel) {
      if (onProgress) onProgress(35, "กำลังโหลดโมเดล ESRGAN Neural Network (888 KB)...");
      await loadScriptPromise("https://cdn.jsdelivr.net/npm/@upscalerjs/default-model@1.0.0/dist/umd/index.min.js");
    }

    // 3. Load UpscalerJS Core
    if (!window.Upscaler) {
      if (onProgress) onProgress(50, "กำลังโหลด UpscalerJS Runtime...");
      await loadScriptPromise("https://cdn.jsdelivr.net/npm/upscaler@1.0.0/dist/browser/umd/upscaler.min.js");
    }

    if (onProgress) onProgress(65, "สร้างอินสแตนซ์โมเดล ESRGAN AI บนการ์ดจอ WebGL...");
    await sleep(40);

    cachedUpscaler = new window.Upscaler({
      model: window.DefaultUpscalerJSModel
    });

    return cachedUpscaler;
  } finally {
    isInitializing = false;
  }
}

function loadScriptPromise(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.getAttribute("data-loaded") === "true") return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", (e) => reject(e));
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => {
      script.setAttribute("data-loaded", "true");
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/* ==========================================================================
   PAGE RENDERER & INTERACTION CONTROLLER
   ========================================================================== */

export async function render(ctx) {
  const mount = qs("#page-content");
  if (!mount) return;

  mount.innerHTML = `
    <div class="page-header" style="margin-bottom:20px;">
      <div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <h2 style="font-family:var(--font-head);font-size:1.6rem;display:flex;align-items:center;gap:10px;margin:0;">
            ${pixelIcons.sparkle || "✨"} ESRGAN AI IMAGE UPSCALER
          </h2>
          <span class="badge badge-info" style="font-family:'Space Mono',monospace;font-size:0.75rem;">
            TENSORFLOW.JS (WEBGL GPU)
          </span>
          <span class="badge badge-ok" style="font-family:'Space Mono',monospace;font-size:0.75rem;">
            ⚡ FAST 888KB MODEL
          </span>
        </div>
        <p class="page-desc" style="margin-top:6px;color:var(--text-muted);font-size:0.88rem;">
          โมเดล Deep Learning โครงข่ายประสาทเทียม <strong>ESRGAN</strong> ขยายภาพความละเอียดสูงจากพิกเซลแตกเป็นบล็อกโมเสก ให้กลายเป็นภาพถ่ายที่เนียน คมชัด และสร้างรายละเอียดขึ้นมาใหม่จริง บน WebGL GPU
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
            <span>📁 เลือกรูปภาพที่ต้องการขยาย</span>
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
              แนะนำภาพขนาด 60px - 800px (เช่น ภาพคนแตกพิกเซล, หน้าคน, โลโก้)
            </div>
          </div>

          <!-- Sample Quick Test Buttons -->
          <div style="margin-top:14px;">
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;font-weight:600;">
              ทดลองด้วยภาพตัวอย่างทันที:
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-sm" id="sample-photo-btn" type="button" style="font-size:0.76rem;padding:5px 10px;">
                🧑 คนถือขวดน้ำแตกพิกเซล (ภาพทดสอบ)
              </button>
              <button class="btn btn-sm" id="sample-logo-btn" type="button" style="font-size:0.76rem;padding:5px 10px;">
                🎯 โลโก้ KKP แตกพิกเซล (120px)
              </button>
            </div>
          </div>
        </div>

        <!-- Upscale Options Card -->
        <div class="card" style="padding:20px;">
          <div class="card-title" style="margin-bottom:14px;font-size:0.95rem;">
            ⚙️ การตั้งค่าโมเดล ESRGAN AI
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
                <div style="font-size:0.72rem;opacity:0.8;margin-top:2px;">ขยาย 2 เท่า (เร็วสุด)</div>
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
                <div style="font-size:0.72rem;opacity:0.8;margin-top:2px;">Ultra HD 4K (2-Pass Neural)</div>
              </button>
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
            <span>✨ รันโมเดล ESRGAN AI (START)</span>
          </button>
        </div>

        <!-- System & Cache Info Card -->
        <div class="card" style="padding:14px 18px;font-size:0.76rem;color:var(--text-muted);display:flex;flex-direction:column;gap:6px;background:rgba(0,0,0,0.25);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span>การเร่งความเร็วฮาร์ดแวร์:</span>
            <span style="color:#2BD14B;font-weight:600;">⚡ WebGL GPU Accelerated</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span>ขนาดโมเดล AI:</span>
            <span style="color:#19C3EB;font-weight:600;">📦 เบาเพียง 888 KB (โหลดไว)</span>
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
              กำลังเริ่มต้นระบบ ESRGAN AI...
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

            <!-- Viewport Buttons -->
            <div style="display:flex;gap:6px;align-items:center;">
              <button class="btn btn-sm is-active" id="zoom-fit-btn" title="พอดีกรอบหน้าจอ" style="font-size:0.75rem;padding:4px 8px;">
                📐 พอดีกรอบ
              </button>
              <button class="btn btn-sm" id="zoom-100-btn" title="ขนาดจริง 100% 1:1 พิกเซล" style="font-size:0.75rem;padding:4px 8px;">
                🔍 ขนาดจริง 1:1
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
              <div style="font-size:0.82rem;max-width:400px;margin:0 auto;line-height:1.5;">
                อัปโหลดรูปภาพทางด้านซ้าย หรือคลิกปุ่ม <strong>"คนถือขวดน้ำแตกพิกเซล"</strong> เพื่อทดสอบการฟื้นฟูด้วยโมเดล ESRGAN AI ทันที
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
            ">
              <!-- After (ESRGAN Upscaled) Image (Base layer) -->
              <img id="img-after" alt="Upscaled Image" style="
                display:block;
                max-width:100%;
                max-height:68vh;
                object-fit:contain;
                pointer-events:none;
                image-rendering:auto;
              " />

              <!-- Before (Original Mosaic/Blurry) Image (Clipped Overlay layer) -->
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
                  image-rendering:pixelated;
                " />
                <span style="
                  position:absolute;
                  bottom:14px;
                  left:14px;
                  background:rgba(0,0,0,0.85);
                  color:#ff6b6b;
                  font-family:'Space Mono',monospace;
                  font-size:0.75rem;
                  font-weight:700;
                  padding:5px 10px;
                  border-radius:4px;
                  letter-spacing:1px;
                  pointer-events:none;
                  border:1px solid rgba(255,107,107,0.4);
                  z-index:4;
                ">BEFORE (แตกเป็นบล็อกโมเสก)</span>
              </div>

              <!-- After Label -->
              <span style="
                position:absolute;
                bottom:14px;
                right:14px;
                background:rgba(43,209,75,0.9);
                color:#fff;
                font-family:'Space Mono',monospace;
                font-size:0.75rem;
                font-weight:700;
                padding:5px 10px;
                border-radius:4px;
                letter-spacing:1px;
                pointer-events:none;
                box-shadow:0 2px 10px rgba(0,0,0,0.5);
                z-index:4;
              ">AFTER (ESRGAN AI คมชัดเนียนกริบ)</span>

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
              ✅ ขยายความละเอียดด้วย ESRGAN AI สำเร็จ
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
  const scale2xBtn = qs("#scale-2x-btn");
  const scale4xBtn = qs("#scale-4x-btn");
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

  const zoomFitBtn = qs("#zoom-fit-btn");
  const zoom100Btn = qs("#zoom-100-btn");

  let currentScale = 2;
  let currentImageBitmap = null;
  let originalDataUrl = null;
  let upscaledDataUrl = null;
  let isDraggingSlider = false;

  // Scale switch handler
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

  // Zoom modes
  zoomFitBtn?.addEventListener("click", () => {
    zoomFitBtn.classList.add("is-active");
    zoom100Btn?.classList.remove("is-active");
    if (imgAfter) {
      imgAfter.style.width = "auto";
      imgAfter.style.height = "auto";
      imgAfter.style.maxWidth = "100%";
      imgAfter.style.maxHeight = "68vh";
    }
    syncOverlaySize();
  });

  zoom100Btn?.addEventListener("click", () => {
    zoom100Btn.classList.add("is-active");
    zoomFitBtn?.classList.remove("is-active");
    if (imgAfter && currentImageBitmap) {
      const outW = currentImageBitmap.naturalWidth * currentScale;
      imgAfter.style.width = `${outW}px`;
      imgAfter.style.height = "auto";
      imgAfter.style.maxWidth = "none";
      imgAfter.style.maxHeight = "none";
    }
    syncOverlaySize();
  });

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

  // Sample Buttons
  qs("#sample-photo-btn")?.addEventListener("click", () => loadSamplePersonMosaic());
  qs("#sample-logo-btn")?.addEventListener("click", () => loadSampleLogo());

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
        syncOverlaySize();

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

  // Sample 1: The exact person with bottle (Inpaint-Web test case)
  function loadSamplePersonMosaic() {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 96;
    const ctx = c.getContext("2d");
    
    // Background outdoor
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 96);
    bgGrad.addColorStop(0, "#8cb2c9");
    bgGrad.addColorStop(0.4, "#506953");
    bgGrad.addColorStop(1, "#363a40");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 64, 96);

    // Person head
    ctx.fillStyle = "#4a2d1d";
    ctx.beginPath();
    ctx.arc(32, 26, 14, 0, Math.PI * 2);
    ctx.fill();

    // Face skin
    ctx.fillStyle = "#8a583c";
    ctx.beginPath();
    ctx.arc(32, 28, 10, 0, Math.PI * 2);
    ctx.fill();

    // Smile teeth
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(27, 33, 10, 2);

    // Body jacket
    ctx.fillStyle = "#6d757d";
    ctx.fillRect(12, 44, 40, 52);

    // Orange water bottle
    const botGrad = ctx.createLinearGradient(16, 32, 30, 80);
    botGrad.addColorStop(0, "#ff822d");
    botGrad.addColorStop(1, "#d45815");
    ctx.fillStyle = botGrad;
    ctx.fillRect(16, 30, 16, 48);

    // Bottle cap
    ctx.fillStyle = "#ffaa44";
    ctx.fillRect(20, 24, 8, 6);

    // Hands
    ctx.fillStyle = "#8a583c";
    ctx.fillRect(12, 54, 12, 12);
    ctx.fillRect(28, 60, 10, 12);

    originalDataUrl = c.toDataURL("image/png");
    setLoadedSample(originalDataUrl, 64, 96, "Sample_Person_Bottle_64x96.png");
  }

  // Sample 2: KKP Logo
  function loadSampleLogo() {
    const c = document.createElement("canvas");
    c.width = 96;
    c.height = 96;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#0c101d";
    ctx.fillRect(0, 0, 96, 96);
    ctx.fillStyle = "#E8202A";
    ctx.beginPath();
    ctx.arc(48, 48, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px 'IBM Plex Sans Thai', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("K", 48, 48);

    originalDataUrl = c.toDataURL("image/png");
    setLoadedSample(originalDataUrl, 96, 96, "Sample_Logo_96px.png");
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
      syncOverlaySize();
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

  // --- START EXECUTION USING ESRGAN AI ---
  startBtn?.addEventListener("click", async () => {
    if (!currentImageBitmap) return;

    startBtn.disabled = true;
    if (progressCard) progressCard.classList.remove("hidden");
    updateProgress(5, "กำลังเริ่มต้นโมเดล ESRGAN AI...");

    try {
      const scale = currentScale;
      const srcImg = currentImageBitmap;

      // Ensure engine loaded
      const upscaler = await ensureUpscalerEngine((pct, msg) => {
        updateProgress(pct, msg);
      });

      updateProgress(70, "กำลังสังเคราะห์โครงสร้างภาพด้วย ESRGAN Neural Network...");
      await sleep(30);

      // Pass 1: 2x Neural Upscale
      const result2x = await upscaler.upscale(srcImg, {
        patchSize: 64,
        padding: 6,
        progress: (amount) => {
          const p = 70 + Math.round(amount * (scale === 4 ? 14 : 28));
          updateProgress(p, `กำลังรัน ESRGAN AI บน WebGL: ${Math.round(amount * 100)}%`);
        }
      });

      let finalResultUrl = result2x;

      // Pass 2: If 4x requested, run second neural upscale pass
      if (scale === 4) {
        updateProgress(86, "กำลังประมวลผล Pass 2 สำหรับความละเอียด 4x Ultra HD...");
        const tempImg = new Image();
        await new Promise((r) => { tempImg.onload = r; tempImg.src = result2x; });
        finalResultUrl = await upscaler.upscale(tempImg, {
          patchSize: 64,
          padding: 6,
          progress: (amount) => {
            const p = 86 + Math.round(amount * 13);
            updateProgress(p, `กำลังสังเคราะห์ 4x Ultra HD: ${Math.round(amount * 100)}%`);
          }
        });
      }

      upscaledDataUrl = finalResultUrl;

      if (imgAfter) {
        imgAfter.onload = () => {
          syncOverlaySize();
        };
        imgAfter.src = upscaledDataUrl;
      }

      // Read output image natural dimensions
      const resImg = new Image();
      resImg.onload = () => {
        if (resBadge) {
          resBadge.textContent = `ขยายแล้ว: ${resImg.naturalWidth} × ${resImg.naturalHeight} px (${scale}x ESRGAN AI)`;
          resBadge.className = "badge badge-ok";
        }
        if (outputMeta) {
          outputMeta.innerHTML = `✅ ผลลัพธ์: <strong>${resImg.naturalWidth} × ${resImg.naturalHeight} px</strong> (${scale}x ESRGAN AI Super Resolution)`;
        }
      };
      resImg.src = upscaledDataUrl;

      if (exportBar) exportBar.classList.remove("hidden");
      setSliderPosition(50);

      updateProgress(100, "ขยายภาพด้วย ESRGAN AI สำเร็จ 100%!");
      window.setTimeout(() => {
        if (progressCard) progressCard.classList.add("hidden");
      }, 1200);

      toast(`ขยายภาพสำเร็จ ${scale} เท่า ด้วยโมเดล ESRGAN AI เรียบร้อยแล้ว!`, "success");

    } catch (err) {
      console.error("ESRGAN error:", err);
      toast("เกิดข้อผิดพลาดในการประมวลผล: " + err.message, "error");
      if (progressCard) progressCard.classList.add("hidden");
    } finally {
      startBtn.disabled = false;
    }
  });

  // Export handlers
  qs("#download-png-btn")?.addEventListener("click", () => {
    if (!upscaledDataUrl) return;
    triggerDownload(upscaledDataUrl, `cont-esrgan-${Date.now()}.png`);
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
      triggerDownload(jpgUrl, `cont-esrgan-${Date.now()}.jpg`);
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
