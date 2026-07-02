<script setup lang="ts">
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
    options: SelectOption[];
    className?: string;
  }>(),
  {
    className: "",
  },
);

const model = defineModel<string>({ required: true });
</script>

<template>
  <div class="field-row" :class="className">
    <label :for="id">{{ label }}</label>
    <NSelect :id="id" v-model:value="model" :options="options" size="small" />
  </div>
</template>
