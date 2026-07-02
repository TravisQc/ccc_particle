<script setup lang="ts">
import { computed } from "vue";
import { NInputNumber } from "naive-ui";

const props = withDefaults(
  defineProps<{
    id: string;
    varianceId: string;
    label: string;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    varianceMin?: number | string;
    varianceMax?: number | string;
    varianceStep?: number | string;
    middleLabel?: string;
    className?: string;
  }>(),
  {
    step: "1",
    middleLabel: "浮动±",
    className: "",
  },
);

const model = defineModel<number>({ required: true });
const varianceModel = defineModel<number>("varianceValue", { required: true });

function numberProp(value: number | string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const minValue = computed(() => numberProp(props.min));
const maxValue = computed(() => numberProp(props.max));
const stepValue = computed(() => numberProp(props.step) || 1);
const varianceMinValue = computed(() => numberProp(props.varianceMin));
const varianceMaxValue = computed(() => numberProp(props.varianceMax));
const varianceStepValue = computed(() => numberProp(props.varianceStep) || stepValue.value);

function updateValue(value: number | null): void {
  if (typeof value === "number" && Number.isFinite(value)) model.value = value;
}

function updateVarianceValue(value: number | null): void {
  if (typeof value === "number" && Number.isFinite(value)) varianceModel.value = value;
}
</script>

<template>
  <div class="field-row pair" :class="className">
    <label :for="id">{{ label }}</label>
    <NInputNumber
      :id="id"
      class="number-input"
      :value="model"
      :min="minValue"
      :max="maxValue"
      :step="stepValue"
      size="small"
      :show-button="false"
      @update:value="updateValue"
    />
    <span class="pair-middle">{{ middleLabel }}</span>
    <NInputNumber
      :id="varianceId"
      class="number-input"
      :value="varianceModel"
      :min="varianceMinValue"
      :max="varianceMaxValue"
      :step="varianceStepValue"
      size="small"
      :show-button="false"
      @update:value="updateVarianceValue"
    />
  </div>
</template>
