<script setup lang="ts">
defineProps<{
  loading?: boolean;
}>();
</script>

<template>
  <section class="data-table-frame" :class="{ 'is-loading': loading }">
    <div class="data-table-frame__body"><slot /></div>
    <div v-if="$slots.pagination" class="data-table-frame__pagination">
      <slot name="pagination" />
    </div>
  </section>
</template>

<style scoped>
.data-table-frame {
  overflow: hidden;
  margin-top: 12px;
  background: var(--roamly-surface);
  border: 1px solid var(--roamly-border);
  border-radius: var(--roamly-content-radius);
  box-shadow: 0 1px 0 rgb(45 42 80 / 2%);
}

.data-table-frame__body {
  min-width: 0;
  overflow-x: auto;
}

.data-table-frame :deep(.el-table) {
  --el-table-border-color: var(--roamly-border);
  --el-table-header-bg-color: #fafaff;
  --el-table-row-hover-bg-color: #fff8f7;
}

.data-table-frame :deep(.el-table th.el-table__cell) {
  color: var(--roamly-muted);
  font-size: 12px;
  font-weight: 650;
}

.data-table-frame :deep(.el-table td.el-table__cell),
.data-table-frame :deep(.el-table th.el-table__cell) {
  padding: 14px 0;
}

.data-table-frame__pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 14px;
  border-top: 1px solid var(--roamly-border);
}

@media (max-width: 600px) {
  .data-table-frame__pagination {
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>
