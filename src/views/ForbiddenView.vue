<script setup lang="ts">
import { WarningFilled } from "@element-plus/icons-vue";
import { ElButton } from "element-plus";
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <section class="forbidden">
    <WarningFilled />
    <h1>无权访问此页面</h1>
    <p>当前管理员角色未获得对应权限。</p>
    <ElButton type="primary" @click="router.push('/dashboard')"
      >返回运营摘要</ElButton
    >
  </section>
</template>

<style scoped>
.forbidden {
  display: grid;
  min-height: 56vh;
  text-align: center;
  place-content: center;
  justify-items: center;
}
.forbidden svg {
  width: 42px;
  color: var(--roamly-accent);
}
.forbidden h1 {
  margin: 18px 0 6px;
  font-size: 22px;
}
.forbidden p {
  margin: 0 0 22px;
  color: var(--roamly-muted);
  font-size: 14px;
}
</style>
