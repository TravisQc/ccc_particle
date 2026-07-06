<script setup lang="ts">
import { computed, shallowRef, useTemplateRef } from "vue";
import { NButton, NButtonGroup, NColorPicker, NIcon, NInput, NInputNumber, NSelect, NSwitch } from "naive-ui";
import { Archive, Download, FileInput, FolderOpen, ImagePlus, Upload } from "@lucide/vue";
import { useI18n } from "vue-i18n";
import InspectorSection from "./InspectorSection.vue";
import LanguageSwitcher from "./LanguageSwitcher.vue";
import AxisField from "./fields/AxisField.vue";
import ColorField from "./fields/ColorField.vue";
import NumberField from "./fields/NumberField.vue";
import PairField from "./fields/PairField.vue";
import SelectField, { type SelectOption } from "./fields/SelectField.vue";
import TextField from "./fields/TextField.vue";
import type { EmitterType, ParticleState, PositionType } from "../domain/types";

type ColorPickerMode = "rgb" | "hsl" | "hsv" | "hex";

const props = defineProps<{
  state: ParticleState;
  textureSize: string;
  presets: SelectOption[];
  blendOptions: SelectOption[];
}>();

const emit = defineEmits<{
  importPlist: [];
  exportPlist: [];
  exportTexture: [];
  exportAll: [];
  chooseTexture: [];
  loadPreset: [preset: string];
  textureDrop: [dataTransfer: DataTransfer];
}>();

const selectedPreset = shallowRef("fireworks");
const dragOver = shallowRef(false);
const textureCanvasRef = useTemplateRef<HTMLCanvasElement>("textureCanvasRef");
const { t } = useI18n();
const colorModes: ColorPickerMode[] = ["hex"];

const positionTypeOptions: Array<{ value: PositionType; label: PositionType }> = [
  { value: "FREE", label: "FREE" },
  { value: "RELATIVE", label: "RELATIVE" },
  { value: "GROUPED", label: "GROUPED" },
];
const emitterTypeOptions = computed<Array<{ value: EmitterType; label: string }>>(() => [
  { value: "0", label: t("fields.gravityMode") },
  { value: "1", label: t("fields.radiusMode") },
]);

function stopDropEvent(event: DragEvent): void {
  event.preventDefault();
  event.stopPropagation();
}

function updateNumber(value: number | null, apply: (value: number) => void): void {
  if (typeof value === "number" && Number.isFinite(value)) apply(value);
}

function updateColor(value: string | null, apply: (value: string) => void): void {
  if (value) apply(value);
}

function onDragEnter(event: DragEvent): void {
  stopDropEvent(event);
  dragOver.value = true;
}

function onDragOver(event: DragEvent): void {
  stopDropEvent(event);
  if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  dragOver.value = true;
}

function onDragLeave(event: DragEvent): void {
  stopDropEvent(event);
  if (!event.currentTarget || !(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null)) {
    dragOver.value = false;
  }
}

function onDrop(event: DragEvent): void {
  stopDropEvent(event);
  dragOver.value = false;
  if (event.dataTransfer) emit("textureDrop", event.dataTransfer);
}

function setTextureName(value: string): void {
  props.state.textureName = value;
  props.state.texturePath = value;
}

defineExpose({
  getTextureCanvas: () => textureCanvasRef.value,
});
</script>

<template>
  <aside
    class="inspector"
    :class="{
      'radius-enabled': state.emitterType === '1',
      'texture-color': state.useTextureColor,
      'drag-over': dragOver,
    }"
    :aria-label="t('inspector.aria')"
  >
    <header class="inspector-header">
      <div>
        <h1>{{ t("app.title") }}</h1>
        <p>{{ t("app.subtitle") }}</p>
      </div>
      <div class="header-tools">
        <LanguageSwitcher />
        <NButtonGroup class="header-actions" size="small">
          <NButton secondary type="default" :title="t('actions.importPlist')" @click="$emit('importPlist')">
            <template #icon>
              <NIcon :component="FileInput" />
            </template>
            {{ t("actions.importPlist") }}
          </NButton>
          <NButton secondary type="default" :title="t('actions.exportParams')" @click="$emit('exportPlist')">
            <template #icon>
              <NIcon :component="Download" />
            </template>
            {{ t("actions.exportParams") }}
          </NButton>
        </NButtonGroup>
      </div>
    </header>

    <div class="inspector-body">
      <div class="field-row">
        <label>{{ t("fields.backgroundColor") }}</label>
        <NColorPicker
          :value="state.backgroundColor"
          :modes="colorModes"
          :show-alpha="false"
          :show-preview="true"
          size="small"
          @update:value="updateColor($event, (value) => (state.backgroundColor = value))"
        />
      </div>

      <div class="field-row template-row">
        <label for="presetSelect">{{ t("fields.particlePreset") }}</label>
        <NSelect id="presetSelect" v-model:value="selectedPreset" :options="presets" size="small" />
        <NButton id="loadPreset" secondary type="primary" size="small" @click="$emit('loadPreset', selectedPreset)">
          <template #icon>
            <NIcon :component="Upload" />
          </template>
          {{ t("actions.load") }}
        </NButton>
      </div>

      <InspectorSection :title="t('inspector.sections.base')">
        <div class="field-row split">
          <label for="duration">{{ t("fields.duration") }}</label>
          <NInputNumber
            id="duration"
            class="number-input"
            :value="state.duration"
            :step="0.1"
            size="small"
            :show-button="false"
            @update:value="updateNumber($event, (value) => (state.duration = value))"
          />
          <label class="switch-label">
            <NSwitch id="infinite" v-model:value="state.infinite" size="small" />
            <span>{{ t("fields.infinite") }}</span>
          </label>
        </div>
        <NumberField id="maxParticles" :label="t('fields.maxParticles')" :min="1" :max="2000" :step="1" v-model="state.maxParticles" />
        <NumberField id="emissionRate" :label="t('fields.emissionRate')" :min="0" :max="10000" :step="1" v-model="state.emissionRate" />
        <PairField id="life" variance-id="lifeVar" :label="t('fields.life')" :step="0.05" v-model="state.life" v-model:variance-value="state.lifeVar" />
        <PairField id="angle" variance-id="angleVar" :label="t('fields.angle')" :step="1" v-model="state.angle" v-model:variance-value="state.angleVar" />
        <AxisField
          :label="t('fields.source')"
          x-id="sourceW"
          y-id="sourceH"
          x-label="W"
          y-label="H"
          v-model:x-value="state.sourceW"
          v-model:y-value="state.sourceH"
        />
        <SelectField id="positionType" :label="t('fields.positionType')" :options="positionTypeOptions" v-model="state.positionType" />
      </InspectorSection>

      <InspectorSection :title="t('inspector.sections.particleMode')">
        <SelectField id="emitterType" :label="t('fields.mode')" :options="emitterTypeOptions" v-model="state.emitterType" />
        <div data-mode="gravity">
          <AxisField :label="t('fields.gravity')" x-id="gravityX" y-id="gravityY" :step="0.01" v-model:x-value="state.gravityX" v-model:y-value="state.gravityY" />
          <PairField id="speed" variance-id="speedVar" :label="t('fields.speed')" :step="1" v-model="state.speed" v-model:variance-value="state.speedVar" />
          <PairField
            id="radialAccel"
            variance-id="radialAccelVar"
            :label="t('fields.radialAccel')"
            :step="1"
            v-model="state.radialAccel"
            v-model:variance-value="state.radialAccelVar"
          />
          <PairField
            id="tangentialAccel"
            variance-id="tangentialAccelVar"
            :label="t('fields.tangentialAccel')"
            :step="1"
            v-model="state.tangentialAccel"
            v-model:variance-value="state.tangentialAccelVar"
          />
        </div>
        <div data-mode="radius">
          <PairField id="maxRadius" variance-id="maxRadiusVar" :label="t('fields.startRadius')" :step="1" v-model="state.maxRadius" v-model:variance-value="state.maxRadiusVar" />
          <PairField id="minRadius" variance-id="minRadiusVar" :label="t('fields.endRadius')" :step="1" v-model="state.minRadius" v-model:variance-value="state.minRadiusVar" />
          <PairField
            id="rotatePerSecond"
            variance-id="rotatePerSecondVar"
            :label="t('fields.rotatePerSecond')"
            :step="1"
            v-model="state.rotatePerSecond"
            v-model:variance-value="state.rotatePerSecondVar"
          />
        </div>
      </InspectorSection>

      <InspectorSection :title="t('inspector.sections.particleColor')">
        <div class="color-grid">
          <label class="color-mode-row">
            <span>{{ t("fields.textureColor") }}</span>
            <span class="toggle-text">
              <NSwitch id="useTextureColor" v-model:value="state.useTextureColor" size="small" />
              {{ t("fields.useTextureColor") }}
            </span>
          </label>
          <ColorField :label="t('fields.startColor')" rgb-control v-model="state.startColor" />
          <ColorField :label="t('fields.variance')" rgb-control v-model="state.startColorVar" />
          <ColorField :label="t('fields.endColor')" rgb-control v-model="state.endColor" />
          <ColorField :label="t('fields.variance')" rgb-control v-model="state.endColorVar" />
          <PairField
            id="startAlpha"
            variance-id="endAlpha"
            :label="t('fields.alpha')"
            :min="0"
            :max="1"
            :variance-min="0"
            :variance-max="1"
            :step="0.01"
            middle-label="→"
            class-name="alpha-row"
            v-model="state.startAlpha"
            v-model:variance-value="state.endAlpha"
          />
        </div>
      </InspectorSection>

      <InspectorSection :title="t('inspector.sections.particleTexture')">
        <div class="texture-panel" @dragenter="onDragEnter" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
          <div class="texture-preview-wrap" :aria-label="t('fields.texturePreview')">
            <canvas id="texture-preview" ref="textureCanvasRef" width="96" height="96" />
            <span id="texture-size">{{ textureSize }}</span>
            <span class="drop-hint">{{ t("fields.textureDropHint") }}</span>
          </div>
          <div class="texture-fields">
            <div class="field-row">
              <label for="texturePath">{{ t("fields.texturePath") }}</label>
              <NInput id="texturePath" v-model:value="state.texturePath" size="small" />
              <NButton id="chooseTexture" type="primary" secondary circle size="small" :title="t('actions.chooseTexture')" :aria-label="t('actions.chooseTexture')" @click="$emit('chooseTexture')">
                <template #icon>
                  <NIcon :component="FolderOpen" />
                </template>
              </NButton>
            </div>
            <TextField id="textureName" :label="t('fields.textureName')" :model-value="state.textureName" @update:model-value="setTextureName" />
            <PairField
              id="startSize"
              variance-id="startSizeVar"
              :label="t('fields.startSize')"
              :step="0.1"
              class-name="texture-size-row"
              v-model="state.startSize"
              v-model:variance-value="state.startSizeVar"
            />
            <PairField
              id="endSize"
              variance-id="endSizeVar"
              :label="t('fields.endSize')"
              :step="0.1"
              class-name="texture-size-row"
              v-model="state.endSize"
              v-model:variance-value="state.endSizeVar"
            />
          </div>
        </div>
      </InspectorSection>

      <InspectorSection :title="t('inspector.sections.particleRotation')">
        <PairField id="rotationStart" variance-id="rotationStartVar" :label="t('fields.rotationStart')" :step="1" v-model="state.rotationStart" v-model:variance-value="state.rotationStartVar" />
        <PairField id="rotationEnd" variance-id="rotationEndVar" :label="t('fields.rotationEnd')" :step="1" v-model="state.rotationEnd" v-model:variance-value="state.rotationEndVar" />
      </InspectorSection>

      <InspectorSection :title="t('inspector.sections.blendMode')">
        <SelectField id="blendSrc" :label="t('fields.blendSrc')" :options="blendOptions" v-model="state.blendSrc" />
        <SelectField id="blendDst" :label="t('fields.blendDst')" :options="blendOptions" v-model="state.blendDst" />
      </InspectorSection>
    </div>

    <footer class="export-bar">
      <label for="saveName">{{ t("fields.saveName") }}</label>
      <NInput id="saveName" v-model:value="state.saveName" size="small" />
      <NButton secondary size="small" @click="$emit('exportPlist')">
        <template #icon>
          <NIcon :component="FileInput" />
        </template>
        {{ t("actions.exportPlist") }}
      </NButton>
      <NButton secondary size="small" @click="$emit('exportTexture')">
        <template #icon>
          <NIcon :component="ImagePlus" />
        </template>
        {{ t("actions.exportTexture") }}
      </NButton>
      <NButton type="primary" size="small" @click="$emit('exportAll')">
        <template #icon>
          <NIcon :component="Archive" />
        </template>
        {{ t("actions.exportAll") }}
      </NButton>
    </footer>
  </aside>
</template>
