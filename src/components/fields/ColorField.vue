<script setup lang="ts">
import { NColorPicker } from "naive-ui";

type ColorPickerMode = "rgb" | "hsl" | "hsv" | "hex";

withDefaults(
  defineProps<{
    label: string;
    rgbControl?: boolean;
  }>(),
  {
    rgbControl: false,
  },
);

const model = defineModel<string>({ required: true });
const colorModes: ColorPickerMode[] = ["hex"];

function updateValue(value: string | null): void {
  if (value) model.value = value;
}
</script>

<template>
  <label class="color-field" v-bind="rgbControl ? { 'data-rgb-control': '' } : {}">
    <span>{{ label }}</span>
    <!-- NColorPicker 触发器是 div，包裹式 label 不建立无障碍关联，需显式 aria-label -->
    <NColorPicker
      :value="model"
      :modes="colorModes"
      :show-alpha="false"
      :show-preview="true"
      size="small"
      :aria-label="label"
      @update:value="updateValue"
    />
  </label>
</template>
