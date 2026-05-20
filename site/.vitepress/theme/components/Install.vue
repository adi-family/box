<template>
  <section class="install">
    <div class="install__inner">
      <p class="install__eyebrow">
        <span class="install__line"></span>
        {{ eyebrow }}
      </p>
      <h2 class="install__title">{{ title }}</h2>
      <p class="install__lead">{{ lead }}</p>

      <div class="install__terminal">
        <div class="install__bar" aria-hidden="true">
          <span class="install__dot install__dot--red"></span>
          <span class="install__dot install__dot--amber"></span>
          <span class="install__dot install__dot--green"></span>
          <span class="install__name">{{ barLabel }}</span>
        </div>
        <div class="install__body">
          <div class="install__row">
            <span class="install__prompt">$</span>
            <span class="install__cmd">
              <span class="install__bin">adi</span>
              <span class="install__sub">plugin install</span>
              <span class="install__pkg">adi.box</span>
            </span>
          </div>
          <div class="install__spacer"></div>
          <div class="install__row">
            <span class="install__prompt">$</span>
            <span class="install__cmd">
              <span class="install__bin">adi</span>
              <span class="install__bin">box</span>
              <span class="install__ellipsis">…</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string;
    title?: string;
    lead?: string;
    barLabel?: string;
  }>(),
  {
    eyebrow: "Install",
    title: "Two commands.",
    lead:
      "Box ships as an adi cli plugin. Install once, then drive it through the adi command line.",
    barLabel: "terminal",
  },
);
</script>

<style scoped>
.install {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  padding: clamp(80px, 14vh, 160px) 24px;
  border-top: 1px solid var(--vp-c-divider);
}

.install__inner {
  max-width: 1240px;
  margin: 0 auto;
}

.install__eyebrow {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0 0 1.5rem;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #c96422;
}

.install__line {
  width: 32px;
  height: 1px;
  background: #c96422;
}

.install__title {
  margin: 0;
  font-size: clamp(32px, 4.5vw, 56px);
  line-height: 1.05;
  letter-spacing: -0.025em;
  font-weight: 700;
  color: var(--vp-c-text-1);
  max-width: 22ch;
}

.install__lead {
  margin: 1.25rem 0 0;
  max-width: 64ch;
  font-size: clamp(15px, 1.4vw, 18px);
  line-height: 1.55;
  color: var(--vp-c-text-2);
}

/* ---------- Terminal card ---------- */

.install__terminal {
  margin: clamp(40px, 6vh, 72px) auto 0;
  max-width: 720px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  background: #050505;
  box-shadow:
    0 24px 80px -32px rgba(0, 0, 0, 0.8),
    0 8px 32px -16px rgba(201, 100, 34, 0.18);
}

.install__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
}

.install__dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  display: inline-block;
}
.install__dot--red   { background: #ff5f57; }
.install__dot--amber { background: #febc2e; }
.install__dot--green { background: #28c840; }

.install__name {
  margin-left: 12px;
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.02em;
}

.install__body {
  padding: 22px 24px;
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 15px;
  line-height: 1.7;
}

.install__row {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.install__spacer {
  height: 12px;
}

.install__prompt {
  color: #c96422;
  font-weight: 600;
  user-select: none;
}

.install__cmd {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  color: rgba(255, 255, 255, 0.92);
}

.install__bin {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
}

.install__sub {
  color: rgba(255, 255, 255, 0.55);
}

.install__pkg {
  color: #ffc799;          /* warm peach — same family as Vesper's keyword */
  font-weight: 500;
}

.install__ellipsis {
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.1em;
}
</style>
