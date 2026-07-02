<script setup lang="ts">
import { computed } from "vue";
import { NInputNumber } from "naive-ui";

const props = withDefaults(
  defineProps<{
    label: string;
    xId: string;
    yId: string;
    xLabel?: string;
    yLabel?: string;
    step?: number | string;
  }>(),
  {
    xLabel: "X",
    yLabel: "Y",
    step: "1",
  },
);

const xModel = defineModel<number>("xValue", { required: true });
const yModel = defineModel<number>("yValue", { required: true });

function numberProp(value: number | string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const stepValue = computed(() => numberProp(props.step) || 1);

function updateXValue(value: number | null): void {
  if (typeof value === "number" && Number.isFinite(value)) xModel.value = value;
}

function updateYValue(value: number | null): void {
  if (typeof value === "number" && Number.isFinite(value)) yModel.value = value;
}
</script>

<template>
  <div class="field-row pair compact-label">
    <label :for="xId">{{ label }}</label>
    <span class="axis-label">{{ xLabel }}</span>
    <NInputNumber
      :id="xId"
      class="number-input"
      :value="xModel"
      :step="stepValue"
      size="small"
      :show-button="false"
      @update:value="updateXValue"
    />
    <span class="axis-label">{{ yLabel }}</span>
    <NInputNumber
      :id="yId"
      class="number-input"
      :value="yModel"
      :step="stepValue"
      size="small"
      :show-button="false"
      @update:value="updateYValue"
    />
  </div>
</template>
