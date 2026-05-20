<template>
  <svg
    v-if="path"
    viewBox="0 0 24 24"
    width="18"
    height="18"
    :style="{ color }"
    fill="currentColor"
    aria-hidden="true"
  >
    <path :d="path" />
  </svg>

  <!-- Fallback: MCP doesn't have an official brand logo. Custom mark. -->
  <svg
    v-else-if="name === 'mcp'"
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    :style="{ color: '#c96422' }"
    aria-hidden="true"
  >
    <path d="M4 18 L4 7 L8 12 L12 7 L12 18" />
    <circle cx="17" cy="9" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="20" cy="14" r="1.2" fill="currentColor" stroke="none" />
    <line x1="17.5" y1="10" x2="19.5" y2="13" />
  </svg>

  <span v-else class="lang-icon__text" aria-hidden="true">
    {{ name.slice(0, 2).toUpperCase() }}
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import * as si from "simple-icons";

const props = defineProps<{
  name: string;
}>();

// Each entry pairs the simple-icons SVG path with the colour used to
// render it. We use the official brand hex from simple-icons where it
// reads well on dark, and override (e.g. Rust → site brand orange)
// where the official mark is black and would disappear on the page.
const map: Record<
  string,
  { path: string | undefined; color: string }
> = {
  rust:       { path: (si as any).siRust?.path,              color: "#c96422" },
  python:     { path: (si as any).siPython?.path,            color: `#${(si as any).siPython?.hex}` },
  typescript: { path: (si as any).siTypescript?.path,        color: `#${(si as any).siTypescript?.hex}` },
  go:         { path: (si as any).siGo?.path,                color: `#${(si as any).siGo?.hex}` },
  openapi:    { path: (si as any).siOpenapiinitiative?.path, color: `#${(si as any).siOpenapiinitiative?.hex}` },
};

const entry = computed(() => map[props.name]);
const path = computed(() => entry.value?.path);
const color = computed(() => entry.value?.color);
</script>

<style scoped>
.lang-icon__text {
  font-family: var(--vp-font-family-mono, ui-monospace, monospace);
  font-size: 12px;
  font-weight: 600;
}
</style>
