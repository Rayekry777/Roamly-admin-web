<script setup lang="ts">
import { ElSkeleton } from "element-plus";

withDefaults(defineProps<{ rows?: number }>(), { rows: 4 });
</script>

<template><ElSkeleton :rows="rows" animated /></template>
