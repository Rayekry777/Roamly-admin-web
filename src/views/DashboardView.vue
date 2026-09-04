<script setup lang="ts">
import { Key, Lock, User, UserFilled } from "@element-plus/icons-vue";
import { computed } from "vue";

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
    <header class="page-heading">
      <div>
        <p>今日工作台</p>
        <h1>{{ auth.current?.displayName }}，欢迎回来</h1>
      </div>
      <span class="page-heading__date">阶段 16 · 管理基础</span>
    </header>

    <div class="metric-grid">
      <article
        v-for="metric in metrics"
        :key="metric.label"
        class="metric-item"
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
  </section>
</template>

<style scoped>
.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 22px;
}

.page-heading p,
.page-heading h1 {
  margin: 0;
}

.page-heading p {
  margin-bottom: 5px;
  color: var(--roamly-muted);
  font-size: 13px;
}

.page-heading h1 {
  font-size: 24px;
}

.page-heading__date {
  color: var(--roamly-muted);
  font-size: 13px;
}

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
  .page-heading {
    align-items: flex-start;
  }
  .page-heading h1 {
    font-size: 20px;
  }
  .page-heading__date {
    display: none;
  }
  .metric-grid {
    grid-template-columns: 1fr;
  }
  .metric-item {
    min-height: 78px;
  }
  .dashboard-section {
    padding: 18px;
  }
  .permission-list code {
    max-width: 100%;
    overflow-wrap: anywhere;
  }
}
</style>
