<script setup lang="ts" generic="T extends string">
import { NSelect } from "naive-ui";
import type { SelectOption as NaiveSelectOption } from "naive-ui";

export interface SelectOption extends NaiveSelectOption {
  value: string;
  label: string;
}

withDefaults(
  defineProps<{
    id: string;
    label: string;
    options: Array<{ value: T; label: string }>;
    className?: string;
  }>(),
  {
    className: "",
  },
);

const model = defineModel<T>({ required: true });

function updateValue(value: string | number | null): void {
  // options 已约束为 T，NSelect 只会回传 options 中的 value
  if (typeof value === "string") model.value = value as T;
}
</script>

<template>
  <div class="field-row" :class="className">
    <label :for="id">{{ label }}</label>
    <NSelect :value="model" :options="options" size="small" :aria-label="label" :input-props="{ id }" @update:value="updateValue" />
  </div>
</template>
