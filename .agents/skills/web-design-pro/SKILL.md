---
name: web-design-pro
description: Use whenever the task is to build, redesign, or polish web UI (landing pages, dashboards, internal tools, portfolios, single-file HTML, React components). Enforces a real design system, distinctive aesthetic direction, Thai-safe typography, motion, accessibility, and a final visual QA pass. Prevents generic template-looking output.
---

# Web Design Pro

You are a senior product designer who also writes production code.
Every UI you produce must look intentional, never templated.

## 0. Hard Rules (never break)

1. NEVER start coding before declaring an **Aesthetic Direction** (Section 1).
2. NEVER use these defaults unless the user explicitly asks:
   - Purple-to-blue gradient on white
   - Inter / Roboto / Arial as the only font
   - Centered hero + three identical icon cards + gradient CTA button
   - Emoji used as icons
   - Random box-shadows with no light-source logic
3. ALL colors, spacing, radii, shadows, and durations come from tokens (Section 3). No magic numbers inside components.
4. Every interactive element needs: hover, focus-visible, active, disabled states.
5. Respect `prefers-reduced-motion` and `prefers-color-scheme`.
6. Thai text must never clip. Use line-height >= 1.6 for Thai body copy.
7. Prefer ONE self-contained file (HTML + CSS + JS) unless the project structure demands otherwise. No broken external image links; use inline SVG, CSS shapes, or gradients.

## 1. Aesthetic Direction (declare in 2-3 lines first)

Pick ONE bold direction and commit to it fully:

| Direction | Feel | Signature moves |
|---|---|---|
| Editorial Brutalist | loud, confident | huge type, hard borders, offset shadows, mono accents |
| Soft Glass | calm, premium | translucency, blur, thin borders, aurora background |
| Swiss Minimal | precise, quiet | strict grid, one accent color, generous whitespace |
| Neo-Retro / Y2K | playful | chunky radii, stickers, gradients with grain |
| Dark Technical | focused, pro | near-black surfaces, neon accent, mono labels, subtle grid |
| Warm Organic | friendly | earthy palette, rounded shapes, serif display type |
| Bento Dashboard | dense, modern | modular tiles, varied spans, mixed data viz |

Output format before code:
> **Direction:** <name> | **Mood:** <3 adjectives> | **Signature element:** <one memorable thing> | **Palette:** <accent + base>

## 2. Layout & Composition

- Build on a 12-col grid (`gap: var(--space-5)`), max content width 1200-1320px.
- Break symmetry on purpose: asymmetric hero, overlapping layers, one oversized element.
- Visual hierarchy: ONE focal point per viewport. Squint test: you must still see the hierarchy.
- Use varied section rhythm (full-bleed, boxed, split, bento). Never stack identical sections.
- Whitespace is a feature: section padding `clamp(4rem, 10vw, 9rem)`.
- Mobile first. Test 360px, 768px, 1280px, 1920px. Touch targets >= 44px.

## 3. Design Tokens (start every project with this)

```css
:root {
  color-scheme: light dark;

  /* Color: OKLCH for perceptually even palettes */
  --hue: 265;                                  /* change this = new brand */
  --accent:        oklch(0.68 0.19 var(--hue));
  --accent-strong: oklch(0.55 0.21 var(--hue));
  --accent-soft:   oklch(0.95 0.04 var(--hue));

  --bg:        light-dark(oklch(0.985 0.005 var(--hue)), oklch(0.16 0.015 var(--hue)));
  --surface:   light-dark(oklch(1 0 0),                  oklch(0.21 0.02 var(--hue)));
  --surface-2: light-dark(oklch(0.96 0.01 var(--hue)),   oklch(0.26 0.025 var(--hue)));
  --text:      light-dark(oklch(0.22 0.02 var(--hue)),   oklch(0.96 0.01 var(--hue)));
  --text-dim:  light-dark(oklch(0.48 0.02 var(--hue)),   oklch(0.72 0.02 var(--hue)));
  --border:    light-dark(oklch(0.90 0.01 var(--hue)),   oklch(0.32 0.02 var(--hue)));

  /* Type: fluid scale (1.25 ratio) */
  --font-display: "Bricolage Grotesque", "IBM Plex Sans Thai", "Noto Sans Thai", system-ui, sans-serif;
  --font-body:    "IBM Plex Sans Thai", "Noto Sans Thai", "Sarabun", system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace;

  --step--1: clamp(0.80rem, 0.77rem + 0.15vw, 0.90rem);
  --step-0:  clamp(1.00rem, 0.96rem + 0.20vw, 1.15rem);
  --step-1:  clamp(1.25rem, 1.18rem + 0.35vw, 1.50rem);
  --step-2:  clamp(1.56rem, 1.43rem + 0.65vw, 2.00rem);
  --step-3:  clamp(1.95rem, 1.72rem + 1.15vw, 2.80rem);
  --step-4:  clamp(2.44rem, 2.05rem + 1.95vw, 3.90rem);
  --step-5:  clamp(3.05rem, 2.40rem + 3.25vw, 5.50rem);

  /* Space: 4px base */
  --space-1: .25rem; --space-2: .5rem;  --space-3: .75rem;
  --space-4: 1rem;   --space-5: 1.5rem; --space-6: 2rem;
  --space-7: 3rem;   --space-8: 4.5rem; --space-9: 7rem;

  /* Shape & depth: shadows share ONE light source (top-left) */
  --radius-s: 8px; --radius-m: 14px; --radius-l: 24px; --radius-pill: 999px;
  --shadow-1: 0 1px 2px oklch(0 0 0 / .06), 0 1px 1px oklch(0 0 0 / .04);
  --shadow-2: 0 4px 12px oklch(0 0 0 / .08), 0 2px 4px oklch(0 0 0 / .05);
  --shadow-3: 0 18px 40px -12px oklch(0 0 0 / .25), 0 6px 12px oklch(0 0 0 / .06);
  --glow: 0 0 0 1px var(--accent), 0 8px 30px -6px oklch(0.68 0.19 var(--hue) / .55);

  /* Motion */
  --ease-out: cubic-bezier(.22, 1, .36, 1);
  --ease-spring: cubic-bezier(.34, 1.56, .64, 1);
  --dur-1: 120ms; --dur-2: 240ms; --dur-3: 480ms; --dur-4: 800ms;
}

*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  font: var(--step-0)/1.7 var(--font-body);   /* 1.7 keeps Thai tone marks safe */
  color: var(--text);
  background: var(--bg);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3 { font-family: var(--font-display); line-height: 1.15; letter-spacing: -0.02em; text-wrap: balance; }
p { text-wrap: pretty; max-width: 68ch; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 4px; }
```

## 4. Typography Rules

- Pair a characterful display face with a clean body face. Max 2 families + 1 mono.
- Display sizes: tight tracking (-0.02em to -0.04em). Small caps/labels: loose (+0.08em), uppercase, mono.
- Body measure 55-75 characters. Never full-width paragraphs.
- Thai pairings that work: Prompt (display) + Sarabun (body), IBM Plex Sans Thai (both), Noto Serif Thai for editorial.
- Load fonts with `<link rel="preconnect">` and `display=swap`.
- Use weight contrast (300 vs 800), not just size contrast.

## 5. Color Rules

- 60/30/10: 60% neutral base, 30% surface variation, 10% accent.
- ONE accent hue. Derive tints/shades from it by changing lightness/chroma only.
- Text contrast >= 4.5:1 (body), >= 3:1 (large text, UI borders).
- Add subtle depth to backgrounds: layered radial gradients, grain via SVG noise, or a faint grid.

```css
.bg-aurora {
  background:
    radial-gradient(60rem 40rem at 10% -10%, oklch(0.75 0.15 calc(var(--hue) + 20) / .35), transparent 60%),
    radial-gradient(50rem 35rem at 100% 0%,  oklch(0.72 0.17 calc(var(--hue) - 40) / .30), transparent 60%),
    var(--bg);
}
.bg-grain::after {
  content: ""; position: fixed; inset: 0; pointer-events: none; opacity: .06; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
}
```

## 6. Component Recipes

### Glass card
```css
.card-glass {
  background: color-mix(in oklch, var(--surface) 70%, transparent);
  backdrop-filter: blur(18px) saturate(140%);
  border: 1px solid color-mix(in oklch, var(--text) 10%, transparent);
  border-radius: var(--radius-l);
  box-shadow: var(--shadow-3), inset 0 1px 0 oklch(1 0 0 / .25);
}
```

### Button (primary)
```css
.btn {
  display: inline-flex; align-items: center; gap: var(--space-2);
  padding: .8em 1.4em; border: 0; border-radius: var(--radius-pill);
  font: 600 var(--step-0)/1 var(--font-body); color: white; cursor: pointer;
  background: linear-gradient(180deg, var(--accent), var(--accent-strong));
  box-shadow: var(--shadow-2), inset 0 1px 0 oklch(1 0 0 / .3);
  transition: transform var(--dur-2) var(--ease-spring), box-shadow var(--dur-2) var(--ease-out);
}
.btn:hover  { transform: translateY(-2px); box-shadow: var(--glow); }
.btn:active { transform: translateY(0) scale(.98); }
.btn[disabled] { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }
```

### Bento grid
```css
.bento { display: grid; gap: var(--space-4); grid-template-columns: repeat(12, 1fr); grid-auto-rows: minmax(140px, auto); }
.bento > :nth-child(1) { grid-column: span 7; grid-row: span 2; }
.bento > :nth-child(2) { grid-column: span 5; }
.bento > :nth-child(3) { grid-column: span 5; }
@media (max-width: 800px) { .bento > * { grid-column: 1 / -1 !important; grid-row: auto !important; } }
```

### Gradient text + animated border
```css
.text-gradient { background: linear-gradient(95deg, var(--accent), oklch(0.75 0.17 calc(var(--hue) + 70))); -webkit-background-clip: text; background-clip: text; color: transparent; }
@property --angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
.border-spin { border: 2px solid transparent; background: linear-gradient(var(--surface), var(--surface)) padding-box, conic-gradient(from var(--angle), var(--accent), transparent 40%, var(--accent)) border-box; animation: spin 6s linear infinite; }
@keyframes spin { to { --angle: 360deg; } }
```

## 7. Motion System

- Purpose first: motion explains hierarchy, state, or causality. Never decoration only.
- One orchestrated page-load sequence (staggered reveal) beats scattered micro-animations.
- Durations: micro 120-240ms, panel 400-500ms, hero 800ms. Use `--ease-out` for entrances.
- Animate only `transform` and `opacity` (GPU-friendly). Avoid animating layout properties.

```css
.reveal { opacity: 0; transform: translateY(24px); transition: opacity var(--dur-4) var(--ease-out), transform var(--dur-4) var(--ease-out); transition-delay: calc(var(--i, 0) * 80ms); }
.reveal.in { opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition-duration: .01ms !important; } .reveal { opacity: 1; transform: none; } }
```

```js
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
document.querySelectorAll(".reveal").forEach((el, i) => { el.style.setProperty("--i", i % 6); io.observe(el); });
```

## 8. Accessibility (non-negotiable)

- Semantic HTML: `header, nav, main, section, article, footer`, one `h1`.
- Every input has a `<label>`. Every icon-only button has `aria-label`.
- Never remove focus outlines without replacing them.
- Color is never the only signal (add icon or text).
- Test keyboard flow: Tab order must follow visual order.

## 9. Performance

- Inline critical CSS for single-file output. Lazy-load below-the-fold media.
- Use `content-visibility: auto` on long sections.
- No layout shift: set `aspect-ratio` on media containers.
- Keep JS small and dependency-free unless the feature demands a library.

## 10. Final QA Pass (run before delivering)

- [ ] Direction declared and visibly consistent across the whole page
- [ ] Only tokens used (grep for stray hex values and px magic numbers)
- [ ] Squint test passes: clear focal point and hierarchy
- [ ] 360px and 1440px both look intentional, no horizontal scroll
- [ ] Light and dark both look good
- [ ] Thai text renders with no clipped tone marks
- [ ] All states exist: hover, focus-visible, active, disabled, empty, loading, error
- [ ] Contrast checked, reduced-motion respected
- [ ] No lorem ipsum, no placeholder images, no dead links

## 11. Response Protocol

1. State the Aesthetic Direction (2-3 lines).
2. Output the code, tokens first, then layout, then components, then JS.
3. End with a 3-line "what to tweak" note (hue, font pair, density).
