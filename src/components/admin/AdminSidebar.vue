<script setup lang="ts">
import { Compass, Fold } from "@element-plus/icons-vue";
import { ElIcon } from "element-plus";
import type { MenuItem } from "@/navigation/menu";

defineProps<{
  menu: MenuItem[];
  activePath: string;
  collapsed: boolean;
  mobileOpen: boolean;
}>();

const emit = defineEmits<{
  navigate: [path: string];
  toggle: [];
  closeMobile: [];
}>();
</script>

<template>
  <button
    v-if="mobileOpen"
    class="admin-shell__scrim"
    aria-label="关闭导航"
    @click="emit('closeMobile')"
  />
  <aside class="admin-sidebar" :class="{ 'admin-sidebar--open': mobileOpen }">
    <div class="admin-brand">
      <span class="admin-brand__mark"><Compass /></span>
      <span v-if="!collapsed" class="admin-brand__name">Roamly</span>
    </div>
    <nav class="admin-nav" aria-label="管理导航">
      <button
        v-for="(item, index) in menu"
        :key="item.path"
        class="admin-nav__item list-stagger"
        :class="{ 'admin-nav__item--active': activePath === item.path }"
        :style="{ animationDelay: `${Math.min(index, 5) * 24}ms` }"
        :title="collapsed ? item.label : undefined"
        @click="emit('navigate', item.path)"
      >
        <ElIcon><component :is="item.icon" /></ElIcon>
        <span v-if="!collapsed">{{ item.label }}</span>
      </button>
    </nav>
    <button
      class="admin-sidebar__fold"
      :title="collapsed ? '展开导航' : '折叠侧栏'"
      @click="emit('toggle')"
    >
      <Fold />
      <span v-if="!collapsed">收起导航</span>
    </button>
  </aside>
</template>

<style scoped>
.admin-shell__scrim {
  position: fixed;
  z-index: 15;
  display: none;
  width: 100%;
  height: 100%;
  padding: 0;
  background: rgb(36 35 49 / 42%);
  border: 0;
}

.admin-sidebar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  height: 100vh;
  color: #fff;
  background: var(--roamly-sidebar);
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
  border-radius: 8px;
  place-items: center;
}

.admin-brand__mark svg {
  width: 20px;
}

.admin-brand__name {
  font-size: 19px;
  font-weight: 750;
  letter-spacing: -0.02em;
}

.admin-nav {
  display: grid;
  gap: 4px;
  padding: 16px 10px;
}

.admin-nav__item,
.admin-sidebar__fold {
  display: flex;
  align-items: center;
  height: 42px;
  padding: 0 13px;
  color: rgb(255 255 255 / 68%);
  background: transparent;
  border: 0;
  border-radius: 8px;
  gap: 12px;
  cursor: pointer;
}

.admin-nav__item:hover,
.admin-nav__item--active {
  color: #fff;
  background: var(--roamly-sidebar-hover);
}

.admin-nav__item--active {
  box-shadow: inset 3px 0 var(--roamly-primary);
}

.admin-sidebar__fold {
  width: calc(100% - 20px);
  margin: auto 10px 16px;
}

.admin-sidebar__fold svg {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
}

@media (max-width: 760px) {
  .admin-sidebar {
    position: fixed;
    left: 0;
    width: 240px;
    transform: translateX(-100%);
    transition: transform var(--roamly-motion-slow)
      cubic-bezier(0.22, 1, 0.36, 1);
  }

  .admin-sidebar--open {
    transform: translateX(0);
  }

  .admin-shell__scrim {
    display: block;
  }
}
</style>
