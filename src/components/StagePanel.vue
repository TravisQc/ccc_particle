<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import { NButton, NIcon, NTooltip } from "naive-ui";
import { Eye, EyeOff, Focus, ImagePlus, Move, Pause, Play, RotateCcw, Trash2 } from "@lucide/vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  backgroundInfo: { name: string; width: number; height: number } | null;
  backgroundVisible: boolean;
  particleCount: string;
  paused: boolean;
}>();

const emit = defineEmits<{
  chooseBackground: [];
  clearBackground: [];
  center: [];
  reset: [];
  toggleBackground: [];
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
const backgroundToggleIcon = computed(() => (props.backgroundVisible ? Eye : EyeOff));
const backgroundToggleLabel = computed(() => (props.backgroundVisible ? t("actions.hideBackground") : t("actions.showBackground")));
const backgroundSummary = computed(() => {
  if (!props.backgroundInfo) return "";
  return t("stage.backgroundSummary", {
    width: props.backgroundInfo.width,
    height: props.backgroundInfo.height,
  });
});

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

      <span class="tool-divider" aria-hidden="true" />

      <NTooltip trigger="hover" placement="bottom">
        <template #trigger>
          <NButton
            class="tool-button"
            circle
            quaternary
            size="small"
            :title="t('actions.importBackground')"
            :aria-label="t('actions.importBackground')"
            @click="$emit('chooseBackground')"
          >
            <template #icon>
              <NIcon :component="ImagePlus" />
            </template>
          </NButton>
        </template>
        {{ t("actions.importBackground") }}
      </NTooltip>

      <template v-if="backgroundInfo">
        <NTooltip trigger="hover" placement="bottom">
          <template #trigger>
            <NButton
              class="tool-button"
              :type="backgroundVisible ? 'primary' : 'default'"
              circle
              quaternary
              size="small"
              :title="backgroundToggleLabel"
              :aria-label="backgroundToggleLabel"
              @click="$emit('toggleBackground')"
            >
              <template #icon>
                <NIcon :component="backgroundToggleIcon" />
              </template>
            </NButton>
          </template>
          {{ backgroundToggleLabel }}
        </NTooltip>

        <NTooltip trigger="hover" placement="bottom">
          <template #trigger>
            <NButton
              class="tool-button"
              circle
              quaternary
              size="small"
              :title="t('actions.clearBackground')"
              :aria-label="t('actions.clearBackground')"
              @click="$emit('clearBackground')"
            >
              <template #icon>
                <NIcon :component="Trash2" />
              </template>
            </NButton>
          </template>
          {{ t("actions.clearBackground") }}
        </NTooltip>
      </template>
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
      <span v-if="backgroundInfo" class="background-status" :title="backgroundInfo.name">
        {{ backgroundSummary }}
        <em v-if="!backgroundVisible">{{ t("stage.backgroundHidden") }}</em>
      </span>
      <span id="hint" class="status-hint">{{ t("stage.hint") }}</span>
    </div>
  </section>
</template>
