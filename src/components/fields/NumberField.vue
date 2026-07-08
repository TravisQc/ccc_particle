<script setup lang="ts">
import { computed } from "vue";
import { NInputNumber } from "naive-ui";
import { finiteNumberUpdater, numberProp } from "./field-utils";

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

const minValue = computed(() => numberProp(props.min));
const maxValue = computed(() => numberProp(props.max));
const stepValue = computed(() => numberProp(props.step) || 1);

const updateValue = finiteNumberUpdater((value) => (model.value = value));
</script>

<template>
  <div class="field-row" :class="className">
    <label :for="id">{{ label }}</label>
    <!-- id 必须通过 input-props 落到真实 <input> 上，直接给组件 :id 只会落在包装 div，label 关联失效 -->
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
  </div>
</template>
