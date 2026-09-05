<script setup lang="ts">
import { ElDrawer, ElSkeleton } from "element-plus";

defineProps<{
  modelValue: boolean;
  title: string;
  subtitle?: string;
  size?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();
</script>

<template>
  <ElDrawer
    :model-value="modelValue"
    :size="size ?? '560px'"
    class="admin-detail-drawer"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="admin-detail-drawer__title">
        <strong>{{ title }}</strong>
        <span v-if="subtitle">{{ subtitle }}</span>
      </div>
    </template>
    <ElSkeleton v-if="loading" :rows="7" animated />
    <slot v-else />
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </ElDrawer>
</template>

<style>
.admin-detail-drawer .el-drawer__header {
  padding: 18px 22px 14px;
  margin: 0;
  border-bottom: 1px solid var(--roamly-border);
}

.admin-detail-drawer .el-drawer__body {
  padding: 0 22px 22px;
}

.admin-detail-drawer .el-drawer__footer {
  padding: 12px 22px;
  border-top: 1px solid var(--roamly-border);
}

.admin-detail-drawer__title {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.admin-detail-drawer__title strong {
  overflow: hidden;
  color: var(--roamly-text);
  font-size: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-detail-drawer__title span {
  color: var(--roamly-muted);
  font-size: 12px;
}

@media (max-width: 760px) {
  .admin-detail-drawer .el-drawer__body {
    padding: 0 16px 18px;
  }

  .admin-detail-drawer .el-drawer__footer {
    padding: 10px 16px;
  }
}
</style>
