<script setup lang="ts">
import { computed, ref } from "vue";
import { NButton, NIcon, NTooltip } from "naive-ui";
import { Focus, Move, Pause, Play, RotateCcw } from "@lucide/vue";

const props = defineProps<{
  particleCount: string;
  paused: boolean;
}>();

const emit = defineEmits<{
  center: [];
  reset: [];
  togglePause: [];
  pointerDown: [event: PointerEvent];
  pointerMove: [event: PointerEvent];
  pointerUp: [event: PointerEvent];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const pauseIcon = computed(() => (props.paused ? Play : Pause));
const pauseLabel = computed(() => (props.paused ? "继续播放" : "暂停预览"));

function onPointerDown(event: PointerEvent): void {
  canvasRef.value?.setPointerCapture(event.pointerId);
  emit("pointerDown", event);
}

function onPointerUp(event: PointerEvent): void {
  emit("pointerUp", event);
}

defineExpose({
  getCanvas: () => canvasRef.value,
});
</script>

<template>
  <section class="stage-panel" aria-label="粒子预览">
    <div class="tool-strip">
      <NTooltip trigger="hover" placement="bottom">
        <template #trigger>
          <NButton class="tool-button" type="primary" circle quaternary size="small" title="拖动画布" aria-label="拖动画布">
            <template #icon>
              <NIcon :component="Move" />
            </template>
          </NButton>
        </template>
        拖动画布
      </NTooltip>

      <NTooltip trigger="hover" placement="bottom">
        <template #trigger>
          <NButton class="tool-button" circle quaternary size="small" title="居中发射器" aria-label="居中发射器" @click="$emit('center')">
            <template #icon>
              <NIcon :component="Focus" />
            </template>
          </NButton>
        </template>
        居中发射器
      </NTooltip>

      <NTooltip trigger="hover" placement="bottom">
        <template #trigger>
          <NButton class="tool-button" circle quaternary size="small" title="重置粒子" aria-label="重置粒子" @click="$emit('reset')">
            <template #icon>
              <NIcon :component="RotateCcw" />
            </template>
          </NButton>
        </template>
        重置粒子
      </NTooltip>

      <NTooltip trigger="hover" placement="bottom">
        <template #trigger>
          <NButton
            class="tool-button"
            :type="paused ? 'primary' : 'default'"
            circle
            quaternary
            size="small"
            :title="pauseLabel"
            :aria-label="pauseLabel"
            @click="$emit('togglePause')"
          >
            <template #icon>
              <NIcon :component="pauseIcon" />
            </template>
          </NButton>
        </template>
        {{ pauseLabel }}
      </NTooltip>
    </div>

    <canvas
      id="preview"
      ref="canvasRef"
      width="1200"
      height="900"
      @pointerdown="onPointerDown"
      @pointermove="$emit('pointerMove', $event)"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    />

    <div class="status-bar">
      <span>Particles <strong>{{ particleCount }}</strong></span>
      <span id="hint">发射器 · 实时预览</span>
    </div>
  </section>
</template>
