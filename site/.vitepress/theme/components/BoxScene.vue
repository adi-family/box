<template>
  <div class="box-scene">
    <div class="box-scene__glow" aria-hidden="true"></div>
    <div class="box-scene__grid" aria-hidden="true"></div>
    <div class="box-scene__grain" aria-hidden="true"></div>

    <div
      class="box-scene__stage"
      :style="{
        transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
      }"
    >
      <div class="box-scene__cube">
        <div class="box-scene__face box-scene__face--front">
          <span class="box-scene__mark">box</span>
        </div>
        <div class="box-scene__face box-scene__face--back"></div>
        <div class="box-scene__face box-scene__face--right"></div>
        <div class="box-scene__face box-scene__face--left"></div>
        <div class="box-scene__face box-scene__face--top"></div>
        <div class="box-scene__face box-scene__face--bottom"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

// Tilt is mouse-driven; rotation is driven by CSS keyframes on .__cube.
const tiltX = ref(-12);
const tiltY = ref(0);

let raf = 0;
let targetX = -12;
let targetY = 0;

function onMouseMove(e: MouseEvent) {
  const px = e.clientX / window.innerWidth; // 0..1
  const py = e.clientY / window.innerHeight; // 0..1
  targetX = -12 + (py - 0.5) * -22;
  targetY = (px - 0.5) * 40;
}

// Smooth easing so the cube doesn't snap.
function loop() {
  tiltX.value += (targetX - tiltX.value) * 0.08;
  tiltY.value += (targetY - tiltY.value) * 0.08;
  raf = requestAnimationFrame(loop);
}

onMounted(() => {
  window.addEventListener("mousemove", onMouseMove, { passive: true });
  raf = requestAnimationFrame(loop);
});

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", onMouseMove);
  cancelAnimationFrame(raf);
});
</script>

<style scoped>
.box-scene {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  max-width: 480px;
  margin: 0 auto;
  display: grid;
  place-items: center;
  perspective: 1100px;
  isolation: isolate;
}

/* ---------- Backdrop layers ---------- */

/* Multi-source blurred gradient. Three offset circles keep colour
 * transitions short enough not to band; blur smooths what remains. */
.box-scene__glow {
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(circle at 30% 35%, rgba(167, 139, 250, 0.30) 0%, transparent 32%),
    radial-gradient(circle at 70% 65%, rgba( 96, 165, 250, 0.22) 0%, transparent 38%),
    radial-gradient(circle at 50% 50%, rgba(139,  92, 246, 0.18) 0%, transparent 52%);
  filter: blur(64px);
  z-index: -3;
  animation: glow-drift 16s ease-in-out infinite;
}

/* SVG turbulence noise to break up any residual gradient steps. */
.box-scene__grain {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  opacity: 0.07;
  mix-blend-mode: overlay;
  pointer-events: none;
  z-index: -1;
}

.box-scene__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right,  rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
  background-size: 36px 36px;
  -webkit-mask-image: radial-gradient(circle at center, black 22%, transparent 78%);
          mask-image: radial-gradient(circle at center, black 22%, transparent 78%);
  z-index: -2;
  pointer-events: none;
}

/* ---------- Cube ---------- */

.box-scene__stage {
  transform-style: preserve-3d;
  /* mouse-driven tilt is applied inline; the spin is on the inner cube */
}

.box-scene__cube {
  --size: 220px;
  position: relative;
  width: var(--size);
  height: var(--size);
  transform-style: preserve-3d;
  animation: cube-spin 28s linear infinite;
}

.box-scene__face {
  position: absolute;
  inset: 0;
  /* Flat dark fill — no internal gradient → no banding. */
  background: #0c0c0c;
  /* Brand-colored hairline edge + outer glow + subtle inner glow. */
  border: 1px solid rgba(167, 139, 250, 0.22);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    inset 0 0 36px rgba(139, 92, 246, 0.10),
    0 0 60px rgba(139, 92, 246, 0.16);
  display: grid;
  place-items: center;
  overflow: hidden;
}

/* Sheen highlight at the upper-left corner. */
.box-scene__face::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.10) 0%,
    rgba(255, 255, 255, 0.03) 28%,
    transparent 60%
  );
  pointer-events: none;
}

/* Scanning beam — vertical light sweep, staggered per face. */
.box-scene__face::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    transparent 46%,
    rgba(167, 139, 250, 0.55) 50%,
    transparent 54%,
    transparent 100%
  );
  background-size: 100% 220%;
  animation: scan 6s ease-in-out infinite;
  mix-blend-mode: screen;
  pointer-events: none;
  opacity: 0.85;
}

.box-scene__face--front  { transform: translateZ(calc(var(--size) / 2)); }
.box-scene__face--front::after  { animation-delay:   0s; }

.box-scene__face--back   { transform: rotateY(180deg) translateZ(calc(var(--size) / 2)); }
.box-scene__face--back::after   { animation-delay: 3.0s; }

.box-scene__face--right  { transform: rotateY(90deg)  translateZ(calc(var(--size) / 2)); }
.box-scene__face--right::after  { animation-delay: 1.0s; }

.box-scene__face--left   { transform: rotateY(-90deg) translateZ(calc(var(--size) / 2)); }
.box-scene__face--left::after   { animation-delay: 4.0s; }

.box-scene__face--top    { transform: rotateX(90deg)  translateZ(calc(var(--size) / 2)); }
.box-scene__face--top::after    { animation-delay: 2.0s; }

.box-scene__face--bottom { transform: rotateX(-90deg) translateZ(calc(var(--size) / 2)); }
.box-scene__face--bottom::after { animation-delay: 5.0s; }

.box-scene__mark {
  position: relative;
  z-index: 2;            /* sit above the scan beam */
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-weight: 500;
  font-size: 30px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.88);
  text-shadow:
    0 0 24px rgba(167, 139, 250, 0.70),
    0 0  8px rgba(255, 255, 255, 0.30);
}

/* ---------- Animations ---------- */

@keyframes cube-spin {
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(360deg); }
}

@keyframes scan {
  0%   { background-position: 0% -110%; }
  55%  { background-position: 0% 210%;  }
  100% { background-position: 0% 210%;  }
}

@keyframes glow-drift {
  0%, 100% { transform: translate(0, 0)   scale(1);    opacity: 0.85; }
  50%      { transform: translate(-3%, 2%) scale(1.06); opacity: 1;    }
}

@media (prefers-reduced-motion: reduce) {
  .box-scene__cube,
  .box-scene__glow,
  .box-scene__face::after {
    animation: none;
  }
}

/* ---------- Light theme tweaks ---------- */

:root:not(.dark) .box-scene__face {
  background: #181818;
  border-color: rgba(139, 92, 246, 0.28);
}
</style>
