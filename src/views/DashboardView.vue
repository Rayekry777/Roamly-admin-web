<script setup lang="ts">
import { Key, Lock, User, UserFilled } from "@element-plus/icons-vue";
import { computed } from "vue";

import PageHeader from "@/components/admin/PageHeader.vue";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const metrics = computed(() => [
  {
    label: "当前角色",
    value: auth.current?.roleLabel ?? "-",
    icon: UserFilled,
    tone: "coral",
  },
  {
    label: "账号状态",
    value: auth.current?.statusLabel ?? "-",
    icon: Lock,
    tone: "green",
  },
  {
    label: "已授权能力",
    value: `${auth.current?.permissions.length ?? 0} 项`,
    icon: Key,
    tone: "purple",
  },
  {
    label: "当前管理员",
    value: auth.current?.displayName ?? "-",
    icon: User,
    tone: "neutral",
  },
]);
</script>

<template>
  <section class="dashboard-page">
    <PageHeader
      eyebrow="今日工作台"
      :title="`${auth.current?.displayName ?? ''}，欢迎回来`"
      meta="平台管理 · 实时工作区"
    />

    <div class="metric-grid">
      <article
        v-for="(metric, index) in metrics"
        :key="metric.label"
        class="metric-item list-stagger"
        :style="{ animationDelay: `${index * 35}ms` }"
      >
        <span class="metric-item__icon" :data-tone="metric.tone"
          ><component :is="metric.icon"
        /></span>
        <div>
          <p>{{ metric.label }}</p>
          <strong>{{ metric.value }}</strong>
        </div>
      </article>
    </div>

    <section class="dashboard-section">
      <div class="dashboard-section__title">
        <div>
          <p>权限边界</p>
          <h2>当前账号可用能力</h2>
        </div>
        <span>{{ auth.current?.permissions.length ?? 0 }} 项</span>
      </div>
      <div class="permission-list">
        <code
          v-for="permission in auth.current?.permissions"
          :key="permission"
          >{{ permission }}</code
        >
      </div>
    </section>

    <section class="dashboard-status">
      <div>
        <p>系统状态</p>
        <h2>管理端服务运行正常</h2>
        <span>权限、会话和实时刷新均已按当前账号边界启用。</span>
      </div>
      <span class="dashboard-status__badge"><i />已连接</span>
    </section>
  </section>
</template>

<style scoped>
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metric-item {
  display: flex;
  align-items: center;
  min-height: 92px;
  padding: 17px;
  background: var(--roamly-surface);
  border: 1px solid var(--roamly-border);
  border-radius: 8px;
  gap: 13px;
  box-shadow: 0 1px 0 rgb(45 42 80 / 2%);
}

.metric-item:hover {
  border-color: rgb(255 95 87 / 35%);
  box-shadow: var(--roamly-shadow-sm);
  transform: translateY(-2px);
}

.metric-item__icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  color: #6559cf;
  background: #efedff;
  border-radius: 6px;
  place-items: center;
}

.metric-item__icon[data-tone="coral"] {
  color: #d94841;
  background: #fff0ef;
}
.metric-item__icon[data-tone="green"] {
  color: #278263;
  background: #eaf8f2;
}
.metric-item__icon[data-tone="neutral"] {
  color: #5f5d69;
  background: #f0f0f4;
}
.metric-item__icon svg {
  width: 20px;
}
.metric-item p {
  margin: 0 0 5px;
  color: var(--roamly-muted);
  font-size: 12px;
}
.metric-item strong {
  display: block;
  overflow: hidden;
  font-size: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-section {
  padding: 22px;
  margin-top: 16px;
  background: var(--roamly-surface);
  border: 1px solid var(--roamly-border);
  border-radius: 8px;
}

.dashboard-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px;
  margin-top: 16px;
  background: linear-gradient(135deg, #fff 0%, #fff9f8 100%);
  border: 1px solid rgb(255 95 87 / 18%);
  border-radius: 8px;
}

.dashboard-status p,
.dashboard-status h2,
.dashboard-status span {
  margin: 0;
}

.dashboard-status p {
  color: var(--roamly-muted);
  font-size: 12px;
}

.dashboard-status h2 {
  margin-top: 4px;
  font-size: 16px;
}

.dashboard-status div > span {
  display: block;
  margin-top: 6px;
  color: var(--roamly-muted);
  font-size: 12px;
}

.dashboard-status__badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  color: var(--roamly-success);
  background: var(--roamly-success-soft);
  border-radius: 999px;
  font-size: 12px;
  white-space: nowrap;
}

.dashboard-status__badge i {
  width: 6px;
  height: 6px;
  margin-right: 6px;
  background: currentColor;
  border-radius: 50%;
}

.dashboard-section__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.dashboard-section__title p,
.dashboard-section__title h2 {
  margin: 0;
}
.dashboard-section__title p {
  color: var(--roamly-muted);
  font-size: 12px;
}
.dashboard-section__title h2 {
  margin-top: 4px;
  font-size: 17px;
}
.dashboard-section__title > span {
  color: var(--roamly-accent);
  font-size: 13px;
  font-weight: 700;
}
.permission-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}
.permission-list code {
  padding: 7px 9px;
  color: #5e5785;
  background: #f5f3ff;
  border: 1px solid #e8e4ff;
  border-radius: 5px;
  font-size: 12px;
}

@media (max-width: 1100px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 560px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
  .metric-item {
    min-height: 78px;
  }
  .dashboard-section {
    padding: 18px;
  }
  .dashboard-status {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }
  .permission-list code {
    max-width: 100%;
    overflow-wrap: anywhere;
  }
}
</style>
