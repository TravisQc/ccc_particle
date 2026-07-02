<script setup lang="ts">
import { computed } from "vue";
import { NInputNumber } from "naive-ui";

const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    className?: string;
  }>(),
  {
    step: "1",
    className: "",
  },
);

const model = defineModel<number>({ required: true });

function numberProp(value: number | string | undefined): number | undefined {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const minValue = computed(() => numberProp(props.min));
const maxValue = computed(() => numberProp(props.max));
const stepValue = computed(() => numberProp(props.step) || 1);

function updateValue(value: number | null): void {
  if (typeof value === "number" && Number.isFinite(value)) model.value = value;
}
</script>

<template>
  <div class="field-row" :class="className">
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
  </div>
</template>
