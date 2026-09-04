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
import { exportAdminResource, listAdminSettlements, retryAdminSettlement } from "@/api/operations";
import { errorMessage } from "@/api/client";
import { saveBlob } from "@/utils/download";
import type { AdminSettlement } from "@/types/operations";
const rows = ref<AdminSettlement[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);
const retrying = ref<string>();
async function load(): Promise<void> {
  loading.value = true;
  try {
    const result = await listAdminSettlements(page.value, size.value);
    rows.value = result.items;
    total.value = result.total;
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    loading.value = false;
  }
}
async function retry(row: AdminSettlement): Promise<void> {
  retrying.value = row.id;
  try {
    await retryAdminSettlement(row.id);
    ElMessage.success("结算已重试");
    await load();
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    retrying.value = undefined;
  }
}
async function exportRows(): Promise<void> { try { saveBlob(await exportAdminResource("settlements"), "roamly-settlements.xlsx"); } catch (error) { ElMessage.error(errorMessage(error)); } }
function tag(value: string) {
  return value === "SUCCEEDED"
    ? "success"
    : value === "FAILED"
      ? "danger"
      : "warning";
}
function label(value: string) {
  return value === "SUCCEEDED" ? "已结算" : value === "FAILED" ? "失败" : value;
}
onMounted(load);
</script>
<template>
  <section class="governance-page">
    <header class="governance-heading">
      <div>
        <p>资金管理</p>
        <h1>结算批次</h1>
      </div>
      <div class="governance-heading__actions"><ElButton type="primary" plain @click="exportRows">导出 XLSX</ElButton><span class="governance-heading__meta">共 {{ total }} 批</span></div>
    </header>
    <section class="governance-table">
      <ElTable
        v-loading="loading"
        :data="rows"
        row-key="id"
        empty-text="暂无结算批次"
        ><ElTableColumn label="批次" min-width="170"
          ><template #default="scope"
            ><div class="governance-row-main">
              <strong>#{{ scope.row.id }}</strong
              ><small>门店 #{{ scope.row.shopId }}</small>
            </div></template
          ></ElTableColumn
        ><ElTableColumn
          prop="settlementDate"
          label="结算日"
          width="130"
        /><ElTableColumn
          label="总额（分）"
          prop="totalAmount"
          width="130"
        /><ElTableColumn label="状态" width="110"
          ><template #default="scope"
            ><ElTag :type="tag(scope.row.status)">{{
              label(scope.row.status)
            }}</ElTag></template
          ></ElTableColumn
        ><ElTableColumn
          prop="failureReason"
          label="失败原因"
          min-width="180"
          show-overflow-tooltip
        /><ElTableColumn
          prop="processedTime"
          label="处理时间"
          min-width="180"
        /><ElTableColumn label="操作" width="100" fixed="right"
          ><template #default="scope"
            ><ElButton
              v-if="scope.row.status !== 'SUCCEEDED'"
              link
              type="primary"
              :icon="Refresh"
              :loading="retrying === scope.row.id"
              @click="retry(scope.row)"
              >重试</ElButton
            ><span v-else>-</span></template
          ></ElTableColumn
        ></ElTable
      >
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
  </section>
</template>
