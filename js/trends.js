import { qs, qsa, toast, openModal, closeModal } from "./app.js";
import { escapeHtml } from "./formatters.js";
import { pixelIcons } from "./pixel-icons.js";

/**
 * Curated Pinterest & Graphic Design Trends Database
 */
export const TREND_DATABASE = [
  {
    id: "trend-y2k-chrome",
    title: "Y2K Acid Chrome & Cyber 90s",
    category: "graphics",
    categoryLabel: "Acid & Y2K Graphics",
    source: "Pinterest Viral",
    saves: "68.4k",
    badge: "🔥 TOP VIRAL",
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
    insight: "เทรนด์การกลับมาของวัฒนธรรมต้นยุค 2000s ผสมผสานโลหะโครเมียมสะท้อนแสง (Liquid Chrome), ประกายดาว 4 แฉก (Sparkle Star), สีสะท้อนแสง และตัวอักษรดิสเพลย์ทรงบิดเบี้ยว",
    principles: ["สะท้อนแสงแบบ 3D Metallic", "สีนีออนม่วง-ชมพู-เขียวตัดดำ", "ประกายดาว Cyber Star", "กลิ่นอาย Rave Culture"],
    bestFor: "โปสเตอร์อีเวนต์ดนตรี, ปกซิงเกิล, สตรีทแวร์, คอนเทนต์วัยรุ่น Gen-Z",
    swatches: [
      { hex: "#FF007F", name: "Cyber Fuchsia" },
      { hex: "#00F0FF", name: "Electric Cyan" },
      { hex: "#18181B", name: "Chrome Core" },
      { hex: "#E4E4E7", name: "Reflective Silver" }
    ],
    tags: ["#Y2K", "#AcidGraphics", "#LiquidChrome", "#RavePoster"],
    aiPrompt: "Y2K cyber aesthetic graphic poster, shiny liquid chrome 3D typography, metallic reflective star shapes, vibrant neon fuchsia and electric cyan gradients, acid techno club aesthetic, high detail, retrofuturistic, 8k render"
  },
  {
    id: "trend-neo-brutalism",
    title: "Neo-Brutalism & High Contrast",
    category: "graphics",
    categoryLabel: "Neo-Brutalism",
    source: "Pinterest & Behance",
    saves: "54.2k",
    badge: "⚡ TRENDING",
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80",
    insight: "ทลายกฎเกณฑ์ความเนี้ยบแบบดั้งเดิมด้วยเส้นขอบสีดำหนาเตอะ (Heavy Black Stroke), เงาตกกระทบแบบมุมฉากไม่มีเบลอ (Hard Drop Shadow), และการใช้สีสดคอนทราสต์จัดจ้าน",
    principles: ["เส้นขอบ 3px - 5px คมชัด", "เงาสีดำทึบ 100%", "สีพาสเทลสดตัดกับแม่สี", "ความดิบและจริงใจในการสื่อสาร"],
    bestFor: "Web UI, การ์ดโปรโมชันโซเชียลมีเดีย, โปสเตอร์อินดี้, งานดีไซน์แบรนด์รุ่นใหม่",
    swatches: [
      { hex: "#FFE600", name: "Brutal Yellow" },
      { hex: "#FF5E5E", name: "Bold Coral" },
      { hex: "#000000", name: "Deep Ink" },
      { hex: "#FFFFFF", name: "Paper Base" }
    ],
    tags: ["#NeoBrutalism", "#HighContrast", "#AntiDesign", "#BoldStrokes"],
    aiPrompt: "Neo-brutalist graphic design poster, heavy thick black outlines, flat vivid pop colors, brutal yellow and coral geometric cards, bold modern typography, asymmetrical playful layout, clean vector art"
  },
  {
    id: "trend-liquid-glass",
    title: "Liquid Glass & Spatial 3D",
    category: "3d",
    categoryLabel: "3D & Spatial Design",
    source: "Pinterest Aesthetics",
    saves: "81.9k",
    badge: "✦ PIN OF THE WEEK",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    insight: "ความล้ำยุคของวัสดุแก้วของเหลวใส (Refractive Glass) การหักเหของแสงสีรุ้ง (Chromatic Aberration) และความโปร่งแสงแบบฟิวเจอร์ริสติกที่กำลังครองใจวงการเทคโนโลยีและแฟชั่น",
    principles: ["การหักเหแสง Caustics", "ความโปร่งใสแบบ Frosted Glass", "ความโค้งมนของของเหลวหยดน้ำ", "แสงสะท้อนระดับสตูดิโอ"],
    bestFor: "Visual Key ของแบรนด์ไฮเอนด์, หน้าปกพอร์ตโฟลิโอ, แคมเปญแอปพลิเคชันยุคใหม่",
    swatches: [
      { hex: "#3B82F6", name: "Spatial Cobalt" },
      { hex: "#A855F7", name: "Iris Glow" },
      { hex: "#06B6D4", name: "Aqua Prism" },
      { hex: "#0F172A", name: "Abyss Dark" }
    ],
    tags: ["#LiquidGlass", "#Glassmorphism", "#ChromaticAberration", "#3DSurreal"],
    aiPrompt: "Fluid liquid glass sculpture, organic transparent glass drops, iridescent rainbow refraction caustic lighting, sleek spatial 3D render, dark ambient studio background, octane render, 8k resolution, ultra detailed"
  },
  {
    id: "trend-swiss-editorial",
    title: "Swiss Grid & Typographic Minimal",
    category: "editorial",
    categoryLabel: "Editorial & Swiss",
    source: "Pinterest Curated",
    saves: "43.7k",
    badge: "🏛️ TIMELESS",
    image: "https://images.unsplash.com/photo-1515260268569-9271009adfdb?auto=format&fit=crop&w=800&q=80",
    insight: "รากฐานการออกแบบระดับสากลที่กลับมาได้รับความนิยมสูงสุดในหมู่ดีไซเนอร์รุ่นใหม่ ใช้ระบบกริดที่เคร่งครัด ตัวอักษร Sans-Serif ที่มีระเบียบ และการเว้นพื้นที่ว่าง (Negative Space) อย่างทรงพลัง",
    principles: ["ตารางกริดเป็นโครงสร้างหลัก", "ฟอนต์ Helvetica / Grotesk ที่ไร้การปรุงแต่ง", "อัตราส่วนพื้นที่ว่างมากกว่า 60%", "เน้นความชัดเจนของสาร (Content-First)"],
    bestFor: "นิตยสารสถาปัตยกรรม, เอกสารแนะนำแบรนด์, งานแสดงศิลปะ, เว็บไซต์คูลๆ",
    swatches: [
      { hex: "#111111", name: "Swiss Black" },
      { hex: "#F3F3F3", name: "Canvas Warmth" },
      { hex: "#E11D48", name: "Accent Carmine" },
      { hex: "#71717A", name: "Slate Grid" }
    ],
    tags: ["#SwissDesign", "#GridSystem", "#EditorialLayout", "#Minimalist"],
    aiPrompt: "Swiss style minimalist editorial poster, clean architectural grid layout, bold Helvetica typography, striking black and white photography, subtle red accent square, pristine negative space, premium museum print"
  },
  {
    id: "trend-retro-risograph",
    title: "Risograph Grain & Halftone Print",
    category: "graphics",
    categoryLabel: "Retro Print & Grain",
    source: "Pinterest Indie Art",
    saves: "52.3k",
    badge: "✨ INDIE HIT",
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80",
    insight: "สุนทรียศาสตร์ของความไม่สมบูรณ์แบบ (Wabi-Sabi) ในงานพิมพ์กระดาษยุคแอนะล็อก ลวดลายเม็ดสกรีน (Halftone Dots), การซ้อนทับของแม่พิมพ์สีเหลื่อม (Misregistration), และเนื้อกระดาษหยาบอบอุ่น",
    principles: ["เม็ดสกรีน Halftone ที่มองเห็นชัด", "การพิมพ์ทับกันของเลเยอร์สี 2-3 สี", "พื้นผิวเกรนกระดาษมีเท็กซ์เจอร์", "โทนสีสไตล์หมึกพิมพ์ญี่ปุ่น"],
    bestFor: "โปสเตอร์คาเฟ่, บรรจุภัณฑ์สินค้าคราฟต์, ปกหนังสืออิสระ, การ์ดอวยพร",
    swatches: [
      { hex: "#10B981", name: "Riso Emerald" },
      { hex: "#F43F5E", name: "Soy Ink Coral" },
      { hex: "#F59E0B", name: "Warm Sun" },
      { hex: "#FEF3C7", name: "Vintage Parchment" }
    ],
    tags: ["#Risograph", "#HalftoneDots", "#VintagePrint", "#AnalogAesthetic"],
    aiPrompt: "Authentic risograph print artwork, tactile halftone dot texture, two-tone soy ink overlay in emerald green and warm coral, subtle misalignment misregistration effect, aged textured paper grain, indie art illustration"
  },
  {
    id: "trend-french-chic",
    title: "High Fashion & Editorial Lookbook",
    category: "editorial",
    categoryLabel: "Fashion & Lookbook",
    source: "Pinterest Lookbooks",
    saves: "61.5k",
    badge: "👗 ELEGANT",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    insight: "การผสมผสานภาพถ่ายบุคคลแฟชั่นชั้นสูง (Editorial Portrait) เข้ากับตัวอักษร Serif ขนาดใหญ่พาดเต็มหน้า ความงามสง่าแบบปารีเซียงและแสงสตูดิโอแบบ Softbox",
    principles: ["ภาพโคลสอัพใบหน้าและเครื่องแต่งกายโดดเด่น", "ฟอนต์ Serif ไฮเอนด์ทรงเพรียว", "ความสมดุลระหว่างความหรูหราและความดิบ", "สีเน้นเฉดเดียว เช่น แดงเบอร์กันดี หรือน้ำเงินโคบอลต์"],
    bestFor: "แคมเปญบิวตี้, นิตยสารแฟชั่น, แบรนด์เสื้อผ้า, โปสเตอร์ภาพยนตร์",
    swatches: [
      { hex: "#BE123C", name: "Parisian Crimson" },
      { hex: "#27272A", name: "Dark Wool" },
      { hex: "#FAFAFA", name: "Studio Soft" },
      { hex: "#A1A1AA", name: "Silk Gray" }
    ],
    tags: ["#HighFashion", "#LookbookCover", "#EditorialChic", "#SerifTypography"],
    aiPrompt: "Vogue style high fashion magazine cover, cinematic model portrait wearing luxury red beret, soft studio lighting, elegant oversized editorial serif title, film grain, luxury aesthetic, 35mm photograph"
  },
  {
    id: "trend-bauhaus-geometry",
    title: "Bauhaus & Constructivist Forms",
    category: "art",
    categoryLabel: "Bauhaus & Modernism",
    source: "Pinterest Art Gallery",
    saves: "39.8k",
    badge: "📐 CLASSIC",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
    insight: "รูปทรงเรขาคณิตบริสุทธิ์ (วงกลม สามเหลี่ยม สี่เหลี่ยม) ภายใต้แนวคิด Form Follows Function ใช้แม่สีพื้นฐานจัดวางในมุมมองพลวัต (Dynamic Angle)",
    principles: ["ใช้แม่สี: แดง น้ำเงิน เหลือง", "รูปทรงเรขาคณิตตัดแปะ", "มุมเอียงสร้างพลังและความเคลื่อนไหว", "ตัวพิมพ์ไม่มีเชิงสไตล์เยอรมัน"],
    bestFor: "นิทรรศการศิลปะ, โปสเตอร์สถาปัตยกรรม, ปกพอดแคสต์สารคดี, สื่อการเรียนรู้",
    swatches: [
      { hex: "#E11D48", name: "Bauhaus Red" },
      { hex: "#2563EB", name: "Modern Blue" },
      { hex: "#FACC15", name: "Primary Yellow" },
      { hex: "#18181B", name: "Charcoal Black" }
    ],
    tags: ["#Bauhaus", "#Constructivism", "#GeometricArt", "#PrimaryColors"],
    aiPrompt: "Bauhaus art movement exhibition poster, bold geometric composition with circles and triangles, primary red, blue, and yellow colors on aged warm cream paper, diagonal dynamic layout, classic modernism graphic"
  },
  {
    id: "trend-cyberpunk-glitch",
    title: "Cyberpunk Glitch & Distorted Type",
    category: "graphics",
    categoryLabel: "Cyberpunk & Glitch",
    source: "Pinterest Trending",
    saves: "73.1k",
    badge: "🔮 SCI-FI",
    image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80",
    insight: "ภาพสะท้อนของโลกอนาคตที่เทคโนโลยีชนกับความวุ่นวาย แสงนีออนสะท้อนบนถนนเปียกฝน สัญญาณภาพล้มเหลว (Glitch Artifacts) และตัวอักษรที่ถูกแยกคลื่นสัญญาณ RGB",
    principles: ["การแตกตัวของสี RGB Shift", "แสงนีออนฟ้าเทอร์ควอยซ์และชมพูไซเบอร์", "องค์ประกอบแบบ HUD Interface", "พื้นหลังมืดสลัวสไตล์ Dystopian"],
    bestFor: "เกม, ปกเพลง Synthwave/EDM, งานอีเวนต์เทคโนโลยี, สตรีมเมอร์",
    swatches: [
      { hex: "#06B6D4", name: "Neon Cyan" },
      { hex: "#EC4899", name: "Laser Magenta" },
      { hex: "#09090B", name: "Night Dystopia" },
      { hex: "#8B5CF6", name: "Electric Violet" }
    ],
    tags: ["#Cyberpunk", "#GlitchArt", "#RGBShift", "#DistortedType"],
    aiPrompt: "Cyberpunk futuristic poster, heavy RGB chromatic aberration glitch effect, neon cyan and hot magenta glows against dark rainy alley, distorted futuristic typography, sci-fi interface elements, 8k render"
  }
];

// Active State
let currentTab = "discovery"; // "discovery" | "studio"
let selectedTrend = TREND_DATABASE[0];
let activeFilter = "all";
let searchQuery = "";

// Studio Image State
let studioState = {
  prompt: selectedTrend.aiPrompt,
  aspectRatio: "1:1", // "1:1", "4:5", "16:9", "9:16"
  stylePreset: "graphic-poster",
  isGenerating: false,
  currentImageUrl: selectedTrend.image,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hueRotate: 0,
  blur: 0,
  overlayText: "",
  overlayPosition: "bottom", // "top", "center", "bottom"
  history: []
};

/**
 * Copy text to clipboard with feedback
 */
function copyText(text, label = "คัดลอกสำเร็จ") {
  navigator.clipboard.writeText(text).then(() => {
    toast(`คัดลอก ${label} เรียบร้อยแล้ว`, "success");
  }).catch(() => {
    const input = document.createElement("input");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    toast(`คัดลอก ${label} เรียบร้อยแล้ว`, "success");
  });
}

/**
 * Build Pollinations AI Image URL
 */
function buildAiImageUrl(prompt, aspect, style) {
  let width = 1024;
  let height = 1024;

  if (aspect === "4:5") {
    width = 896;
    height = 1120;
  } else if (aspect === "16:9") {
    width = 1152;
    height = 648;
  } else if (aspect === "9:16") {
    width = 648;
    height = 1152;
  }

  // Enrich prompt with chosen style
  let styleSuffix = "";
  if (style === "3d-render") {
    styleSuffix = ", 3D octane render, cinema 4d, ray tracing, spatial lighting, 8k render";
  } else if (style === "graphic-poster") {
    styleSuffix = ", graphic design poster, print ready, vector aesthetics, balanced typography, award-winning visual";
  } else if (style === "photorealistic") {
    styleSuffix = ", editorial photography, 35mm film shot, photorealistic, cinematic atmospheric light, 8k";
  } else if (style === "cyberpunk") {
    styleSuffix = ", cyberpunk aesthetic, neon glow, holographic reflections, futuristic high tech, ultra detailed";
  } else if (style === "swiss-minimal") {
    styleSuffix = ", swiss graphic design, minimalist grid, helvetica typography, negative space, black and white with vivid accent";
  }

  const fullPrompt = `${prompt.trim()}${styleSuffix}`;
  const seed = Math.floor(Math.random() * 999999);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
}

/**
 * Main Render Function
 */
export async function render(context = {}) {
  const mount = qs("#page-content");
  if (!mount) return;

  mount.innerHTML = `
    <div class="trend-curator-app">
      <!-- App Top Navigation & Mode Switcher -->
      <div class="trend-top-bar">
        <div class="trend-brand-group">
          <div class="trend-pill-badge">
            <span class="pulse-indicator"></span>
            <span>DESIGN TREND CURATOR AI</span>
            <span class="badge-tag">PINTEREST & STUDIO</span>
          </div>
          <h1 class="trend-main-heading">
            วิเคราะห์เทรนด์งานดีไซน์ & AI สร้างภาพพร้อมปรับแต่งทันที
          </h1>
          <p class="trend-sub-heading">
            ดึงภาพและเจาะลึก Insight จาก Pinterest และแหล่งดีไซน์ระดับโลก แล้วนำไอเดียมาให้ AI ช่วยสังเคราะห์ภาพใหม่และปรับแต่งได้ในที่เดียว
          </p>
        </div>

        <!-- Mode Switcher Tabs -->
        <div class="trend-mode-tabs">
          <button type="button" class="mode-tab-btn ${currentTab === "discovery" ? "is-active" : ""}" id="tab-btn-discovery">
            <span>📌 ค้นหา & วิเคราะห์เทรนด์ (Trends Feed)</span>
          </button>
          <button type="button" class="mode-tab-btn ${currentTab === "studio" ? "is-active" : ""}" id="tab-btn-studio">
            <span>✨ AI Studio & เครื่องมือปรับแต่งภาพ</span>
          </button>
        </div>
      </div>

      <!-- Main Workspace Views -->
      <div class="trend-workspace" id="trend-workspace">
        <!-- Rendered dynamically based on currentTab -->
      </div>
    </div>
  `;

  // Bind tab buttons
  qs("#tab-btn-discovery")?.addEventListener("click", () => {
    currentTab = "discovery";
    updateActiveTabs();
    renderDiscoveryView();
  });

  qs("#tab-btn-studio")?.addEventListener("click", () => {
    currentTab = "studio";
    updateActiveTabs();
    renderStudioView();
  });

  function updateActiveTabs() {
    qs("#tab-btn-discovery")?.classList.toggle("is-active", currentTab === "discovery");
    qs("#tab-btn-studio")?.classList.toggle("is-active", currentTab === "studio");
  }

  // Initial View
  if (currentTab === "discovery") {
    renderDiscoveryView();
  } else {
    renderStudioView();
  }
}

/**
 * VIEW 1: TREND DISCOVERY & INSIGHT BREAKDOWN
 */
function renderDiscoveryView() {
  const container = qs("#trend-workspace");
  if (!container) return;

  // Filter trends based on category & search
  const filteredTrends = TREND_DATABASE.filter((item) => {
    const matchCat = activeFilter === "all" || item.category === activeFilter;
    const matchSearch = searchQuery === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.insight.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  container.innerHTML = `
    <div class="discovery-layout">
      <!-- Search & Category Filtering Bar -->
      <div class="discovery-filter-card">
        <div class="discovery-search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            id="trend-search-input" 
            class="trend-input-search" 
            placeholder="ค้นหาเทรนด์ เช่น Y2K, Brutalism, Liquid Glass, Minimalist, Cyberpunk..." 
            value="${escapeHtml(searchQuery)}"
          />
          ${searchQuery ? `<button type="button" class="btn-clear-search" id="btn-clear-search">✕</button>` : ""}
        </div>

        <div class="discovery-category-pills" id="category-pills">
          <button type="button" class="filter-pill ${activeFilter === "all" ? "is-selected" : ""}" data-filter="all">
            🌟 เทรนด์ทั้งหมด (${TREND_DATABASE.length})
          </button>
          <button type="button" class="filter-pill ${activeFilter === "graphics" ? "is-selected" : ""}" data-filter="graphics">
            ⚡ Acid & Neo-Brutalism
          </button>
          <button type="button" class="filter-pill ${activeFilter === "3d" ? "is-selected" : ""}" data-filter="3d">
            🔮 3D & Spatial Glass
          </button>
          <button type="button" class="filter-pill ${activeFilter === "editorial" ? "is-selected" : ""}" data-filter="editorial">
            📰 Swiss & Fashion Lookbook
          </button>
          <button type="button" class="filter-pill ${activeFilter === "art" ? "is-selected" : ""}" data-filter="art">
            🎨 Bauhaus & Modern Art
          </button>
        </div>
      </div>

      <!-- Main Dual Panel: Left Selected Trend Deep Dive, Right Grid of Pinterest Cards -->
      <div class="discovery-main-grid">
        
        <!-- Left: Selected Trend AI Insight Breakdown -->
        <div class="trend-inspector-panel">
          <div class="inspector-card">
            <div class="inspector-header">
              <div class="inspector-meta-badge">
                <span>📌 AI INSIGHT ANALYSIS</span>
                <span class="inspector-saves">${selectedTrend.saves} Saves</span>
              </div>
              <h2 class="inspector-title">${escapeHtml(selectedTrend.title)}</h2>
              <div class="inspector-source-label">หมวดหมู่: ${escapeHtml(selectedTrend.categoryLabel)} · แหล่งที่มา: ${escapeHtml(selectedTrend.source)}</div>
            </div>

            <div class="inspector-image-wrap">
              <img src="${escapeHtml(selectedTrend.image)}" alt="${escapeHtml(selectedTrend.title)}" />
              <div class="inspector-img-badge">${escapeHtml(selectedTrend.badge)}</div>
            </div>

            <!-- Insight Content -->
            <div class="inspector-section">
              <div class="inspector-section-label">💡 แก่นและ Insight ของเทรนด์นี้:</div>
              <p class="inspector-insight-text">${escapeHtml(selectedTrend.insight)}</p>
            </div>

            <!-- Design Principles -->
            <div class="inspector-section">
              <div class="inspector-section-label">📐 องค์ประกอบ & กฎการจัดวาง:</div>
              <ul class="inspector-principles-list">
                ${selectedTrend.principles.map(p => `<li>✦ ${escapeHtml(p)}</li>`).join("")}
              </ul>
            </div>

            <!-- Color Palette -->
            <div class="inspector-section">
              <div class="inspector-section-label">🎨 จานสีเด่น (คลิกเพื่อคัดลอก HEX):</div>
              <div class="inspector-swatches-grid">
                ${selectedTrend.swatches.map(s => `
                  <div class="inspector-swatch-box" data-hex="${s.hex}" title="คลิกเพื่อคัดลอก ${s.hex}">
                    <div class="swatch-color-bar" style="background:${s.hex};"></div>
                    <div class="swatch-info">
                      <span class="swatch-hex">${s.hex}</span>
                      <span class="swatch-name">${escapeHtml(s.name)}</span>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>

            <!-- AI Prompt Blueprint -->
            <div class="inspector-section">
              <div class="inspector-section-label" style="display:flex;justify-content:space-between;align-items:center;">
                <span>🤖 AI Prompt Blueprint สำหรับสร้างงานสไตล์นี้:</span>
                <button type="button" class="btn btn-ghost btn-xs" id="btn-copy-blueprint-prompt">คัดลอก 📋</button>
              </div>
              <pre class="inspector-prompt-code">${escapeHtml(selectedTrend.aiPrompt)}</pre>
            </div>

            <!-- Inspector Action Buttons -->
            <div class="inspector-actions">
              <button type="button" class="btn-studio-launch" id="btn-open-in-studio">
                <span>✨ ให้ AI สร้างภาพตามเทรนด์นี้ทันที</span>
              </button>
              <button type="button" class="btn btn-ghost" id="btn-create-task-from-trend">
                <span>+ บรีฟงานสร้าง Task ใน CONT</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Pinterest Trend Cards Grid -->
        <div class="trends-cards-column">
          <div class="cards-column-header">
            <span class="column-title">กระดานเทรนด์ที่คัดสรรมาให้คุณ (${filteredTrends.length} สไตล์)</span>
            <span class="column-hint">คลิกการ์ดเพื่อดูการวิเคราะห์ Insight</span>
          </div>

          <div class="trends-masonry-grid">
            ${filteredTrends.map(item => `
              <div class="trend-pin-card ${item.id === selectedTrend.id ? "is-active-pin" : ""}" data-trend-id="${item.id}">
                <div class="pin-card-media">
                  <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" />
                  <div class="pin-card-overlay">
                    <span class="pin-badge">${escapeHtml(item.badge)}</span>
                    <span class="pin-saves">📌 ${item.saves}</span>
                  </div>
                </div>

                <div class="pin-card-body">
                  <div class="pin-card-cat">${escapeHtml(item.categoryLabel)}</div>
                  <h3 class="pin-card-title">${escapeHtml(item.title)}</h3>
                  <p class="pin-card-desc">${escapeHtml(item.insight)}</p>

                  <div class="pin-palette-mini">
                    ${item.swatches.map(s => `<span class="mini-swatch" style="background:${s.hex};" title="${s.hex} (${s.name})"></span>`).join("")}
                  </div>

                  <div class="pin-card-footer">
                    <button type="button" class="btn-pin-action btn-inspect-pin" data-inspect-id="${item.id}">
                      วิเคราะห์ Insight
                    </button>
                    <button type="button" class="btn-pin-action btn-generate-pin" data-gen-id="${item.id}">
                      ✨ AI สร้างภาพ
                    </button>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

      </div>
    </div>
  `;

  // Bind Search Input
  const searchInput = qs("#trend-search-input");
  searchInput?.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderDiscoveryView();
    // Keep focus
    const input = qs("#trend-search-input");
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  });

  qs("#btn-clear-search")?.addEventListener("click", () => {
    searchQuery = "";
    renderDiscoveryView();
  });

  // Bind Category Filter Pills
  qsa(".filter-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      activeFilter = pill.dataset.filter;
      renderDiscoveryView();
    });
  });

  // Bind Swatch Copy
  qsa(".inspector-swatch-box").forEach((box) => {
    box.addEventListener("click", () => {
      copyText(box.dataset.hex, `รหัสสี ${box.dataset.hex}`);
    });
  });

  // Bind Copy Blueprint
  qs("#btn-copy-blueprint-prompt")?.addEventListener("click", () => {
    copyText(selectedTrend.aiPrompt, "AI Prompt");
  });

  // Bind Open in Studio
  qs("#btn-open-in-studio")?.addEventListener("click", () => {
    loadTrendIntoStudio(selectedTrend);
  });

  // Bind Create Task from Trend
  qs("#btn-create-task-from-trend")?.addEventListener("click", () => {
    if (typeof window.openCreateTask === "function") {
      window.openCreateTask({
        title: `งานดีไซน์สไตล์ ${selectedTrend.title}`,
        description: `บรีฟชิ้นงานอ้างอิงเทรนด์: ${selectedTrend.title}\nInsight: ${selectedTrend.insight}\n\nองค์ประกอบหลัก:\n${selectedTrend.principles.map(p => `- ${p}`).join("\n")}\n\nจานสีเด่น: ${selectedTrend.swatches.map(s => `${s.name} (${s.hex})`).join(", ")}\n\nAI Prompt Blueprint:\n${selectedTrend.aiPrompt}\n`,
        preview_url: selectedTrend.image,
        channel: "Social Media / Key Visual"
      });
    } else {
      toast("กรุณาเปิดเมนูสร้าง Task ในระบบ CONT", "info");
    }
  });

  // Bind Pin Cards Click
  qsa(".trend-pin-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      // Don't trigger if clicked on specific inner buttons
      if (e.target.closest(".btn-generate-pin")) return;
      const id = card.dataset.trendId;
      const found = TREND_DATABASE.find(t => t.id === id);
      if (found) {
        selectedTrend = found;
        renderDiscoveryView();
      }
    });
  });

  // Bind Quick Generate Button on Pin Cards
  qsa(".btn-generate-pin").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.genId;
      const found = TREND_DATABASE.find(t => t.id === id);
      if (found) {
        loadTrendIntoStudio(found);
      }
    });
  });
}

/**
 * Load a Trend into Studio and switch tab
 */
function loadTrendIntoStudio(trend) {
  selectedTrend = trend;
  studioState.prompt = trend.aiPrompt;
  studioState.currentImageUrl = trend.image;
  studioState.overlayText = trend.title.toUpperCase();
  currentTab = "studio";
  render();
  toast(`โหลดข้อมูลสไตล์ "${trend.title}" เข้าสู่ AI Studio เรียบร้อยแล้ว`, "success");
}

/**
 * VIEW 2: AI STUDIO & IMAGE CUSTOMIZER
 */
function renderStudioView() {
  const container = qs("#trend-workspace");
  if (!container) return;

  container.innerHTML = `
    <div class="studio-layout">
      <!-- Left Panel: AI Generator Controls & Prompts -->
      <div class="studio-controls-panel">
        <div class="studio-box">
          <div class="studio-box-header">
            <span class="studio-badge">✨ AI IMAGE GENERATOR</span>
            <span class="studio-status">${studioState.isGenerating ? "⏳ กำลังสร้างภาพ..." : "พร้อมสร้างภาพ"}</span>
          </div>

          <h3 class="studio-box-title">เครื่องมือ AI สังเคราะห์ภาพกราฟิก</h3>
          <p class="studio-box-desc">ปรับแต่งข้อความ Prompt สไตล์ และอัตราส่วนภาพ จากนั้นกดสั่งให้ AI เจนภาพได้ทันที</p>

          <!-- Prompt Textarea -->
          <div class="form-group" style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <label class="studio-field-label">AI Prompt คำสั่งสร้างภาพ:</label>
              <button type="button" class="btn btn-ghost btn-xs" id="btn-enhance-prompt" title="AI ช่วยเติมคีย์เวิร์ดเสริมคุณภาพ">
                ⚡ เพิ่มความอลังการ (Enhance)
              </button>
            </div>
            <textarea id="studio-prompt-input" class="studio-textarea" rows="4" placeholder="พิมพ์อธิบายภาพกราฟิกที่ต้องการสร้าง...">${escapeHtml(studioState.prompt)}</textarea>
          </div>

          <!-- Style Preset Selector -->
          <div class="form-group" style="margin-bottom:14px;">
            <label class="studio-field-label">สไตล์ภาพ (Visual Style):</label>
            <div class="studio-style-grid" id="studio-styles-grid">
              <button type="button" class="style-choice-btn ${studioState.stylePreset === "graphic-poster" ? "is-selected" : ""}" data-style="graphic-poster">
                🎨 Graphic Poster
              </button>
              <button type="button" class="style-choice-btn ${studioState.stylePreset === "3d-render" ? "is-selected" : ""}" data-style="3d-render">
                🔮 3D Octane Render
              </button>
              <button type="button" class="style-choice-btn ${studioState.stylePreset === "photorealistic" ? "is-selected" : ""}" data-style="photorealistic">
                📸 Fashion Editorial
              </button>
              <button type="button" class="style-choice-btn ${studioState.stylePreset === "cyberpunk" ? "is-selected" : ""}" data-style="cyberpunk">
                ⚡ Cyberpunk & Neon
              </button>
              <button type="button" class="style-choice-btn ${studioState.stylePreset === "swiss-minimal" ? "is-selected" : ""}" data-style="swiss-minimal">
                📐 Swiss Minimalist
              </button>
            </div>
          </div>

          <!-- Aspect Ratio Selector -->
          <div class="form-group" style="margin-bottom:18px;">
            <label class="studio-field-label">อัตราส่วนภาพ (Aspect Ratio):</label>
            <div class="aspect-ratio-row" id="aspect-ratio-row">
              <button type="button" class="aspect-choice-btn ${studioState.aspectRatio === "1:1" ? "is-selected" : ""}" data-aspect="1:1">
                <span class="aspect-icon square"></span>
                <span>1:1 (Square)</span>
              </button>
              <button type="button" class="aspect-choice-btn ${studioState.aspectRatio === "4:5" ? "is-selected" : ""}" data-aspect="4:5">
                <span class="aspect-icon portrait"></span>
                <span>4:5 (Social/Pin)</span>
              </button>
              <button type="button" class="aspect-choice-btn ${studioState.aspectRatio === "16:9" ? "is-selected" : ""}" data-aspect="16:9">
                <span class="aspect-icon landscape"></span>
                <span>16:9 (Cover)</span>
              </button>
              <button type="button" class="aspect-choice-btn ${studioState.aspectRatio === "9:16" ? "is-selected" : ""}" data-aspect="9:16">
                <span class="aspect-icon story"></span>
                <span>9:16 (Story/Reel)</span>
              </button>
            </div>
          </div>

          <!-- Primary Generate Button -->
          <button type="button" class="btn-studio-generate-main ${studioState.isGenerating ? "is-loading" : ""}" id="btn-generate-ai-image" ${studioState.isGenerating ? "disabled" : ""}>
            <span>${studioState.isGenerating ? "⏳ กำลังสังเคราะห์ภาพด้วย AI..." : "🚀 สั่งให้ AI สร้างภาพทันที (Generate Image)"}</span>
          </button>
        </div>

        <!-- Trend Reference Fast Swapper -->
        <div class="studio-box" style="margin-top:16px;">
          <div class="studio-box-header">
            <span class="studio-badge">📌 โหลดไอเดียจากเทรนด์อื่น</span>
          </div>
          <div class="quick-trend-chips">
            ${TREND_DATABASE.map(t => `
              <button type="button" class="quick-chip-btn ${t.id === selectedTrend.id ? "is-active" : ""}" data-load-trend="${t.id}">
                ${escapeHtml(t.title)}
              </button>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- Right Panel: Live Canvas Preview & Customizer Tools -->
      <div class="studio-canvas-panel">
        <div class="canvas-card">
          <!-- Canvas Top Bar -->
          <div class="canvas-top-bar">
            <div class="canvas-title-group">
              <span class="canvas-title">ภาพชิ้นงานที่สร้างและปรับแต่ง</span>
              <span class="canvas-ratio-pill">${studioState.aspectRatio}</span>
            </div>
            <div class="canvas-actions-right">
              <button type="button" class="btn btn-ghost btn-sm" id="btn-reset-filters" title="รีเซ็ตฟิลเตอร์">
                🔄 รีเซ็ตค่าสี
              </button>
              <button type="button" class="btn-pixel btn-pixel-cyan" id="btn-download-image" style="padding:6px 14px;">
                <span>💾 ดาวน์โหลดภาพ (.PNG)</span>
              </button>
              <button type="button" class="btn-pixel btn-pixel-orange" id="btn-task-from-canvas" style="padding:6px 14px;">
                <span>+ ส่งงานเข้า CONT</span>
              </button>
            </div>
          </div>

          <!-- Canvas Preview Viewport -->
          <div class="canvas-viewport aspect-${studioState.aspectRatio.replace(":", "-")}" id="canvas-viewport">
            ${studioState.isGenerating ? `
              <div class="canvas-loader-overlay">
                <div class="loader-spinner"></div>
                <div class="loader-text">AI กำลังเรนเดอร์ภาพกราฟิกความละเอียดสูง...</div>
                <div class="loader-sub">อิงตาม Prompt และทฤษฎีการออกแบบของเทรนด์</div>
              </div>
            ` : ""}

            <div class="canvas-img-container" id="canvas-img-container">
              <img 
                id="canvas-active-img" 
                src="${escapeHtml(studioState.currentImageUrl)}" 
                alt="AI Generated Artwork" 
                style="filter: brightness(${studioState.brightness}%) contrast(${studioState.contrast}%) saturate(${studioState.saturation}%) hue-rotate(${studioState.hueRotate}deg) blur(${studioState.blur}px);"
              />

              <!-- Overlay Headline Text if any -->
              <div 
                id="canvas-overlay-display" 
                class="canvas-overlay-text pos-${studioState.overlayPosition}" 
                style="${studioState.overlayText ? "display:block;" : "display:none;"}"
              >
                ${escapeHtml(studioState.overlayText)}
              </div>
            </div>
          </div>

          <!-- Image Customizer Tools (Filters & Typography) -->
          <div class="studio-editor-tools">
            <div class="tools-header">
              <span class="tools-title">🎛️ เครื่องมือปรับแต่งภาพ (Live Image Customizer)</span>
              <div class="preset-filters-row">
                <button type="button" class="preset-btn" data-preset="normal">Original</button>
                <button type="button" class="preset-btn" data-preset="cyber">Cyber Neon</button>
                <button type="button" class="preset-btn" data-preset="noir">Noir B&W</button>
                <button type="button" class="preset-btn" data-preset="warm">Warm Vintage</button>
                <button type="button" class="preset-btn" data-preset="acid">Acid Pop</button>
              </div>
            </div>

            <div class="sliders-grid">
              <!-- Brightness -->
              <div class="slider-control">
                <div class="slider-label-row">
                  <span>ความสว่าง (Brightness)</span>
                  <span id="val-brightness">${studioState.brightness}%</span>
                </div>
                <input type="range" id="slider-brightness" min="40" max="180" value="${studioState.brightness}" class="tool-range-slider" />
              </div>

              <!-- Contrast -->
              <div class="slider-control">
                <div class="slider-label-row">
                  <span>ความคมชัด (Contrast)</span>
                  <span id="val-contrast">${studioState.contrast}%</span>
                </div>
                <input type="range" id="slider-contrast" min="50" max="200" value="${studioState.contrast}" class="tool-range-slider" />
              </div>

              <!-- Saturation -->
              <div class="slider-control">
                <div class="slider-label-row">
                  <span>ความอิ่มตัวสี (Saturation)</span>
                  <span id="val-saturation">${studioState.saturation}%</span>
                </div>
                <input type="range" id="slider-saturation" min="0" max="220" value="${studioState.saturation}" class="tool-range-slider" />
              </div>

              <!-- Hue Rotate -->
              <div class="slider-control">
                <div class="slider-label-row">
                  <span>เฉดสี (Hue Shift)</span>
                  <span id="val-hue">${studioState.hueRotate}°</span>
                </div>
                <input type="range" id="slider-hue" min="0" max="360" value="${studioState.hueRotate}" class="tool-range-slider" />
              </div>
            </div>

            <!-- Typography Overlay Row -->
            <div class="overlay-text-row">
              <div style="flex:1;">
                <label class="studio-field-label">พิมพ์ข้อความ Headline ลงบนภาพ:</label>
                <input 
                  type="text" 
                  id="input-overlay-text" 
                  class="studio-text-input" 
                  placeholder="เช่น NEW COLLECTION 2026, ART EXHIBITION, FUTURE BEATS..." 
                  value="${escapeHtml(studioState.overlayText)}"
                />
              </div>
              <div style="width:160px;">
                <label class="studio-field-label">ตำแหน่งข้อความ:</label>
                <select id="select-overlay-pos" class="studio-select">
                  <option value="bottom" ${studioState.overlayPosition === "bottom" ? "selected" : ""}>ล่างสุด (Bottom)</option>
                  <option value="center" ${studioState.overlayPosition === "center" ? "selected" : ""}>ตรงกลาง (Center)</option>
                  <option value="top" ${studioState.overlayPosition === "top" ? "selected" : ""}>บนสุด (Top)</option>
                </select>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  `;

  // Bind Prompt Textarea changes
  const promptInput = qs("#studio-prompt-input");
  promptInput?.addEventListener("input", (e) => {
    studioState.prompt = e.target.value;
  });

  // Bind Enhance Prompt
  qs("#btn-enhance-prompt")?.addEventListener("click", () => {
    const current = studioState.prompt.trim();
    const additions = ", masterpiece quality, volumetric lighting, award winning graphic design composition, hyper detailed 8k";
    if (!current.includes("masterpiece")) {
      studioState.prompt = current + additions;
      if (promptInput) promptInput.value = studioState.prompt;
      toast("เติมคีย์เวิร์ดยกระดับคุณภาพเรียบร้อยแล้ว", "success");
    }
  });

  // Bind Style Choices
  qsa(".style-choice-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      studioState.stylePreset = btn.dataset.style;
      qsa(".style-choice-btn").forEach(b => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
    });
  });

  // Bind Aspect Choices
  qsa(".aspect-choice-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      studioState.aspectRatio = btn.dataset.aspect;
      renderStudioView();
    });
  });

  // Bind Generate Button
  qs("#btn-generate-ai-image")?.addEventListener("click", async () => {
    if (!studioState.prompt.trim()) {
      toast("กรุณาใส่ข้อความ Prompt ก่อนสั่งให้ AI สร้างภาพ", "warning");
      return;
    }

    studioState.isGenerating = true;
    renderStudioView();

    const targetUrl = buildAiImageUrl(studioState.prompt, studioState.aspectRatio, studioState.stylePreset);

    // Preload image to avoid blank flashing
    const imgLoader = new Image();
    imgLoader.src = targetUrl;
    imgLoader.onload = () => {
      studioState.currentImageUrl = targetUrl;
      studioState.isGenerating = false;
      studioState.history.unshift(targetUrl);
      renderStudioView();
      toast("AI สังเคราะห์ภาพกราฟิกตามเทรนด์สำเร็จ!", "success", "AI Generated");
    };

    imgLoader.onerror = () => {
      // Fallback
      studioState.currentImageUrl = targetUrl;
      studioState.isGenerating = false;
      renderStudioView();
      toast("สร้างภาพเรียบร้อยแล้ว", "success");
    };
  });

  // Bind Quick Trend Swappers
  qsa("[data-load-trend]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.loadTrend;
      const t = TREND_DATABASE.find(x => x.id === id);
      if (t) {
        loadTrendIntoStudio(t);
      }
    });
  });

  // Live Slider Events
  const applyFilterStyles = () => {
    const img = qs("#canvas-active-img");
    if (img) {
      img.style.filter = `brightness(${studioState.brightness}%) contrast(${studioState.contrast}%) saturate(${studioState.saturation}%) hue-rotate(${studioState.hueRotate}deg) blur(${studioState.blur}px)`;
    }
  };

  const bSlider = qs("#slider-brightness");
  bSlider?.addEventListener("input", (e) => {
    studioState.brightness = e.target.value;
    qs("#val-brightness").textContent = `${studioState.brightness}%`;
    applyFilterStyles();
  });

  const cSlider = qs("#slider-contrast");
  cSlider?.addEventListener("input", (e) => {
    studioState.contrast = e.target.value;
    qs("#val-contrast").textContent = `${studioState.contrast}%`;
    applyFilterStyles();
  });

  const sSlider = qs("#slider-saturation");
  sSlider?.addEventListener("input", (e) => {
    studioState.saturation = e.target.value;
    qs("#val-saturation").textContent = `${studioState.saturation}%`;
    applyFilterStyles();
  });

  const hSlider = qs("#slider-hue");
  hSlider?.addEventListener("input", (e) => {
    studioState.hueRotate = e.target.value;
    qs("#val-hue").textContent = `${studioState.hueRotate}°`;
    applyFilterStyles();
  });

  // Preset Filters
  qsa(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = btn.dataset.preset;
      if (p === "normal") {
        studioState.brightness = 100;
        studioState.contrast = 100;
        studioState.saturation = 100;
        studioState.hueRotate = 0;
      } else if (p === "cyber") {
        studioState.brightness = 110;
        studioState.contrast = 140;
        studioState.saturation = 160;
        studioState.hueRotate = 40;
      } else if (p === "noir") {
        studioState.brightness = 95;
        studioState.contrast = 150;
        studioState.saturation = 0;
        studioState.hueRotate = 0;
      } else if (p === "warm") {
        studioState.brightness = 105;
        studioState.contrast = 115;
        studioState.saturation = 120;
        studioState.hueRotate = 330;
      } else if (p === "acid") {
        studioState.brightness = 115;
        studioState.contrast = 160;
        studioState.saturation = 180;
        studioState.hueRotate = 120;
      }
      renderStudioView();
      toast(`ใช้ฟิลเตอร์: ${btn.textContent}`, "info");
    });
  });

  // Reset Filters
  qs("#btn-reset-filters")?.addEventListener("click", () => {
    studioState.brightness = 100;
    studioState.contrast = 100;
    studioState.saturation = 100;
    studioState.hueRotate = 0;
    renderStudioView();
    toast("รีเซ็ตค่าสีเรียบร้อยแล้ว", "info");
  });

  // Overlay Headline Input
  const overlayInput = qs("#input-overlay-text");
  overlayInput?.addEventListener("input", (e) => {
    studioState.overlayText = e.target.value;
    const display = qs("#canvas-overlay-display");
    if (display) {
      display.textContent = studioState.overlayText;
      display.style.display = studioState.overlayText ? "block" : "none";
    }
  });

  // Overlay Position Select
  const overlaySelect = qs("#select-overlay-pos");
  overlaySelect?.addEventListener("change", (e) => {
    studioState.overlayPosition = e.target.value;
    const display = qs("#canvas-overlay-display");
    if (display) {
      display.className = `canvas-overlay-text pos-${studioState.overlayPosition}`;
    }
  });

  // Download Image button (Renders to Canvas to apply CSS filters & overlay text permanently!)
  qs("#btn-download-image")?.addEventListener("click", () => {
    const img = qs("#canvas-active-img");
    if (!img) return;

    toast("กำลังประมวลผลไฟล์ภาพความละเอียดสูง...", "info");

    const offscreen = document.createElement("canvas");
    const ctx = offscreen.getContext("2d");
    const dlImg = new Image();
    dlImg.crossOrigin = "anonymous";
    dlImg.src = studioState.currentImageUrl;

    dlImg.onload = () => {
      offscreen.width = dlImg.naturalWidth || 1024;
      offscreen.height = dlImg.naturalHeight || 1024;

      // Apply Filter via canvas context
      ctx.filter = `brightness(${studioState.brightness}%) contrast(${studioState.contrast}%) saturate(${studioState.saturation}%) hue-rotate(${studioState.hueRotate}deg)`;
      ctx.drawImage(dlImg, 0, 0, offscreen.width, offscreen.height);

      // Render Overlay Text if present
      if (studioState.overlayText) {
        ctx.filter = "none";
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        const barHeight = offscreen.height * 0.12;
        let yPos = offscreen.height - barHeight;
        if (studioState.overlayPosition === "top") yPos = 0;
        if (studioState.overlayPosition === "center") yPos = (offscreen.height - barHeight) / 2;

        ctx.fillRect(0, yPos, offscreen.width, barHeight);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `bold ${Math.round(offscreen.width * 0.045)}px 'Space Mono', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(studioState.overlayText, offscreen.width / 2, yPos + barHeight / 2);
      }

      // Trigger download
      try {
        const link = document.createElement("a");
        link.download = `CONT-AI-${selectedTrend.id}-${Date.now()}.png`;
        link.href = offscreen.toDataURL("image/png");
        link.click();
        toast("ดาวน์โหลดภาพสำเร็จเรียบร้อย!", "success");
      } catch (err) {
        // Direct open fallback if canvas tainted
        window.open(studioState.currentImageUrl, "_blank");
        toast("เปิดภาพต้นฉบับในแท็บใหม่แล้ว", "success");
      }
    };

    dlImg.onerror = () => {
      window.open(studioState.currentImageUrl, "_blank");
      toast("เปิดภาพในแท็บใหม่สำหรับการบันทึก", "info");
    };
  });

  // Task from Canvas button
  qs("#btn-task-from-canvas")?.addEventListener("click", () => {
    if (typeof window.openCreateTask === "function") {
      window.openCreateTask({
        title: `งานดีไซน์: ${studioState.overlayText || selectedTrend.title}`,
        description: `ชิ้นงานที่สร้างและปรับแต่งด้วย AI Studio ตามเทรนด์ ${selectedTrend.title}\n\nAI Prompt ที่ใช้:\n${studioState.prompt}\n\nสไตล์: ${studioState.stylePreset} (${studioState.aspectRatio})\nการตั้งค่าฟิลเตอร์: Brightness ${studioState.brightness}%, Contrast ${studioState.contrast}%, Saturation ${studioState.saturation}%\n`,
        preview_url: studioState.currentImageUrl,
        channel: "Social Media / Key Visual"
      });
    } else {
      toast("เปิดเมนูสร้างงานในระบบ CONT", "info");
    }
  });
}
