<template>
  <NConfigProvider :date-locale="naiveDateLocale" :locale="naiveLocale" :theme="darkTheme" :theme-overrides="themeOverrides">
    <NGlobalStyle />
    <main class="app-shell">
      <StagePanel
        ref="stagePanelRef"
        :background-info="backgroundInfo"
        :background-visible="backgroundVisible"
        :particle-count="particleCount"
        :paused="paused"
        @choose-background="chooseBackground"
        @clear-background="clearBackground"
        @center="centerEmitter"
        @reset="resetParticles"
        @toggle-background="toggleBackground"
        @toggle-pause="togglePause"
        @pointer-down="beginDrag"
        @pointer-move="dragEmitter"
        @pointer-up="endDrag"
        @nudge-emitter="nudgeEmitter"
      />
      <InspectorPanel
        ref="inspectorPanelRef"
        :state="state"
        :texture-size="textureSize"
        :presets="presetOptions"
        :blend-options="blendOptions"
        @load-preset="loadPreset"
        @choose-texture="chooseTexture"
        @texture-drop="loadDroppedTextures"
        @import-plist="choosePlist"
        @export-plist="exportPlistFile"
        @export-texture="exportTextureFile"
        @export-all="exportAllZip"
      />
    </main>

    <input ref="backgroundInputRef" type="file" accept="image/png,image/jpeg,image/webp" hidden @change="onBackgroundInput" />
    <input ref="textureInputRef" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden @change="onTextureInput" />
    <input ref="plistInputRef" type="file" accept=".plist,text/xml,application/xml" hidden @change="onPlistInput" />
  </NConfigProvider>
</template>

<script setup lang="ts">
import { darkTheme, dateEnUS, dateZhCN, enUS, NConfigProvider, NGlobalStyle, zhCN } from "naive-ui";
import type { GlobalThemeOverrides } from "naive-ui";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, shallowRef, useTemplateRef, watch } from "vue";
import { useI18n } from "vue-i18n";
import InspectorPanel from "./components/InspectorPanel.vue";
import StagePanel from "./components/StagePanel.vue";
import { downloadBlob } from "./domain/download";
import { firstImageFile, textureFilesFromDrop } from "./domain/files";
import { ParticleEngine, type BackgroundImageInfo } from "./domain/particle-engine";
import { BLEND_MAP, PRESET_NAMES, PRESETS, createInitialState, type PresetName } from "./domain/presets";
import { createPlist, importedPlistState, parsePlistDict } from "./domain/plist";
import type { ParticleFile, ParticleState } from "./domain/types";
import { makeZip, sanitizeFileName } from "./domain/zip";

type StageExpose = InstanceType<typeof StagePanel>;

type InspectorExpose = InstanceType<typeof InspectorPanel>;

const state = reactive<ParticleState>(createInitialState());
const particleCount = shallowRef("0 / 0");
const textureSize = shallowRef("64 x 64");
const paused = shallowRef(false);
const backgroundInfo = shallowRef<BackgroundImageInfo | null>(null);
const backgroundVisible = shallowRef(true);
const { locale, t } = useI18n();

const stagePanelRef = useTemplateRef<StageExpose>("stagePanelRef");
const inspectorPanelRef = useTemplateRef<InspectorExpose>("inspectorPanelRef");
const backgroundInputRef = useTemplateRef<HTMLInputElement>("backgroundInputRef");
const textureInputRef = useTemplateRef<HTMLInputElement>("textureInputRef");
const plistInputRef = useTemplateRef<HTMLInputElement>("plistInputRef");

let engine: ParticleEngine | null = null;

const activeLocale = computed(() => (locale.value === "en-US" ? "en-US" : "zh-CN"));
const naiveLocale = computed(() => (activeLocale.value === "zh-CN" ? zhCN : enUS));
const naiveDateLocale = computed(() => (activeLocale.value === "zh-CN" ? dateZhCN : dateEnUS));
const presetOptions = computed(() => PRESET_NAMES.map((value) => ({ value, label: t(`presets.${value}`) })));
const blendOptions = Object.keys(BLEND_MAP).map((value) => ({ value, label: value }));

const themeOverrides: GlobalThemeOverrides = {
  common: {
    borderRadius: "6px",
    primaryColor: "#37d6b0",
    primaryColorHover: "#55e5c4",
    primaryColorPressed: "#22a58a",
    primaryColorSuppl: "#37d6b0",
    infoColor: "#69c6ff",
    bodyColor: "#111418",
    cardColor: "#181d24",
    modalColor: "#181d24",
    popoverColor: "#202731",
    inputColor: "#10151c",
    borderColor: "#323b48",
    dividerColor: "#323b48",
    textColorBase: "#eef4ff",
    textColor1: "#eef4ff",
    textColor2: "#c7d2e1",
    textColor3: "#8f9daf",
    fontFamily: "\"Microsoft YaHei\", \"Segoe UI\", Arial, sans-serif",
  },
  Button: {
    borderRadiusSmall: "6px",
    heightSmall: "28px",
    fontSizeSmall: "12px",
  },
  Input: {
    heightSmall: "26px",
    fontSizeSmall: "12px",
    borderRadius: "6px",
    color: "#10151c",
    colorFocus: "#10151c",
    textColor: "#edf4ff",
    caretColor: "#69c6ff",
    placeholderColor: "#6f7c8c",
    border: "1px solid #323b48",
    borderHover: "1px solid #465364",
    borderFocus: "1px solid #69c6ff",
    boxShadowFocus: "0 0 0 2px rgba(105, 198, 255, 0.18)",
  },
  Collapse: {
    titleFontSize: "12px",
    titleTextColor: "#37d6b0",
    dividerColor: "#323b48",
  },
};

function textureCanvas(): HTMLCanvasElement | null {
  return inspectorPanelRef.value?.getTextureCanvas() || null;
}

function updateTexturePreview(): void {
  const canvas = textureCanvas();
  if (engine && canvas) textureSize.value = engine.drawTexturePreview(canvas);
}

function resetParticles(): void {
  engine?.resetParticles();
}

function centerEmitter(): void {
  engine?.centerEmitter();
  engine?.resetParticles();
}

function togglePause(): void {
  paused.value = !paused.value;
  engine?.setPaused(paused.value);
}

function beginDrag(event: PointerEvent): void {
  engine?.beginDrag(event);
}

function dragEmitter(event: PointerEvent): void {
  engine?.drag(event);
}

function endDrag(): void {
  engine?.endDrag();
}

function nudgeEmitter(dx: number, dy: number): void {
  engine?.nudgeEmitter(dx, dy);
}

function loadPreset(name: string): void {
  const preset = PRESETS[name as PresetName];
  if (!preset) return;
  Object.assign(state, preset);
  resetParticles();
}

function chooseTexture(): void {
  textureInputRef.value?.click();
}

function chooseBackground(): void {
  backgroundInputRef.value?.click();
}

function toggleBackground(): void {
  if (!backgroundInfo.value) return;
  backgroundVisible.value = !backgroundVisible.value;
  engine?.setBackgroundVisible(backgroundVisible.value);
}

function clearBackground(): void {
  backgroundInfo.value = null;
  backgroundVisible.value = true;
  engine?.clearBackground();
}

function choosePlist(): void {
  plistInputRef.value?.click();
}

async function loadTextureFromFile(file: ParticleFile): Promise<void> {
  if (!engine) return;
  Object.assign(state, await engine.loadTextureFile(file));
  updateTexturePreview();
}

async function loadTextureFiles(files: Iterable<File>): Promise<void> {
  const file = firstImageFile(files);
  if (file) await loadTextureFromFile(file);
}

async function loadDroppedTextures(dataTransfer: DataTransfer): Promise<void> {
  await loadTextureFiles(await textureFilesFromDrop(dataTransfer));
}

function onTextureInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (input.files) void loadTextureFiles(input.files);
  input.value = "";
}

async function onBackgroundInput(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files ? firstImageFile(input.files) : undefined;
  if (file && engine) {
    backgroundInfo.value = await engine.loadBackgroundFile(file);
    backgroundVisible.value = true;
  }
  input.value = "";
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error(t("errors.readPlist")));
    reader.readAsText(file);
  });
}

async function onPlistInput(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    const data = parsePlistDict(await readFileAsText(file));
    Object.assign(state, importedPlistState(data, state));
    resetParticles();
  }
  input.value = "";
}

function exportPlistFile(): void {
  const filename = `${state.saveName || "particle"}.plist`;
  downloadBlob(new Blob([createPlist(state)], { type: "application/xml" }), filename);
}

async function exportTextureFile(): Promise<void> {
  if (!engine) return;
  const filename = state.textureName || `${state.saveName || "particle"}.png`;
  const blob = await engine.texturePngBlob();
  if (blob) downloadBlob(blob, filename);
}

async function exportAllZip(): Promise<void> {
  if (!engine) return;
  const baseName = sanitizeFileName(state.saveName, "particle");
  const plistName = `${baseName}.plist`;
  const textureName = sanitizeFileName(state.textureName || `${baseName}.png`, `${baseName}.png`);
  const pngBlob = await engine.texturePngBlob();
  if (!pngBlob) return;

  const zipBlob = makeZip([
    { name: plistName, data: new TextEncoder().encode(createPlist(state)) },
    { name: textureName, data: await pngBlob.arrayBuffer() },
  ]);
  downloadBlob(zipBlob, `${baseName}.zip`);
}

function fitCanvas(): void {
  engine?.fitCanvas();
}

// 这些字段只影响展示/导出命名，改动它们不应重置粒子模拟
const NON_SIMULATION_FIELDS = new Set(["saveName", "textureName", "texturePath", "backgroundColor"]);

watch(
  () => Object.keys(state)
    .filter((key) => !NON_SIMULATION_FIELDS.has(key))
    .map((key) => state[key as keyof ParticleState]),
  () => {
    resetParticles();
  },
);

let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  await nextTick();
  const canvas = stagePanelRef.value?.getCanvas();
  if (!canvas) return;

  engine = new ParticleEngine(canvas, state, (value) => {
    particleCount.value = value;
  });
  await engine.makeDefaultTexture();
  updateTexturePreview();
  engine.fitCanvas();
  engine.start();
  // window resize 覆盖 DPR 变化，ResizeObserver 覆盖窗口不变时的布局变化
  window.addEventListener("resize", fitCanvas);
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(fitCanvas);
    resizeObserver.observe(canvas);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", fitCanvas);
  resizeObserver?.disconnect();
  resizeObserver = null;
  engine?.stop();
});
</script>
