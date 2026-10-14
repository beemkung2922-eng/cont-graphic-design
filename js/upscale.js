import { qs, qsa, toast } from "./app.js";
import { escapeHtml } from "./formatters.js";
import { pixelIcons } from "./pixel-icons.js";

/* ==========================================================================
   AUTHENTIC REAL-ESRGAN AI IMAGE UPSCALER (100% IN-BROWSER / WEBGPU & WASM)
   Direct Port of lxfater/inpaint-web Super-Resolution Engine
   - Architecture: Real-ESRGAN x4 Deep Residual Dense Network (64MB ONNX)
   - Tiled Neural Inference (64x64 tiles with 6px border padding & seam suppression)
   - IndexedDB Model Caching (Persistent local storage, downloads once only)
   - Hardware Acceleration: WebGPU Compute Shaders / WASM SIMD Multi-Threading
   ========================================================================== */

const MODEL_CONFIG = {
  version: "1.16.3",
  url: "https://huggingface.co/lxfater/inpaint-web/resolve/main/realesrgan-x4.onnx",
  backupUrl: "https://worker-share-proxy-01f5.lxfater.workers.dev/lxfater/inpaint-web/resolve/main/realesrgan-x4.onnx",
  tileSize: 64,
  tilePadding: 6,
  scale: 4
};

// Global in-memory cache
let cachedSession = null;
let cachedModelBuffer = null;
let isSessionInitializing = false;

/* --- IndexedDB Persistence for Model Caching (Zero re-download) --- */
const DB_NAME = "cont_upscale_cache";
const STORE_NAME = "models";
const CACHE_KEY = "realesrgan_x4_onnx";

function openCacheDb() {
  return new Promise((resolve) => {
    if (!window.indexedDB) return resolve(null);
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function getCachedModel() {
  try {
    const db = await openCacheDb();
    if (!db) return null;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(CACHE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn("IndexedDB read error:", err);
    return null;
  }
}

async function saveCachedModel(buffer) {
  try {
    const db = await openCacheDb();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(buffer, CACHE_KEY);
  } catch (err) {
    console.warn("IndexedDB write error:", err);
  }
}

/* --- Hardware Capability Detection --- */
async function checkCapabilities() {
  let webgpu = false;
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) webgpu = true;
    } catch (e) {
      webgpu = false;
    }
  }
  const wasm = typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function";
  return { webgpu, wasm };
}

/* --- Dynamic ONNX Runtime Web Script Loader (Matching inpaint-web) --- */
async function loadOnnxRuntime() {
  if (window.ort) return window.ort;

  const caps = await checkCapabilities();
  const prefix = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${MODEL_CONFIG.version}/dist/`;
  // inpaint-web loads ort.webgpu.min.js if webgpu available, else ort.wasm.min.js or ort.min.js
  const scriptUrl = caps.webgpu ? `${prefix}ort.webgpu.min.js` : `${prefix}ort.wasm.min.js`;

  await new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${scriptUrl}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", (e) => reject(e));
      return;
    }
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error(`ไม่สามารถโหลด ONNX Runtime Script จาก CDN: ${scriptUrl}`));
    document.head.appendChild(script);
  });

  return window.ort;
}

/* --- Chunked Stream Downloader with Real-time MB Progress --- */
async function downloadModelWithProgress(url, onProgress) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);

  const contentLength = response.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength, 10) : 67051787; // ~64MB

  const reader = response.body?.getReader();
  if (!reader) {
    const buffer = await response.arrayBuffer();
    return buffer;
  }

  const chunks = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.length;
      if (onProgress && total > 0) {
        const pct = Math.min(99, Math.round((loaded / total) * 100));
        onProgress(pct, loaded, total);
      }
    }
  }

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const fullBuffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    fullBuffer.set(chunk, offset);
    offset += chunk.length;
  }

  return fullBuffer.buffer;
}

/* --- Initialize ONNX Session (Single Instance in Memory) --- */
async function getOrInitSession(onStatus) {
  if (cachedSession) return cachedSession;
  if (isSessionInitializing) {
    while (isSessionInitializing) {
      await sleep(100);
    }
    if (cachedSession) return cachedSession;
  }

  isSessionInitializing = true;
  try {
    if (onStatus) onStatus(5, "โหลด ONNX Runtime Web Runtime...");
    const ort = await loadOnnxRuntime();

    const caps = await checkCapabilities();
    ort.env.wasm.wasmPaths = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${MODEL_CONFIG.version}/dist/`;
    if (caps.webgpu) {
      ort.env.wasm.numThreads = 1;
    } else {
      ort.env.wasm.numThreads = navigator.hardwareConcurrency ? Math.min(8, navigator.hardwareConcurrency) : 4;
      ort.env.wasm.simd = true;
    }

    // 1. Check local IndexedDB cache
    if (!cachedModelBuffer) {
      if (onStatus) onStatus(8, "ตรวจสอบหน่วยความจำเครื่อง (IndexedDB Cache)...");
      cachedModelBuffer = await getCachedModel();
    }

    // 2. Download Real-ESRGAN x4 ONNX model from Hugging Face if not cached
    if (!cachedModelBuffer) {
      if (onStatus) onStatus(10, "กำลังดาวน์โหลดโมเดล Real-ESRGAN AI (64 MB) ครั้งแรก...");
      try {
        cachedModelBuffer = await downloadModelWithProgress(MODEL_CONFIG.url, (pct, loaded, total) => {
          const mbL = (loaded / (1024 * 1024)).toFixed(1);
          const mbT = (total / (1024 * 1024)).toFixed(1);
          if (onStatus) {
            onStatus(10 + Math.round(pct * 0.4), `ดาวน์โหลดโมเดล Real-ESRGAN AI (${mbL} / ${mbT} MB) ครั้งแรก: ${pct}%`);
          }
        });
        await saveCachedModel(cachedModelBuffer);
      } catch (dlErr) {
        console.warn("Primary HuggingFace model download failed, trying mirror proxy...", dlErr);
        cachedModelBuffer = await downloadModelWithProgress(MODEL_CONFIG.backupUrl, (pct, loaded, total) => {
          const mbL = (loaded / (1024 * 1024)).toFixed(1);
          const mbT = (total / (1024 * 1024)).toFixed(1);
          if (onStatus) {
            onStatus(10 + Math.round(pct * 0.4), `ดาวน์โหลดโมเดล AI (Mirror Proxy ${mbL}/${mbT} MB): ${pct}%`);
          }
        });
        await saveCachedModel(cachedModelBuffer);
      }
    }

    if (onStatus) onStatus(52, caps.webgpu ? "สร้าง WebGPU AI Inference Session..." : "สร้าง WASM CPU AI Inference Session...");

    const ep = caps.webgpu ? ["webgpu", "wasm"] : ["wasm"];
    try {
      cachedSession = await ort.InferenceSession.create(cachedModelBuffer, {
        executionProviders: ep
      });
    } catch (epErr) {
      console.warn("WebGPU session creation failed, falling back to wasm:", epErr);
      cachedSession = await ort.InferenceSession.create(cachedModelBuffer, {
        executionProviders: ["wasm"]
      });
    }

    return cachedSession;
  } finally {
    isSessionInitializing = false;
  }
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
            ${pixelIcons.sparkle || "✨"} REAL-ESRGAN AI IMAGE UPSCALER
          </h2>
          <span class="badge badge-info" style="font-family:'Space Mono',monospace;font-size:0.75rem;">
            REAL-ESRGAN X4 (INPAINT-WEB)
          </span>
          <span class="badge badge-ok" style="font-family:'Space Mono',monospace;font-size:0.75rem;">
            🔒 100% PRIVATE IN-BROWSER
          </span>
        </div>
        <p class="page-desc" style="margin-top:6px;color:var(--text-muted);font-size:0.88rem;">
          โมเดล Deep Learning ขยายภาพความละเอียดสูง <strong>Real-ESRGAN x4</strong> ตัวเดียวกับ inpaint-web ฟื้นฟูโครงสร้างใบหน้า ผิว วัตถุ และลวดลายจากภาพแตกพิกเซลให้กลายเป็นภาพถ่ายความคมชัดสูงจริงในเบราว์เซอร์
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
            <span>📁 เลือกรูปภาพที่ต้องการขยาย (ภาพแตก / เบลอ / ขนาดเล็ก)</span>
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
              แนะนำภาพขนาด 64px - 1000px (เช่น ภาพแตกพิกเซล, หน้าคน, โลโก้)
            </div>
          </div>

          <!-- Sample Quick Test Buttons -->
          <div style="margin-top:14px;">
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;font-weight:600;">
              หรือทดลองดูพลัง Real-ESRGAN ด้วยภาพตัวอย่าง:
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-sm" id="sample-photo-btn" type="button" style="font-size:0.76rem;padding:5px 10px;">
                🧑 ภาพคนแตกพิกเซล (Inpaint-Web Test)
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
            ⚙️ การตั้งค่า AI Super Resolution
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

          <!-- Smart auto limit for giant inputs -->
          <div id="large-img-opt" class="hidden" style="margin-bottom:16px;padding:10px;background:rgba(255,210,63,0.08);border:1px solid rgba(255,210,63,0.3);border-radius:6px;">
            <label style="font-size:0.78rem;color:#FFD23F;display:flex;align-items:start;gap:6px;cursor:pointer;">
              <input type="checkbox" id="auto-limit-dim" checked style="margin-top:2px;accent-color:#FFD23F;" />
              <span>ภาพมีขนาดใหญ่: ย่อขนาดเป็นไม่เกิน 800px ก่อนป้อนให้โมเดล AI เพื่อให้ประมวลผลเร็วและเครื่องไม่ค้าง</span>
            </label>
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
            <span>✨ รันโมเดล Real-ESRGAN AI (START)</span>
          </button>
        </div>

        <!-- System & Cache Info Card -->
        <div class="card" style="padding:14px 18px;font-size:0.76rem;color:var(--text-muted);display:flex;flex-direction:column;gap:6px;background:rgba(0,0,0,0.25);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span>การเร่งความเร็วฮาร์ดแวร์:</span>
            <span id="hw-status" style="color:var(--cyan);font-weight:600;">กำลังตรวจสอบ...</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span>แคชโมเดล Real-ESRGAN:</span>
            <span id="model-status" style="color:#FFD23F;font-weight:600;">กำลังตรวจแคช...</span>
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
              กำลังเริ่มต้นระบบ Real-ESRGAN AI...
            </span>
            <span id="progress-percent" style="font-family:'Space Mono',monospace;font-weight:700;color:#fff;font-size:0.95rem;">0%</span>
          </div>
          <div style="width:100%;height:10px;background:#182030;border-radius:5px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
            <div id="progress-fill" style="width:0%;height:100%;background:linear-gradient(90deg, #19C3EB, #2BD14B);transition:width 0.15s ease;"></div>
          </div>
          <div id="progress-subnote" style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;">
            * เมื่อโหลดโมเดล 64MB ครั้งแรกเสร็จ ระบบจะบันทึกลง IndexedDB ถาวร ครั้งต่อไปจะรันได้ทันทีโดยไม่ต้องโหลดซ้ำ
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
                อัปโหลดรูปภาพทางด้านซ้าย หรือคลิกปุ่ม <strong>"ภาพคนแตกพิกเซล"</strong> เพื่อดูการสร้างรายละเอียดโครงสร้างใหม่ด้วยโมเดล Real-ESRGAN AI
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
              <!-- After (Real-ESRGAN Upscaled) Image (Base layer) -->
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
                ">BEFORE (ต้นฉบับแตกเบลอ)</span>
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
              ">AFTER (REAL-ESRGAN AI)</span>

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
              ✅ ขยายความละเอียดด้วย Real-ESRGAN AI สำเร็จ
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
  const largeImgOpt = qs("#large-img-opt");
  const autoLimitDim = qs("#auto-limit-dim");
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
  const hwStatus = qs("#hw-status");
  const modelStatus = qs("#model-status");

  const zoomFitBtn = qs("#zoom-fit-btn");
  const zoom100Btn = qs("#zoom-100-btn");

  let currentScale = 2;
  let currentImageBitmap = null;
  let originalDataUrl = null;
  let upscaledDataUrl = null;
  let isDraggingSlider = false;

  // Check hardware acceleration & IndexedDB status
  checkCapabilities().then(caps => {
    if (hwStatus) {
      if (caps.webgpu) {
        hwStatus.innerHTML = "<span style='color:#2BD14B;'>⚡ WebGPU พร้อมใช้งาน (เร็วสูงสุด)</span>";
      } else if (caps.wasm) {
        hwStatus.innerHTML = "<span style='color:#19C3EB;'>⚙️ WebAssembly (WASM SIMD)</span>";
      } else {
        hwStatus.innerHTML = "<span>โหมดมาตรฐาน</span>";
      }
    }
  });

  getCachedModel().then(buf => {
    if (modelStatus) {
      if (buf) {
        modelStatus.innerHTML = "<span style='color:#2BD14B;'>บันทึกในเครื่องแล้ว (Cached 64MB)</span>";
      } else {
        modelStatus.innerHTML = "<span>จะดาวน์โหลดเมื่อกด Start (64 MB)</span>";
      }
    }
  });

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

  // Sample Images Generator
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

        if (srcW > 800 || srcH > 800) {
          if (largeImgOpt) largeImgOpt.classList.remove("hidden");
        } else {
          if (largeImgOpt) largeImgOpt.classList.add("hidden");
        }

        toast(`โหลดภาพ: ${file.name} (${srcW}×${srcH}px)`, "info");
      };
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  }

  // Sample 1: The exact person with bottle (Inpaint-Web test case)
  function loadSamplePersonMosaic() {
    // Generate a 100x150 downscaled portrait with real photo gradient and features
    const c = document.createElement("canvas");
    c.width = 96;
    c.height = 144;
    const ctx = c.getContext("2d");
    
    // Background outdoor sky/trees
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 144);
    bgGrad.addColorStop(0, "#8cb2c9");
    bgGrad.addColorStop(0.4, "#506953");
    bgGrad.addColorStop(1, "#363a40");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 96, 144);

    // Person silhouette
    ctx.fillStyle = "#555b62";
    ctx.beginPath();
    ctx.arc(48, 42, 22, 0, Math.PI * 2); // head
    ctx.fill();

    // Face skin
    ctx.fillStyle = "#8a583c";
    ctx.beginPath();
    ctx.arc(48, 44, 16, 0, Math.PI * 2);
    ctx.fill();

    // Eyes / smile
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(41, 51, 14, 4); // smile teeth
    ctx.fillStyle = "#2c1b12";
    ctx.fillRect(40, 40, 4, 3);
    ctx.fillRect(52, 40, 4, 3);

    // Body jacket
    ctx.fillStyle = "#7d858c";
    ctx.fillRect(20, 68, 56, 76);

    // Orange water bottle
    const botGrad = ctx.createLinearGradient(28, 50, 44, 120);
    botGrad.addColorStop(0, "#ff822d");
    botGrad.addColorStop(1, "#d45815");
    ctx.fillStyle = botGrad;
    ctx.fillRect(26, 48, 22, 70);

    // Bottle cap
    ctx.fillStyle = "#ffaa44";
    ctx.fillRect(32, 40, 10, 8);

    // Hands holding bottle
    ctx.fillStyle = "#8a583c";
    ctx.fillRect(20, 82, 16, 18);
    ctx.fillRect(44, 90, 14, 18);

    originalDataUrl = c.toDataURL("image/png");
    setLoadedSample(originalDataUrl, 96, 144, "Sample_Person_Bottle_96x144.png");
  }

  // Sample 2: KKP Logo
  function loadSampleLogo() {
    const c = document.createElement("canvas");
    c.width = 120;
    c.height = 120;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#0c101d";
    ctx.fillRect(0, 0, 120, 120);
    ctx.fillStyle = "#E8202A";
    ctx.beginPath();
    ctx.arc(60, 60, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 38px 'IBM Plex Sans Thai', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("K", 60, 60);

    originalDataUrl = c.toDataURL("image/png");
    setLoadedSample(originalDataUrl, 120, 120, "Sample_Logo_120px.png");
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
      if (largeImgOpt) largeImgOpt.classList.add("hidden");
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

  // --- START REAL-ESRGAN EXECUTION ---
  startBtn?.addEventListener("click", async () => {
    if (!currentImageBitmap) return;

    startBtn.disabled = true;
    if (progressCard) progressCard.classList.remove("hidden");
    updateProgress(2, "เริ่มต้น Real-ESRGAN AI Engine...");

    try {
      const scale = currentScale;
      let srcImg = currentImageBitmap;

      // Smart downscale if image is overly large (> 800) and checkbox is checked
      const maxDim = 800;
      if (autoLimitDim?.checked && (srcImg.naturalWidth > maxDim || srcImg.naturalHeight > maxDim)) {
        const ratio = Math.min(maxDim / srcImg.naturalWidth, maxDim / srcImg.naturalHeight);
        const nw = Math.round(srcImg.naturalWidth * ratio);
        const nh = Math.round(srcImg.naturalHeight * ratio);
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = nw;
        tempCanvas.height = nh;
        const tctx = tempCanvas.getContext("2d");
        tctx.drawImage(srcImg, 0, 0, nw, nh);
        srcImg = tempCanvas;
      }

      // Execute True Real-ESRGAN Tiled Super-Resolution
      const resultCanvas = await runRealEsrganSuperResolution(srcImg, scale, (pct, msg) => {
        updateProgress(pct, msg);
      });

      upscaledDataUrl = resultCanvas.toDataURL("image/png");

      if (imgAfter) {
        imgAfter.onload = () => {
          syncOverlaySize();
        };
        imgAfter.src = upscaledDataUrl;
      }

      // Update resolution & metadata
      if (resBadge) {
        resBadge.textContent = `ขยายแล้ว: ${resultCanvas.width} × ${resultCanvas.height} px (${scale}x Real-ESRGAN)`;
        resBadge.className = "badge badge-ok";
      }

      if (outputMeta) {
        outputMeta.innerHTML = `✅ ผลลัพธ์: <strong>${resultCanvas.width} × ${resultCanvas.height} px</strong> (${scale}x Real-ESRGAN AI Super Resolution)`;
      }

      if (exportBar) exportBar.classList.remove("hidden");
      setSliderPosition(50);

      updateProgress(100, "ขยายภาพด้วย Real-ESRGAN AI สำเร็จ 100%!");
      window.setTimeout(() => {
        if (progressCard) progressCard.classList.add("hidden");
      }, 1200);

      toast(`ขยายภาพสำเร็จ ${scale} เท่า (${resultCanvas.width}×${resultCanvas.height}px) ด้วย Real-ESRGAN AI!`, "success");

      // Update cache badge
      if (modelStatus) {
        modelStatus.innerHTML = "<span style='color:#2BD14B;'>บันทึกในเครื่องแล้ว (Cached 64MB)</span>";
      }

    } catch (err) {
      console.error("Real-ESRGAN error:", err);
      toast("เกิดข้อผิดพลาดในการประมวลผล: " + err.message, "error");
      if (progressCard) progressCard.classList.add("hidden");
    } finally {
      startBtn.disabled = false;
    }
  });

  // Export handlers
  qs("#download-png-btn")?.addEventListener("click", () => {
    if (!upscaledDataUrl) return;
    triggerDownload(upscaledDataUrl, `cont-realesrgan-${Date.now()}.png`);
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
      triggerDownload(jpgUrl, `cont-realesrgan-${Date.now()}.jpg`);
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
   REAL-ESRGAN X4 TILED INFERENCE PIPELINE (MATCHING INPAINT-WEB)
   ========================================================================== */

async function runRealEsrganSuperResolution(sourceImg, targetScale, onProgress) {
  const ort = await loadOnnxRuntime();
  const session = await getOrInitSession((pct, msg) => {
    if (onProgress) onProgress(pct, msg);
  });

  const srcW = sourceImg.naturalWidth || sourceImg.width;
  const srcH = sourceImg.naturalHeight || sourceImg.height;

  onProgress(55, `เตรียมข้อมูลภาพ (${srcW}×${srcH}px)...`);
  await sleep(30);

  // 1. Convert Image to CHW Float32Array normalized [0, 1]
  const inputTensorData = imageToCHW(sourceImg);

  const tileSize = MODEL_CONFIG.tileSize; // 64
  const tilePadding = MODEL_CONFIG.tilePadding; // 6
  const tileSizePre = tileSize - tilePadding * 2; // 52

  const tilesx = Math.ceil(srcW / tileSizePre);
  const tilesy = Math.ceil(srcH / tileSizePre);
  const numTiles = tilesx * tilesy;

  const outImageW = srcW * 4;
  const outImageH = srcH * 4;

  const outData = new Float32Array(outImageW * outImageH * 3);
  const outROffset = 0;
  const outGOffset = outImageW * outImageH;
  const outBOffset = outImageW * outImageH * 2;

  const rOffset = 0;
  const gOffset = srcW * srcH;
  const bOffset = srcW * srcH * 2;

  const inputName = session.inputNames?.[0] || "input.1";
  const outputName = session.outputNames?.[0] || "1895";

  let currentTile = 0;

  for (let i = 0; i < tilesx; i++) {
    for (let j = 0; j < tilesy; j++) {
      const tileW = Math.min(tileSizePre, srcW - i * tileSizePre);
      const tileH = Math.min(tileSizePre, srcH - j * tileSizePre);

      const tileData = new Float32Array(tileSize * tileSize * 3);
      const tileROffset = 0;
      const tileGOffset = tileSize * tileSize;
      const tileBOffset = tileSize * tileSize * 2;

      for (let xp = -tilePadding; xp < tileSizePre + tilePadding; xp++) {
        for (let yp = -tilePadding; yp < tileSizePre + tilePadding; yp++) {
          let xim = i * tileSizePre + xp;
          if (xim < 0) xim = 0;
          else if (xim >= srcW) xim = srcW - 1;

          let yim = j * tileSizePre + yp;
          if (yim < 0) yim = 0;
          else if (yim >= srcH) yim = srcH - 1;

          const idx = xim + yim * srcW;
          const xt = xp + tilePadding;
          const yt = yp + tilePadding;

          tileData[xt + yt * tileSize + tileROffset] = inputTensorData[idx + rOffset];
          tileData[xt + yt * tileSize + tileGOffset] = inputTensorData[idx + gOffset];
          tileData[xt + yt * tileSize + tileBOffset] = inputTensorData[idx + bOffset];
        }
      }

      // Run inference on 64x64 tile
      const tileTensor = new ort.Tensor("float32", tileData, [1, 3, tileSize, tileSize]);
      const feeds = {};
      feeds[inputName] = tileTensor;
      const runResult = await session.run(feeds);
      const outTile = runResult[outputName] || runResult[Object.keys(runResult)[0]];

      const outTileW = tileW * 4;
      const outTileH = tileH * 4;
      const outTileSize = tileSize * 4; // 256
      const outTileSizePre = tileSizePre * 4; // 208

      const outTileROffset = 0;
      const outTileGOffset = outTileSize * outTileSize;
      const outTileBOffset = outTileSize * outTileSize * 2;

      // Copy inner 208x208 unpadded tile region to global output tensor
      for (let x = 0; x < outTileW; x++) {
        for (let y = 0; y < outTileH; y++) {
          const xim = i * outTileSizePre + x;
          const yim = j * outTileSizePre + y;
          const idx = xim + yim * outImageW;
          const xt = x + tilePadding * 4;
          const yt = y + tilePadding * 4;

          outData[idx + outROffset] = outTile.data[xt + yt * outTileSize + outTileROffset];
          outData[idx + outGOffset] = outTile.data[xt + yt * outTileSize + outTileGOffset];
          outData[idx + outBOffset] = outTile.data[xt + yt * outTileSize + outTileBOffset];
        }
      }

      currentTile++;
      const currentPct = 55 + Math.round((currentTile / numTiles) * 42);
      onProgress(currentPct, `ประมวลผล Real-ESRGAN AI (Tile ${currentTile}/${numTiles})...`);
      // Yield to event loop to allow UI progress bar updates
      await sleep(0);
    }
  }

  onProgress(98, "เรนเดอร์ภาพความละเอียดสูง (Rendering 4K Canvas)...");
  await sleep(20);

  // Convert CHW output tensor to 4x Canvas
  const canvas4x = chwToCanvas(outData, outImageW, outImageH);

  // If user selected 2x scale, downscale the 4x Real-ESRGAN result by half (yields crystal-sharp 2x)
  if (targetScale === 2) {
    const targetW = srcW * 2;
    const targetH = srcH * 2;
    const canvas2x = document.createElement("canvas");
    canvas2x.width = targetW;
    canvas2x.height = targetH;
    const ctx2x = canvas2x.getContext("2d");
    ctx2x.imageSmoothingEnabled = true;
    ctx2x.imageSmoothingQuality = "high";
    ctx2x.drawImage(canvas4x, 0, 0, targetW, targetH);
    return canvas2x;
  }

  return canvas4x;
}

/* --- Convert Image to CHW Float32Array [0, 1] --- */
function imageToCHW(img) {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const rgba = ctx.getImageData(0, 0, width, height).data;

  const size = width * height;
  const chw = new Float32Array(3 * size);
  const rOffset = 0;
  const gOffset = size;
  const bOffset = size * 2;

  for (let i = 0; i < size; i++) {
    const srcIdx = i * 4;
    chw[rOffset + i] = rgba[srcIdx] / 255.0;
    chw[gOffset + i] = rgba[srcIdx + 1] / 255.0;
    chw[bOffset + i] = rgba[srcIdx + 2] / 255.0;
  }
  return chw;
}

/* --- Convert CHW Float32Array to Canvas --- */
function chwToCanvas(chw, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  const size = width * height;
  const rOffset = 0;
  const gOffset = size;
  const bOffset = size * 2;

  for (let i = 0; i < size; i++) {
    const outIdx = i * 4;
    let r = chw[rOffset + i];
    let g = chw[gOffset + i];
    let b = chw[bOffset + i];

    data[outIdx]     = Math.min(255, Math.max(0, Math.round(r * 255)));
    data[outIdx + 1] = Math.min(255, Math.max(0, Math.round(g * 255)));
    data[outIdx + 2] = Math.min(255, Math.max(0, Math.round(b * 255)));
    data[outIdx + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
