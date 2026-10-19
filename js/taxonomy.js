import { qs, qsa, toast, openModal, closeModal } from "./app.js";
import { escapeHtml } from "./formatters.js";
import { pixelIcons } from "./pixel-icons.js";

/* ─────────────────────────────────────────────────────────────────────────
   TAXONOMY OF VISUALS DATABASE (Jason Murray Design Principles Framework)
   Level 1: Objective (Pillar) -> Level 2: Cognitive Mechanism -> Level 3: Application
───────────────────────────────────────────────────────────────────────── */
export const TAXONOMY_PILLARS = {
  differentiate: {
    id: "differentiate",
    name: "Differentiate",
    nameTh: "สร้างจุดเด่น & แยกความแตกต่าง",
    color: "#ffc61a",
    bg: "rgba(255, 198, 26, 0.12)",
    border: "rgba(255, 198, 26, 0.35)",
    icon: "⚡",
    desc: "สั่งให้สมองตรวจจับวัตถุเป้าหมายทันทีด้วยการทำลายความสม่ำเสมอของภาพ (Breaking Visual Patterns)"
  },
  organize: {
    id: "organize",
    name: "Organize (Gestalt)",
    nameTh: "จัดระเบียบข้อมูลตามจิตวิทยา Gestalt",
    color: "#19c3eb",
    bg: "rgba(25, 195, 235, 0.12)",
    border: "rgba(25, 195, 235, 0.35)",
    icon: "🧩",
    desc: "ช่วยให้สมองผู้ชมประมวลผลข้อมูลปริมาณมากได้อย่างรวดเร็ว โดยไม่รู้สึกอึดอัดหรือสับสน"
  },
  direct: {
    id: "direct",
    name: "Direct (Hierarchy)",
    nameTh: "ควบคุมลำดับการอ่าน (Visual Hierarchy)",
    color: "#2bd14b",
    bg: "rgba(43, 209, 75, 0.12)",
    border: "rgba(43, 209, 75, 0.35)",
    icon: "👁️",
    desc: "นำทางสายตาของผู้ชมให้เห็นหัวข้อหลักก่อน แล้วค่อยเคลื่อนต่อไปยังรายละเอียดและ Call-to-Action"
  },
  infer: {
    id: "infer",
    name: "Infer (Metaphor)",
    nameTh: "สื่อความหมายเชิงลึก & บริบททางภาพ",
    color: "#8b4dff",
    bg: "rgba(139, 77, 255, 0.12)",
    border: "rgba(139, 77, 255, 0.35)",
    icon: "💡",
    desc: "ทำให้ภาพมีความหมายลึกซึ้ง (Storytelling) ผ่านการเปรียบเทียบเชิงอุปมา หรือการหยิบยืมวัฒนธรรม"
  }
};

export const TAXONOMY_PRINCIPLES = [
  /* ── 1. DIFFERENTIATE ── */
  {
    id: "diff-color-contrast",
    pillar: "differentiate",
    tier: "Feature Disruption",
    title: "Chromatic Contrast & Accent Isolation",
    titleTh: "การสร้างจุดเด่นด้วยสีคู่ตรงข้าม & จุดเน้นเดี่ยว",
    summary: "ใช้สีสดเพียง 10% ตัดกับฉากหลังสีโทนกลาง (Monochrome/Dark) เพื่อสั่งให้สายตาพุ่งตรงไปที่สินค้าทันที",
    psychology: "สมองมนุษย์มีระบบคัดกรองสัญญาณฉับพลัน (Preattentive Processing) โดยสมองจะตรวจจับความผิดปกติของค่าสี (Hue & Saturation) ได้ภายใน 13 มิลลิวินาที ก่อนที่เราจะรู้ตัวว่ากำลังมองอะไร",
    howItWorks: "ใช้กฎสี 60-30-10 โดย 60% เป็นสีฉากหลังหลัก, 30% เป็นโครงสร้างรอง, และ 10% คือสี Accent ที่ห้ามใช้ซ้ำที่อื่นเพื่อสงวนพลังการดึงดูดสายตา",
    bestFor: ["Key Visual แคมเปญ", "ปุ่ม Call-to-Action (CTA)", "แบนเนอร์ลดราคา Flash Sale", "ปกอัลบั้ม / โปสเตอร์อีเวนต์"],
    doList: [
      "ใช้สีสด 1 สีที่เป็นสัญลักษณ์ของบรีฟ (เช่น เหลืองตัดดำ หรือ ส้มตัดน้ำเงินเข้ม)",
      "เว้นระยะรอบจุดเน้นไม่ให้มีองค์ประกอบอื่นมาเบียดแย่งความเด่น"
    ],
    dontList: [
      "อย่าสาดสีสดเต็มพื้นที่จนไม่มีที่พักสายตา ทำให้กลายเป็นงานที่ 'ตะโกนใส่คนดู'",
      "หลีกเลี่ยงการใช้สีที่มีค่าความสว่าง (Value) เท่ากัน เพราะตาจะมองไม่ออกเมื่อแสดงผลบนจอมือถือ"
    ],
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80",
    exampleAnalysis: "แคมเปญ Cyber Neon ที่ใช้ฉากหลังสีดำสนิท 90% และมีวัตถุสีเหลืองนีออนเปล่งแสงเด่นออกมาเพียงจุดเดียว ทำให้ผู้ชมจดจำสินค้าได้ในพริบตา",
    aiPrompt: "Minimalist graphic poster, monochromatic dark charcoal background, a single glowing vibrant acid yellow geometric orb in the center, high contrast, striking visual impact, Swiss design influence, editorial style, 8k"
  },
  {
    id: "diff-scale-discrepancy",
    pillar: "differentiate",
    tier: "Feature Disruption",
    title: "Scale Discrepancy & Hyperbolic Ratio",
    titleTh: "ความต่างของสเกลขนาดแบบสุดขั้ว",
    summary: "ขยายวัตถุชิ้นหนึ่งให้ใหญ่ยักษ์ หรือย่อวัตถุให้จิ๋วผิดปกติ เพื่อสร้างความตื่นเต้นทางสายตาและหยุดการเลื่อนฟีด",
    psychology: "สมองคาดหวังว่าสิ่งของในโลกแห่งความเป็นจริงต้องมีขนาดสมส่วน เมื่อพบวัตถุที่ขนาดผิดเพี้ยนไปจากความเคยชิน ระบบประสาทจะตื่นตัวและตั้งคำถามว่า 'ทำไมสิ่งนี้ถึงใหญ่ขนาดนี้'",
    howItWorks: "สร้างอัตราส่วนขนาด (Scale Ratio) ระหว่างวัตถุหลักกับวัตถุรองอย่างน้อย 3:1 ขึ้นไป หลีกเลี่ยงความต่างเพียง 1.2:1 ซึ่งดูเหมือนความผิดพลาดมากกว่าความตั้งใจ",
    bestFor: ["บิลบอร์ดริมถนน", "Key Visual โฆษณาเปิดตัวสินค้าใหม่", "โปสเตอร์ภาพยนตร์", "หน้าปก Magazine"],
    doList: [
      "จับคู่วัตถุขนาดมโหฬารกับมนุษย์ตัวเล็กๆ เพื่อเป็นตัวเปรียบเทียบมาตรวัด (Human Scale Reference)",
      "ปล่อยให้ขอบของวัตถุขยายล้นทะลุขอบเฟรม (Bleed out of frame)"
    ],
    dontList: [
      "อย่าขยายทุกองค์ประกอบให้ใหญ่เท่ากันหมด เพราะจะทำให้สูญเสียสเกลเปรียบเทียบ",
      "ระวังตัวอักษรจมเมื่อวางทับบนวัตถุขนาดใหญ่"
    ],
    image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80",
    exampleAnalysis: "งานบิลบอร์ดขนาดยักษ์ที่แสดงสินค้ากระป๋องกาแฟขนาดยักษ์สูงเทียมตึก ตัดกับคนเดินถนนขนาดจิ๋ว สร้างความรู้สึกว่าสินค้าให้พลังงานมหาศาล",
    aiPrompt: "Surreal graphic design advertisement, a colossal giant vintage perfume bottle towering over miniature city buildings, miniature people walking below, sharp dramatic shadows, hyper-realistic scale discrepancy, editorial art, 8k"
  },
  {
    id: "diff-semantic-contrast",
    pillar: "differentiate",
    tier: "Semantic Tension",
    title: "Semantic Juxtaposition & Irony",
    titleTh: "ความหมายที่ขัดแย้งเชิงตรรกะ (Juxtaposition)",
    summary: "นำวัตถุสองสิ่งที่มีความหมายตรงกันข้าม หรือไม่ควรอยู่ด้วยกัน มาผสมผสานในภาพเดียวเพื่อกระตุ้นความคิดลึกซึ้ง",
    psychology: "ทฤษฎีความไม่ลงรอยกันทางปัญญา (Cognitive Dissonance) มนุษย์จะพยายามหาเหตุผลเชื่อมโยงเมื่อเห็นสองสิ่งที่ขัดแย้งกัน ส่งผลให้ผู้ชมจดจำแบรนด์ได้นานกว่าภาพสินค้าตรงๆ ถึง 4 เท่า",
    howItWorks: "เลือก Idea A (ปัญหา / สภาพเดิม) + Idea B (วิธีแก้ / ผลลัพธ์ที่ต้องการ) แล้วสร้าง Hybrid Object ชิ้นเดียวที่รวมทั้งสองความหมาย",
    bestFor: ["โฆษณาเชิงรณรงค์ (Public Awareness)", "แคมเปญแบรนด์ชั้นนำ", "ภาพประกอบบทความเชิงวิเคราะห์", "หน้าปกนิตยสาร"],
    doList: [
      "ใช้การผสมผสานรูปทรงที่แนบเนียน เช่น ไอศกรีมที่ละลายเป็นรูปโลก หรือหลอดไฟที่เป็นรูปสมอง",
      "มีข้อความ Headline สั้นๆ ที่ช่วยเสริมมุมมองตลกร้ายหรือข้อคิด"
    ],
    dontList: [
      "อย่าใส่สัญลักษณ์ที่ซับซ้อนเกินไปจนคนดูต้องถอดรหัสหลายชั้น",
      "ระวังความหมายสองแง่สองง่ามที่อาจส่งผลลบต่อความน่าเชื่อถือของแบรนด์"
    ],
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    exampleAnalysis: "โฆษณารถยนต์พลังงานสะอาดที่แสดงปล่องควันโรงงานที่มีดอกไม้สีขาวงอกออกมาแทนควันดำ สื่อสารเรื่องความยั่งยืนได้โดยไม่ต้องเขียนคำอธิบายยาว",
    aiPrompt: "Clever surreal advertising visual, conceptual juxtaposition, an hourglass with ocean water and marine life on top slowly turning into plastic bottles below, clean white gallery background, thought-provoking, museum quality photograph"
  },

  /* ── 2. ORGANIZE (GESTALT) ── */
  {
    id: "org-gestalt-proximity",
    pillar: "organize",
    tier: "Gestalt Law",
    title: "Law of Proximity & Spatial Chunking",
    titleTh: "กฎความชิดใกล้ & การรวมก้อนข้อมูล (Proximity)",
    summary: "ระยะห่างที่ใกล้กันทำให้สมองสรุปว่าเป็นข้อมูลชุดเดียวกัน ช่วยจัดระเบียบใบปลิว เมนู และหน้าจอ UI ที่มีข้อมูลแน่น",
    psychology: "สมองมนุษย์พยายามประหยัดพลังงานในการประมวลผล (Cognitive Load Reduction) หากข้อมูลถูกจัดเป็นกลุ่มก้อน (Chunking) สมองจะอ่านทีละกลุ่มแทนที่จะอ่านข้อมูลกระจัดกระจาย",
    howItWorks: "เว้นระยะห่างภายในกลุ่ม (Internal Margin) ให้น้อยกว่าระยะห่างระหว่างกลุ่ม (External Margin) อย่างน้อย 2.5 เท่า เช่น ข้อมูลสินค้า A อยู่ห่างกัน 8px แต่อยู่ห่างจากสินค้า B 24px",
    bestFor: ["ตารางโปรโมชัน / โบรชัวร์สินค้า", "การ์ดแสดงผลบน Web & App UI", "การจัดหมวดหมู่งานพิมพ์", "Infographic สถิติ"],
    doList: [
      "รวมหัวข้อ + คำอธิบาย + ปุ่ม ให้เกาะกลุ่มกันชัดเจน",
      "ใช้พื้นที่ว่างสีขาว (Negative Space) เป็นตัวแบ่งกลุ่มแทนการตีเส้นขอบลายตา"
    ],
    dontList: [
      "อย่าวางระยะห่างของทุกสิ่งเท่ากันหมด (Uniform Spacing) เพราะคนดูจะไม่รู้ว่าข้อความนี้เป็นของรูปไหน",
      "อย่าวางคำอธิบายภาพ (Caption) ห่างจากรูปภาพจนดูเหมือนเป็นของอีกรูป"
    ],
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
    exampleAnalysis: "หน้าเมนูร้านอาหารระดับพรีเมียมที่จัดชื่อเมนู คำอธิบาย และราคาชิดกันเป็นกลุ่มๆ ทำให้ลูกค้ากวาดตาดูอาหารได้สบายตา ไม่สับสนเรื่องราคา",
    aiPrompt: "Clean Swiss minimalist layout brochure, structured spatial chunking, typography grouped by law of proximity, generous white margins, sophisticated editorial aesthetic, high resolution graphic design"
  },
  {
    id: "org-gestalt-enclosure",
    pillar: "organize",
    tier: "Gestalt Law",
    title: "Common Region & Enclosure Framing",
    titleTh: "การตีกรอบพื้นที่ร่วม (Common Region)",
    summary: "การใส่กล่อง แถบสีพื้นหลัง หรือกรอบเส้นรอบองค์ประกอบ เพื่อแยกโซนความสำคัญหรือระบุสถานะพิเศษ",
    psychology: "กฎ Common Region ของ Palmer (1992) พิสูจน์ว่าเมื่อองค์ประกอบอยู่ภายในขอบเขตเดียวกัน สมองจะมองเห็นความสัมพันธ์ของมันเหนือกว่ากฎความใกล้ชิด (Proximity) หรือความเหมือน (Similarity)",
    howItWorks: "ใช้กล่องการ์ดสีพื้นหลังที่สว่างหรือมืดกว่าพื้นหลังหลัก 5-10% หรือใช้เส้นขอบบางๆ เพื่อสร้าง 'เกาะข้อมูล' ให้คนดูเข้าใจทันทีว่านี่คือข้อเสนอพิเศษ",
    bestFor: ["การ์ดราคาแพ็กเกจ (Pricing Tier Card)", "กรอบ Highlight สิทธิพิเศษ", "Pop-up Notification", "Banner คูปองส่วนลด"],
    doList: [
      "ใช้ตีกรอบแพ็กเกจที่ต้องการ 'เชียร์ขายมากที่สุด' (Best Seller Card) ให้เด่นกว่าแพ็กเกจอื่น",
      "รักษาระยะ Padding ภายในกล่องให้เท่ากันรอบด้านอย่างสม่ำเสมอ"
    ],
    dontList: [
      "อย่าตีกรอบทุกสิ่งทุกอย่างในหน้าเดียว เพราะจะทำให้ดีไซน์ดูแข็งทื่อเหมือนตารางเอ็กเซลโบราณ",
      "ระวังเส้นขอบที่หนาและดำทึบเกินไปจนแย่งความเด่นของเนื้อหาข้างใน"
    ],
    image: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=800&q=80",
    exampleAnalysis: "หน้ารวมแพ็กเกจราคาซอฟต์แวร์ที่มี 3 ตัวเลือก โดยตัวเลือกตรงกลางใส่กรอบสีทองพร้อมพื้นหลังการ์ดที่สว่างกว่า ทำให้ลูกค้ารู้ทันทีว่าเป็นแพ็กเกจยอดนิยม",
    aiPrompt: "Modern UI pricing card layout, common region design principle, centered highlighted card with subtle glow border, sleek dark mode aesthetics, clean typography, professional product showcase"
  },
  {
    id: "org-gestalt-similarity",
    pillar: "organize",
    tier: "Gestalt Law",
    title: "Law of Similarity & Rhythmic Cohesion",
    titleTh: "กฎความเหมือน & ความเป็นเอกภาพ (Similarity)",
    summary: "การใช้องค์ประกอบทางภาพที่มีรูปทรง สี ขนาด หรือฟอนต์แบบเดียวกัน เพื่อสร้างความคุ้นเคยและความเป็นระบบระเบียบ",
    psychology: "สมองมนุษย์จะจับคู่สิ่งของที่หน้าตาเหมือนกันโดยอัตโนมัติ เพื่อสร้างกฎเกณฑ์การเข้าใจแบบไม่ต้องคิดซ้ำ (Systematic Processing)",
    howItWorks: "กำหนด Style Guide ของไอคอน, รูปทรงปุ่ม, และประเภทหัวข้อ ให้มีสเปกตายตัว เช่น ไอคอนทุกตัวต้องเป็นเส้นขอบ 2px มุมโค้งมน และใช้สีเดียวกันทั้งหมด",
    bestFor: ["ชุดไอคอนแสดงจุดเด่นบริการ", "ตารางเปรียบเทียบฟีเจอร์", "การออกแบบระบบแบรนด์ (CI System)", "แคตตาล็อกสินค้า"],
    doList: [
      "ทำให้สิ่งที่มีหน้าที่เดียวกัน (เช่น ปุ่มกดยืนยัน) มีหน้าตาเหมือนกันเสมอในทุกหน้างาน",
      "เมื่อต้องการสร้างจุดเด่น ให้ทำลายความเหมือนของชิ้นนั้นเพียงชิ้นเดียว (Anomaly in Pattern)"
    ],
    dontList: [
      "อย่าใช้ไอคอนหลายสไตล์ปนกัน (เช่น ไอคอนเส้น ผสม ไอคอนทึบ ผสม ไอคอน 3D สีสด)",
      "อย่าเปลี่ยนสีปุ่มไปเรื่อยๆ จนผู้ใช้สับสนว่าปุ่มไหนกดได้หรือไม่ได้"
    ],
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    exampleAnalysis: "แบนเนอร์บริการการเงิน 4 จุดเด่น ที่ใช้ไอคอนทรงลูกบาศก์สีฟ้าขนาดเท่ากัน วางในตำแหน่งเดียวกันใน 4 คอลัมน์ ทำให้ดูน่าเชื่อถือและเป็นมืออาชีพ",
    aiPrompt: "Unified brand design system, modular icon set, geometric consistency, law of similarity, sleek modern corporate aesthetics, minimal navy and cyan palette, premium presentation slide"
  },

  /* ── 3. DIRECT (VISUAL HIERARCHY) ── */
  {
    id: "dir-focal-point",
    pillar: "direct",
    tier: "Visual Hierarchy",
    title: "Primary Focal Point & Cognitive Entry",
    titleTh: "จุดตกสายตาแรก (Primary Focal Point)",
    summary: "การกำหนดพระเอกของภาพให้มีเพียง 1 จุดชัดเจน เพื่อเป็นประตูบานแรกที่เปิดรับสายตาผู้ชมเข้าสู่งาน",
    psychology: "เมื่อมนุษย์เห็นภาพใดๆ ตาจะกวาดหาจุดที่มีคอนทราสต์หรือพลังดึงดูดสูงสุดก่อน หากไม่มีจุดเด่นเลย สมองจะสับสน (Visual Paralysis) และตัดสินใจเลื่อนผ่านภาพนั้นไป",
    howItWorks: "ใช้กฎ 'Squint Test' (หรี่ตาลงแล้วมองงาน) หากหรี่ตาแล้วไม่สามารถระบุได้ทันทีว่าอะไรคือจุดเด่นที่สุด แปลว่าภาพนั้นขาด Focal Point ที่แข็งแรง",
    bestFor: ["Key Visual แคมเปญโฆษณา", "ปกหนังสือ / ปกเพลง", "Hero Banner บนเว็บไซต์", "โปสเตอร์ภาพยนตร์"],
    doList: [
      "ทำให้แน่ใจว่าทั้งภาพมี 'พระเอก' เพียงชิ้นเดียวเสมอ และมี 'พระรอง' ช่วยเสริม",
      "วางพระเอกในตำแหน่งจุดตัด 9 ช่อง (Rule of Thirds) หรือกึ่งกลางภาพที่มั่นคง"
    ],
    dontList: [
      "อย่าพยายามทำให้โลโก้ สินค้า พรีเซนเตอร์ และโปรโมชัน 'เด่นเท่ากันทุกอย่าง' เพราะจะกลายเป็นไม่มีอะไรเด่นเลย",
      "อย่าวางองค์ประกอบแย่งสายตาไว้ใกล้ขอบภาพ เพราะจะพาตาผู้ชมหลุดออกจากงาน"
    ],
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80",
    exampleAnalysis: "โปสเตอร์แฟชั่นที่ใช้แสงสปอตไลต์ส่องตรงไปที่ดวงตาของนางแบบ โดยฉากหลังเบลอมืดสนิท ทำให้สายตาของผู้ชมตรึงอยู่ที่สายตานั้นทันที",
    aiPrompt: "Cinematic fashion key visual, powerful single focal point, dramatic rim lighting on the model, dark atmospheric background, golden ratio composition, rule of thirds, award-winning photography"
  },
  {
    id: "dir-reading-flow",
    pillar: "direct",
    tier: "Visual Hierarchy",
    title: "Z-Pattern & Gutenberg Reading Flow",
    titleTh: "เส้นทางนำสายตาแบบ Z-Pattern & ทิศทางการอ่าน",
    summary: "จัดวางข้อมูลตามธรรมชาติการกวาดสายตาของมนุษย์ (ซ้ายบน -> ขวาบน -> ซ้ายล่าง -> ขวาล่าง) เพื่อจบที่ Call-to-Action",
    psychology: "ในวัฒนธรรมที่อ่านหนังสือจากซ้ายไปขวา สมองจะเริ่มสำรวจมุมซ้ายบนเป็นจุดแรก จากนั้นกวาดไปทางขวา ทแยงลงมาซ้ายล่าง และจบลงที่ขวาล่างซึ่งเป็นจุดตัดสินใจ (Terminal Area)",
    howItWorks: "1. ซ้ายบน: โลโก้แบรนด์ | 2. ขวาบน: เมนูหรือสโลแกน | 3. กึ่งกลาง/ซ้ายล่าง: รูปภาพสินค้าและข้อเสนอ | 4. ขวาล่าง: ปุ่มสั่งซื้อ / เบอร์ติดต่อ / QR Code",
    bestFor: ["สื่อโฆษณาบน Facebook / Instagram", "แบนเนอร์โปรโมชัน", "ใบปลิวแจกงานอีเวนต์", "Landing Page หน้าแรก"],
    doList: [
      "วางปุ่มสั่งซื้อหรือ QR Code ไว้ที่มุมขวาล่าง หรือปลายทางของเส้นทางสายตาเสมอ",
      "ใช้สายตาหรือมือของพรีเซนเตอร์ชี้นำไปยังข้อความสำคัญ"
    ],
    dontList: [
      "อย่าวางปุ่มสำคัญไว้ที่มุมซ้ายบน เพราะคนดูยังไม่ได้รับข้อมูลสินค้าก่อนตัดสินใจ",
      "อย่าวางเส้นแบ่งแนวนอนหนาเตอะขวางกั้นทิศทางการเลื่อนลงของสายตา"
    ],
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    exampleAnalysis: "แอดโฆษณาโซเชียลที่เริ่มจากพาดหัวโดนใจมุมซ้ายบน รูปสินค้าเด่นตรงกลาง และจบด้วยปุ่ม 'รับสิทธิ์ตอนนี้' มุมขวาล่าง สร้างยอดคลิกทะลุเป้า",
    aiPrompt: "High-converting social media ad layout, flawless Z-pattern visual hierarchy, compelling headline top-left, hero product center, bold call to action button bottom-right, clean modern branding"
  },
  {
    id: "dir-typographic-scale",
    pillar: "direct",
    tier: "Visual Hierarchy",
    title: "Typographic Scale Hierarchy (3-Level Rule)",
    titleTh: "ลำดับชั้นตัวอักษร 3 ระดับ (Scale Hierarchy)",
    summary: "แบ่งข้อความออกเป็น Headline, Subheadline และ Body Text ด้วยขนาดที่ต่างกันอย่างน้อย 2 เท่าเพื่อการกวาดอ่านใน 3 วินาที",
    psychology: "มนุษย์จะไม่อ่านทุกคำในภาพโฆษณา แต่จะ 'สแกน' คำที่ตัวใหญ่ที่สุดก่อน ถ้าหัวข้อไม่น่าสนใจ สมองจะสั่งให้เลิกอ่านทันที",
    howItWorks: "ใช้มาตราส่วนดนตรี (Typographic Scale เช่น Major Third 1.25x หรือ Golden Ratio 1.618x): Headline 48pt / Subhead 24pt / Body 14pt พร้อมการใช้น้ำหนักฟอนต์ Bold คู่กับ Regular",
    bestFor: ["โปสเตอร์งานเสวนา", "Infographic สรุปข้อมูล", "สไลด์พรีเซนเทชันขององค์กร", "ภาพแชร์บทความบนโซเชียล"],
    doList: [
      "พาดหัวต้องสั้น กระชับ และมีขนาดใหญ่กว่าข้อความย่อยอย่างชัดเจน",
      "เว้นระยะบรรทัด (Line Height) ของข้อความเนื้อหาให้อ่านง่าย (1.5 - 1.7 เท่าของขนาดฟอนต์)"
    ],
    dontList: [
      "อย่าใช้ฟอนต์ดิสเพลย์ลายตาในส่วนข้อความเนื้อหา (Body Text)",
      "อย่าใช้ขนาดฟอนต์ที่ใกล้เคียงกัน เช่น พาดหัว 20pt กับเนื้อหา 18pt เพราะดูเหมือนไม่ได้จัดลำดับชั้น"
    ],
    image: "https://images.unsplash.com/photo-1515260268569-9271009adfdb?auto=format&fit=crop&w=800&q=80",
    exampleAnalysis: "โปสเตอร์คอนเสิร์ตที่ใช้ชื่อศิลปินขนาดมหึมามองเห็นได้จากระยะ 10 เมตร วันที่และสถานที่ขนาดกลาง และรายละเอียดเงื่อนไขขนาดเล็กด้านล่าง",
    aiPrompt: "Editorial typographic poster, strict Swiss typographic scale, massive bold headline, medium subtitle, elegant body text, beautiful white space, red accent graphic, museum exhibition flyer"
  },

  /* ── 4. INFER (METAPHOR & STORYTELLING) ── */
  {
    id: "inf-contextual-metaphor",
    pillar: "infer",
    tier: "Conceptual Resonance",
    title: "Contextual Metaphor & Symbolic Transference",
    titleTh: "การเปรียบเทียบเชิงบริบท (Contextual Metaphor)",
    summary: "ยืมคุณสมบัติของสิ่งหนึ่งมาอธิบายอีกสิ่งหนึ่ง เพื่อให้ผู้ชมเข้าใจคุณประโยชน์ของสินค้าได้โดยไม่ต้องอ่านคำบรรยาย",
    psychology: "สมองมนุษย์เรียนรู้ผ่านการเปรียบเทียบเชิงเปรียบเปรย (Conceptual Metaphor Theory) เมื่อเห็นรูปภาพที่สื่อถึงความเร็ว เช่น เสือชีตาห์ สมองจะถ่ายทอดคุณสมบัติ 'ความเร็วฉับพลัน' ให้กับสินค้าชิ้นนั้นทันที",
    howItWorks: "วิเคราะห์คุณสมบัติหลักของสินค้า (Key Selling Point) เช่น 'กันน้ำ', 'เบาเหมือนขนนก', 'ทนทานเหมือนหินผา' แล้วนำสิ่งที่มีคุณสมบัตินั้นในธรรมชาติมาจัดวางร่วมกับสินค้า",
    bestFor: ["โฆษณาแคมเปญสร้างการรับรู้แบรนด์", "การเปิดตัวนวัตกรรมเทคโนโลยี", "ภาพพรีเมียมในแวดวงความงามและสุขภาพ", "ป้ายโฆษณารถยนต์"],
    doList: [
      "เลือกคู่เปรียบเทียบที่สากลและเข้าใจง่ายในวัฒนธรรมของกลุ่มเป้าหมาย",
      "เน้นความประณีตของงานรีทัชและการจัดแสงให้วัตถุทั้งสองกลมกลืนเป็นเนื้อเดียวกัน"
    ],
    dontList: [
      "อย่าเปรียบเทียบในทางลบหรือสิ่งที่ทำให้เกิดความรู้สึกน่าขยะแขยง",
      "อย่าใช้อุปมาที่ซ้ำซากจนกลายเป็นภาพจำเจ (Cliché) เช่น สมองมีฟันเฟือง หรือจับมือกันรอบโลก"
    ],
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    exampleAnalysis: "โฆษณาหูฟังตัดเสียงรบกวนที่แสดงภาพผู้ใช้กำลังฟังเพลงท่ามกลางฟองสบู่ใสที่ลอยอยู่กลางเมืองที่วุ่นวาย สื่อถึงความเงียบสงบส่วนตัวอย่างสมบูรณ์แบบ",
    aiPrompt: "Poetic conceptual advertising image, contextual metaphor, a sleek modern smartphone floating as weightless as a delicate white bird feather over calm water, ethereal studio lighting, 8k commercial photography"
  },
  {
    id: "inf-cultural-quotation",
    pillar: "infer",
    tier: "Conceptual Resonance",
    title: "Cultural Quotation & Genre Referencing",
    titleTh: "การหยิบยืมวัฒนธรรม & ยุคสมัย (Cultural Quotation)",
    summary: "ดึงเอาเอกลักษณ์ทางสายตาของยุคสมัย ศิลปะ หรือป๊อปคัลเจอร์ (เช่น Y2K, Bauhaus, 90s Grunge) มาใช้เพื่อสื่อสารกับกลุ่มเป้าหมายเฉพาะ",
    psychology: "ทฤษฎีความโหยหาอดีต (Nostalgia Effect) และความรู้สึกเป็นส่วนหนึ่งของกลุ่ม (Subculture Belonging) เมื่อผู้ชมเห็นองค์ประกอบที่ตรงกับความทรงจำหรือรสนิยมของตนเอง จะเกิดความผูกพันและเชื่อมั่นในแบรนด์ทันที",
    howItWorks: "ศึกษาประวัติศาสตร์ของสไตล์นั้นๆ อย่างถ่องแท้ (เช่น Y2K ต้องมี Liquid Chrome + Starburst + Rave Typography) เพื่อนำมาใช้ให้ถูกต้องตามเนื้อแท้ ไม่ใช่แค่แปะสติกเกอร์ผิวเผิน",
    bestFor: ["แคมเปญเจาะกลุ่ม Gen Z หรือ Millennial", "แบรนด์แฟชั่นและไลฟ์สไตล์", "โปสเตอร์คอนเสิร์ตและอีเวนต์", "บรรจุภัณฑ์เครื่องดื่มและของสะสม"],
    doList: [
      "ผสมผสานกลิ่นอายย้อนยุคเข้ากับเทคโนโลยีและฟอนต์ยุคใหม่เพื่อไม่ให้งานดูเก่าโบราณ",
      "ใช้ Palette สีที่เป็นตัวแทนของยุคสมัยนั้นอย่างแท้จริง"
    ],
    dontList: [
      "อย่ายัดเยียดสไตล์ที่ไม่เข้ากับเนื้อหาของสินค้า (เช่น สินค้าประกันภัย แต่ใช้สไตล์ Acid Techno)",
      "อย่าเลียนแบบเทรนด์โดยไม่เข้าใจที่มา เพราะอาจเกิดข้อผิดพลาดทางวัฒนธรรมได้"
    ],
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
    exampleAnalysis: "งานดีไซน์แคมเปญดนตรียุค 2000s ที่ใช้ตัวอักษรโลหะสะท้อนแสงทรงบิดเบี้ยวคู่กับสีฟูเชียนีออน สื่อสารถึงพลังและความขบถของวัยรุ่น Gen Z ได้อย่างทรงพลัง",
    aiPrompt: "Authentic Y2K aesthetic graphic poster, liquid chrome 3D typography, holographic cyber texture, starburst flares, nostalgic 2000s Japanese club flyer influence, retrofuturistic, stunning art print"
  }
];

/* ─────────────────────────────────────────────────────────────────────────
   PRACTICAL DESIGN SCENARIOS (Problem Solver Quick Filter)
───────────────────────────────────────────────────────────────────────── */
export const DESIGN_SCENARIOS = [
  {
    id: "sc-eye-catcher",
    icon: "🎯",
    title: "อยากให้สินค้าเด่นกระแทกตาใน 1 วินาที",
    desc: "แก้ปัญหางานจม เลื่อนผ่านแล้วจำไม่ได้",
    targetPillar: "differentiate",
    targetPrinciples: ["diff-color-contrast", "diff-scale-discrepancy"]
  },
  {
    id: "sc-dense-info",
    icon: "📑",
    title: "บรีฟข้อมูลเยอะ โปรโมชันแน่น จัดอย่างไรไม่อึดอัด",
    desc: "แก้ปัญหางานรก ตาจับต้นชนปลายไม่ถูก",
    targetPillar: "organize",
    targetPrinciples: ["org-gestalt-proximity", "org-gestalt-enclosure"]
  },
  {
    id: "sc-reading-flow",
    icon: "👁️",
    title: "คนดูไม่รู้จะอ่านอะไรก่อน ปุ่มคลิกไม่เด่น",
    desc: "แก้ปัญหาคนเห็นแต่ไม่กด Call-to-Action",
    targetPillar: "direct",
    targetPrinciples: ["dir-focal-point", "dir-reading-flow", "dir-typographic-scale"]
  },
  {
    id: "sc-storytelling",
    icon: "💡",
    title: "อยากให้ภาพมีความหมายลึกซึ้ง ไม่ใช่แค่รูปตกแต่ง",
    desc: "แก้ปัญหาภาพทั่วไปที่ดูน่าเบื่อ ไม่มีเอกลักษณ์",
    targetPillar: "infer",
    targetPrinciples: ["inf-contextual-metaphor", "inf-cultural-quotation"]
  }
];

/* ─────────────────────────────────────────────────────────────────────────
   MAIN RENDER METHOD
───────────────────────────────────────────────────────────────────────── */
export async function render(ctx) {
  let activePillar = "all";
  let activeSearch = "";
  let activeScenario = null;
  let currentViewMode = "matrix"; // "matrix" | "tree"

  const mountModal = (principle) => {
    const pillar = TAXONOMY_PILLARS[principle.pillar];
    const modalContent = `
      <div class="tax-detail-modal">
        <div class="tax-modal-header" style="border-bottom: 1px solid #2a2e44; padding-bottom: 16px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
            <span class="tax-pillar-badge" style="background:${pillar.bg}; color:${pillar.color}; border: 1px solid ${pillar.border};">
              ${pillar.icon} ${pillar.name} · ${principle.tier}
            </span>
          </div>
          <h2 style="font-size: 1.5rem; font-weight: 700; color: #ffffff; margin: 0 0 6px;">
            ${escapeHtml(principle.titleTh)}
          </h2>
          <div style="font-family: var(--font-mono); font-size: 0.85rem; color: #8e95b0;">
            ${escapeHtml(principle.title)}
          </div>
        </div>

        <div class="tax-modal-body">
          <!-- Main Hero Image & Case Study Breakdown -->
          <div class="tax-modal-visual-row">
            <div class="tax-modal-img-wrap">
              <img src="${escapeHtml(principle.image)}" alt="${escapeHtml(principle.title)}" class="tax-modal-img" />
              <div class="tax-modal-img-caption">
                <span style="font-weight:700; color:#ffc61a;">กรณีศึกษาจริง (Case Study):</span> ${escapeHtml(principle.exampleAnalysis)}
              </div>
            </div>
            <div class="tax-modal-quick-facts">
              <div class="tax-fact-box">
                <div class="tax-fact-label">⚡ สรุปหัวใจสำคัญ (Core Concept)</div>
                <div class="tax-fact-val">${escapeHtml(principle.summary)}</div>
              </div>
              <div class="tax-fact-box">
                <div class="tax-fact-label">🧠 กลไกทางจิตวิทยา (Why It Works)</div>
                <div class="tax-fact-val" style="color:#d1d6ea; font-size:0.84rem; line-height:1.55;">${escapeHtml(principle.psychology)}</div>
              </div>
              <div class="tax-fact-box">
                <div class="tax-fact-label">📐 สูตรและวิธีการนำไปใช้ (How To Apply)</div>
                <div class="tax-fact-val" style="color:#ffffff; font-size:0.84rem; line-height:1.55;">${escapeHtml(principle.howItWorks)}</div>
              </div>
            </div>
          </div>

          <!-- Application Matrix & Best For Tags -->
          <div style="margin-top: 24px; padding: 16px; background: #131522; border: 1px solid #262a3e; border-radius: 10px;">
            <div style="font-size: 0.82rem; font-weight: 700; color: #8e95b0; text-transform: uppercase; margin-bottom: 10px;">
              🎯 เหมาะกับงานออกแบบประเภทไหนมากที่สุด (Applicable Workloads):
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${principle.bestFor.map(b => `
                <span class="chip" style="background:#1b1f32; border:1px solid #2e344e; color:#ffc61a; font-weight:600; font-size:0.8rem; padding:5px 12px; border-radius:6px;">
                  ✓ ${escapeHtml(b)}
                </span>
              `).join("")}
            </div>
          </div>

          <!-- Do's and Don'ts Grid -->
          <div class="tax-dodont-grid" style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-top:20px;">
            <div class="tax-do-box" style="background: rgba(34, 197, 94, 0.08); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 10px; padding: 16px;">
              <div style="font-weight: 700; color: #22c55e; margin-bottom: 10px; display:flex; align-items:center; gap:6px;">
                <span>✓</span> <span>สิ่งที่ควรทำ (Best Practices)</span>
              </div>
              <ul style="margin:0; padding-left:18px; font-size:0.82rem; color:#d8deea; line-height:1.6;">
                ${principle.doList.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
              </ul>
            </div>
            <div class="tax-dont-box" style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 10px; padding: 16px;">
              <div style="font-weight: 700; color: #ef4444; margin-bottom: 10px; display:flex; align-items:center; gap:6px;">
                <span>✕</span> <span>ข้อควรระวัง (Common Pitfalls)</span>
              </div>
              <ul style="margin:0; padding-left:18px; font-size:0.82rem; color:#d8deea; line-height:1.6;">
                ${principle.dontList.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
              </ul>
            </div>
          </div>

          <!-- AI Generation Prompt Template -->
          <div style="margin-top: 20px; background: #0c0e18; border: 1px dashed #343a56; border-radius: 10px; padding: 16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <span style="font-size:0.8rem; font-weight:700; color:#8b92ad;">🤖 AI Generation Prompt (สำหรับ Midjourney / DALL-E):</span>
              <button type="button" class="btn btn-sm btn-ghost" id="btn-copy-prompt" style="font-size:0.75rem; color:#ffc61a;">
                📋 คัดลอก Prompt
              </button>
            </div>
            <code style="display:block; font-family:var(--font-mono); font-size:0.78rem; color:#e0e4f5; line-height:1.5; background:#141726; padding:10px 14px; border-radius:6px; word-break:break-all;" id="prompt-code-text">
              ${escapeHtml(principle.aiPrompt)}
            </code>
          </div>
        </div>
      </div>
    `;

    openModal("หลักการออกแบบภาพ (Visual Principle Deep-Dive)", modalContent, [
      {
        label: "ปิดหน้าต่าง",
        variant: "ghost",
        action: closeModal
      }
    ]);

    qs("#btn-copy-prompt")?.addEventListener("click", () => {
      navigator.clipboard.writeText(principle.aiPrompt);
      toast("คัดลอก AI Prompt เรียบร้อยแล้ว", "ok");
    });
  };

  const draw = () => {
    // Filter principles based on search, pillar, and scenario
    let filtered = TAXONOMY_PRINCIPLES.filter((p) => {
      if (activePillar !== "all" && p.pillar !== activePillar) return false;
      if (activeScenario && !activeScenario.targetPrinciples.includes(p.id)) return false;
      if (activeSearch) {
        const query = activeSearch.toLowerCase();
        const matchTitle = (p.title || "").toLowerCase().includes(query) || (p.titleTh || "").toLowerCase().includes(query);
        const matchSummary = (p.summary || "").toLowerCase().includes(query);
        const matchBest = (p.bestFor || []).some(b => b.toLowerCase().includes(query));
        return matchTitle || matchSummary || matchBest;
      }
      return true;
    });

    // 1. Scenario Quick-Solver Chips HTML
    const scenariosHtml = DESIGN_SCENARIOS.map((sc) => {
      const isSel = activeScenario && activeScenario.id === sc.id;
      return `
        <button type="button" class="tax-scenario-btn ${isSel ? "is-active" : ""}" data-scenario-id="${sc.id}">
          <span class="tax-sc-icon">${sc.icon}</span>
          <div class="tax-sc-text">
            <span class="tax-sc-title">${escapeHtml(sc.title)}</span>
            <span class="tax-sc-desc">${escapeHtml(sc.desc)}</span>
          </div>
        </button>
      `;
    }).join("");

    // 2. Pillars Tab Bar HTML
    const pillarTabsHtml = `
      <div class="tax-pillar-tabs">
        <button type="button" class="tax-pillar-tab ${activePillar === "all" ? "is-active" : ""}" data-pillar="all">
          <span>✨</span>
          <span>ทั้งหมด (${TAXONOMY_PRINCIPLES.length})</span>
        </button>
        ${Object.values(TAXONOMY_PILLARS).map(p => {
          const count = TAXONOMY_PRINCIPLES.filter(item => item.pillar === p.id).length;
          return `
            <button type="button" class="tax-pillar-tab ${activePillar === p.id ? "is-active" : ""}" data-pillar="${p.id}" style="${activePillar === p.id ? `border-color:${p.color}; color:#fff;` : ""}">
              <span>${p.icon}</span>
              <span>${escapeHtml(p.name)}</span>
              <span class="tax-pill-count">${count}</span>
            </button>
          `;
        }).join("")}
      </div>
    `;

    // 3. Matrix View Cards HTML
    const cardsGridHtml = filtered.length > 0 ? `
      <div class="tax-cards-grid">
        ${filtered.map((item) => {
          const pil = TAXONOMY_PILLARS[item.pillar];
          return `
            <div class="tax-principle-card" data-open-principle="${item.id}">
              <div class="tax-card-thumb-wrap">
                <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" class="tax-card-thumb" loading="lazy" />
                <span class="tax-card-pillar-tag" style="background:${pil.bg}; color:${pil.color}; border:1px solid ${pil.border};">
                  ${pil.icon} ${pil.name}
                </span>
                <span class="tax-card-tier-tag">${escapeHtml(item.tier)}</span>
              </div>
              <div class="tax-card-body">
                <div class="tax-card-en-title">${escapeHtml(item.title)}</div>
                <h3 class="tax-card-th-title">${escapeHtml(item.titleTh)}</h3>
                <p class="tax-card-summary">${escapeHtml(item.summary)}</p>

                <div class="tax-card-bestfor">
                  <span class="tax-bf-label">ใช้บ่อยใน:</span>
                  <div class="tax-bf-chips">
                    ${item.bestFor.slice(0, 3).map(b => `<span class="tax-bf-chip">${escapeHtml(b)}</span>`).join("")}
                  </div>
                </div>

                <div class="tax-card-footer">
                  <span class="tax-card-cta">คลิกเพื่อดูเจาะลึก & AI Prompt ›</span>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    ` : `
      <div class="tax-empty-state" style="text-align:center; padding:50px 20px; background:#131522; border:1px solid #262a3e; border-radius:14px; margin:20px 0;">
        <div style="font-size:2.5rem; margin-bottom:12px;">🔍</div>
        <h3 style="color:#ffffff; font-size:1.15rem; margin-bottom:6px;">ไม่พบหลักการออกแบบที่ตรงกับเงื่อนไข</h3>
        <p style="color:#8b92ad; font-size:0.85rem;">ลองเปลี่ยนคำค้นหา หรือคลิกปุ่ม "ล้างตัวกรอง" เพื่อดูหลักการทั้งหมด</p>
        <button type="button" class="btn btn-sm btn-ghost" id="btn-clear-tax-filters" style="margin-top:14px; color:#ffc61a;">
          ✕ ล้างตัวกรองทั้งหมด
        </button>
      </div>
    `;

    // 4. Tree / Mind Map View HTML (Replicating Jason Murray's connected network view)
    const treeViewHtml = `
      <div class="tax-tree-shell">
        <div class="tax-tree-root-banner">
          <div class="tax-tree-root-badge">CORE TAXONOMY OF VISUALS</div>
          <h2>ระบบกลไกการสื่อสารทางภาพ 4 เสาหลัก</h2>
          <p>คลิกที่โหนดเพื่อดูรายละเอียดหลักการ จิตวิทยาการรับรู้ และการนำไปใช้จริง</p>
        </div>

        <div class="tax-tree-branches-grid">
          ${Object.values(TAXONOMY_PILLARS).map((pil) => {
            const pItems = TAXONOMY_PRINCIPLES.filter(item => item.pillar === pil.id);
            return `
              <div class="tax-tree-column">
                <div class="tax-tree-col-head" style="border-top: 3px solid ${pil.color};">
                  <span style="font-size:1.3rem;">${pil.icon}</span>
                  <div>
                    <h4 style="color:${pil.color}; margin:0; font-size:1rem; font-weight:700;">${pil.name}</h4>
                    <p style="color:#8b92ad; margin:2px 0 0; font-size:0.75rem;">${pil.nameTh}</p>
                  </div>
                </div>

                <div class="tax-tree-nodes-list">
                  ${pItems.map(item => `
                    <div class="tax-tree-node-card" data-open-principle="${item.id}">
                      <div class="tax-node-thumb-mini">
                        <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" />
                      </div>
                      <div class="tax-node-content">
                        <span class="tax-node-tier">${escapeHtml(item.tier)}</span>
                        <div class="tax-node-title">${escapeHtml(item.titleTh)}</div>
                        <div class="tax-node-sub">${escapeHtml(item.title)}</div>
                      </div>
                      <span class="tax-node-arrow">›</span>
                    </div>
                  `).join("")}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;

    // 5. Complete Page Layout HTML
    qs("#page-content").innerHTML = `
      <div class="taxonomy-page-shell">
        <!-- Top Hero Header -->
        <div class="tax-hero-banner">
          <div class="tax-hero-info">
            <div class="tax-hero-tag">
              <span>✦</span> <span>JASON MURRAY DESIGN FRAMEWORK</span>
            </div>
            <h1 class="tax-hero-title">Taxonomy of Visuals</h1>
            <p class="tax-hero-subtitle">
              คลังจัดหมวดหมู่หลักการออกแบบภาพเชิงระบบ — ยกระดับจากการแค่ 'หาเรฟสวยๆ' สู่การเข้าใจ 'กลไกและจิตวิทยาที่ทำให้ภาพสื่อสารได้ผล'
            </p>
          </div>

          <div class="tax-hero-actions">
            <div class="tax-view-switcher">
              <button type="button" class="tax-switch-btn ${currentViewMode === "matrix" ? "is-active" : ""}" id="btn-view-matrix" title="มุมมองการ์ด (Card Matrix)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                <span>การ์ดหลักการ</span>
              </button>
              <button type="button" class="tax-switch-btn ${currentViewMode === "tree" ? "is-active" : ""}" id="btn-view-tree" title="มุมมองแผนผังต้นไม้ (Taxonomy Tree)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="3"></circle><line x1="12" y1="8" x2="12" y2="14"></line><circle cx="6" cy="19" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="12" y1="14" x2="6" y2="16"></line><line x1="12" y1="14" x2="18" y2="16"></line></svg>
                <span>แผนผังความสัมพันธ์</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Problem Solver Quick Assistant -->
        <div class="tax-problem-solver-box">
          <div class="tax-ps-header">
            <span class="tax-ps-badge">💡 DESIGN PROBLEM SOLVER</span>
            <span class="tax-ps-title">เลือกปัญหาหรือโจทย์งานที่กำลังเจอ เพื่อดูหลักการออกแบบที่แก้ได้ตรงจุด:</span>
          </div>
          <div class="tax-scenarios-grid">
            ${scenariosHtml}
          </div>
        </div>

        <!-- Toolbar: Search Bar + Pillar Tabs -->
        <div class="tax-toolbar">
          <div class="tax-search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b92ad" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" id="tax-search-input" class="tax-search-input" placeholder="ค้นหาหลักการ เช่น Gestalt, Contrast, Hierarchy, หรือประเภทงาน..." value="${escapeHtml(activeSearch)}" />
            ${activeSearch ? `<button type="button" class="tax-search-clear" id="tax-search-clear">×</button>` : ""}
          </div>
          ${pillarTabsHtml}
        </div>

        <!-- Main Content Area: Matrix Grid or Tree View -->
        <div class="tax-main-content">
          ${currentViewMode === "matrix" ? cardsGridHtml : treeViewHtml}
        </div>
      </div>
    `;

    /* ─────────── Event Bindings ─────────── */
    // Open Detail Modal
    qsa("[data-open-principle]").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.dataset.openPrinciple;
        const found = TAXONOMY_PRINCIPLES.find(p => p.id === id);
        if (found) mountModal(found);
      });
    });

    // View Mode Switcher
    qs("#btn-view-matrix")?.addEventListener("click", () => {
      currentViewMode = "matrix";
      draw();
    });
    qs("#btn-view-tree")?.addEventListener("click", () => {
      currentViewMode = "tree";
      draw();
    });

    // Pillar Tab Selection
    qsa("[data-pillar]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activePillar = btn.dataset.pillar;
        activeScenario = null;
        draw();
      });
    });

    // Scenario Button Toggle
    qsa("[data-scenario-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.scenarioId;
        if (activeScenario && activeScenario.id === id) {
          activeScenario = null;
          activePillar = "all";
        } else {
          activeScenario = DESIGN_SCENARIOS.find(s => s.id === id);
          if (activeScenario) activePillar = activeScenario.targetPillar;
        }
        draw();
      });
    });

    // Search Input Handler
    const searchInput = qs("#tax-search-input");
    searchInput?.addEventListener("input", (e) => {
      activeSearch = e.target.value.trim();
      draw();
    });
    qs("#tax-search-clear")?.addEventListener("click", () => {
      activeSearch = "";
      draw();
    });

    // Clear Filters Button in empty state
    qs("#btn-clear-tax-filters")?.addEventListener("click", () => {
      activePillar = "all";
      activeSearch = "";
      activeScenario = null;
      draw();
    });
  };

  draw();
}
