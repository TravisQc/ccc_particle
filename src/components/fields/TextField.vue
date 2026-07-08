<script setup lang="ts">
import { NInput } from "naive-ui";

const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    className?: string;
  }>(),
  {
    className: "",
  },
);

const model = defineModel<string>({ required: true });
const inputProps = { id: props.id, "aria-label": props.label };
</script>

<template>
  <div class="field-row" :class="className">
    <label :for="id">{{ label }}</label>
    <NInput v-model:value="model" size="small" :input-props="inputProps" />
  </div>
</template>
