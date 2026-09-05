<script setup lang="ts">
import { ElButton, ElDialog } from "element-plus";

withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    confirmText?: string;
    loading?: boolean;
    danger?: boolean;
    width?: string;
  }>(),
  {
    confirmText: "确认提交",
    loading: false,
    danger: false,
    width: "440px",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [];
}>();
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    :title="title"
    :width="width"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <slot />
    <template #footer>
      <div class="command-dialog__footer">
        <ElButton @click="emit('update:modelValue', false)">取消</ElButton>
        <ElButton
          :type="danger ? 'danger' : 'primary'"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ confirmText }}
        </ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<style scoped>
.command-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
