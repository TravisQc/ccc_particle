<script setup lang="ts">
import { shallowRef, useTemplateRef } from "vue";
import { NButton, NButtonGroup, NColorPicker, NIcon, NInput, NInputNumber, NSelect, NSwitch } from "naive-ui";
import { Archive, Download, FileInput, FolderOpen, ImagePlus, Upload } from "@lucide/vue";
import InspectorSection from "./InspectorSection.vue";
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
const colorModes: ColorPickerMode[] = ["hex"];

const positionTypeOptions: Array<{ value: PositionType; label: PositionType }> = [
  { value: "FREE", label: "FREE" },
  { value: "RELATIVE", label: "RELATIVE" },
  { value: "GROUPED", label: "GROUPED" },
];
const emitterTypeOptions: Array<{ value: EmitterType; label: string }> = [
  { value: "0", label: "重力模式" },
  { value: "1", label: "半径模式" },
];

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
    aria-label="CocosCreator 粒子参数调整"
  >
    <header class="inspector-header">
      <div>
        <h1>CocosCreator 粒子编辑器</h1>
        <p>Cocos Creator plist / PNG 实时预览导出</p>
      </div>
      <NButtonGroup class="header-actions" size="small">
        <NButton secondary type="default" title="导入 plist" @click="$emit('importPlist')">
          <template #icon>
            <NIcon :component="FileInput" />
          </template>
          导入 plist
        </NButton>
        <NButton secondary type="default" title="导出参数" @click="$emit('exportPlist')">
          <template #icon>
            <NIcon :component="Download" />
          </template>
          导出参数
        </NButton>
      </NButtonGroup>
    </header>

    <div class="inspector-body">
      <div class="field-row">
        <label>场景背景色</label>
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
        <label for="presetSelect">粒子模板</label>
        <NSelect id="presetSelect" v-model:value="selectedPreset" :options="presets" size="small" />
        <NButton id="loadPreset" secondary type="primary" size="small" @click="$emit('loadPreset', selectedPreset)">
          <template #icon>
            <NIcon :component="Upload" />
          </template>
          载入
        </NButton>
      </div>

      <InspectorSection title="基础">
        <div class="field-row split">
          <label for="duration">持续时间</label>
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
            <span>永久</span>
          </label>
        </div>
        <NumberField id="maxParticles" label="数量" :min="1" :max="2000" :step="1" v-model="state.maxParticles" />
        <NumberField id="emissionRate" label="每秒发射" :min="0" :max="10000" :step="1" v-model="state.emissionRate" />
        <PairField id="life" variance-id="lifeVar" label="生命周期" :step="0.05" v-model="state.life" v-model:variance-value="state.lifeVar" />
        <PairField id="angle" variance-id="angleVar" label="发射角度" :step="1" v-model="state.angle" v-model:variance-value="state.angleVar" />
        <AxisField
          label="发射区域"
          x-id="sourceW"
          y-id="sourceH"
          x-label="W"
          y-label="H"
          v-model:x-value="state.sourceW"
          v-model:y-value="state.sourceH"
        />
        <SelectField id="positionType" label="位置类型" :options="positionTypeOptions" v-model="state.positionType" />
      </InspectorSection>

      <InspectorSection title="粒子模式">
        <SelectField id="emitterType" label="模式" :options="emitterTypeOptions" v-model="state.emitterType" />
        <div data-mode="gravity">
          <AxisField label="重力" x-id="gravityX" y-id="gravityY" :step="0.01" v-model:x-value="state.gravityX" v-model:y-value="state.gravityY" />
          <PairField id="speed" variance-id="speedVar" label="发射速度" :step="1" v-model="state.speed" v-model:variance-value="state.speedVar" />
          <PairField
            id="radialAccel"
            variance-id="radialAccelVar"
            label="径向加速"
            :step="1"
            v-model="state.radialAccel"
            v-model:variance-value="state.radialAccelVar"
          />
          <PairField
            id="tangentialAccel"
            variance-id="tangentialAccelVar"
            label="切向加速"
            :step="1"
            v-model="state.tangentialAccel"
            v-model:variance-value="state.tangentialAccelVar"
          />
        </div>
        <div data-mode="radius">
          <PairField id="maxRadius" variance-id="maxRadiusVar" label="开始半径" :step="1" v-model="state.maxRadius" v-model:variance-value="state.maxRadiusVar" />
          <PairField id="minRadius" variance-id="minRadiusVar" label="结束半径" :step="1" v-model="state.minRadius" v-model:variance-value="state.minRadiusVar" />
          <PairField
            id="rotatePerSecond"
            variance-id="rotatePerSecondVar"
            label="每秒旋转"
            :step="1"
            v-model="state.rotatePerSecond"
            v-model:variance-value="state.rotatePerSecondVar"
          />
        </div>
      </InspectorSection>

      <InspectorSection title="粒子颜色">
        <div class="color-grid">
          <label class="color-mode-row">
            <span>纹理颜色</span>
            <span class="toggle-text">
              <NSwitch id="useTextureColor" v-model:value="state.useTextureColor" size="small" />
              使用图片原色
            </span>
          </label>
          <ColorField label="开始颜色" rgb-control v-model="state.startColor" />
          <ColorField label="浮动±" rgb-control v-model="state.startColorVar" />
          <ColorField label="结束颜色" rgb-control v-model="state.endColor" />
          <ColorField label="浮动±" rgb-control v-model="state.endColorVar" />
          <PairField
            id="startAlpha"
            variance-id="endAlpha"
            label="透明度"
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

      <InspectorSection title="粒子纹理">
        <div class="texture-panel" @dragenter="onDragEnter" @dragover="onDragOver" @dragleave="onDragLeave" @drop="onDrop">
          <div class="texture-preview-wrap" aria-label="纹理预览">
            <canvas id="texture-preview" ref="textureCanvasRef" width="96" height="96" />
            <span id="texture-size">{{ textureSize }}</span>
            <span class="drop-hint">PNG / JPG / WEBP</span>
          </div>
          <div class="texture-fields">
            <div class="field-row">
              <label for="texturePath">path</label>
              <NInput id="texturePath" v-model:value="state.texturePath" size="small" />
              <NButton id="chooseTexture" type="primary" secondary circle size="small" title="载入纹理" aria-label="载入纹理" @click="$emit('chooseTexture')">
                <template #icon>
                  <NIcon :component="FolderOpen" />
                </template>
              </NButton>
            </div>
            <TextField id="textureName" label="name" :model-value="state.textureName" @update:model-value="setTextureName" />
            <PairField
              id="startSize"
              variance-id="startSizeVar"
              label="开始大小"
              :step="0.1"
              class-name="texture-size-row"
              v-model="state.startSize"
              v-model:variance-value="state.startSizeVar"
            />
            <PairField
              id="endSize"
              variance-id="endSizeVar"
              label="结束大小"
              :step="0.1"
              class-name="texture-size-row"
              v-model="state.endSize"
              v-model:variance-value="state.endSizeVar"
            />
          </div>
        </div>
      </InspectorSection>

      <InspectorSection title="粒子自旋转角度">
        <PairField id="rotationStart" variance-id="rotationStartVar" label="起始角度" :step="1" v-model="state.rotationStart" v-model:variance-value="state.rotationStartVar" />
        <PairField id="rotationEnd" variance-id="rotationEndVar" label="结束角度" :step="1" v-model="state.rotationEnd" v-model:variance-value="state.rotationEndVar" />
      </InspectorSection>

      <InspectorSection title="混合模式">
        <SelectField id="blendSrc" label="src" :options="blendOptions" v-model="state.blendSrc" />
        <SelectField id="blendDst" label="dst" :options="blendOptions" v-model="state.blendDst" />
      </InspectorSection>
    </div>

    <footer class="export-bar">
      <label for="saveName">保存名字</label>
      <NInput id="saveName" v-model:value="state.saveName" size="small" />
      <NButton secondary size="small" @click="$emit('exportPlist')">
        <template #icon>
          <NIcon :component="FileInput" />
        </template>
        plist
      </NButton>
      <NButton secondary size="small" @click="$emit('exportTexture')">
        <template #icon>
          <NIcon :component="ImagePlus" />
        </template>
        PNG
      </NButton>
      <NButton type="primary" size="small" @click="$emit('exportAll')">
        <template #icon>
          <NIcon :component="Archive" />
        </template>
        全部
      </NButton>
    </footer>
  </aside>
</template>
