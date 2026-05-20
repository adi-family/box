<template>
  <div
    ref="root"
    class="box-scene"
    @mousemove="onMove"
    @mouseleave="onLeave"
  >
    <div class="box-scene__glow"></div>
    <div class="box-scene__grid"></div>

    <div
      class="box-scene__cube-wrap"
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
import { ref } from "vue";

const root = ref<HTMLElement | null>(null);
const tiltX = ref(-15);
const tiltY = ref(0);

function onMove(e: MouseEvent) {
  if (!root.value) return;
  const rect = root.value.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width; // 0..1
  const py = (e.clientY - rect.top) / rect.height; // 0..1
  // Map mouse position to small tilt offsets layered on the spin
  tiltX.value = -15 + (py - 0.5) * -20;
  tiltY.value = (px - 0.5) * 30;
}

function onLeave() {
  tiltX.value = -15;
  tiltY.value = 0;
}
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
  perspective: 1400px;
  isolation: isolate;
  cursor: crosshair;
}

/* Radial glow behind the cube. */
.box-scene__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at center,
    rgba(139, 92, 246, 0.18) 0%,
    rgba(59, 130, 246, 0.1) 25%,
    transparent 60%
  );
  filter: blur(40px);
  z-index: -2;
  animation: glow-pulse 8s ease-in-out infinite;
}

/* Subtle grid floor behind. */
.box-scene__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 36px 36px;
  -webkit-mask-image: radial-gradient(
    circle at center,
    black 30%,
    transparent 75%
  );
  mask-image: radial-gradient(
    circle at center,
    black 30%,
    transparent 75%
  );
  z-index: -1;
  pointer-events: none;
}

.box-scene__cube-wrap {
  transform-style: preserve-3d;
  transition: transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
}

.box-scene__cube {
  --size: 220px;

  position: relative;
  width: var(--size);
  height: var(--size);
  transform-style: preserve-3d;
  animation: cube-spin 24s linear infinite;
}

.box-scene:hover .box-scene__cube {
  animation-duration: 8s;
}

.box-scene__face {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, #0a0a0a 0%, #161616 50%, #050505 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    inset 0 0 60px rgba(255, 255, 255, 0.03),
    inset 0 0 0 1px rgba(255, 255, 255, 0.02),
    0 0 40px rgba(0, 0, 0, 0.5);
  display: grid;
  place-items: center;
  backface-visibility: visible;
}

.box-scene__face--front  { transform: translateZ(calc(var(--size) / 2)); }
.box-scene__face--back   { transform: rotateY(180deg) translateZ(calc(var(--size) / 2)); }
.box-scene__face--right  { transform: rotateY(90deg)  translateZ(calc(var(--size) / 2)); }
.box-scene__face--left   { transform: rotateY(-90deg) translateZ(calc(var(--size) / 2)); }
.box-scene__face--top    { transform: rotateX(90deg)  translateZ(calc(var(--size) / 2)); }
.box-scene__face--bottom { transform: rotateX(-90deg) translateZ(calc(var(--size) / 2)); }

/* Edge sheen on each face. */
.box-scene__face::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    transparent 40%
  );
  pointer-events: none;
}

.box-scene__mark {
  font-family: var(--vp-font-family-mono, monospace);
  font-weight: 500;
  font-size: 28px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.7);
  text-shadow:
    0 0 18px rgba(139, 92, 246, 0.5),
    0 0 6px rgba(255, 255, 255, 0.2);
}

@keyframes cube-spin {
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(360deg); }
}

@keyframes glow-pulse {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.08); }
}

@media (prefers-reduced-motion: reduce) {
  .box-scene__cube,
  .box-scene__glow {
    animation: none;
  }
}

/* Light theme: a bit less heavy. */
:root:not(.dark) .box-scene__face {
  background:
    linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 50%, #0f0f0f 100%);
  border-color: rgba(255, 255, 255, 0.12);
}
:root:not(.dark) .box-scene__glow {
  background: radial-gradient(
    circle at center,
    rgba(139, 92, 246, 0.22) 0%,
    rgba(59, 130, 246, 0.14) 25%,
    transparent 60%
  );
}
</style>
