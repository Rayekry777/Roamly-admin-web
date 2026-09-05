<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  meta?: string;
}>();
</script>

<template>
  <header class="page-header page-heading">
    <div class="page-header__copy">
      <p>{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
    </div>
    <div v-if="$slots.actions || meta" class="page-header__actions">
      <slot name="actions" />
      <span v-if="meta" class="page-header__meta">{{ meta }}</span>
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  min-height: 58px;
  margin-bottom: 18px;
  gap: 16px;
}

.page-header__copy p,
.page-header__copy h1 {
  margin: 0;
}

.page-header__copy p {
  margin-bottom: 5px;
  color: var(--roamly-muted);
  font-size: 13px;
}

.page-header__copy h1 {
  color: var(--roamly-text);
  font-size: clamp(21px, 2vw, 26px);
  letter-spacing: -0.02em;
}

.page-header__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.page-header__meta {
  color: var(--roamly-muted);
  font-size: 12px;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .page-header {
    align-items: flex-start;
    min-height: 0;
    gap: 12px;
  }

  .page-header__actions {
    flex-direction: column-reverse;
    align-items: flex-end;
    gap: 6px;
  }

  .page-header__actions :deep(.el-button) {
    white-space: nowrap;
  }
}
</style>
