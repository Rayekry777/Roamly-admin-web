<script setup lang="ts">
import { Download } from "@element-plus/icons-vue";
import { onMounted, ref } from "vue";
import {
  ElButton,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from "element-plus";
import {
  exportLedger,
  listLedger,
  getFinanceSummary,
  type LedgerPage,
  type FinanceSummary,
} from "@/api/finance";
import { saveBlob } from "@/utils/download";
import PageHeader from "@/components/admin/PageHeader.vue";
import DataTableFrame from "@/components/admin/DataTableFrame.vue";
const loading = ref(false);
const exporting = ref(false);
const data = ref<LedgerPage>({ items: [], page: 1, size: 20, total: 0 });
const summary = ref<FinanceSummary>();
async function load() {
  loading.value = true;
  try {
    const [ledger, totals] = await Promise.all([
      listLedger(),
      getFinanceSummary(),
    ]);
    data.value = ledger;
    summary.value = totals;
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : "加载账本失败");
  } finally {
    loading.value = false;
  }
}
onMounted(load);
async function exportRows(): Promise<void> {
  exporting.value = true;
  try {
    saveBlob(await exportLedger(), "roamly-ledger.xlsx");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "导出账本失败");
  } finally {
    exporting.value = false;
  }
}
</script>
<template>
  <section class="governance-page">
    <PageHeader
      eyebrow="资金与佣金"
      title="账本分录"
      :meta="`共 ${data.total} 条`"
    >
      <template #actions>
        <ElButton
          type="primary"
          plain
          :icon="Download"
          :loading="exporting"
          @click="exportRows"
          >导出 XLSX</ElButton
        >
      </template>
    </PageHeader>
    <DataTableFrame :loading="loading">
      <div v-if="summary" class="finance-summary">
        <div>
          <span>支付冻结</span><strong>{{ summary.frozenAmount }} 分</strong>
        </div>
        <div>
          <span>已退款</span><strong>{{ summary.refundedAmount }} 分</strong>
        </div>
        <div>
          <span>当前净额</span><strong>{{ summary.netAmount }} 分</strong>
        </div>
      </div>
      <ElTable
        v-loading="loading"
        :data="data.items"
        row-key="id"
        empty-text="暂无账本分录"
        ><ElTableColumn
          prop="id"
          label="分录 ID"
          min-width="180" /><ElTableColumn
          prop="shopId"
          label="门店 ID"
          width="150" /><ElTableColumn
          prop="entryType"
          label="业务事件"
          width="190" /><ElTableColumn
          prop="accountSide"
          label="方向"
          width="100"
          ><template #default="s"
            ><ElTag>{{
              s.row.accountSide === "CREDIT" ? "贷方" : "借方"
            }}</ElTag></template
          ></ElTableColumn
        ><ElTableColumn
          prop="amount"
          label="金额（分）"
          width="130" /><ElTableColumn
          prop="occurredTime"
          label="发生时间"
          min-width="180"
      /></ElTable>
    </DataTableFrame>
  </section>
</template>
