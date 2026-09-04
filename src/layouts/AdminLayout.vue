<script setup lang="ts">
import {
  ArrowDown,
  Close,
  Compass,
  Fold,
  SwitchButton,
} from "@element-plus/icons-vue";
import {
  ElButton,
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElIcon,
  ElNotification,
} from "element-plus";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { visibleMenu } from "@/navigation/menu";
import { useAuthStore } from "@/stores/auth";
import { startAdminRealtime, type AdminRealtimeEvent } from "@/api/realtime";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const collapsed = ref(false);
const mobileMenuOpen = ref(false);
const menu = computed(() => visibleMenu(auth.current?.permissions ?? []));
const tabs = ref<{ path: string; label: string }[]>([]);
const realtimeState = ref<"connected" | "fallback">("fallback");
let stopRealtime: (() => void) | undefined;

watch(
  [() => route.path, menu],
  ([path, items]) => {
    const item = items.find((candidate) => candidate.path === path);
    if (item && !tabs.value.some((tab) => tab.path === item.path)) {
      tabs.value.push({ path: item.path, label: item.label });
    }
  },
  { immediate: true },
);

async function signOut(): Promise<void> {
  await auth.logout();
  await router.replace("/login");
}

function navigate(path: string): void {
  mobileMenuOpen.value = false;
  void router.push(path);
}

function closeTab(path: string): void {
  const index = tabs.value.findIndex((tab) => tab.path === path);
  if (index < 0) return;
  tabs.value.splice(index, 1);
  if (route.path !== path) return;
  const fallback = tabs.value[Math.max(0, index - 1)];
  void router.push(fallback?.path ?? "/dashboard");
}

function onRealtimeEvent(event: AdminRealtimeEvent): void {
  if (event.type === "FALLBACK_REFRESH") return;
  const labels: Record<string, string> = {
    PAYMENT_UPDATED: "支付订单",
    REFUND_UPDATED: "退款记录",
    VOUCHER_REDEEMED: "核销记录",
    REDEMPTION_REVERSED: "撤销记录",
    MERCHANT_REVIEWED: "商户审核",
    SETTLEMENT_UPDATED: "结算批次",
  };
  ElNotification({ title: "数据已更新", message: `${labels[event.type] ?? "业务数据"}发生变化，请刷新当前列表`, type: "info", duration: 3500 });
  window.dispatchEvent(new CustomEvent("roamly-admin-realtime", { detail: event }));
}

onMounted(() => { stopRealtime = startAdminRealtime({ onEvent: onRealtimeEvent, onState: (state) => { realtimeState.value = state; } }); });
onBeforeUnmount(() => stopRealtime?.());
</script>

<template>
  <div class="admin-shell" :class="{ 'admin-shell--collapsed': collapsed }">
    <button
      v-if="mobileMenuOpen"
      class="admin-shell__scrim"
      aria-label="关闭导航"
      @click="mobileMenuOpen = false"
    />
    <aside
      class="admin-sidebar"
      :class="{ 'admin-sidebar--open': mobileMenuOpen }"
    >
      <div class="admin-brand">
        <span class="admin-brand__mark"><Compass /></span>
        <span v-if="!collapsed" class="admin-brand__name">Roamly</span>
      </div>
      <nav class="admin-nav" aria-label="管理导航">
        <button
          v-for="item in menu"
          :key="item.path"
          class="admin-nav__item"
          :class="{ 'admin-nav__item--active': route.path === item.path }"
          :title="collapsed ? item.label : undefined"
          @click="navigate(item.path)"
        >
          <ElIcon><component :is="item.icon" /></ElIcon>
          <span v-if="!collapsed">{{ item.label }}</span>
        </button>
      </nav>
      <button
        class="admin-sidebar__fold"
        title="折叠侧栏"
        @click="collapsed = !collapsed"
      >
        <Fold />
        <span v-if="!collapsed">收起导航</span>
      </button>
    </aside>

    <div class="admin-main">
      <header class="admin-topbar">
        <button
          class="admin-topbar__mobile-menu"
          title="打开导航"
          @click="mobileMenuOpen = true"
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
        <span class="admin-realtime-state" :class="`admin-realtime-state--${realtimeState}`">{{ realtimeState === "connected" ? "实时已连接" : "实时连接重试中" }}</span>
        <ElDropdown trigger="click">
          <ElButton class="admin-user-menu">
            <span class="admin-user-menu__avatar">{{
              auth.current?.displayName.slice(0, 1)
            }}</span>
            <span class="admin-user-menu__copy">
              <strong>{{ auth.current?.displayName }}</strong>
              <small>{{ auth.current?.roleLabel }}</small>
            </span>
            <ElIcon><ArrowDown /></ElIcon>
          </ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem :icon="SwitchButton" @click="signOut"
                >退出登录</ElDropdownItem
              >
            </ElDropdownMenu>
          </template>
        </ElDropdown>
      </header>
      <nav class="admin-tabs" aria-label="页面标签">
        <div
          v-for="tab in tabs"
          :key="tab.path"
          class="admin-tab"
          :class="{ 'admin-tab--active': route.path === tab.path }"
        >
          <button class="admin-tab__target" @click="navigate(tab.path)">
            {{ tab.label }}
          </button>
          <button
            v-if="tab.path !== '/dashboard'"
            class="admin-tab__close"
            :aria-label="`关闭${tab.label}标签`"
            :title="`关闭${tab.label}标签`"
            @click="closeTab(tab.path)"
          >
            <Close />
          </button>
        </div>
      </nav>
      <main class="admin-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  display: grid;
  grid-template-columns: 224px minmax(0, 1fr);
  min-height: 100vh;
}

.admin-shell--collapsed {
  grid-template-columns: 72px minmax(0, 1fr);
}

.admin-sidebar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  height: 100vh;
  color: #fff;
  background: #242331;
}

.admin-brand {
  display: flex;
  align-items: center;
  height: 68px;
  padding: 0 19px;
  gap: 12px;
  border-bottom: 1px solid rgb(255 255 255 / 10%);
}

.admin-brand__mark {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  background: var(--roamly-primary);
  border-radius: 6px;
  place-items: center;
}

.admin-brand__mark svg {
  width: 20px;
}

.admin-brand__name {
  font-size: 19px;
  font-weight: 750;
}

.admin-nav {
  display: grid;
  gap: 4px;
  padding: 16px 10px;
}

.admin-nav__item,
.admin-sidebar__fold,
.admin-topbar__mobile-menu {
  display: flex;
  align-items: center;
  height: 42px;
  padding: 0 13px;
  color: rgb(255 255 255 / 68%);
  background: transparent;
  border: 0;
  border-radius: 6px;
  gap: 12px;
  cursor: pointer;
}

.admin-nav__item:hover,
.admin-nav__item--active {
  color: #fff;
  background: rgb(255 255 255 / 9%);
}

.admin-nav__item--active {
  box-shadow: inset 3px 0 var(--roamly-primary);
}

.admin-sidebar__fold {
  width: calc(100% - 20px);
  margin: auto 10px 16px;
}

.admin-sidebar__fold svg,
.admin-topbar__mobile-menu svg {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
}

.admin-main {
  min-width: 0;
}

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
  margin-left: auto;
  margin-right: 16px;
  padding: 4px 9px;
  border-radius: 6px;
  color: var(--roamly-muted);
  font-size: 12px;
  white-space: nowrap;
}

.admin-realtime-state--connected {
  color: #27845c;
  background: #eaf8f0;
}

.admin-realtime-state--fallback {
  color: #9a6a12;
  background: #fff7df;
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
  border-radius: 6px;
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

.admin-content {
  width: min(1500px, 100%);
  padding: 24px 28px 40px;
  margin: 0 auto;
}

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
  border-radius: 5px 5px 0 0;
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

.admin-topbar__mobile-menu,
.admin-shell__scrim {
  display: none;
}

@media (max-width: 760px) {
  .admin-shell,
  .admin-shell--collapsed {
    display: block;
  }

  .admin-sidebar {
    position: fixed;
    left: 0;
    width: 224px;
    transform: translateX(-100%);
    transition: transform 180ms ease;
  }

  .admin-sidebar--open {
    transform: translateX(0);
  }

  .admin-shell__scrim {
    position: fixed;
    z-index: 15;
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    background: rgb(36 35 49 / 42%);
    border: 0;
  }

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
    place-items: center;
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

  .admin-content {
    padding: 18px 14px 32px;
  }

  .admin-tabs {
    display: none;
  }
}
</style>
