<template>
  <section class="pipeline">
    <div class="pipeline__inner">
      <p class="pipeline__eyebrow">
        <span class="pipeline__line"></span>
        {{ eyebrow }}
      </p>
      <h2 class="pipeline__title">{{ title }}</h2>
      <p class="pipeline__lead">{{ lead }}</p>

      <!-- Kind tabs -->
      <div class="pipeline__tabs" role="tablist">
        <button
          v-for="t in tabs"
          :key="t.id"
          :class="['pipeline__tab', { 'is-active': active === t.id }]"
          :aria-selected="active === t.id"
          role="tab"
          @click="active = t.id"
        >
          {{ t.label }}
        </button>
      </div>

      <div class="pipeline__split">
        <!-- Source -->
        <div class="pipeline__source">
          <div class="pipeline__bar" aria-hidden="true">
            <span class="pipeline__dot pipeline__dot--red"></span>
            <span class="pipeline__dot pipeline__dot--amber"></span>
            <span class="pipeline__dot pipeline__dot--green"></span>
            <span class="pipeline__name">{{ currentFilename }}</span>
          </div>
          <div class="pipeline__code">
            <div v-show="active === 'http'"><slot name="http" /></div>
            <div v-show="active === 'mcp'"><slot name="mcp" /></div>
            <div v-show="active === 'cli'"><slot name="cli" /></div>
          </div>
        </div>

        <!-- Arrow -->
        <div class="pipeline__arrow" aria-hidden="true">
          <svg viewBox="0 0 40 12" width="40" height="12">
            <path
              d="M0 6 L36 6 M30 1 L36 6 L30 11"
              stroke="rgba(201, 100, 34, 0.7)"
              stroke-width="1.6"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <!-- Outputs -->
        <div class="pipeline__outputs">
          <p class="pipeline__outputs-label">{{ outputsLabel }}</p>
          <ul class="pipeline__targets">
            <li
              v-for="t in currentTargets"
              :key="t.name"
              class="pipeline__target"
            >
              <span class="pipeline__symbol">
                <LangIcon :name="t.icon" />
              </span>
              <div class="pipeline__target-body">
                <span class="pipeline__target-name">{{ t.name }}</span>
                <span class="pipeline__target-framework">{{ t.framework }}</span>
              </div>
              <div class="pipeline__chips">
                <span
                  v-for="c in t.chips"
                  :key="c"
                  class="pipeline__chip"
                >
                  {{ chipLabel(c) }}
                </span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import LangIcon from "./LangIcon.vue";

type KindId = "http" | "mcp" | "cli";

type Target = {
  icon: string;
  name: string;
  framework: string;
  chips: string[];
};

const tabs: { id: KindId; label: string }[] = [
  { id: "http", label: "http" },
  { id: "mcp",  label: "mcp" },
  { id: "cli",  label: "cli" },
];

const filenames: Record<KindId, string> = {
  http: "user-service/http.box",
  mcp:  "user-service/mcp.box",
  cli:  "box/box/cli.box",
};

// Chips are stored as keys; the label map (default English, overridable
// via the `chipLabels` prop) renders the visible text. Lets locale pages
// translate just the words without re-stating every row of `targets`.
const targets: Record<KindId, Target[]> = {
  http: [
    { icon: "rust",       name: "Rust",        framework: "axum · reqwest",   chips: ["client", "server"] },
    { icon: "python",     name: "Python",      framework: "FastAPI · httpx",  chips: ["client", "server"] },
    { icon: "typescript", name: "TypeScript",  framework: "Fastify · fetch",  chips: ["client", "server"] },
    { icon: "go",         name: "Go",          framework: "net/http · chi",   chips: ["client", "server"] },
    { icon: "openapi",    name: "OpenAPI 3.x", framework: "JSON · YAML",      chips: ["spec"] },
  ],
  mcp: [
    { icon: "rust",       name: "Rust",       framework: "tokio · jsonrpsee", chips: ["server"] },
    { icon: "python",     name: "Python",     framework: "mcp · asyncio",     chips: ["server"] },
    { icon: "typescript", name: "TypeScript", framework: "MCP SDK · node",    chips: ["server"] },
    { icon: "go",         name: "Go",         framework: "json-rpc · stdio",  chips: ["server"] },
  ],
  cli: [
    { icon: "rust", name: "Rust", framework: "lib-plugin-abi-v3 · cdylib", chips: ["adi_plugin"] },
  ],
};

const defaultChipLabels: Record<string, string> = {
  client: "Client",
  server: "Server",
  spec: "Spec",
  tools: "Tools",
  adi_plugin: "adi plugin",
};

const chipLabel = (key: string): string =>
  props.chipLabels?.[key] ?? defaultChipLabels[key] ?? key;

const props = withDefaults(
  defineProps<{
    eyebrow?: string;
    title?: string;
    lead?: string;
    outputsLabel?: string;
    chipLabels?: Record<string, string>;
  }>(),
  {
    eyebrow: "Source → outputs",
    title: "One source. Every consumer.",
    lead:
      "Plugins claim kinds for the surfaces you expose; target plugins emit the clients, servers and specs. Change the source, every consumer follows.",
    outputsLabel: "Generates",
    chipLabels: () => ({}),
  },
);

const active = ref<KindId>("http");
const currentFilename = computed(() => filenames[active.value]);
const currentTargets  = computed(() => targets[active.value]);
</script>

<style scoped>
.pipeline {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  padding: clamp(80px, 14vh, 160px) 24px;
  border-top: 1px solid var(--vp-c-divider);
}

.pipeline__inner {
  max-width: 1240px;
  margin: 0 auto;
}

/* ---------- Header ---------- */

.pipeline__eyebrow {
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

.pipeline__line {
  width: 32px;
  height: 1px;
  background: #c96422;
}

.pipeline__title {
  margin: 0;
  font-size: clamp(32px, 4.5vw, 56px);
  line-height: 1.05;
  letter-spacing: -0.025em;
  font-weight: 700;
  color: var(--vp-c-text-1);
  max-width: 22ch;
}

.pipeline__lead {
  margin: 1.25rem 0 0;
  max-width: 64ch;
  font-size: clamp(15px, 1.4vw, 18px);
  line-height: 1.55;
  color: var(--vp-c-text-2);
}

/* ---------- Tabs ---------- */

.pipeline__tabs {
  display: flex;
  gap: 4px;
  margin: clamp(40px, 6vh, 64px) 0 24px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.pipeline__tab {
  appearance: none;
  border: none;
  background: transparent;
  padding: 12px 18px;
  font: inherit;
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--vp-c-text-3);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.pipeline__tab:hover {
  color: var(--vp-c-text-1);
}

.pipeline__tab.is-active {
  color: var(--vp-c-text-1);
  border-bottom-color: #c96422;
}

/* ---------- Split layout ---------- */

.pipeline__split {
  display: grid;
  gap: 28px;
  align-items: start;
  /* Equal columns — code panel no longer dominates the outputs list. */
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
}

@media (max-width: 1080px) {
  .pipeline__split {
    grid-template-columns: 1fr;
  }
  .pipeline__arrow {
    transform: rotate(90deg);
    justify-self: center;
  }
}

/* ---------- Source panel ---------- */

.pipeline__source {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  background: #050505;
  box-shadow:
    0 24px 80px -32px rgba(0, 0, 0, 0.8),
    0 8px 32px -16px rgba(201, 100, 34, 0.18);
}

.pipeline__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 13px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
}

.pipeline__dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  display: inline-block;
}
.pipeline__dot--red   { background: #ff5f57; }
.pipeline__dot--amber { background: #febc2e; }
.pipeline__dot--green { background: #28c840; }

.pipeline__name {
  margin-left: 12px;
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.02em;
}

.pipeline__code {
  max-height: 480px;
  overflow-y: auto;
}

/* Reset the entire VitePress code-block chrome stack so nothing adds
 * top/bottom padding outside our own <pre> rules. */
.pipeline__code :deep(div[class*="language-"]) {
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
}

.pipeline__code :deep(pre) {
  margin: 0 !important;
  padding: 14px 20px !important;
  background: transparent !important;
  font-size: 13px !important;
  line-height: 1.6 !important;
}

.pipeline__code :deep(code) {
  display: block;
  padding: 0 !important;
  font-size: 13px !important;
  background: transparent !important;
}

/* Hide VitePress's copy button and language label — the file chrome
 * bar above already identifies the block, and the button reserves
 * vertical space that pushes the first code line down. */
.pipeline__code :deep(button.copy) {
  display: none !important;
}

.pipeline__code :deep(.lang) {
  display: none !important;
}

/* ---------- Arrow ---------- */

.pipeline__arrow {
  align-self: center;
  justify-self: center;
  width: 40px;
  padding: 0 4px;
  opacity: 0.85;
}

/* ---------- Outputs ---------- */

.pipeline__outputs {
  padding: 6px 0;
}

.pipeline__outputs-label {
  margin: 0 0 14px;
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.pipeline__targets {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pipeline__target {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  transition: border-color 0.2s ease, transform 0.15s ease;
}

.pipeline__target:hover {
  border-color: rgba(201, 100, 34, 0.4);
  transform: translateX(2px);
}

.pipeline__symbol {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  /* Neutral container — each icon brings its own brand colour. */
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-elv);
}

.pipeline__target-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pipeline__target-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  letter-spacing: -0.005em;
}

.pipeline__target-framework {
  margin-top: 2px;
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 12px;
  color: var(--vp-c-text-3);
  letter-spacing: 0.01em;
}

.pipeline__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: flex-end;
}

.pipeline__chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-elv);
  white-space: nowrap;
}
</style>
