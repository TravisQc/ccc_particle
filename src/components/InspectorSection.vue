<script setup lang="ts">
import { NCollapse, NCollapseItem } from "naive-ui";

// name 必须与语言无关：NCollapse 非受控模式下展开集合按 name 匹配，
// 若用翻译后的标题作 name，切换语言会让所有面板收起。
const props = defineProps<{
  name: string;
  title: string;
}>();

const defaultExpandedNames = [props.name];
</script>

<template>
  <NCollapse class="panel-section" :default-expanded-names="defaultExpandedNames" arrow-placement="right">
    <NCollapseItem :title="title" :name="name">
      <slot />
    </NCollapseItem>
  </NCollapse>
</template>
