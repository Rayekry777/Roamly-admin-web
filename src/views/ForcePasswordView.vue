<script setup lang="ts">
import { Compass, Lock } from "@element-plus/icons-vue";
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
import { useRouter } from "vue-router";

import { changeAdminPassword } from "@/api/admin";
import { errorMessage } from "@/api/client";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const auth = useAuthStore();
const formRef = ref<FormInstance>();
const submitting = ref(false);
const form = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;
const rules = {
  currentPassword: [
    { required: true, message: "请输入当前密码", trigger: "blur" },
  ],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    {
      pattern: passwordPattern,
      message: "密码需为 8 至 64 位且包含字母和数字",
      trigger: "blur",
    },
  ],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    {
      validator: (
        _rule: unknown,
        value: string,
        callback: (error?: Error) => void,
      ) =>
        callback(
          value === form.newPassword
            ? undefined
            : new Error("两次输入的密码不一致"),
        ),
      trigger: "blur",
    },
  ],
};

async function submit(): Promise<void> {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    await changeAdminPassword(form.currentPassword, form.newPassword);
    auth.clearSession();
    ElMessage.success("密码已修改，请重新登录");
    await router.replace("/login");
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    submitting.value = false;
  }
}

async function signOut(): Promise<void> {
  await auth.logout();
  await router.replace("/login");
}
</script>

<template>
  <main class="password-page">
    <section class="password-panel" aria-labelledby="password-title">
      <header>
        <span class="password-panel__mark"><Compass /></span>
        <div>
          <p>账号安全</p>
          <h1 id="password-title">请先修改密码</h1>
        </div>
      </header>
      <p class="password-panel__notice">
        当前账号使用初始或重置密码，修改后将退出全部管理端会话。
      </p>
      <ElForm
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        @submit.prevent="submit"
      >
        <ElFormItem label="当前密码" prop="currentPassword">
          <ElInput
            v-model="form.currentPassword"
            type="password"
            show-password
            autocomplete="current-password"
          >
            <template #prefix
              ><ElIcon><Lock /></ElIcon
            ></template>
          </ElInput>
        </ElFormItem>
        <ElFormItem label="新密码" prop="newPassword">
          <ElInput
            v-model="form.newPassword"
            type="password"
            show-password
            autocomplete="new-password"
          />
        </ElFormItem>
        <ElFormItem label="确认新密码" prop="confirmPassword">
          <ElInput
            v-model="form.confirmPassword"
            type="password"
            show-password
            autocomplete="new-password"
          />
        </ElFormItem>
        <div class="password-panel__actions">
          <ElButton @click="signOut">退出登录</ElButton>
          <ElButton type="primary" native-type="submit" :loading="submitting"
            >确认修改</ElButton
          >
        </div>
      </ElForm>
    </section>
  </main>
</template>

<style scoped>
.password-page {
  display: grid;
  min-height: 100vh;
  padding: 24px;
  place-items: center;
}

.password-panel {
  width: min(480px, 100%);
  padding: 32px;
  background: var(--roamly-surface);
  border: 1px solid var(--roamly-border);
  border-radius: 8px;
  box-shadow: var(--roamly-shadow);
}

.password-panel header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.password-panel__mark {
  display: grid;
  width: 42px;
  height: 42px;
  color: #fff;
  background: var(--roamly-accent);
  border-radius: 6px;
  place-items: center;
}

.password-panel header p,
.password-panel h1 {
  margin: 0;
}

.password-panel header p {
  color: var(--roamly-muted);
  font-size: 12px;
}

.password-panel h1 {
  margin-top: 2px;
  font-size: 22px;
}

.password-panel__notice {
  padding: 12px 14px;
  margin: 24px 0;
  color: #625b96;
  background: #f1efff;
  border-left: 3px solid var(--roamly-accent);
  font-size: 13px;
  line-height: 1.6;
}

.password-panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 480px) {
  .password-page {
    padding: 0;
    background: var(--roamly-surface);
  }

  .password-panel {
    padding: 26px 20px;
    border: 0;
    box-shadow: none;
  }
}
</style>
