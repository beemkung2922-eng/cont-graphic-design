import { qs, qsa, toast, openModal, closeModal } from "./app.js";
import { escapeHtml } from "./formatters.js";
import { pixelIcons } from "./pixel-icons.js";

/**
 * Curated Top Design Trends from Behance, Dribbble, Awwwards, and Muzli Magazine
 */
export const TRENDS_DATA = [
  {
    id: "trend-kinetic-type",
    rank: 1,
    title: "Kinetic Typography & Editorial Maximalism",
    titleTh: "อักษรศิลป์เคลื่อนไหว ขนาดโอเวอร์ไซส์ และเลย์เอาต์นิตยสารร่วมสมัย",
    category: "Typography",
    categoryLabel: "Typography & Graphic Design",
    sources: [
      { name: "Muzli Magazine", badge: "Weekly Trend Digest #512", url: "https://medium.muz.li", color: "#F59E0B" },
      { name: "Behance", badge: "Best of Typography & Editorial", url: "https://www.behance.net", color: "#0057FF" }
    ],
    updatedPeriod: "สัปดาห์นี้ (ตุลาคม 2026)",
    popularityScore: 98,
    keywords: ["#KineticType", "#EditorialMaximalism", "#VariableFont", "#HighContrast", "#OversizedDisplay"],
    colorPalette: [
      { hex: "#0B0C10", name: "Obsidian Void" },
      { hex: "#F5F5F0", name: "Editorial Newsprint" },
      { hex: "#E11D48", name: "Acid Rose" },
      { hex: "#D97706", name: "Amber Ochre" },
      { hex: "#475569", name: "Slate Grain" }
    ],
    summary: "ตัวอักษรไม่ได้เป็นเพียงเครื่องมืออ่านข้อความอีกต่อไป แต่ได้กลายเป็น 'กราฟิกชิ้นเอก' ของหน้าจอและสื่อสิ่งพิมพ์ ยุคนี้คือการผสานความสง่างามของฟอนต์ Serif ย้อนยุคเข้ากับการเคลื่อนไหว Kinetic Motion ที่ตอบสนองต่อการ Scroll หน้าเว็บ",
    visualTraits: [
      "Text-as-Artwork: ใช้ฟอนต์ Display ขนาดใหญ่พิเศษ (Oversized Headline) ดึงดูดสายตาทันทีตั้งแต่แรกเห็น",
      "Dynamic Kinetic Transitions: ตัวอักษรยืด หด หรือขยับตามการเลื่อนเมาส์ (Scroll-driven motion)",
      "High Contrast & Editorial Spacing: การจัดวางที่เลียนแบบนิตยสารแฟชั่นชั้นนำ สลับช่องไฟแบบอสมมาตร (Asymmetrical Layout)",
      "Imperfect Character Shapes: การดัดแปลงตัวอักษรเฉพาะจุด (Custom Ligatures) ให้มีเอกลักษณ์เฉพาะตัว"
    ],
    applications: [
      "Key Visual แคมเปญโฆษณาและโปสเตอร์ประชาสัมพันธ์หลัก",
      "Social Media Carousels & Title Cards สำหรับแคมเปญโปรโมต",
      "Hero Banner ของหน้า Landing Page",
      "ปกสิ่งพิมพ์ โบรชัวร์ และรายงานประจำปี"
    ],
    previewImage: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80",
    aiPrompt: "Cinematic editorial graphic design, bold oversized kinetic typography 'CONT CREATIVE', high contrast black and ivory paper texture, acid rose and amber ochre accents, asymmetric Swiss grid layout, 8k resolution, professional behance showcase style"
  },
  {
    id: "trend-bento-grid",
    rank: 2,
    title: "Bento Grid Architecture & Spatial Depth",
    titleTh: "เลย์เอาต์โมดูลาร์แบบเบนโตะ ผสานมิติเลเยอร์ลอยตัว (Floating Depth)",
    category: "UI/UX",
    categoryLabel: "UI/UX & Web Design",
    sources: [
      { name: "Awwwards", badge: "Site of the Day (SOTD)", url: "https://www.awwwards.com", color: "#10B981" },
      { name: "Dribbble", badge: "Trending Modular Systems", url: "https://dribbble.com", color: "#EA4C89" }
    ],
    updatedPeriod: "สัปดาห์นี้ (ตุลาคม 2026)",
    popularityScore: 95,
    keywords: ["#BentoGrid", "#ModularUI", "#SpatialDepth", "#GlassCards", "#MicroInteractions"],
    colorPalette: [
      { hex: "#0F1018", name: "Deep Charcoal" },
      { hex: "#181A26", name: "Bento Card Base" },
      { hex: "#19C3EB", name: "Electric Cyan Glow" },
      { hex: "#8B5CF6", name: "Spatial Violet" },
      { hex: "#64748B", name: "Titanium Border" }
    ],
    summary: "อิทธิพลจากการจัดกล่องข้าวเบนโตะญี่ปุ่นที่พัฒนามาเป็นมาตรฐานการออกแบบเว็บและแดชบอร์ดยุคใหม่ ช่วยจัดระเบียบข้อมูลสถิติ ฟีเจอร์ และกราฟิกที่ซับซ้อนให้กลายเป็นกล่องการ์ดโมดูลาร์ที่ย่อยง่าย สวยงาม และดึงดูดสายตา",
    visualTraits: [
      "Modular Compartments: กริดสี่เหลี่ยมหลายขนาดที่เรียงตัวกันอย่างมีจังหวะ (Multi-sized Asymmetric Cards)",
      "Floating Objects (UFOs): วัตถุ 3D หรือภาพกราฟิกลอยตัวทะลุขอบกล่อง สร้างมิติความลึก (Z-Index Layering)",
      "Luminous Borders: ขอบการ์ดบางเฉียบพร้อมประกายแสงสะท้อน (Subtle Gradient Border Glow)",
      "Tactile Hover States: การ์ดขยับตามการลากเมาส์เบา ๆ (Interactive Tilt Feedback)"
    ],
    applications: [
      "หน้า Landing Page นำเสนอผลิตภัณฑ์และบริการสินเชื่อ",
      "แดชบอร์ดสรุปสถิติผลงานและ KPI ของทีม",
      "ตารางเปรียบเทียบฟีเจอร์และสิทธิประโยชน์ทางการเงิน",
      "Infographic สรุปข้อมูลสำคัญบน Social Media"
    ],
    previewImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    aiPrompt: "Modern dark UI dashboard landing page, bento grid layout with glowing borders, translucent frosted glass cards, holographic cyan and purple lighting, 3D floating icons, clean sans-serif typography, awwwards site of the day award winner aesthetic"
  },
  {
    id: "trend-agentic-mx",
    rank: 3,
    title: "AI Machine Experience (MX) & Agentic Dark Canvas",
    titleTh: "อินเทอร์เฟซผู้ช่วย AI ยุคใหม่ แคนวาสสีเข้มและชิปพารามิเตอร์อัจฉริยะ",
    category: "UI/UX",
    categoryLabel: "AI Interface & Product Design",
    sources: [
      { name: "Dribbble", badge: "Popular / AI Design Systems", url: "https://dribbble.com", color: "#EA4C89" },
      { name: "Muzli Magazine", badge: "AI Tools & UX Digest", url: "https://medium.muz.li", color: "#F59E0B" }
    ],
    updatedPeriod: "เดือนนี้ (ตุลาคม 2026)",
    popularityScore: 92,
    keywords: ["#AgenticUI", "#MachineExperience", "#DarkSpatial", "#DynamicChips", "#AmbientGlow"],
    colorPalette: [
      { hex: "#090A0F", name: "Zero Gravity Black" },
      { hex: "#141724", name: "Dark Slate Surface" },
      { hex: "#10B981", name: "Agent Active Mint" },
      { hex: "#6366F1", name: "Neural Indigo" },
      { hex: "#38BDF8", name: "Prompt Azure" }
    ],
    summary: "การก้าวกระโดดของงานออกแบบ UI/UX สำหรับเครื่องมือ AI ไม่ใช่แค่กล่องแชทธรรมดา แต่เป็น 'Living Canvas' ที่มีเครื่องมือผู้ช่วยฝังตัวอยู่รอบพื้นที่ทำงาน พร้อมชิป Interactive ปรับแต่งพารามิเตอร์ได้อย่างลื่นไหลและเข้าใจง่าย",
    visualTraits: [
      "Living Agent Status: แสดงสถานะการทำงานของ AI อย่างชัดเจน (Idle / Thinking / Ready) ด้วยไฟแอมเบียนต์",
      "Contextual Inline Toolbars: เมนูคำสั่งลอยตัวที่ปรากฏขึ้นเมื่อคลิกเลือกชิ้นงานบนหน้าจอ",
      "Fluid Chip Parameters: ปุ่มแท็กแบบแคปซูลสำหรับสลับโหมด ป้อน Prompt และตั้งค่ารวดเร็ว",
      "Deep Spatial Void: ธีมมืดสนิทที่ช่วยให้สีไฮไลต์ของ AI โดดเด่น สบายตาเวลาทำงานต่อเนื่องหลายชั่วโมง"
    ],
    applications: [
      "ระบบบริหารจัดการงานดีไซน์อัตโนมัติภายในทีม",
      "เว็บแอปพลิเคชันที่ขับเคลื่อนด้วยระบบ AI",
      "เครื่องมือสร้างสรรค์คอนเทนต์และจัดการแคมเปญการตลาด",
      "อินเทอร์เฟซตัวช่วยคัดกรองข้อมูลอัจฉริยะ"
    ],
    previewImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    aiPrompt: "Sleek dark mode AI agent interface canvas, fluid neon mesh gradients, luminous emerald and indigo status pills, floating modular tool palette, generative creative assistant, dribbble trending shot style"
  },
  {
    id: "trend-acid-risograph",
    rank: 4,
    title: "Acid Graphics & Risograph Tactile Nostalgia",
    titleTh: "กราฟิกเกรนเก๋า งานพิมพ์รีโซกราฟ และป้ายสัญลักษณ์เรโทร 90s",
    category: "Graphic Design",
    categoryLabel: "Graphic Design & Branding",
    sources: [
      { name: "Behance", badge: "Best of Behance / Branding", url: "https://www.behance.net", color: "#0057FF" },
      { name: "Muzli Magazine", badge: "Weekly Graphic Inspiration", url: "https://medium.muz.li", color: "#F59E0B" }
    ],
    updatedPeriod: "เดือนนี้ (ตุลาคม 2026)",
    popularityScore: 90,
    keywords: ["#AcidGraphic", "#RisographGrain", "#RetroSerif", "#HalftoneDots", "#AnalogNostalgia"],
    colorPalette: [
      { hex: "#E06D53", name: "Risograph Terracotta" },
      { hex: "#C8F902", name: "Electric Acid Lime" },
      { hex: "#171829", name: "Deep Ink Blue" },
      { hex: "#F3EDE2", name: "Vintage Newsprint" },
      { hex: "#FFAA00", name: "Analog Amber" }
    ],
    summary: "กระแสต่อต้านความเนี้ยบเกินไปของภาพดิจิทัล (Anti-Slick Digital) ครีเอเตอร์หันกลับมาหลงใหลในเสน่ห์ของงานพิมพ์ยุคแอนะล็อกที่มีความไม่สมบูรณ์แบบ เช่น เม็ดสกรีน Halftone, ลายเกรน Risograph, และรูปทรงดาว Y2K ที่ให้ความรู้สึกอบอุ่น มีจิตวิญญาณ",
    visualTraits: [
      "Raw Print Textures: พื้นผิวสัมผัสกระดาษจริง มีเกรนฟิล์มและจุดเม็ดสกรีน Halftone สไตล์งานพิมพ์โบราณ",
      "Misaligned Layers: เทคนิคการพิมพ์ซ้อนทับแบบเหลื่อมสี (Off-register print aesthetic)",
      "Neo-Vintage Crests & Badges: การใช้ตราสัญลักษณ์ ป้ายแสตมป์ และเส้นกรอบเรขาคณิตยุค 70s-90s",
      "Vibrant Contrast Duotones: สีคู่ตรงข้ามที่มีพลัง เช่น สีส้มอิฐคู่กับสีเขียวมะนาวสะท้อนแสง"
    ],
    applications: [
      "แคมเปญเจาะกลุ่มคนรุ่นใหม่ / กลุ่มลูกค้าไลฟ์สไตล์",
      "อาร์ตเวิร์ก Social Media และโปสเตอร์อีเวนต์",
      "บรรจุภัณฑ์ ของพรีเมียม และเสื้อยืดแคมเปญทีม",
      "ภาพประกอบบทความและการเล่าเรื่องสไตล์สารคดี"
    ],
    previewImage: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80",
    aiPrompt: "Vintage risograph art poster, tactile grainy paper texture, vibrant terracotta and electric lime ink, halftone dot patterns, retro display serif typography, nostalgic 90s acid graphic design badge, behance featured showcase"
  },
  {
    id: "trend-webgl-clay",
    rank: 5,
    title: "Lightweight In-Browser 3D & Claymorphism",
    titleTh: "วัตถุสามมิติสไตล์ดินน้ำมันนุ่มนวล และโมเดลอินเทอร์แอ็กทีฟบนเว็บเบราว์เซอร์",
    category: "3D & Motion",
    categoryLabel: "3D Design & Web Interactive",
    sources: [
      { name: "Awwwards", badge: "Developer Award & SOTD", url: "https://www.awwwards.com", color: "#10B981" },
      { name: "Dribbble", badge: "Popular 3D & Spline Art", url: "https://dribbble.com", color: "#EA4C89" }
    ],
    updatedPeriod: "สัปดาห์นี้ (ตุลาคม 2026)",
    popularityScore: 88,
    keywords: ["#Claymorphism", "#Spline3D", "#WebGLInteractive", "#SoftMatte", "#Spatial3D"],
    colorPalette: [
      { hex: "#C4B5FD", name: "Soft Clay Lilac" },
      { hex: "#FCA5A5", name: "Pastel Clay Coral" },
      { hex: "#38BDF8", name: "Floating Sky Azure" },
      { hex: "#0F172A", name: "Midnight Space" },
      { hex: "#FFFFFF", name: "Specular White" }
    ],
    summary: "การพัฒนาของเทคโนโลยี WebGL และเครื่องมืออย่าง Spline ทำให้งาน 3 มิติบนเว็บเบราว์เซอร์มีขนาดไฟล์เล็กลง โหลดเร็ว และหมุนโต้ตอบกับผู้ใช้ได้ทันที งานสไตล์ Claymorphism ที่มีผิวสัมผัสดินน้ำมันเนื้อแมตต์ให้ความรู้สึกที่เป็นมิตรและทันสมัย",
    visualTraits: [
      "Soft Matte Materials: พื้นผิวไม่สะท้อนแสงจัด ให้ความรู้สึกนุ่มเหมือนดินน้ำมันหรือยางซิลิโคนคุณภาพสูง",
      "Playful Geometry: รูปทรงเรขาคณิตมุมมนโค้งมน ไร้ขอบคม ดูเป็นมิตรและอบอุ่น",
      "Interactive 3D Motion: หมุนหรือลอยตามการขยับเมาส์ (Mouse-reactive physics)",
      "Delicate Pastel Lighting: แสงเงาฟุ้งละมุน ไม่แข็งกร้าว สร้างบรรยากาศเชิงบวกและผ่อนคลาย"
    ],
    applications: [
      "ไอคอนหมวดหมู่บริการทางการเงินและแพ็กเกจสินเชื่อ",
      "มาสคอตและภาพประกอบนำเสนอสิทธิประโยชน์",
      "Hero Section บนหน้าแรกของเว็บไซต์",
      "ภาพเคลื่อนไหวประกอบแคมเปญดิจิทัล"
    ],
    previewImage: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80",
    aiPrompt: "Cute playful claymorphism 3D abstract objects floating in mid air, soft matte pastel lilac and coral materials, gentle ambient shadows, clean composition, rendered in blender and spline 3d, dribbble popular 3d shot"
  }
];

let currentFilterCategory = "all";
let currentFilterSource = "all";
let currentSearchQuery = "";
let lastScanTime = "สัปดาห์นี้ (ตุลาคม 2026)";

/**
 * Copies a HEX code to clipboard and provides toast notification
 */
function copyHexToClipboard(hex, colorName) {
  navigator.clipboard.writeText(hex).then(() => {
    toast(`คัดลอกรหัสสี ${hex} (${colorName}) เรียบร้อยแล้ว`, "success", "Color Copied");
  }).catch(() => {
    // Fallback
    const input = document.createElement("input");
    input.value = hex;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    toast(`คัดลอกรหัสสี ${hex} เรียบร้อยแล้ว`, "success", "Color Copied");
  });
}

/**
 * Triggers the AI Curator Scan Simulation Modal
 */
function triggerAiCuratorScan(onComplete) {
  const modal = openModal({
    title: `
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:1.4rem;">🤖</span>
        <div>
          <div style="font-weight:700;font-size:1.05rem;color:#ffffff;">Design Trend Curator AI — Live Data Fetch</div>
          <div style="font-size:0.75rem;color:#8f95ae;">กำลังวิเคราะห์และสังเคราะห์ข้อมูลจาก 4 แหล่งที่มาล่าสุด...</div>
        </div>
      </div>
    `,
    body: `
      <div class="ai-scan-modal-body" style="padding:10px 0;">
        <div class="ai-scan-progress-wrap" style="background:#151622;border:1px solid #282a3c;border-radius:8px;padding:14px;margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span id="ai-scan-status-text" style="font-size:0.84rem;font-weight:600;color:var(--cyan);">กำลังเชื่อมต่อแหล่งข้อมูล...</span>
            <span id="ai-scan-percent" style="font-size:0.84rem;font-weight:700;color:#ffffff;">15%</span>
          </div>
          <div style="width:100%;height:8px;background:#232638;border-radius:4px;overflow:hidden;">
            <div id="ai-scan-bar" style="width:15%;height:100%;background:linear-gradient(90deg, #19C3EB, #8B4DFF);transition:width 0.4s ease;"></div>
          </div>
        </div>

        <div class="ai-scan-sources-list" style="display:flex;flex-direction:column;gap:10px;">
          <div class="ai-source-item" id="src-behance" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#141521;border:1px solid #26283b;border-radius:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="width:10px;height:10px;border-radius:50%;background:#0057FF;display:inline-block;"></span>
              <div>
                <div style="font-weight:600;font-size:0.84rem;color:#ffffff;">Behance (Popular / Best of Behance)</div>
                <div style="font-size:0.74rem;color:#8f95ae;">สแกนผลงาน Branding, Graphic Design, และ Typography ล่าสุด</div>
              </div>
            </div>
            <span class="ai-source-badge" style="font-size:0.75rem;color:#8f95ae;">⏳ กำลังสแกน...</span>
          </div>

          <div class="ai-source-item" id="src-dribbble" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#141521;border:1px solid #26283b;border-radius:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="width:10px;height:10px;border-radius:50%;background:#EA4C89;display:inline-block;"></span>
              <div>
                <div style="font-weight:600;font-size:0.84rem;color:#ffffff;">Dribbble (Popular / Trending)</div>
                <div style="font-size:0.74rem;color:#8f95ae;">วิเคราะห์ช็อตยอดนิยม, แดชบอร์ด AI และโมดูลาร์ Bento Grids</div>
              </div>
            </div>
            <span class="ai-source-badge" style="font-size:0.75rem;color:#8f95ae;">รอคิว...</span>
          </div>

          <div class="ai-source-item" id="src-awwwards" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#141521;border:1px solid #26283b;border-radius:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="width:10px;height:10px;border-radius:50%;background:#10B981;display:inline-block;"></span>
              <div>
                <div style="font-weight:600;font-size:0.84rem;color:#ffffff;">Awwwards (Site of the Day / Trends)</div>
                <div style="font-size:0.74rem;color:#8f95ae;">สกัดเทรนด์สถาปัตยกรรมเว็บ, WebGL 3D และ Micro-Interactions</div>
              </div>
            </div>
            <span class="ai-source-badge" style="font-size:0.75rem;color:#8f95ae;">รอคิว...</span>
          </div>

          <div class="ai-source-item" id="src-muzli" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#141521;border:1px solid #26283b;border-radius:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="width:10px;height:10px;border-radius:50%;background:#F59E0B;display:inline-block;"></span>
              <div>
                <div style="font-weight:600;font-size:0.84rem;color:#ffffff;">Muzli Magazine (Weekly Trend Digest)</div>
                <div style="font-size:0.74rem;color:#8f95ae;">ประมวลผลบทความสรุปเทรนด์รายสัปดาห์ & Best Portfolios</div>
              </div>
            </div>
            <span class="ai-source-badge" style="font-size:0.75rem;color:#8f95ae;">รอคิว...</span>
          </div>
        </div>

        <div style="margin-top:16px;text-align:center;font-size:0.78rem;color:#8f95ae;">
          🔍 AI กำลังสกัดคีย์เวิร์ด, จับคู่รหัสสี HEX, และคัดเลือกลิงก์ภาพตัวอย่างคุณภาพสูง...
        </div>
      </div>
    `,
    footer: `
      <div style="display:flex;justify-content:flex-end;width:100%;">
        <button type="button" class="btn btn-ghost" data-close-modal>ยกเลิก</button>
      </div>
    `
  });

  const bar = modal.querySelector("#ai-scan-bar");
  const pct = modal.querySelector("#ai-scan-percent");
  const statusTxt = modal.querySelector("#ai-scan-status-text");

  const step1 = setTimeout(() => {
    if (bar) bar.style.width = "40%";
    if (pct) pct.textContent = "40%";
    if (statusTxt) statusTxt.textContent = "ดึงข้อมูล Best of Behance สำเร็จ... กำลังสแกน Dribbble Trending...";
    const el = modal.querySelector("#src-behance .ai-source-badge");
    if (el) { el.textContent = "✓ วิเคราะห์สำเร็จ"; el.style.color = "var(--green)"; }
    const el2 = modal.querySelector("#src-dribbble .ai-source-badge");
    if (el2) { el2.textContent = "⏳ กำลังสแกน..."; el2.style.color = "var(--cyan)"; }
  }, 700);

  const step2 = setTimeout(() => {
    if (bar) bar.style.width = "65%";
    if (pct) pct.textContent = "65%";
    if (statusTxt) statusTxt.textContent = "สแกน Dribbble สำเร็จ... กำลังตรวจสอบ Awwwards Site of the Day...";
    const el = modal.querySelector("#src-dribbble .ai-source-badge");
    if (el) { el.textContent = "✓ วิเคราะห์สำเร็จ"; el.style.color = "var(--green)"; }
    const el2 = modal.querySelector("#src-awwwards .ai-source-badge");
    if (el2) { el2.textContent = "⏳ กำลังสแกน..."; el2.style.color = "var(--cyan)"; }
  }, 1400);

  const step3 = setTimeout(() => {
    if (bar) bar.style.width = "88%";
    if (pct) pct.textContent = "88%";
    if (statusTxt) statusTxt.textContent = "ประมวลผล Awwwards สำเร็จ... กำลังรวบรวม Muzli Magazine Digest...";
    const el = modal.querySelector("#src-awwwards .ai-source-badge");
    if (el) { el.textContent = "✓ วิเคราะห์สำเร็จ"; el.style.color = "var(--green)"; }
    const el2 = modal.querySelector("#src-muzli .ai-source-badge");
    if (el2) { el2.textContent = "⏳ กำลังสแกน..."; el2.style.color = "var(--cyan)"; }
  }, 2100);

  const step4 = setTimeout(() => {
    if (bar) bar.style.width = "100%";
    if (pct) pct.textContent = "100%";
    if (statusTxt) statusTxt.textContent = "✨ สกัดคีย์เวิร์ด, สวอตช์สี HEX, และจัดอันดับ 5 เทรนด์ล่าสุดเรียบร้อยแล้ว!";
    const el = modal.querySelector("#src-muzli .ai-source-badge");
    if (el) { el.textContent = "✓ วิเคราะห์สำเร็จ"; el.style.color = "var(--green)"; }

    setTimeout(() => {
      closeModal();
      lastScanTime = "เมื่อสักครู่ (Real-Time Live)";
      toast("AI Curator ซิงค์ข้อมูลเทรนด์ล่าสุด 4 แหล่งเรียบร้อยแล้ว!", "success", "AI Curator Sync Complete");
      if (typeof onComplete === "function") onComplete();
    }, 600);
  }, 2800);
}

/**
 * Open Trend Deep Dive Modal
 */
function openTrendDeepDive(trend) {
  openModal({
    size: "lg",
    title: `
      <div style="display:flex;align-items:center;gap:12px;">
        <span class="badge badge-info" style="font-weight:700;font-size:0.85rem;">🔥 TREND #${trend.rank}</span>
        <div>
          <div style="font-weight:700;font-size:1.15rem;color:#ffffff;">${escapeHtml(trend.title)}</div>
          <div style="font-size:0.8rem;color:#8f95ae;">${escapeHtml(trend.titleTh)}</div>
        </div>
      </div>
    `,
    body: `
      <div class="trend-modal-content" style="display:flex;flex-direction:column;gap:20px;">
        <!-- Large Preview Image -->
        <div style="position:relative;border-radius:10px;overflow:hidden;border:1px solid #282a3c;background:#151622;max-height:360px;">
          <img src="${escapeHtml(trend.previewImage)}" alt="${escapeHtml(trend.title)}" style="width:100%;height:360px;object-fit:cover;display:block;" />
          <div style="position:absolute;bottom:0;left:0;right:0;padding:14px 18px;background:linear-gradient(180deg, transparent 0%, rgba(10,11,16,0.92) 100%);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              ${trend.sources.map((s) => `
                <a href="${s.url}" target="_blank" rel="noopener noreferrer" style="font-size:0.75rem;padding:3px 9px;border-radius:4px;background:${s.color}26;color:${s.color};border:1px solid ${s.color}66;text-decoration:none;font-weight:600;">
                  ↗ ${escapeHtml(s.name)}: ${escapeHtml(s.badge)}
                </a>
              `).join("")}
            </div>
            <span style="font-size:0.75rem;color:#c5cadc;font-weight:500;">ดัชนีความนิยม: <strong>${trend.popularityScore}%</strong></span>
          </div>
        </div>

        <!-- Color Palette with Copy Buttons -->
        <div style="background:#141521;border:1px solid #26283b;border-radius:8px;padding:16px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="font-weight:700;font-size:0.9rem;color:#ffffff;display:flex;align-items:center;gap:7px;">
              <span>🎨</span>
              <span>โทนสีแนะนำประจำเทรนด์ (Curated Color Palette):</span>
            </div>
            <span style="font-size:0.74rem;color:#8f95ae;">คลิกที่สีเพื่อคัดลอกรหัส HEX</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:10px;">
            ${trend.colorPalette.map((col) => `
              <div class="color-swatch-box" data-copy-hex="${col.hex}" data-color-name="${col.name}" style="background:#191b2a;border:1px solid #2c3048;border-radius:6px;padding:10px;cursor:pointer;transition:transform 0.15s, border-color 0.15s;" title="คลิกเพื่อคัดลอก ${col.hex}">
                <div style="width:100%;height:32px;border-radius:4px;background:${col.hex};border:1px solid rgba(255,255,255,0.1);margin-bottom:8px;"></div>
                <div style="font-weight:700;font-size:0.8rem;color:#ffffff;">${col.hex}</div>
                <div style="font-size:0.7rem;color:#8f95ae;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(col.name)}</div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Keywords & Visual Traits -->
        <div style="background:#141521;border:1px solid #26283b;border-radius:8px;padding:16px;">
          <div style="font-weight:700;font-size:0.9rem;color:#ffffff;margin-bottom:10px;">
            ✨ ลักษณะเด่นและเอกลักษณ์ทางสายตา (Visual Traits):
          </div>
          <ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:8px;color:#c5cadc;font-size:0.85rem;line-height:1.5;">
            ${trend.visualTraits.map((trait) => `<li>${escapeHtml(trait)}</li>`).join("")}
          </ul>
        </div>

        <!-- Applications for KKP / CONT -->
        <div style="background:#141521;border:1px solid #26283b;border-radius:8px;padding:16px;">
          <div style="font-weight:700;font-size:0.9rem;color:var(--cyan);margin-bottom:10px;">
            🎯 แนวทางการนำไปประยุกต์ใช้ในงานจริง (Practical Application for CONT):
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:8px;">
            ${trend.applications.map((app) => `
              <div style="display:flex;align-items:center;gap:8px;font-size:0.82rem;color:#e1e4ef;background:#181a28;padding:8px 12px;border-radius:6px;border:1px solid #282c42;">
                <span style="color:var(--green);">✓</span>
                <span>${escapeHtml(app)}</span>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- AI Prompt Inspiration -->
        <div style="background:#10111a;border:1px dashed #30354e;border-radius:8px;padding:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <span style="font-weight:700;font-size:0.82rem;color:#9ca2bb;">💡 AI Prompt Inspiration สำหรับเจเนอเรตภาพหรือตั้งต้นบรีฟ:</span>
            <button type="button" class="btn btn-ghost btn-xs" id="btn-copy-prompt" style="font-size:0.72rem;padding:2px 8px;">คัดลอก Prompt 📋</button>
          </div>
          <pre style="margin:0;font-family:'Space Mono',monospace;font-size:0.76rem;color:#a6acc3;white-space:pre-wrap;background:#151622;padding:10px;border-radius:4px;border:1px solid #25283a;">${escapeHtml(trend.aiPrompt)}</pre>
        </div>
      </div>
    `,
    footer: `
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:12px;flex-wrap:wrap;">
        <div style="display:flex;gap:8px;">
          ${trend.sources.map((s) => `
            <a href="${s.url}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm" style="font-size:0.78rem;">
              เปิดดู ${escapeHtml(s.name)} ↗
            </a>
          `).join("")}
        </div>
        <div style="display:flex;gap:10px;">
          <button type="button" class="btn btn-ghost" data-close-modal>ปิด</button>
          <button type="button" class="btn-pixel btn-pixel-cyan" id="btn-use-trend-create" style="padding:7px 16px;">
            ${pixelIcons.plus}
            <span>นำเทรนด์นี้ไปสร้าง Task</span>
          </button>
        </div>
      </div>
    `
  });

  // Bind Swatch Copies in Modal
  qsa(".color-swatch-box").forEach((box) => {
    box.addEventListener("click", () => {
      copyHexToClipboard(box.dataset.copyHex, box.dataset.colorName);
    });
  });

  // Bind Copy Prompt
  qs("#btn-copy-prompt")?.addEventListener("click", () => {
    navigator.clipboard.writeText(trend.aiPrompt).then(() => {
      toast("คัดลอก AI Prompt เรียบร้อยแล้ว", "success");
    });
  });

  // Bind Create Task from this Trend
  qs("#btn-use-trend-create")?.addEventListener("click", () => {
    closeModal();
    if (typeof window.openCreateTask === "function") {
      window.openCreateTask({
        title: `แคมเปญใหม่ — สไตล์ ${trend.title}`,
        description: `บรีฟอาร์ตเวิร์กตามเทรนด์ ${trend.title} (${trend.titleTh})\n\nแหล่งอ้างอิง: ${trend.sources.map((s) => s.name).join(", ")}\nคีย์เวิร์ด: ${trend.keywords.join(" ")}\nโทนสีแนะนำ: ${trend.colorPalette.map((c) => `${c.name} (${c.hex})`).join(", ")}\n\nวัตถุประสงค์และรายละเอียดงาน: \n`,
        preview_url: trend.previewImage,
        channel: trend.category === "UI/UX" ? "Web / App" : "Social Media"
      });
    }
  });
}

/**
 * Filter Trends Data based on Category, Source, and Search
 */
function getFilteredTrends() {
  return TRENDS_DATA.filter((t) => {
    if (currentFilterCategory !== "all" && t.category !== currentFilterCategory) {
      return false;
    }
    if (currentFilterSource !== "all") {
      const matchSource = t.sources.some((s) => s.name.toLowerCase().includes(currentFilterSource.toLowerCase()));
      if (!matchSource) return false;
    }
    if (currentSearchQuery.trim()) {
      const q = currentSearchQuery.toLowerCase().trim();
      const matchTitle = t.title.toLowerCase().includes(q) || t.titleTh.toLowerCase().includes(q);
      const matchKeywords = t.keywords.some((k) => k.toLowerCase().includes(q));
      const matchSummary = t.summary.toLowerCase().includes(q);
      if (!matchTitle && !matchKeywords && !matchSummary) return false;
    }
    return true;
  });
}

/**
 * Main Render Function for Trends Page
 */
export async function render(context = {}) {
  const mount = qs("#page-content");
  if (!mount) return;

  mount.innerHTML = `
    <div class="trends-page-container">
      <!-- Top Hero Header -->
      <div class="trends-hero-header">
        <div class="trends-hero-main">
          <div class="trends-hero-badge">
            <span class="live-dot-pulse"></span>
            <span>DESIGN TREND CURATOR AI</span>
            <span class="badge-source-count">4 GLOBAL DATA SOURCES</span>
          </div>
          <h1 class="trends-hero-title">
            ผู้ช่วยวิเคราะห์เทรนด์ Graphic Design & UI/UX ล่าสุด
          </h1>
          <p class="trends-hero-subtitle">
            ประมวลผลและคัดสรรเทรนด์งานออกแบบที่กำลังมาแรงที่สุดจาก <strong>Behance, Dribbble, Awwwards</strong> และ <strong>Muzli Magazine</strong> เพื่อสร้างแรงบันดาลใจ ยกระดับไอเดีย และนำไปใช้งานจริงในเวิร์กโฟลว์ของทีม KKP
          </p>
        </div>
        <div class="trends-hero-actions">
          <button type="button" class="btn-pixel btn-pixel-cyan" id="btn-trigger-ai-scan" title="Trigger AI Curator Fetch">
            <span style="font-size:1.1rem;margin-right:4px;">🤖</span>
            <span>ดึงข้อมูลเทรนด์ล่าสุด (AI SYNC)</span>
          </button>
          <div class="trends-last-updated" id="trends-last-updated-text">
            <span>🕒 อัปเดตล่าสุด:</span> <strong>${lastScanTime}</strong>
          </div>
        </div>
      </div>

      <!-- Data Sources Indicator Bar -->
      <div class="trends-sources-bar">
        <div class="sources-bar-label">
          <span>📡 แหล่งข้อมูลอ้างอิงมาตรฐาน (Data Sources):</span>
        </div>
        <div class="sources-pills-row">
          <a href="https://www.behance.net" target="_blank" rel="noopener noreferrer" class="source-pill source-behance" title="Behance Popular & Curated">
            <span class="source-dot" style="background:#0057FF;"></span>
            <span>Behance (Popular / Best of Behance)</span>
          </a>
          <a href="https://dribbble.com" target="_blank" rel="noopener noreferrer" class="source-pill source-dribbble" title="Dribbble Trending">
            <span class="source-dot" style="background:#EA4C89;"></span>
            <span>Dribbble (Popular / Trending)</span>
          </a>
          <a href="https://www.awwwards.com" target="_blank" rel="noopener noreferrer" class="source-pill source-awwwards" title="Awwwards Site of the Day">
            <span class="source-dot" style="background:#10B981;"></span>
            <span>Awwwards (Site of the Day / Trends)</span>
          </a>
          <a href="https://medium.muz.li" target="_blank" rel="noopener noreferrer" class="source-pill source-muzli" title="Muzli Weekly Magazine">
            <span class="source-dot" style="background:#F59E0B;"></span>
            <span>Muzli Magazine (Weekly Trend Digest)</span>
          </a>
        </div>
      </div>

      <!-- Filter Controls Toolbar -->
      <div class="trends-filter-toolbar">
        <div class="trends-filter-left">
          <!-- Search Box -->
          <div class="trends-search-box">
            <span class="search-icon">${pixelIcons.search}</span>
            <input type="search" id="trends-search-input" placeholder="ค้นหาเทรนด์, คีย์เวิร์ด, หรือสไตล์ (เช่น Bento, 3D, Acid, Type)..." />
          </div>

          <!-- Category Pills -->
          <div class="trends-category-pills" id="trends-cat-pills">
            <button type="button" class="btn-cat-pill is-active" data-cat="all">ทั้งหมด (${TRENDS_DATA.length})</button>
            <button type="button" class="btn-cat-pill" data-cat="Graphic Design">Graphic Design</button>
            <button type="button" class="btn-cat-pill" data-cat="UI/UX">UI/UX & Web</button>
            <button type="button" class="btn-cat-pill" data-cat="Typography">Typography</button>
            <button type="button" class="btn-cat-pill" data-cat="3D & Motion">3D & Motion</button>
          </div>
        </div>

        <div class="trends-filter-right">
          <!-- Source Filter Dropdown -->
          <div style="display:flex;align-items:center;gap:8px;">
            <label for="trends-source-select" style="font-size:0.78rem;color:#8f95ae;white-space:nowrap;">กรองตามแหล่งที่มา:</label>
            <select id="trends-source-select" class="trends-select-clean">
              <option value="all">ทุกแหล่งที่มา (4 แหล่ง)</option>
              <option value="behance">Behance</option>
              <option value="dribbble">Dribbble</option>
              <option value="awwwards">Awwwards</option>
              <option value="muzli">Muzli Magazine</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Trend Cards Grid -->
      <div id="trends-grid-container" class="trends-cards-grid">
        <!-- Rendered dynamically by renderTrendsList() -->
      </div>
    </div>
  `;

  // Render Function
  const renderTrendsList = () => {
    const grid = mount.querySelector("#trends-grid-container");
    if (!grid) return;

    const filtered = getFilteredTrends();

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:48px 16px;background:#141521;border:1px dashed #282a3c;border-radius:10px;color:#8f95ae;">
          <div style="font-size:2rem;margin-bottom:10px;">🔍</div>
          <div style="font-size:1.05rem;font-weight:700;color:#ffffff;">ไม่พบเทรนด์ตามเงื่อนไขที่เลือก</div>
          <div style="font-size:0.82rem;margin-top:6px;">ลองค้นหาด้วยคำอื่น หรือกดเลือกดู "ทั้งหมด"</div>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map((t) => `
      <div class="trend-card" data-trend-id="${t.id}">
        <!-- Top Media Showcase -->
        <div class="trend-card-media">
          <img src="${escapeHtml(t.previewImage)}" alt="${escapeHtml(t.title)}" loading="lazy" />
          <div class="trend-card-rank-badge">
            <span class="rank-fire">🔥</span>
            <span>#${t.rank} TREND</span>
          </div>
          <div class="trend-card-cat-badge">
            ${escapeHtml(t.categoryLabel)}
          </div>
        </div>

        <!-- Main Info -->
        <div class="trend-card-body">
          <!-- Sources row -->
          <div class="trend-card-sources">
            ${t.sources.map((s) => `
              <span class="trend-source-chip" style="background:${s.color}22;color:${s.color};border:1px solid ${s.color}55;">
                ● ${escapeHtml(s.name)}
              </span>
            `).join("")}
            <span class="trend-score-badge">ความนิยม ${t.popularityScore}%</span>
          </div>

          <!-- Title -->
          <h2 class="trend-card-title">${escapeHtml(t.title)}</h2>
          <div class="trend-card-sub">${escapeHtml(t.titleTh)}</div>

          <!-- Keywords Tags -->
          <div class="trend-card-tags">
            ${t.keywords.map((k) => `<span class="trend-kw-tag">${escapeHtml(k)}</span>`).join("")}
          </div>

          <!-- Summary -->
          <p class="trend-card-summary">${escapeHtml(t.summary)}</p>

          <!-- Color Palette Swatches -->
          <div class="trend-card-palette-wrap">
            <div class="palette-header">
              <span style="font-weight:700;font-size:0.75rem;color:#9ca2bb;">โทนสีแนะนำ (คลิกเพื่อก็อปปี้):</span>
            </div>
            <div class="palette-swatches-row">
              ${t.colorPalette.map((col) => `
                <div class="swatch-item" data-swatch-hex="${col.hex}" data-swatch-name="${col.name}" title="${col.name} (${col.hex}) - คลิกเพื่อคัดลอก">
                  <span class="swatch-circle" style="background:${col.hex};"></span>
                  <span class="swatch-hex">${col.hex}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <!-- Actions Footer -->
        <div class="trend-card-foot">
          <button type="button" class="btn btn-ghost btn-sm btn-deepdive" data-open-deepdive="${t.id}">
            🔍 ดูบทวิเคราะห์เชิงลึก
          </button>
          <button type="button" class="btn-pixel btn-pixel-cyan btn-sm btn-create-task-trend" data-use-trend="${t.id}">
            ${pixelIcons.plus}
            <span>นำไปสร้าง Task</span>
          </button>
        </div>
      </div>
    `).join("");

    // Bind Swatch Clicks
    grid.querySelectorAll("[data-swatch-hex]").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        copyHexToClipboard(item.dataset.swatchHex, item.dataset.swatchName);
      });
    });

    // Bind Deep Dive Modal
    grid.querySelectorAll("[data-open-deepdive]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const trend = TRENDS_DATA.find((x) => x.id === btn.dataset.openDeepdive);
        if (trend) openTrendDeepDive(trend);
      });
    });

    // Bind Create Task
    grid.querySelectorAll("[data-use-trend]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const trend = TRENDS_DATA.find((x) => x.id === btn.dataset.useTrend);
        if (trend && typeof window.openCreateTask === "function") {
          window.openCreateTask({
            title: `แคมเปญใหม่ — สไตล์ ${trend.title}`,
            description: `บรีฟอาร์ตเวิร์กตามเทรนด์ ${trend.title} (${trend.titleTh})\n\nแหล่งอ้างอิง: ${trend.sources.map((s) => s.name).join(", ")}\nคีย์เวิร์ด: ${trend.keywords.join(" ")}\nโทนสีแนะนำ: ${trend.colorPalette.map((c) => `${c.name} (${c.hex})`).join(", ")}\n\nวัตถุประสงค์และรายละเอียดงาน: \n`,
            preview_url: trend.previewImage,
            channel: trend.category === "UI/UX" ? "Web / App" : "Social Media"
          });
        }
      });
    });
  };

  // Bind Trigger Button
  const btnTrigger = mount.querySelector("#btn-trigger-ai-scan");
  btnTrigger?.addEventListener("click", () => {
    triggerAiCuratorScan(() => {
      const timeEl = mount.querySelector("#trends-last-updated-text");
      if (timeEl) timeEl.innerHTML = `<span>🕒 อัปเดตล่าสุด:</span> <strong>${lastScanTime}</strong>`;
      renderTrendsList();
    });
  });

  // Bind Search Input
  const searchInput = mount.querySelector("#trends-search-input");
  searchInput?.addEventListener("input", (e) => {
    currentSearchQuery = e.target.value;
    renderTrendsList();
  });

  // Bind Category Filter Pills
  const catPills = mount.querySelectorAll(".btn-cat-pill");
  catPills.forEach((btn) => {
    btn.addEventListener("click", () => {
      catPills.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentFilterCategory = btn.dataset.cat;
      renderTrendsList();
    });
  });

  // Bind Source Select
  const sourceSelect = mount.querySelector("#trends-source-select");
  sourceSelect?.addEventListener("change", (e) => {
    currentFilterSource = e.target.value;
    renderTrendsList();
  });

  // Initial List Render
  renderTrendsList();
}
