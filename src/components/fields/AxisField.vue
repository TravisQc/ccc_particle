<script setup lang="ts">
import { computed } from "vue";
import { NInputNumber } from "naive-ui";
import { finiteNumberUpdater, numberProp } from "./field-utils";

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

const stepValue = computed(() => numberProp(props.step) || 1);

const updateXValue = finiteNumberUpdater((value) => (xModel.value = value));
const updateYValue = finiteNumberUpdater((value) => (yModel.value = value));
</script>

<template>
  <div class="field-row pair compact-label">
    <label :for="xId">{{ label }}</label>
    <span class="axis-label">{{ xLabel }}</span>
    <NInputNumber
      class="number-input"
      :value="xModel"
      :step="stepValue"
      size="small"
      :show-button="false"
      :input-props="{ id: xId, 'aria-label': `${label} ${xLabel}` }"
      @update:value="updateXValue"
    />
    <span class="axis-label">{{ yLabel }}</span>
    <NInputNumber
      class="number-input"
      :value="yModel"
      :step="stepValue"
      size="small"
      :show-button="false"
      :input-props="{ id: yId, 'aria-label': `${label} ${yLabel}` }"
      @update:value="updateYValue"
    />
  </div>
</template>
