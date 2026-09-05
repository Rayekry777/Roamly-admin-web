<script setup lang="ts">
import { ElTag } from "element-plus";

withDefaults(
  defineProps<{
    label: string;
    tone?: "success" | "warning" | "danger" | "info" | "neutral";
  }>(),
  { tone: "neutral" },
);
</script>

<template>
  <ElTag :type="tone === 'neutral' ? undefined : tone" effect="light">
    {{ label }}
  </ElTag>
</template>
