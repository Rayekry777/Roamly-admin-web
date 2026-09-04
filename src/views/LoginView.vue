<script setup lang="ts">
import { Compass, Lock, User } from "@element-plus/icons-vue";
import {
  ElButton,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElMessage,
  type FormInstance,
} from "element-plus";
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { errorMessage } from "@/api/client";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const formRef = ref<FormInstance>();
const form = reactive({ username: "", password: "" });
const rules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    {
      pattern: /^[A-Za-z0-9_.-]{3,32}$/,
      message: "用户名格式不正确",
      trigger: "blur",
    },
  ],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
};

async function submit(): Promise<void> {
  await formRef.value?.validate();
  try {
    const current = await auth.login(form.username, form.password);
    const redirect =
      typeof route.query.redirect === "string"
        ? route.query.redirect
        : "/dashboard";
    await router.replace(
      current.forcePasswordChange ? "/force-password" : redirect,
    );
  } catch (error) {
    ElMessage.error(errorMessage(error));
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-panel" aria-labelledby="login-title">
      <div class="login-brand">
        <span class="login-brand__mark"><Compass /></span>
        <div><strong>Roamly</strong><span>平台管理</span></div>
      </div>
      <div class="login-copy">
        <p>ROAMLY OPERATIONS</p>
        <h1 id="login-title">登录运营工作台</h1>
      </div>
      <ElForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submit"
      >
        <ElFormItem label="用户名" prop="username">
          <ElInput
            v-model="form.username"
            size="large"
            autocomplete="username"
            placeholder="请输入用户名"
          >
            <template #prefix
              ><ElIcon><User /></ElIcon
            ></template>
          </ElInput>
        </ElFormItem>
        <ElFormItem label="密码" prop="password">
          <ElInput
            v-model="form.password"
            size="large"
            type="password"
            autocomplete="current-password"
            show-password
            placeholder="请输入密码"
            @keyup.enter="submit"
          >
            <template #prefix
              ><ElIcon><Lock /></ElIcon
            ></template>
          </ElInput>
        </ElFormItem>
        <ElButton
          class="login-submit"
          type="primary"
          size="large"
          native-type="submit"
          :loading="auth.loading"
        >
          登录
        </ElButton>
      </ElForm>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  display: grid;
  min-height: 100vh;
  padding: 36px 20px;
  background: var(--roamly-bg);
  place-items: center;
}

.login-panel {
  width: min(420px, 100%);
  padding: 34px;
  background: var(--roamly-surface);
  border: 1px solid var(--roamly-border);
  border-radius: var(--roamly-content-radius);
  box-shadow: var(--roamly-shadow);
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.login-brand__mark {
  display: grid;
  width: 38px;
  height: 38px;
  color: #fff;
  background: var(--roamly-primary);
  border-radius: 6px;
  place-items: center;
}

.login-brand__mark svg {
  width: 22px;
}

.login-brand div {
  display: grid;
}

.login-brand strong {
  font-size: 18px;
}

.login-brand span:not(.login-brand__mark) {
  color: var(--roamly-muted);
  font-size: 12px;
}

.login-copy {
  margin: 42px 0 28px;
}

.login-copy p {
  margin: 0 0 8px;
  color: var(--roamly-accent);
  font-size: 12px;
  font-weight: 700;
}

.login-copy h1 {
  margin: 0;
  font-size: 27px;
  line-height: 1.3;
}

.login-submit {
  width: 100%;
  margin-top: 8px;
}

@media (max-width: 480px) {
  .login-page {
    padding: 0;
    background: var(--roamly-surface);
  }

  .login-panel {
    padding: 28px 22px;
    border: 0;
    box-shadow: none;
  }
}
</style>
