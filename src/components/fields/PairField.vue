<script setup lang="ts">
import { computed } from "vue";
import { NInputNumber } from "naive-ui";
import { useI18n } from "vue-i18n";
import { finiteNumberUpdater, numberProp } from "./field-utils";

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
    middleLabel: "",
    className: "",
  },
);

const model = defineModel<number>({ required: true });
const varianceModel = defineModel<number>("varianceValue", { required: true });
const { t } = useI18n();

const minValue = computed(() => numberProp(props.min));
const maxValue = computed(() => numberProp(props.max));
const stepValue = computed(() => numberProp(props.step) || 1);
const varianceMinValue = computed(() => numberProp(props.varianceMin));
const varianceMaxValue = computed(() => numberProp(props.varianceMax));
const varianceStepValue = computed(() => numberProp(props.varianceStep) || stepValue.value);
const displayMiddleLabel = computed(() => props.middleLabel || t("fields.variance"));

const updateValue = finiteNumberUpdater((value) => (model.value = value));
const updateVarianceValue = finiteNumberUpdater((value) => (varianceModel.value = value));
</script>

<template>
  <div class="field-row pair" :class="className">
    <label :for="id">{{ label }}</label>
    <NInputNumber
      class="number-input"
      :value="model"
      :min="minValue"
      :max="maxValue"
      :step="stepValue"
      size="small"
      :show-button="false"
      :input-props="{ id, 'aria-label': label }"
      @update:value="updateValue"
    />
    <span class="pair-middle">{{ displayMiddleLabel }}</span>
    <NInputNumber
      class="number-input"
      :value="varianceModel"
      :min="varianceMinValue"
      :max="varianceMaxValue"
      :step="varianceStepValue"
      size="small"
      :show-button="false"
      :input-props="{ id: varianceId, 'aria-label': `${label} ${displayMiddleLabel}` }"
      @update:value="updateVarianceValue"
    />
  </div>
</template>
