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
import { exportAdminResource, listAdminRedemptions } from "@/api/operations";
import { errorMessage } from "@/api/client";
import { saveBlob } from "@/utils/download";
import type { AdminRedemption } from "@/types/operations";
import PageHeader from "@/components/admin/PageHeader.vue";
const rows = ref<AdminRedemption[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const loading = ref(false);
async function load(): Promise<void> {
  loading.value = true;
  try {
    const result = await listAdminRedemptions(page.value, size.value);
    rows.value = result.items;
    total.value = result.total;
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    loading.value = false;
  }
}
function type(value: string) {
  return value === "SUCCEEDED"
    ? "success"
    : value === "REVERSED"
      ? "info"
      : "warning";
}
function label(value: string) {
  return value === "SUCCEEDED"
    ? "核销成功"
    : value === "REVERSED"
      ? "已撤销"
      : value;
}
onMounted(load);
async function exportRows(): Promise<void> {
  try {
    saveBlob(
      await exportAdminResource("redemptions"),
      "roamly-redemptions.xlsx",
    );
  } catch (error) {
    ElMessage.error(errorMessage(error));
  }
}
</script>
<template>
  <section class="governance-page">
    <PageHeader eyebrow="履约监管" title="核销审计" :meta="`共 ${total} 条`">
      <template #actions>
        <ElButton type="primary" plain @click="exportRows">导出 XLSX</ElButton>
      </template>
    </PageHeader>
    <section class="governance-table">
      <ElTable
        v-loading="loading"
        :data="rows"
        row-key="id"
        empty-text="暂无核销记录"
        ><ElTableColumn label="核销记录" min-width="180"
          ><template #default="scope"
            ><div class="governance-row-main">
              <strong>#{{ scope.row.id }}</strong
              ><small
                >券 #{{ scope.row.voucherId }} · 门店 #{{
                  scope.row.shopId
                }}</small
              >
            </div></template
          ></ElTableColumn
        ><ElTableColumn
          label="操作人"
          prop="operatorId"
          width="130" /><ElTableColumn label="使用次数" prop="useCount" width="110" /><ElTableColumn label="状态" width="110"
          ><template #default="scope"
            ><ElTag :type="type(scope.row.status)">{{
              label(scope.row.status)
            }}</ElTag></template
          ></ElTableColumn
        ><ElTableColumn
          prop="redeemedTime"
          label="核销时间"
          min-width="180" /><ElTableColumn
          prop="reversalReason"
          label="撤销原因"
          min-width="180"
          show-overflow-tooltip
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
