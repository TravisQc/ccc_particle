<script setup lang="ts">
import { computed } from "vue";
import { NCollapse, NCollapseItem } from "naive-ui";

const props = defineProps<{
  title: string;
}>();

const defaultExpandedNames = computed(() => [props.title]);
</script>

<template>
  <NCollapse class="panel-section" :default-expanded-names="defaultExpandedNames" arrow-placement="right">
    <NCollapseItem :title="title" :name="title">
      <slot />
    </NCollapseItem>
  </NCollapse>
</template>
