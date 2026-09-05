<script setup lang="ts">
import {
  EditPen,
  Key,
  Lock,
  Plus,
  Refresh,
  Search,
  Unlock,
} from "@element-plus/icons-vue";
import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTooltip,
  type FormInstance,
} from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";

import {
  activateAdminUser,
  createAdminUser,
  disableAdminUser,
  listAdminUsers,
  resetAdminUserPassword,
  updateAdminUser,
} from "@/api/admin";
import { ApiError, errorMessage } from "@/api/client";
import type { AdminRole, AdminStatus, AdminUser } from "@/types/admin";
import PageHeader from "@/components/admin/PageHeader.vue";

const roleOptions: { value: AdminRole; label: string }[] = [
  { value: "PLATFORM_ADMIN", label: "平台超级管理员" },
  { value: "MERCHANT_REVIEWER", label: "商户审核员" },
  { value: "FINANCE", label: "财务管理员" },
];
const statusOptions: { value: AdminStatus; label: string }[] = [
  { value: "ACTIVE", label: "已启用" },
  { value: "DISABLED", label: "已停用" },
];
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;

const loading = ref(false);
const rows = ref<AdminUser[]>([]);
const total = ref(0);
const query = reactive<{
  keyword: string;
  role?: AdminRole;
  status?: AdminStatus;
  page: number;
  size: number;
}>({
  keyword: "",
  page: 1,
  size: 20,
});

const editorVisible = ref(false);
const editorMode = ref<"create" | "edit">("create");
const editorRef = ref<FormInstance>();
const editorSaving = ref(false);
const editor = reactive({
  id: "",
  username: "",
  displayName: "",
  role: "MERCHANT_REVIEWER" as AdminRole,
  initialPassword: "",
  version: 0,
});
const editorTitle = computed(() =>
  editorMode.value === "create" ? "新增管理员" : "编辑管理员",
);
const editorRules = computed(() => ({
  username:
    editorMode.value === "create"
      ? [
          { required: true, message: "请输入用户名", trigger: "blur" },
          {
            pattern: /^[A-Za-z0-9_.-]{3,32}$/,
            message: "用户名格式不正确",
            trigger: "blur",
          },
        ]
      : [],
  displayName: [{ required: true, message: "请输入显示名", trigger: "blur" }],
  role: [{ required: true, message: "请选择角色", trigger: "change" }],
  initialPassword:
    editorMode.value === "create"
      ? [
          { required: true, message: "请输入初始密码", trigger: "blur" },
          {
            pattern: passwordPattern,
            message: "密码需为 8 至 64 位且包含字母和数字",
            trigger: "blur",
          },
        ]
      : [],
}));

const resetVisible = ref(false);
const resetRef = ref<FormInstance>();
const resetSaving = ref(false);
const resetForm = reactive({
  id: "",
  username: "",
  newPassword: "",
  version: 0,
});
const resetRules = {
  newPassword: [
    { required: true, message: "请输入临时密码", trigger: "blur" },
    {
      pattern: passwordPattern,
      message: "密码需为 8 至 64 位且包含字母和数字",
      trigger: "blur",
    },
  ],
};

async function load(): Promise<void> {
  loading.value = true;
  try {
    const result = await listAdminUsers({
      keyword: query.keyword.trim() || undefined,
      role: query.role,
      status: query.status,
      page: query.page,
      size: query.size,
    });
    rows.value = result.items;
    total.value = result.total;
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    loading.value = false;
  }
}

function search(): void {
  query.page = 1;
  void load();
}

function resetQuery(): void {
  query.keyword = "";
  query.role = undefined;
  query.status = undefined;
  query.page = 1;
  void load();
}

function openCreate(): void {
  editorMode.value = "create";
  Object.assign(editor, {
    id: "",
    username: "",
    displayName: "",
    role: "MERCHANT_REVIEWER",
    initialPassword: "",
    version: 0,
  });
  editorVisible.value = true;
}

function openEdit(row: AdminUser): void {
  editorMode.value = "edit";
  Object.assign(editor, {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    role: row.role,
    initialPassword: "",
    version: row.version,
  });
  editorVisible.value = true;
}

async function saveEditor(): Promise<void> {
  await editorRef.value?.validate();
  editorSaving.value = true;
  try {
    if (editorMode.value === "create") {
      await createAdminUser({
        username: editor.username,
        displayName: editor.displayName,
        role: editor.role,
        initialPassword: editor.initialPassword,
      });
      ElMessage.success("管理员已创建");
    } else {
      await updateAdminUser(editor.id, {
        displayName: editor.displayName,
        role: editor.role,
        version: editor.version,
      });
      ElMessage.success("管理员信息已更新");
    }
    editorVisible.value = false;
    await load();
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) await load();
    ElMessage.error(errorMessage(error));
  } finally {
    editorSaving.value = false;
  }
}

async function changeStatus(row: AdminUser): Promise<void> {
  const enabling = row.status === "DISABLED";
  await ElMessageBox.confirm(
    `确认${enabling ? "启用" : "停用"}管理员“${row.displayName}”？`,
    `${enabling ? "启用" : "停用"}管理员`,
    {
      type: enabling ? "info" : "warning",
      confirmButtonText: "确认",
      cancelButtonText: "取消",
    },
  );
  try {
    if (enabling) await activateAdminUser(row.id, row.version);
    else await disableAdminUser(row.id, row.version);
    ElMessage.success(`管理员已${enabling ? "启用" : "停用"}`);
    await load();
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) await load();
    ElMessage.error(errorMessage(error));
  }
}

function openReset(row: AdminUser): void {
  Object.assign(resetForm, {
    id: row.id,
    username: row.username,
    newPassword: "",
    version: row.version,
  });
  resetVisible.value = true;
}

async function saveReset(): Promise<void> {
  await resetRef.value?.validate();
  resetSaving.value = true;
  try {
    await resetAdminUserPassword(
      resetForm.id,
      resetForm.newPassword,
      resetForm.version,
    );
    resetVisible.value = false;
    ElMessage.success("密码已重置，目标账号需重新登录并修改密码");
    await load();
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) await load();
    ElMessage.error(errorMessage(error));
  } finally {
    resetSaving.value = false;
  }
}

function formatTime(value?: string): string {
  if (!value) return "从未登录";
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

onMounted(load);
</script>

<template>
  <section class="admin-users-page">
    <PageHeader eyebrow="账号与权限" title="管理员账号">
      <template #actions>
        <ElButton type="primary" :icon="Plus" @click="openCreate"
          >新增管理员</ElButton
        >
      </template>
    </PageHeader>

    <section class="filter-band" aria-label="管理员筛选">
      <ElInput
        v-model="query.keyword"
        clearable
        placeholder="用户名或显示名"
        @keyup.enter="search"
      />
      <ElSelect v-model="query.role" clearable placeholder="全部角色">
        <ElOption
          v-for="option in roleOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>
      <ElSelect v-model="query.status" clearable placeholder="全部状态">
        <ElOption
          v-for="option in statusOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>
      <div class="filter-band__actions">
        <ElButton :icon="Refresh" @click="resetQuery">重置</ElButton>
        <ElButton type="primary" :icon="Search" @click="search">查询</ElButton>
      </div>
    </section>

    <section class="table-band">
      <ElTable
        v-loading="loading"
        :data="rows"
        row-key="id"
        empty-text="暂无管理员账号"
      >
        <ElTableColumn prop="username" label="用户名" min-width="145" />
        <ElTableColumn prop="displayName" label="显示名" min-width="150" />
        <ElTableColumn label="角色" min-width="150"
          ><template #default="scope">{{
            scope.row.roleLabel
          }}</template></ElTableColumn
        >
        <ElTableColumn label="状态" width="100">
          <template #default="scope">
            <ElTag
              :type="scope.row.status === 'ACTIVE' ? 'success' : 'info'"
              effect="light"
              >{{ scope.row.statusLabel }}</ElTag
            >
          </template>
        </ElTableColumn>
        <ElTableColumn label="改密" width="92">
          <template #default="scope">
            <span
              :class="
                scope.row.forcePasswordChange ? 'text-warning' : 'text-muted'
              "
            >
              {{ scope.row.forcePasswordChange ? "待完成" : "已完成" }}
            </span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="最近登录" min-width="170">
          <template #default="scope">{{
            formatTime(scope.row.lastLoginTime)
          }}</template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="142" fixed="right">
          <template #default="scope">
            <div class="table-actions">
              <ElTooltip content="编辑" placement="top"
                ><ElButton
                  aria-label="编辑"
                  :icon="EditPen"
                  circle
                  @click="openEdit(scope.row)"
              /></ElTooltip>
              <ElTooltip content="重置密码" placement="top"
                ><ElButton
                  aria-label="重置密码"
                  :icon="Key"
                  circle
                  @click="openReset(scope.row)"
              /></ElTooltip>
              <ElTooltip
                :content="scope.row.status === 'ACTIVE' ? '停用' : '启用'"
                placement="top"
              >
                <ElButton
                  :type="scope.row.status === 'ACTIVE' ? 'danger' : 'success'"
                  :aria-label="scope.row.status === 'ACTIVE' ? '停用' : '启用'"
                  :icon="scope.row.status === 'ACTIVE' ? Lock : Unlock"
                  plain
                  circle
                  @click="changeStatus(scope.row)"
                />
              </ElTooltip>
            </div>
          </template>
        </ElTableColumn>
      </ElTable>
      <footer class="table-band__footer">
        <span>共 {{ total }} 条</span>
        <ElPagination
          v-model:current-page="query.page"
          v-model:page-size="query.size"
          layout="prev, pager, next"
          :total="total"
          @current-change="load"
        />
      </footer>
    </section>

    <ElDialog
      v-model="editorVisible"
      :title="editorTitle"
      width="min(520px, calc(100vw - 28px))"
      destroy-on-close
    >
      <ElForm
        ref="editorRef"
        :model="editor"
        :rules="editorRules"
        label-position="top"
      >
        <ElFormItem label="用户名" prop="username">
          <ElInput
            v-model="editor.username"
            :disabled="editorMode === 'edit'"
            autocomplete="off"
          />
        </ElFormItem>
        <ElFormItem label="显示名" prop="displayName"
          ><ElInput v-model="editor.displayName" maxlength="64"
        /></ElFormItem>
        <ElFormItem label="固定角色" prop="role">
          <ElSelect v-model="editor.role" class="dialog-select">
            <ElOption
              v-for="option in roleOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem
          v-if="editorMode === 'create'"
          label="初始密码"
          prop="initialPassword"
        >
          <ElInput
            v-model="editor.initialPassword"
            type="password"
            show-password
            autocomplete="new-password"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="editorVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="editorSaving" @click="saveEditor"
          >保存</ElButton
        >
      </template>
    </ElDialog>

    <ElDialog
      v-model="resetVisible"
      title="重置管理员密码"
      width="min(460px, calc(100vw - 28px))"
      destroy-on-close
    >
      <p class="dialog-note">账号：{{ resetForm.username }}</p>
      <ElForm
        ref="resetRef"
        :model="resetForm"
        :rules="resetRules"
        label-position="top"
      >
        <ElFormItem label="临时新密码" prop="newPassword">
          <ElInput
            v-model="resetForm.newPassword"
            type="password"
            show-password
            autocomplete="new-password"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="resetVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="resetSaving" @click="saveReset"
          >确认重置</ElButton
        >
      </template>
    </ElDialog>
  </section>
</template>

<style scoped>
.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 18px;
}
.page-heading p,
.page-heading h1 {
  margin: 0;
}
.page-heading p {
  margin-bottom: 4px;
  color: var(--roamly-muted);
  font-size: 12px;
}
.page-heading h1 {
  font-size: 23px;
}
.filter-band {
  display: grid;
  grid-template-columns:
    minmax(180px, 1.3fr) minmax(150px, 0.8fr) minmax(130px, 0.7fr)
    auto;
  padding: 14px;
  background: var(--roamly-surface);
  border: 1px solid var(--roamly-border);
  border-radius: 8px 8px 0 0;
  gap: 10px;
}
.filter-band__actions {
  display: flex;
  gap: 8px;
}
.table-band {
  overflow: hidden;
  background: var(--roamly-surface);
  border: 1px solid var(--roamly-border);
  border-top: 0;
  border-radius: 0 0 8px 8px;
}
.table-actions {
  display: flex;
  gap: 6px;
}
.table-band__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: 8px 14px;
  color: var(--roamly-muted);
  border-top: 1px solid var(--roamly-border);
  font-size: 12px;
}
.text-warning {
  color: #b87513;
}
.text-muted {
  color: var(--roamly-muted);
}
.dialog-select {
  width: 100%;
}
.dialog-note {
  padding: 10px 12px;
  margin: 0 0 18px;
  color: var(--roamly-muted);
  background: var(--roamly-bg);
  border-radius: 6px;
  font-size: 13px;
}

@media (max-width: 900px) {
  .filter-band {
    grid-template-columns: 1fr 1fr;
  }
  .filter-band__actions {
    justify-content: flex-end;
  }
}

@media (max-width: 560px) {
  .page-heading h1 {
    font-size: 20px;
  }
  .filter-band {
    grid-template-columns: 1fr;
    border-radius: 8px;
  }
  .filter-band__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .table-band {
    margin-top: 12px;
    border-top: 1px solid var(--roamly-border);
    border-radius: 8px;
  }
  .table-band__footer {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }
}
</style>
