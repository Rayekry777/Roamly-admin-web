<script setup lang="ts">
import { ArrowDown, Fold, SwitchButton } from "@element-plus/icons-vue";
import {
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElIcon,
} from "element-plus";
import { useRoute } from "vue-router";

defineProps<{
  realtimeState: "connected" | "fallback";
  displayName?: string;
  roleLabel?: string;
}>();

const emit = defineEmits<{
  openMenu: [];
  signOut: [];
}>();
const route = useRoute();
</script>

<template>
  <header class="admin-topbar">
    <button
      class="admin-topbar__mobile-menu"
      title="打开导航"
      @click="emit('openMenu')"
    >
      <Fold />
    </button>
    <div class="admin-topbar__heading">
      <p class="admin-topbar__context">Roamly 平台管理</p>
      <ElBreadcrumb separator="/" aria-label="面包屑">
        <ElBreadcrumbItem>平台管理</ElBreadcrumbItem>
        <ElBreadcrumbItem>{{ route.meta.title }}</ElBreadcrumbItem>
      </ElBreadcrumb>
    </div>
    <span
      class="admin-realtime-state"
      :class="`admin-realtime-state--${realtimeState}`"
    >
      <i aria-hidden="true" />
      {{ realtimeState === "connected" ? "实时已连接" : "实时连接重试中" }}
    </span>
    <ElDropdown trigger="click">
      <ElButton class="admin-user-menu" aria-label="打开管理员菜单">
        <span class="admin-user-menu__avatar">{{
          displayName?.slice(0, 1)
        }}</span>
        <span class="admin-user-menu__copy">
          <strong>{{ displayName }}</strong>
          <small>{{ roleLabel }}</small>
        </span>
        <ElIcon><ArrowDown /></ElIcon>
      </ElButton>
      <template #dropdown>
        <ElDropdownMenu>
          <ElDropdownItem :icon="SwitchButton" @click="emit('signOut')">
            退出登录
          </ElDropdownItem>
        </ElDropdownMenu>
      </template>
    </ElDropdown>
  </header>
</template>

<style scoped>
.admin-topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 68px;
  padding: 0 28px;
  background: rgb(255 255 255 / 94%);
  border-bottom: 1px solid var(--roamly-border);
  backdrop-filter: blur(10px);
}

.admin-topbar__heading {
  min-width: 0;
}

.admin-topbar__context {
  margin: 0 0 2px;
  color: var(--roamly-muted);
  font-size: 12px;
}

.admin-topbar__heading :deep(.el-breadcrumb__inner) {
  color: var(--roamly-text);
  font-size: 13px;
  font-weight: 600;
}

.admin-topbar__heading
  :deep(.el-breadcrumb__item:first-child .el-breadcrumb__inner) {
  color: var(--roamly-muted);
  font-weight: 400;
}

.admin-realtime-state {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  margin-right: 16px;
  padding: 5px 10px;
  border-radius: 999px;
  color: var(--roamly-muted);
  font-size: 12px;
  white-space: nowrap;
}

.admin-realtime-state i {
  width: 6px;
  height: 6px;
  margin-right: 6px;
  background: currentColor;
  border-radius: 50%;
}

.admin-realtime-state--connected {
  color: var(--roamly-success);
  background: var(--roamly-success-soft);
}

.admin-realtime-state--fallback {
  color: var(--roamly-warning);
  background: var(--roamly-warning-soft);
}

.admin-user-menu {
  height: 46px;
  padding: 4px 10px 4px 5px;
  border-color: var(--roamly-border);
}

.admin-user-menu__avatar {
  display: grid;
  width: 34px;
  height: 34px;
  color: #fff;
  background: var(--roamly-accent);
  border-radius: 8px;
  place-items: center;
}

.admin-user-menu__copy {
  display: grid;
  min-width: 96px;
  text-align: left;
}

.admin-user-menu__copy strong {
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
}

.admin-user-menu__copy small {
  color: var(--roamly-muted);
  font-size: 11px;
}

.admin-topbar__mobile-menu {
  display: none;
}

@media (max-width: 760px) {
  .admin-topbar {
    height: 62px;
    padding: 0 16px;
  }

  .admin-topbar__mobile-menu {
    display: grid;
    width: 38px;
    height: 38px;
    padding: 9px;
    color: var(--roamly-text);
    background: var(--roamly-bg);
    border: 0;
    border-radius: 8px;
    place-items: center;
    cursor: pointer;
  }

  .admin-topbar__mobile-menu svg {
    width: 18px;
  }

  .admin-topbar__context,
  .admin-topbar__heading :deep(.el-breadcrumb__item:first-child),
  .admin-user-menu__copy,
  .admin-user-menu > .el-icon {
    display: none;
  }

  .admin-user-menu {
    width: 42px;
    padding: 3px;
  }

  .admin-realtime-state {
    margin-right: 8px;
    padding: 4px 8px;
    font-size: 11px;
  }
}
</style>
