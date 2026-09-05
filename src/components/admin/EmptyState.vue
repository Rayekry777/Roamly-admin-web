<script setup lang="ts">
import { ElEmpty } from "element-plus";

withDefaults(defineProps<{ description?: string }>(), {
  description: "暂无数据",
});
</script>

<template><ElEmpty :description="description" :image-size="58" /></template>
