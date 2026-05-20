<template>
  <section class="hero">
    <canvas ref="canvasRef" class="hero__canvas" aria-hidden="true"></canvas>

    <div class="hero__content">
      <a v-if="eyebrow" class="hero__eyebrow" :href="eyebrow.href">
        <span class="hero__eyebrow-dot"></span>
        <span>{{ eyebrow.text }}</span>
      </a>

      <h1 class="hero__title">{{ title }}</h1>
      <p class="hero__tagline">{{ tagline }}</p>

      <p v-if="features.length" class="hero__features">
        <template v-for="(f, i) in features" :key="i">
          <span v-if="i > 0" class="hero__sep">·</span>
          <span class="hero__feature">{{ f }}</span>
        </template>
      </p>

      <div class="hero__actions">
        <a v-if="primary" class="hero__btn hero__btn--primary" :href="primary.href">
          {{ primary.text }}
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
              d="M6 3l5 5-5 5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </a>
        <a v-if="secondary" class="hero__btn" :href="secondary.href">
          {{ secondary.text }}
        </a>
      </div>
    </div>

    <a class="hero__scroll" href="#below" aria-label="Scroll for more">
      <span class="hero__scroll-dot"></span>
    </a>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";

type Link = { text: string; href: string };

withDefaults(
  defineProps<{
    title?: string;
    tagline?: string;
    features?: string[];
    eyebrow?: Link | null;
    primary?: Link | null;
    secondary?: Link | null;
  }>(),
  {
    title: "BOX",
    tagline: "one source of truth. point.",
    features: () => [
      "infinite extensibility",
      "infinite composition",
      "infinite portability",
    ],
    eyebrow: () => ({
      text: "Draft v0.13 · early development",
      href: "https://github.com/adi-family/box/blob/main/SPEC.md",
    }),
    primary: () => ({
      text: "Get started",
      href: "/box/guide/getting-started",
    }),
    secondary: () => ({
      text: "View on GitHub",
      href: "https://github.com/adi-family/box",
    }),
  },
);

type V3 = [number, number, number];

const canvasRef = ref<HTMLCanvasElement | null>(null);

let ctx: CanvasRenderingContext2D | null = null;
let dpr = 1;
let raf = 0;
let resizeObs: ResizeObserver | null = null;

// Default rotation shows three faces (front, top, right). Mouse moves
// nudge X/Y rotation by a small amount around this baseline.
const BASE_ROT_X = -0.4;
const BASE_ROT_Y = -0.45;
let targetRotX = BASE_ROT_X;
let targetRotY = BASE_ROT_Y;
let rotX = BASE_ROT_X;
let rotY = BASE_ROT_Y;

// Unit cube vertices.
const verts: V3[] = [
  [-1, -1, -1], [ 1, -1, -1], [ 1,  1, -1], [-1,  1, -1],
  [-1, -1,  1], [ 1, -1,  1], [ 1,  1,  1], [-1,  1,  1],
];

// 6 faces, CCW winding from outside the cube.
const faces: number[][] = [
  [0, 3, 2, 1], // back  (z = -1)
  [4, 5, 6, 7], // front (z = +1)
  [0, 4, 7, 3], // left  (x = -1)
  [1, 2, 6, 5], // right (x = +1)
  [0, 1, 5, 4], // top   (y = -1)
  [3, 7, 6, 2], // bottom (y = +1)
];

// All 12 edges of the cube. Drawn unconditionally so the far-side
// edges show through the front faces (x-ray look).
const edges: [number, number][] = [
  // back face perimeter
  [0, 1], [1, 2], [2, 3], [3, 0],
  // front face perimeter
  [4, 5], [5, 6], [6, 7], [7, 4],
  // connecting edges (back ↔ front)
  [0, 4], [1, 5], [2, 6], [3, 7],
];

function rotateX(v: V3, a: number): V3 {
  const [x, y, z] = v;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x, y * c - z * s, y * s + z * c];
}

function rotateY(v: V3, a: number): V3 {
  const [x, y, z] = v;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c + z * s, y, -x * s + z * c];
}

function project(v: V3, w: number, h: number, scale: number, persp: number): [number, number] {
  const [x, y, z] = v;
  const f = persp / (persp - z);
  return [w / 2 + x * scale * f, h / 2 + y * scale * f];
}

function resize() {
  const c = canvasRef.value;
  if (!c || !ctx) return;
  dpr = window.devicePixelRatio || 1;
  c.width = Math.round(c.clientWidth * dpr);
  c.height = Math.round(c.clientHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function onMouseMove(e: MouseEvent) {
  const px = e.clientX / window.innerWidth;  // 0..1
  const py = e.clientY / window.innerHeight; // 0..1
  // Subtle mouse-driven offsets around the baseline 3-face view.
  targetRotY = BASE_ROT_Y + (px - 0.5) * Math.PI * 0.3;
  targetRotX = BASE_ROT_X - (py - 0.5) * 0.3;
}

function tracePath(face: number[], projected: [number, number][]) {
  if (!ctx) return;
  ctx.beginPath();
  const p0 = projected[face[0]];
  ctx.moveTo(p0[0], p0[1]);
  for (let i = 1; i < face.length; i++) {
    const p = projected[face[i]];
    ctx.lineTo(p[0], p[1]);
  }
  ctx.closePath();
}

function draw() {
  const c = canvasRef.value;
  if (!c || !ctx) return;
  const w = c.clientWidth;
  const h = c.clientHeight;

  if (w === 0 || h === 0) {
    raf = requestAnimationFrame(draw);
    return;
  }

  rotX += (targetRotX - rotX) * 0.08;
  rotY += (targetRotY - rotY) * 0.08;

  const rotated = verts.map((v) => rotateY(rotateX(v, rotX), rotY));

  const scale = Math.min(Math.min(w, h) * 0.25, 320);
  const persp = 5;
  const projected = rotated.map((v) => project(v, w, h, scale, persp));

  ctx.clearRect(0, 0, w, h);

  // Build the visible-face list with backface culling.
  const visible = faces
    .map((face) => {
      const v0 = rotated[face[0]];
      const v1 = rotated[face[1]];
      const vL = rotated[face[face.length - 1]];
      // Z component of (v1 - v0) × (vL - v0). Positive = front-facing.
      const nz =
        (v1[0] - v0[0]) * (vL[1] - v0[1]) -
        (v1[1] - v0[1]) * (vL[0] - v0[0]);
      return {
        face,
        avgZ: face.reduce((s, i) => s + rotated[i][2], 0) / 4,
        nz,
      };
    })
    .filter((f) => f.nz > 0)
    .sort((a, b) => a.avgZ - b.avgZ);

  // Pass 1: fill front-facing faces with pure black so the cube reads
  // as solid from the visible side.
  ctx.fillStyle = "#000";
  for (const { face } of visible) {
    tracePath(face, projected);
    ctx.fill();
  }

  // Pass 2: stroke ALL 12 edges, including the ones on the far side.
  // Drawn on top of the fills, so back-side edges read as faint lines
  // crossing through the cube (x-ray view).
  ctx.lineWidth = 1.4;
  ctx.lineCap = "round";
  for (const [a, b] of edges) {
    const avgZ = (rotated[a][2] + rotated[b][2]) / 2;
    const shade = Math.max(0, Math.min(1, (avgZ + 1) / 2));
    // Near edges: bright. Far (back-side) edges: faint but visible.
    const alpha = 0.22 + shade * 0.6;
    ctx.strokeStyle = `rgba(201, 100, 34, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(projected[a][0], projected[a][1]);
    ctx.lineTo(projected[b][0], projected[b][1]);
    ctx.stroke();
  }

  raf = requestAnimationFrame(draw);
}

onMounted(() => {
  const c = canvasRef.value;
  if (!c) return;
  ctx = c.getContext("2d");

  resizeObs = new ResizeObserver(() => resize());
  resizeObs.observe(c);
  resize();

  window.addEventListener("mousemove", onMouseMove, { passive: true });
  raf = requestAnimationFrame(draw);
});

onBeforeUnmount(() => {
  if (resizeObs) {
    resizeObs.disconnect();
    resizeObs = null;
  }
  window.removeEventListener("mousemove", onMouseMove);
  cancelAnimationFrame(raf);
});
</script>

<style scoped>
.hero {
  position: relative;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  height: 90vh;
  min-height: 640px;
}

.hero__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.hero__content {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  pointer-events: none;       /* let mouse-move hit canvas... */
  z-index: 1;
  padding: 0 24px;
}

/* ...except for clickable affordances. */
.hero__eyebrow,
.hero__actions {
  pointer-events: auto;
}

/* ---------- Eyebrow badge ---------- */

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  margin-bottom: 1.75rem;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.hero__eyebrow:hover {
  border-color: rgba(201, 100, 34, 0.4);
  color: #fff;
}

.hero__eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c96422;
  box-shadow: 0 0 10px rgba(201, 100, 34, 0.6);
  animation: pulse 2.4s ease-in-out infinite;
}

/* ---------- Title / tagline / features ---------- */

.hero__title {
  font-size: clamp(64px, 12vmin, 180px);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  margin: 0;
  color: #fff;
  text-shadow:
    0 4px 24px rgba(0, 0, 0, 0.6),
    0 0 60px rgba(201, 100, 34, 0.18);
}

.hero__tagline {
  margin: 1.25rem 0 0;
  max-width: 36ch;
  font-size: clamp(16px, 1.8vmin, 20px);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.78);
  letter-spacing: 0.02em;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
  line-height: 1.45;
}

.hero__features {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: baseline;
  column-gap: 0.85rem;
  row-gap: 0.4rem;
  margin: 1.75rem 0 0;
  font-size: clamp(12px, 1.3vmin, 14px);
  letter-spacing: 0.06em;
  text-transform: lowercase;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.6);
}

.hero__feature {
  color: rgba(255, 255, 255, 0.55);
}

.hero__sep {
  color: rgba(201, 100, 34, 0.7);
  font-weight: 700;
}

/* ---------- CTAs ---------- */

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 2.25rem;
}

.hero__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  padding: 12px 22px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-decoration: none;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: transform 0.2s ease, background 0.2s ease,
    border-color 0.2s ease;
}

.hero__btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.24);
  transform: translateY(-1px);
}

.hero__btn--primary {
  background: #c96422;
  border-color: #c96422;
  color: #fff;
  box-shadow: 0 8px 24px -8px rgba(201, 100, 34, 0.6);
}

.hero__btn--primary:hover {
  background: #b15518;
  border-color: #b15518;
}

.hero__btn svg {
  transition: transform 0.2s ease;
}

.hero__btn:hover svg {
  transform: translateX(2px);
}

/* ---------- Scroll cue ---------- */

.hero__scroll {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: grid;
  place-items: start center;
  padding-top: 8px;
  pointer-events: auto;
  z-index: 1;
  opacity: 0.65;
  transition: opacity 0.2s ease, border-color 0.2s ease;
}

.hero__scroll:hover {
  opacity: 1;
  border-color: rgba(201, 100, 34, 0.6);
}

.hero__scroll-dot {
  width: 3px;
  height: 6px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.85);
  animation: scroll-bounce 2s ease-in-out infinite;
}

/* ---------- Animations ---------- */

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.55; transform: scale(0.85); }
}

@keyframes scroll-bounce {
  0%, 100% { transform: translateY(0);   opacity: 0.95; }
  50%      { transform: translateY(14px); opacity: 0.2; }
}

@media (prefers-reduced-motion: reduce) {
  .hero__eyebrow-dot,
  .hero__scroll-dot {
    animation: none;
  }
}
</style>
