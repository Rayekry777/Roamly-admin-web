<script setup lang="ts">
import { Check, Close, Refresh } from "@element-plus/icons-vue";
import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from "element-plus";
import { onMounted, ref } from "vue";
import {
  createAdminRefund,
  approveAdminRefund,
  listAdminRefunds,
  rejectAdminRefund,
  retryAdminRefund,
  exportAdminResource,
} from "@/api/operations";
import { errorMessage } from "@/api/client";
import PageHeader from "@/components/admin/PageHeader.vue";
import { saveBlob } from "@/utils/download";
import type { AdminRefund } from "@/types/operations";

const rows = ref<AdminRefund[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const status = ref<string>();
const loading = ref(false);
const dialog = ref(false);
const reason = ref("");
const target = ref<AdminRefund>();
const submitting = ref(false);
const createDialog = ref(false);
const createOrderId = ref("");
const createVoucherIds = ref("");
const createReason = ref("");
const options = [
  { value: "REQUESTED", label: "已申请" },
  { value: "PROCESSING", label: "处理中" },
  { value: "SUCCEEDED", label: "退款成功" },
  { value: "FAILED", label: "失败" },
  { value: "REJECTED", label: "已拒绝" },
];
async function load(): Promise<void> {
  loading.value = true;
  try {
    const result = await listAdminRefunds(status.value, page.value, size.value);
    rows.value = result.items;
    total.value = result.total;
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    loading.value = false;
  }
}
function reset(): void {
  status.value = undefined;
  page.value = 1;
  void load();
}
function tagType(value: string) {
  return value === "SUCCEEDED"
    ? "success"
    : value === "REJECTED"
      ? "info"
      : value === "FAILED"
        ? "danger"
        : "warning";
}
function label(value: string) {
  return options.find((item) => item.value === value)?.label ?? value;
}
function openReject(row: AdminRefund): void {
  target.value = row;
  reason.value = "";
  dialog.value = true;
}
async function decide(action: "approve" | "retry" | "reject"): Promise<void> {
  if (!target.value) return;
  submitting.value = true;
  try {
    if (action === "approve") await approveAdminRefund(target.value.id);
    else if (action === "retry") await retryAdminRefund(target.value.id);
    else {
      if (!reason.value.trim()) {
        ElMessage.warning("请填写拒绝原因");
        return;
      }
      await rejectAdminRefund(target.value.id, reason.value.trim());
      dialog.value = false;
    }
    ElMessage.success("退款状态已更新");
    await load();
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    submitting.value = false;
  }
}
async function exportRows(): Promise<void> {
  try {
    saveBlob(await exportAdminResource("refunds"), "roamly-refunds.xlsx");
  } catch (error) {
    ElMessage.error(errorMessage(error));
  }
}
async function submitCreate(): Promise<void> {
  if (
    !createOrderId.value.trim() ||
    !createVoucherIds.value.trim() ||
    !createReason.value.trim()
  ) {
    ElMessage.warning("请填写订单、券和退款原因");
    return;
  }
  submitting.value = true;
  try {
    await createAdminRefund({
      orderId: createOrderId.value.trim(),
      voucherIds: createVoucherIds.value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      reasonCode: createReason.value.trim(),
    });
    createDialog.value = false;
    ElMessage.success("退款已发起");
    await load();
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    submitting.value = false;
  }
}
onMounted(load);
</script>
<template>
  <section class="governance-page">
    <PageHeader eyebrow="交易监管" title="退款处理" :meta="`共 ${total} 笔`">
      <template #actions>
        <ElButton type="primary" @click="createDialog = true"
          >发起退款</ElButton
        >
        <ElButton type="primary" plain @click="exportRows">导出 XLSX</ElButton>
      </template>
    </PageHeader>
    <section class="governance-filter">
      <ElSelect
        v-model="status"
        clearable
        placeholder="全部退款状态"
        @change="
          page = 1;
          load();
        "
        ><ElOption
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
      /></ElSelect>
      <div class="governance-filter__actions">
        <ElButton :icon="Refresh" @click="reset">重置</ElButton>
      </div>
    </section>
    <section class="governance-table">
      <ElTable
        v-loading="loading"
        :data="rows"
        row-key="id"
        empty-text="暂无退款记录"
        ><ElTableColumn label="退款单" min-width="170"
          ><template #default="scope"
            ><div class="governance-row-main">
              <strong>#{{ scope.row.id }}</strong
              ><small
                >订单 #{{ scope.row.orderId }} · 券 #{{
                  scope.row.voucherId
                }}</small
              >
            </div></template
          ></ElTableColumn
        ><ElTableColumn
          label="金额（分）"
          prop="amount"
          width="120"
        /><ElTableColumn label="状态" width="110"
          ><template #default="scope"
            ><ElTag :type="tagType(scope.row.status)">{{
              label(scope.row.status)
            }}</ElTag></template
          ></ElTableColumn
        ><ElTableColumn
          prop="reason"
          label="原因"
          min-width="180"
          show-overflow-tooltip
        /><ElTableColumn
          prop="requestedTime"
          label="申请时间"
          min-width="180"
        /><ElTableColumn label="操作" width="190" fixed="right"
          ><template #default="scope"
            ><div
              v-if="
                scope.row.status === 'REQUESTED' ||
                scope.row.status === 'FAILED'
              "
              class="governance-table-actions"
            >
              <ElButton
                link
                type="primary"
                :icon="Check"
                @click="
                  target = scope.row;
                  decide('approve');
                "
                >通过</ElButton
              ><ElButton
                v-if="scope.row.status === 'REQUESTED'"
                link
                type="danger"
                :icon="Close"
                @click="openReject(scope.row)"
                >拒绝</ElButton
              ><ElButton
                v-else
                link
                type="warning"
                :icon="Refresh"
                @click="
                  target = scope.row;
                  decide('retry');
                "
                >重试</ElButton
              >
            </div>
            <span v-else>-</span></template
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
    <ElDialog
      v-model="dialog"
      title="拒绝退款"
      width="min(470px, calc(100vw - 28px))"
      ><ElForm label-position="top"
        ><ElFormItem label="拒绝原因" required
          ><ElInput
            v-model="reason"
            type="textarea"
            maxlength="500"
            show-word-limit
            :rows="4" /></ElFormItem></ElForm
      ><template #footer
        ><ElButton :disabled="submitting" @click="dialog = false">取消</ElButton
        ><ElButton type="danger" :loading="submitting" @click="decide('reject')"
          >确认拒绝</ElButton
        ></template
      ></ElDialog
    >
    <ElDialog
      v-model="createDialog"
      title="发起退款"
      width="min(470px, calc(100vw - 28px))"
    >
      <ElForm label-position="top">
        <ElFormItem label="订单 ID" required
          ><ElInput v-model="createOrderId"
        /></ElFormItem>
        <ElFormItem label="券 ID（逗号分隔）" required
          ><ElInput v-model="createVoucherIds"
        /></ElFormItem>
        <ElFormItem label="退款原因" required
          ><ElInput v-model="createReason" type="textarea" :rows="3"
        /></ElFormItem>
      </ElForm>
      <template #footer
        ><ElButton @click="createDialog = false">取消</ElButton
        ><ElButton type="primary" :loading="submitting" @click="submitCreate"
          >确认发起</ElButton
        ></template
      >
    </ElDialog>
  </section>
</template>
