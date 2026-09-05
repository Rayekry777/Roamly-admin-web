<script setup lang="ts">
import { ElNotification } from "element-plus";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import AdminSidebar from "@/components/admin/AdminSidebar.vue";
import AdminTabs from "@/components/admin/AdminTabs.vue";
import AdminTopbar from "@/components/admin/AdminTopbar.vue";
import PageContainer from "@/components/admin/PageContainer.vue";
import { startAdminRealtime, type AdminRealtimeEvent } from "@/api/realtime";
import { visibleMenu } from "@/navigation/menu";
import { useAuthStore } from "@/stores/auth";

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
  ElNotification({
    title: "数据已更新",
    message: `${labels[event.type] ?? "业务数据"}发生变化，请刷新当前列表`,
    type: "info",
    duration: 3500,
  });
  window.dispatchEvent(
    new CustomEvent("roamly-admin-realtime", { detail: event }),
  );
}

onMounted(() => {
  stopRealtime = startAdminRealtime({
    onEvent: onRealtimeEvent,
    onState: (state) => {
      realtimeState.value = state;
    },
  });
});

onBeforeUnmount(() => stopRealtime?.());
</script>

<template>
  <div class="admin-shell" :class="{ 'admin-shell--collapsed': collapsed }">
    <AdminSidebar
      :menu="menu"
      :active-path="route.path"
      :collapsed="collapsed"
      :mobile-open="mobileMenuOpen"
      @navigate="navigate"
      @toggle="collapsed = !collapsed"
      @close-mobile="mobileMenuOpen = false"
    />
    <div class="admin-main">
      <AdminTopbar
        :realtime-state="realtimeState"
        :display-name="auth.current?.displayName"
        :role-label="auth.current?.roleLabel"
        @open-menu="mobileMenuOpen = true"
        @sign-out="signOut"
      />
      <AdminTabs
        :tabs="tabs"
        :active-path="route.path"
        @navigate="navigate"
        @close="closeTab"
      />
      <PageContainer>
        <RouterView v-slot="{ Component, route: viewRoute }">
          <Transition name="route" mode="out-in">
            <component :is="Component" :key="viewRoute.fullPath" />
          </Transition>
        </RouterView>
      </PageContainer>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  min-height: 100vh;
}

.admin-shell--collapsed {
  grid-template-columns: 72px minmax(0, 1fr);
}

.admin-main {
  min-width: 0;
}

@media (max-width: 760px) {
  .admin-shell,
  .admin-shell--collapsed {
    display: block;
  }
}
</style>
