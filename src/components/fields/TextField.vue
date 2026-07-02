<script setup lang="ts">
import { NInput } from "naive-ui";

withDefaults(
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
</script>

<template>
  <div class="field-row" :class="className">
    <label :for="id">{{ label }}</label>
    <NInput :id="id" v-model:value="model" size="small" />
  </div>
</template>
