<template>
  <section class="filter-toolbar">
    <div class="filter-toolbar__fields"><slot /></div>
    <div v-if="$slots.actions" class="filter-toolbar__actions">
      <slot name="actions" />
    </div>
  </section>
</template>

<style scoped>
.filter-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  padding: 14px;
  background: var(--roamly-surface);
  border: 1px solid var(--roamly-border);
  border-radius: var(--roamly-content-radius);
  gap: 10px;
}

.filter-toolbar__fields {
  display: flex;
  flex-wrap: wrap;
  min-width: 0;
  gap: 10px;
}

.filter-toolbar__fields > :deep(.el-input),
.filter-toolbar__fields > :deep(.el-select),
.filter-toolbar__fields > :deep(.el-date-editor) {
  min-width: 150px;
  flex: 1 1 150px;
}

.filter-toolbar__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 760px) {
  .filter-toolbar {
    grid-template-columns: 1fr;
  }

  .filter-toolbar__fields {
    display: grid;
    grid-template-columns: 1fr;
  }

  .filter-toolbar__fields > :deep(.el-input),
  .filter-toolbar__fields > :deep(.el-select),
  .filter-toolbar__fields > :deep(.el-date-editor) {
    width: 100%;
    min-width: 0;
  }

  .filter-toolbar__actions {
    justify-content: stretch;
  }

  .filter-toolbar__actions :deep(.el-button) {
    flex: 1;
  }
}
</style>
