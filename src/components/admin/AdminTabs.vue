<script setup lang="ts">
import { Close } from "@element-plus/icons-vue";

defineProps<{
  tabs: { path: string; label: string }[];
  activePath: string;
}>();

const emit = defineEmits<{
  navigate: [path: string];
  close: [path: string];
}>();
</script>

<template>
  <nav class="admin-tabs" aria-label="页面标签">
    <div
      v-for="tab in tabs"
      :key="tab.path"
      class="admin-tab"
      :class="{ 'admin-tab--active': activePath === tab.path }"
    >
      <button class="admin-tab__target" @click="emit('navigate', tab.path)">
        {{ tab.label }}
      </button>
      <button
        v-if="tab.path !== '/dashboard'"
        class="admin-tab__close"
        :aria-label="`关闭${tab.label}标签`"
        :title="`关闭${tab.label}标签`"
        @click="emit('close', tab.path)"
      >
        <Close />
      </button>
    </div>
  </nav>
</template>

<style scoped>
.admin-tabs {
  position: sticky;
  top: 68px;
  z-index: 9;
  display: flex;
  min-height: 41px;
  padding: 6px 28px 0;
  overflow-x: auto;
  background: var(--roamly-surface);
  border-bottom: 1px solid var(--roamly-border);
  gap: 6px;
}

.admin-tab {
  display: flex;
  align-items: center;
  height: 34px;
  flex: 0 0 auto;
  color: var(--roamly-muted);
  background: var(--roamly-bg);
  border: 1px solid transparent;
  border-radius: 7px 7px 0 0;
}

.admin-tab--active {
  color: var(--roamly-primary-hover);
  background: var(--roamly-surface);
  border-color: var(--roamly-border);
  border-bottom-color: var(--roamly-surface);
}

.admin-tab__target,
.admin-tab__close {
  height: 100%;
  padding: 0 10px;
  color: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.admin-tab__close {
  display: grid;
  width: 28px;
  padding: 7px;
  place-items: center;
}

.admin-tab__close svg {
  width: 14px;
}

@media (max-width: 760px) {
  .admin-tabs {
    display: none;
  }
}
</style>
