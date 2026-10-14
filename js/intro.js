/*!
 * CONT — Kinetic Typography Brand Intro & Video Engine
 * Powered by GSAP & Web Audio API Procedural Synthesizer
 */

/* ─────────────────────────────────────────────────────────────────────────
   AUDIO SYNTHESIZER (PROCEDURAL WEB AUDIO SFX - ZERO EXTERNAL ASSETS)
───────────────────────────────────────────────────────────────────────── */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggle() {
    this.init();
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playImpact() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.35);
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.45);
  }

  playTick(pitch = 880) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.4, t + 0.08);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playWhoosh() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.2);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.4);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.42);
  }

  playChime() {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major Chord
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t + i * 0.06);
      gain.gain.setValueAtTime(0.18, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 1.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 1.3);
    });
  }
}

const sfx = new SoundEngine();

/* ─────────────────────────────────────────────────────────────────────────
   SETUP DOM ELEMENTS & TEXT MASKING ENGINE
───────────────────────────────────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);

const stage = $("stage");
const hi = $("hi");
const nameLine = $("name");
const dot = $("dot");
const field = $("field");
const ladder = $("ladder");
const lockup = $("lockup");
const anchor = $("anchor");
const endcard = $("endcard");
const barTop = $("barTop");
const barBot = $("barBot");
const replayBtn = $("replay");
const camera = $("camera");
const dotOut = $("dotOut");
const blobs = document.querySelectorAll(".blob");
const squiggles = document.querySelectorAll(".squiggle__path");
const gridLight = document.querySelector(".grid--light");
const soundBtn = $("btn-toggle-sound");
const ratioBtn = $("btn-toggle-ratio");
const filmWrapper = document.querySelector(".film-wrapper");

// Split a container into character spans for 3D kinetic typography
const splitToChars = (el, className) => {
  const chars = [...el.textContent];
  el.textContent = "";
  return chars.map((ch) => {
    const span = document.createElement("span");
    span.className = className;
    span.textContent = ch === " " ? "\u00A0" : ch;
    el.appendChild(span);
    return span;
  });
};

const anchorChars = splitToChars(anchor, "anchor__ch");
const rungs = [null, ...document.querySelectorAll(".rung")];
const rungsIn = rungs.map((r) => r && r.querySelector(".rung__in"));
const periods = rungs.map((r) => r && r.querySelector(".pd"));
const rungsChars = rungsIn.map((r) => (r ? splitToChars(r, "rung__ch") : null));
const allChars = [...anchorChars, ...rungsChars.slice(1).flat()];

// Tuning constants for kinetic perspective and responsive bounds
const FONT_SCALES = [{ s: 1 }, { s: 0.86 }, { s: 0.78 }, { s: 0.72 }, { s: 0.64 }, { s: 0.54 }];
const MOBILE_ANCHOR_PCT = 0.38;
const DESKTOP_ANCHOR_PCT = 0.24;
const MAX_BOUNDS_PCT = 0.90;
const BASE_FONT_PX = 200;
const GAP_EM = 0.22;
const DOT_DIAMETER = 120;
const RUNG_ROTATION_ENTER = -78;
const RUNG_ROTATION_EXIT = 62;
const PERSPECTIVE_Z = 620;

let rungMetrics = [];
let masterTimeline = null;

// Register custom SVG stroke drawn plugin with GSAP
if (window.gsap) {
  window.gsap.registerPlugin({
    name: "drawn",
    init(target, value) {
      const len = target.getTotalLength();
      target.style.strokeDasharray = len;
      this.target = target;
      this.len = len;
      this.value = value;
    },
    render(progress, data) {
      const current = data.value * progress;
      data.target.style.strokeDashoffset = data.len * (1 - current);
    }
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   RESPONSIVE OPTICAL CENTERING & METRICS COMPUTATION
───────────────────────────────────────────────────────────────────────── */
function computeMetrics() {
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  const isLandscape = w / h >= 1;
  const anchorPct = isLandscape ? DESKTOP_ANCHOR_PCT : MOBILE_ANCHOR_PCT;

  lockup.style.fontSize = `${BASE_FONT_PX}px`;
  const rawAnchorW = anchor.offsetWidth;
  const targetFontSize = BASE_FONT_PX * (anchorPct * w / rawAnchorW);
  lockup.style.fontSize = `${targetFontSize}px`;

  const anchorW = anchor.offsetWidth;
  const gapPx = GAP_EM * targetFontSize;

  rungMetrics = FONT_SCALES.map((scaleObj, idx) => {
    const totalW = idx === 0 ? anchorW : anchorW + gapPx + rungs[idx].offsetWidth;
    const fittedScale = Math.min(scaleObj.s, (MAX_BOUNDS_PCT * w) / totalW);
    return {
      scale: fittedScale,
      x: (w - totalW * fittedScale) / 2
    };
  });

  const landY = h * 0.32;
  const floodScale = (2 * Math.hypot(w / 2, h - landY) * 1.08) / DOT_DIAMETER;

  return { w, h, landY, floodScale };
}

/* ─────────────────────────────────────────────────────────────────────────
   MASTER ANIMATION TIMELINE BUILDER
───────────────────────────────────────────────────────────────────────── */
function buildMasterTimeline(metrics) {
  const tl = window.gsap.timeline({
    paused: true,
    onComplete: () => {
      replayBtn.hidden = false;
      requestAnimationFrame(() => replayBtn.classList.add("is-shown"));
      window.gsap.set(
        [lockup, camera, barTop, barBot, dot, dotOut, gridLight, ...allChars, ...rungsIn.slice(1), ...periods.slice(1)],
        { willChange: "auto" }
      );
    }
  });

  // 1. Initial State
  tl.set([hi, nameLine], { opacity: 0, yPercent: 0 })
    .set([barTop, barBot], { yPercent: 0 })
    .set(dot, { opacity: 0, x: 0, y: -120, scale: 0.09 })
    .set(field, { opacity: 0 })
    .set(blobs, { opacity: 0 })
    .set(ladder, { opacity: 0 })
    .set(lockup, { x: rungMetrics[0].x, scale: rungMetrics[0].scale })
    .set(camera, { scale: 1, y: 0 })
    .set(gridLight, { xPercent: 0, yPercent: 0 })
    .set(allChars, {
      transformPerspective: PERSPECTIVE_Z,
      transformOrigin: "50% 100%",
      yPercent: 140,
      rotationX: RUNG_ROTATION_ENTER
    })
    .set(rungs.slice(1), { opacity: 1 })
    .set(rungsIn.slice(1), { yPercent: 0 })
    .set(periods.slice(1), { scale: 0 })
    .set(dotOut, { opacity: 0, x: 0, y: 0, scale: 0.001 })
    .set(endcard, { opacity: 0 })
    .set(".endcard__badge", { opacity: 0, y: -10 })
    .set(".endcard__cta", { opacity: 0, yPercent: 40 })
    .set(".endcard__sub", { opacity: 0, y: 14 })
    .set(".endcard__actions", { opacity: 0, y: 16 })
    .set(".endcard__handle", { opacity: 0, y: 12 })
    .set(squiggles, { drawn: 0 });

  // 2. Act 1: Shutter Cinema Bars Open & "HELLO" Reveal
  tl.to(barTop, { yPercent: -62, duration: 0.34, ease: "power2.out" }, 0.05)
    .to(barBot, { yPercent: 62, duration: 0.34, ease: "power2.out" }, 0.05)
    .call(() => sfx.playWhoosh(), null, 0.06);

  tl.fromTo(hi, { opacity: 0, yPercent: 26 }, { opacity: 1, yPercent: 0, duration: 0.4, ease: "power3.out" }, 0.15)
    .to(hi, { opacity: 0, yPercent: -22, duration: 0.26, ease: "power2.in" }, 0.55);

  tl.to(barTop, { yPercent: -100, duration: 0.82, ease: "power3.inOut" }, 0.5)
    .to(barBot, { yPercent: 100, duration: 0.82, ease: "power3.inOut" }, 0.5);

  // 3. Act 1b: "This is CONT." with Underline Squiggle
  tl.fromTo(nameLine, { opacity: 0, yPercent: 24 }, { opacity: 1, yPercent: 0, duration: 0.44, ease: "power3.out" }, 0.58)
    .to(squiggles[0], { drawn: 1, duration: 0.42, ease: "power2.inOut" }, 0.82);

  // 4. Act 2: Accent Dot Drop, Squash & Infinite Color Flood
  tl.set(dot, { opacity: 1 }, 1.3)
    .to(dot, { y: metrics.landY, scaleX: 0.16, scaleY: 0.34, duration: 0.36, ease: "power1.in" }, 1.3)
    .call(() => sfx.playImpact(), null, 1.62)
    .to(dot, { scaleX: 0.34, scaleY: 0.14, duration: 0.07, ease: "power2.out" }, 1.62)
    .to(dot, { scaleX: metrics.floodScale, scaleY: metrics.floodScale, duration: 0.38, ease: "power2.in" }, 1.68)
    .call(() => sfx.playWhoosh(), null, 1.75);

  // 5. Act 3: Flood World, Blobs & Continuous Slow Camera Push
  tl.set(field, { opacity: 1 }, 2.02)
    .set(dot, { opacity: 0 }, 2.03)
    .to(blobs, { opacity: 1, duration: 0.7, ease: "power2.out" }, 2.04)
    .set(ladder, { opacity: 1 }, 2.02)
    .fromTo(camera, { scale: 1, y: 0 }, { scale: 1.14, y: -0.024 * metrics.h, duration: 5.2, ease: "none" }, 2.02)
    .fromTo(gridLight, { xPercent: 0, yPercent: 0 }, { xPercent: -2.6, yPercent: -1.8, duration: 5.2, ease: "none" }, 2.02);

  // 6. Anchor Word "Every" hinges in
  tl.to(anchorChars, { yPercent: 0, rotationX: 0, duration: 0.5, ease: "power3.out", stagger: 0.03 }, 2.1)
    .call(() => sfx.playTick(600), null, 2.1);

  // 7. Kinetic Ladder Transitions
  // Rung 1: "brief."
  transitionRung(tl, 1, 2.7);
  // Rung 2: "artwork."
  transitionRung(tl, 2, 3.3);
  // Rung 3: "campaign."
  transitionRung(tl, 3, 3.9);
  // Rung 4: "approval."
  transitionRung(tl, 4, 4.5);
  // Rung 5: "creative team."
  transitionRung(tl, 5, 5.1);

  // 8. Act 4: Reverse Drop Transition to End Card
  tl.set(dotOut, { opacity: 1 }, 7.0)
    .to(dotOut, { y: metrics.landY, scaleX: 0.16, scaleY: 0.34, duration: 0.3, ease: "power1.in" }, 7.0)
    .call(() => sfx.playImpact(), null, 7.3)
    .to(dotOut, { scaleX: 0.3, scaleY: 0.13, duration: 0.07, ease: "power2.out" }, 7.3)
    .to(dotOut, { scaleX: metrics.floodScale, scaleY: metrics.floodScale, duration: 0.42, ease: "power2.in" }, 7.37)
    .call(() => sfx.playWhoosh(), null, 7.4);

  // 9. Act 5: Clean End Card Reveal
  tl.set(endcard, { opacity: 1 }, 7.81)
    .set([camera, field, dotOut], { opacity: 0 }, 7.82)
    .call(() => sfx.playChime(), null, 7.84)
    .to(".endcard__badge", { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" }, 7.85)
    .to(".endcard__cta", { opacity: 1, yPercent: 0, duration: 0.44, ease: "power3.out" }, 7.92)
    .to(".endcard__sub", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, 8.10)
    .to(".endcard__actions", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, 8.28)
    .to(".endcard__handle", { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, 8.46)
    .to(squiggles[1], { drawn: 1, duration: 0.46, ease: "power2.inOut" }, 8.65)
    .to({}, { duration: 0.01 }, 10.0);

  return tl;
}

function transitionRung(timeline, targetIdx, startTime) {
  const targetMetric = rungMetrics[targetIdx];
  const prevChars = rungsChars[targetIdx - 1];
  const nextChars = rungsChars[targetIdx];

  if (prevChars) {
    timeline
      .to(prevChars, { yPercent: -140, rotationX: RUNG_ROTATION_EXIT, duration: 0.28, ease: "power2.in", stagger: 0.012 }, startTime)
      .to(periods[targetIdx - 1], { scale: 0, duration: 0.13, ease: "power2.in" }, startTime);
  }

  timeline
    .to(lockup, { x: targetMetric.x, scale: targetMetric.scale, duration: 0.4, ease: "power3.out" }, startTime)
    .to(nextChars, { yPercent: 0, rotationX: 0, duration: 0.5, ease: "power3.out", stagger: 0.022 }, startTime + 0.1)
    .to(periods[targetIdx], { scale: 1, duration: 0.32, ease: "back.out(3.4)" }, startTime + 0.3)
    .call(() => sfx.playTick(720 + targetIdx * 60), null, startTime + 0.12);
}

/* ─────────────────────────────────────────────────────────────────────────
   REPLAY & CONTROLS MANAGEMENT
───────────────────────────────────────────────────────────────────────── */
function initIntro(autoPlay = true) {
  const metrics = computeMetrics();
  if (masterTimeline) {
    masterTimeline.kill();
  }
  masterTimeline = buildMasterTimeline(metrics);
  if (autoPlay) {
    masterTimeline.play(0);
  }
}

function handleReplay() {
  replayBtn.classList.remove("is-shown");
  replayBtn.hidden = true;
  if (!masterTimeline) {
    initIntro(true);
  } else {
    masterTimeline.restart();
  }
}

// Audio Button Handler
if (soundBtn) {
  soundBtn.addEventListener("click", () => {
    const isAudioOn = sfx.toggle();
    soundBtn.classList.toggle("is-active", isAudioOn);
    soundBtn.innerHTML = isAudioOn
      ? `<span>🔊 SOUND ON</span>`
      : `<span>🔇 SOUND OFF</span>`;
  });
}

// Aspect Ratio Switcher (Full -> 9:16 Vertical -> 16:9 Cinema)
if (ratioBtn && filmWrapper) {
  const modes = ["full", "vertical", "cinema"];
  let modeIndex = 0;

  ratioBtn.addEventListener("click", () => {
    modeIndex = (modeIndex + 1) % modes.length;
    const mode = modes[modeIndex];
    filmWrapper.dataset.mode = mode;

    if (mode === "full") {
      ratioBtn.innerHTML = `<span>📺 RATIO: FULL</span>`;
    } else if (mode === "vertical") {
      ratioBtn.innerHTML = `<span>📱 RATIO: 9:16 REEL</span>`;
    } else {
      ratioBtn.innerHTML = `<span>🎬 RATIO: 16:9 CINEMA</span>`;
    }

    // Recompute bounds after transition
    setTimeout(() => {
      const isProgressEnd = masterTimeline && masterTimeline.progress() === 1;
      const curTime = masterTimeline ? masterTimeline.time() : 0;
      initIntro(false);
      if (isProgressEnd) {
        masterTimeline.progress(1);
      } else if (masterTimeline) {
        masterTimeline.play(curTime);
      }
    }, 420);
  });
}

// Keyboard shortcuts
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    handleReplay();
  } else if (e.code === "KeyM") {
    soundBtn?.click();
  }
});

// Window resize throttling
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const isPlaying = masterTimeline ? masterTimeline.isActive() : false;
    const curTime = masterTimeline ? masterTimeline.time() : 0;
    initIntro(false);
    if (isPlaying) {
      masterTimeline.play(curTime);
    }
  }, 180);
});

// Boot when fonts and DOM are ready
const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (isReducedMotion) {
  stage.classList.add("is-ready");
} else {
  document.fonts.ready.then(() => {
    initIntro(true);
    stage.classList.add("is-ready");
  });
}

if (replayBtn) {
  replayBtn.addEventListener("click", handleReplay);
}

// Global API
window.introAPI = {
  play: handleReplay,
  restart: handleReplay,
  pause: () => masterTimeline && masterTimeline.pause(),
  seek: (t) => masterTimeline && masterTimeline.seek(t),
  enableSound: () => sfx.toggle()
};
