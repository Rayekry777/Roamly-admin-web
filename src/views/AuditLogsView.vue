<script setup lang="ts">
import { Refresh } from "@element-plus/icons-vue";
import {
  ElButton,
  ElMessage,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
} from "element-plus";
import { onMounted, ref } from "vue";
import { exportAdminResource, listAdminAuditLogs } from "@/api/operations";
import { errorMessage } from "@/api/client";
import { saveBlob } from "@/utils/download";
import type { AdminAuditLog } from "@/types/operations";
const rows = ref<AdminAuditLog[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);
async function load(): Promise<void> {
  loading.value = true;
  try {
    const result = await listAdminAuditLogs(page.value, size.value);
    rows.value = result.items;
    total.value = result.total;
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    loading.value = false;
  }
}
function tag(value: string) {
  return value === "SUCCEEDED" ? "success" : "danger";
}
function label(value: string) {
  return value === "SUCCEEDED" ? "成功" : value === "FAILED" ? "失败" : value;
}
onMounted(load);
async function exportRows(): Promise<void> {
  try {
    saveBlob(await exportAdminResource("audits"), "roamly-audits.xlsx");
  } catch (error) {
    ElMessage.error(errorMessage(error));
  }
}
</script>
<template>
  <section class="governance-page">
    <header class="governance-heading">
      <div>
        <p>安全与合规</p>
        <h1>操作审计</h1>
      </div>
      <div class="governance-heading__actions">
        <ElButton type="primary" plain @click="exportRows">导出 XLSX</ElButton
        ><span class="governance-heading__meta">共 {{ total }} 条</span>
      </div>
    </header>
    <section class="governance-table">
      <ElTable
        v-loading="loading"
        :data="rows"
        row-key="id"
        empty-text="暂无审计记录"
        ><ElTableColumn label="审计记录" min-width="170"
          ><template #default="scope"
            ><div class="governance-row-main">
              <strong>#{{ scope.row.id }}</strong
              ><small
                >{{ scope.row.actorType }} ·
                {{ scope.row.actorId || "系统" }}</small
              >
            </div></template
          ></ElTableColumn
        ><ElTableColumn
          prop="action"
          label="操作"
          min-width="220" /><ElTableColumn label="对象" min-width="170"
          ><template #default="scope"
            >{{ scope.row.objectType }} #{{
              scope.row.objectId || "-"
            }}</template
          ></ElTableColumn
        ><ElTableColumn label="结果" width="100"
          ><template #default="scope"
            ><ElTag :type="tag(scope.row.result)">{{
              label(scope.row.result)
            }}</ElTag></template
          ></ElTableColumn
        ><ElTableColumn
          prop="reason"
          label="说明"
          min-width="220"
          show-overflow-tooltip /><ElTableColumn
          prop="createTime"
          label="时间"
          min-width="180"
      /></ElTable>
      <div class="governance-table__pagination">
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @current-change="load"
          @size-change="load"
        />
      </div>
    </section>
    <ElButton
      class="floating-refresh"
      :icon="Refresh"
      title="刷新"
      @click="load"
    />
  </section>
</template>
