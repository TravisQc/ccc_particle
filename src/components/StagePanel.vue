<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { NButton, NIcon, NTooltip } from "naive-ui";
import { Focus, Move, Pause, Play, RotateCcw } from "@lucide/vue";
import { useI18n } from "vue-i18n";

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
  nudgeEmitter: [dx: number, dy: number];
}>();

const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef");
const { t } = useI18n();
const pauseIcon = computed(() => (props.paused ? Play : Pause));
const pauseLabel = computed(() => (props.paused ? t("stage.resumePlayback") : t("stage.pausePreview")));

function onPointerDown(event: PointerEvent): void {
  canvasRef.value?.setPointerCapture(event.pointerId);
  emit("pointerDown", event);
}

function onPointerUp(event: PointerEvent): void {
  const canvas = canvasRef.value;
  if (canvas?.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
  emit("pointerUp", event);
}

function onKeyDown(event: KeyboardEvent): void {
  const step = event.shiftKey ? 10 : 1;
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0],
    ArrowRight: [step, 0],
    ArrowUp: [0, -step],
    ArrowDown: [0, step],
  };
  const move = moves[event.key];
  if (move) {
    event.preventDefault();
    emit("nudgeEmitter", move[0], move[1]);
  }
}

defineExpose({
  getCanvas: () => canvasRef.value,
});
</script>

<template>
  <section class="stage-panel" :aria-label="t('stage.aria')">
    <div class="tool-strip">
      <NTooltip trigger="hover" placement="bottom">
        <template #trigger>
          <NButton class="tool-button" type="primary" circle quaternary size="small" :title="t('stage.dragCanvas')" :aria-label="t('stage.dragCanvas')">
            <template #icon>
              <NIcon :component="Move" />
            </template>
          </NButton>
        </template>
        {{ t("stage.dragCanvas") }}
      </NTooltip>

      <NTooltip trigger="hover" placement="bottom">
        <template #trigger>
          <NButton class="tool-button" circle quaternary size="small" :title="t('stage.centerEmitter')" :aria-label="t('stage.centerEmitter')" @click="$emit('center')">
            <template #icon>
              <NIcon :component="Focus" />
            </template>
          </NButton>
        </template>
        {{ t("stage.centerEmitter") }}
      </NTooltip>

      <NTooltip trigger="hover" placement="bottom">
        <template #trigger>
          <NButton class="tool-button" circle quaternary size="small" :title="t('stage.resetParticles')" :aria-label="t('stage.resetParticles')" @click="$emit('reset')">
            <template #icon>
              <NIcon :component="RotateCcw" />
            </template>
          </NButton>
        </template>
        {{ t("stage.resetParticles") }}
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
      tabindex="0"
      role="application"
      :aria-label="t('stage.aria')"
      @pointerdown="onPointerDown"
      @pointermove="$emit('pointerMove', $event)"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown="onKeyDown"
    />

    <div class="status-bar">
      <span>{{ t("stage.particles") }} <strong>{{ particleCount }}</strong></span>
      <span id="hint" class="status-hint">{{ t("stage.hint") }}</span>
    </div>
  </section>
</template>
