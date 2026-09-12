<script setup lang="ts">
import { Check, Close, Refresh, View } from "@element-plus/icons-vue";
import {
  ElButton,
  ElDialog,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElPagination,
  ElTabPane,
  ElTable,
  ElTableColumn,
  ElTabs,
  ElTag,
} from "element-plus";
import { onMounted, onUnmounted, ref } from "vue";
import {
  approveAdminRefund,
  createAdminRefund,
  exportAdminResource,
  getAdminRefund,
  getAdminRefundTimeline,
  listAdminRefunds,
  rejectAdminRefund,
  retryAdminRefund,
} from "@/api/operations";
import { errorMessage } from "@/api/client";
import PageHeader from "@/components/admin/PageHeader.vue";
import { saveBlob } from "@/utils/download";
import type { AdminRefund, RefundTimelineEvent } from "@/types/operations";

const queues = [
  { value: "PENDING_REVIEW", label: "待审核" },
  { value: "WAITING_EXECUTION", label: "等待退款" },
  { value: "PROCESSING", label: "处理中" },
  { value: "FAILED", label: "退款失败" },
  { value: "MANUAL_REQUIRED", label: "人工处理" },
  { value: "PARTIAL_SUCCESS", label: "部分退款" },
  { value: "SUCCESS", label: "已完成" },
  { value: "REJECTED", label: "已拒绝" },
] as const;
const rows = ref<AdminRefund[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const queue = ref<(typeof queues)[number]["value"]>("PENDING_REVIEW");
const loading = ref(false);
const rejectDialog = ref(false);
const reason = ref("");
const target = ref<AdminRefund>();
const submitting = ref(false);
const createDialog = ref(false);
const createOrderId = ref("");
const createVoucherIds = ref("");
const createReason = ref("");
const drawer = ref(false);
const detailLoading = ref(false);
const detail = ref<AdminRefund>();
const timeline = ref<RefundTimelineEvent[]>([]);

const money = (value?: number) => "¥" + ((value ?? 0) / 100).toFixed(2);
const dateTime = (value?: string) =>
  value ? value.replace("T", " ").slice(0, 19) : "--";
function statusText(value?: string): string {
  return (
    (
      {
        PENDING_REVIEW: "待审核",
        AUTO_APPROVED: "自动通过",
        MANUAL_APPROVED: "人工通过",
        REJECTED: "已拒绝",
        NOT_STARTED: "未开始",
        WAITING_EXECUTION: "等待执行",
        PROCESSING: "处理中",
        RETRY_WAITING: "等待重试",
        SUCCESS: "退款成功",
        PARTIAL_SUCCESS: "部分退款",
        FAILED: "退款失败",
        MANUAL_REQUIRED: "人工处理",
        REQUESTED: "已申请",
        SUCCEEDED: "退款成功",
      } as Record<string, string>
    )[value || ""] ||
    value ||
    "--"
  );
}
function tagType(value?: string): "success" | "warning" | "danger" | "info" {
  if (value === "SUCCESS" || value === "SUCCEEDED") return "success";
  if (value === "FAILED" || value === "MANUAL_REQUIRED") return "danger";
  if (value === "REJECTED") return "info";
  return "warning";
}
async function load(): Promise<void> {
  loading.value = true;
  try {
    const result = await listAdminRefunds(queue.value, page.value, size.value);
    rows.value = result.items;
    total.value = result.total;
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    loading.value = false;
  }
}
async function openDetail(row: AdminRefund): Promise<void> {
  drawer.value = true;
  detailLoading.value = true;
  detail.value = row;
  timeline.value = [];
  try {
    const [current, events] = await Promise.all([
      getAdminRefund(row.id),
      getAdminRefundTimeline(row.id),
    ]);
    detail.value = current;
    timeline.value = events;
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    detailLoading.value = false;
  }
}
function openReject(row: AdminRefund): void {
  target.value = row;
  reason.value = "";
  rejectDialog.value = true;
}
async function decide(
  action: "approve" | "retry" | "reject",
  row = target.value,
): Promise<void> {
  if (!row) return;
  submitting.value = true;
  try {
    if (action === "approve") await approveAdminRefund(row.id);
    else if (action === "retry") await retryAdminRefund(row.id);
    else {
      if (!reason.value.trim()) {
        ElMessage.warning("请填写拒绝原因");
        return;
      }
      await rejectAdminRefund(row.id, reason.value.trim());
      rejectDialog.value = false;
    }
    ElMessage.success(
      action === "retry" ? "已创建新的 Mock 重试" : "审核结果已提交",
    );
    await load();
    if (drawer.value && detail.value?.id === row.id) await openDetail(row);
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
  const voucherIds = createVoucherIds.value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (
    !createOrderId.value.trim() ||
    !voucherIds.length ||
    !createReason.value.trim()
  ) {
    ElMessage.warning("请填写订单、券和退款原因");
    return;
  }
  submitting.value = true;
  try {
    await createAdminRefund({
      orderId: createOrderId.value.trim(),
      voucherIds,
      reasonCode: createReason.value.trim(),
    });
    createDialog.value = false;
    queue.value = "PENDING_REVIEW";
    page.value = 1;
    ElMessage.success("退款申请已创建");
    await load();
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    submitting.value = false;
  }
}
function onRealtime(event: Event): void {
  const payload = (event as CustomEvent<{ type?: string }>).detail;
  if (payload?.type === "REFUND_UPDATED") void load();
}
onMounted(() => {
  window.addEventListener("roamly-admin-realtime", onRealtime);
  void load();
});
onUnmounted(() =>
  window.removeEventListener("roamly-admin-realtime", onRealtime),
);
</script>

<template>
  <section class="governance-page">
    <PageHeader
      eyebrow="交易监管"
      title="退款工作台"
      :meta="'当前队列 ' + total + ' 笔'"
    >
      <template #actions>
        <ElButton type="primary" @click="createDialog = true"
          >发起退款</ElButton
        >
        <ElButton type="primary" plain @click="exportRows">导出 XLSX</ElButton>
      </template>
    </PageHeader>
    <section class="refund-queues">
      <ElTabs
        v-model="queue"
        @tab-change="
          page = 1;
          load();
        "
      >
        <ElTabPane
          v-for="item in queues"
          :key="item.value"
          :name="item.value"
          :label="item.label"
        />
      </ElTabs>
      <ElButton :icon="Refresh" @click="load">刷新</ElButton>
    </section>
    <section class="governance-table">
      <ElTable
        v-loading="loading"
        :data="rows"
        row-key="id"
        empty-text="当前队列暂无退款"
      >
        <ElTableColumn label="退款申请" min-width="230">
          <template #default="scope"
            ><div class="governance-row-main">
              <strong>{{ scope.row.refundNo || "#" + scope.row.id }}</strong>
              <small
                >订单 {{ scope.row.merchantOrderNo || scope.row.orderId }} ·
                {{ scope.row.items?.length || 1 }} 张券</small
              >
            </div></template
          >
        </ElTableColumn>
        <ElTableColumn label="申请人" width="110"
          ><template #default="scope">{{
            scope.row.source || "CONSUMER"
          }}</template></ElTableColumn
        >
        <ElTableColumn label="退款金额" width="130"
          ><template #default="scope"
            ><strong>{{ money(scope.row.amount) }}</strong></template
          ></ElTableColumn
        >
        <ElTableColumn label="审核状态" width="130"
          ><template #default="scope"
            ><ElTag type="info">{{
              statusText(scope.row.decisionStatus)
            }}</ElTag></template
          ></ElTableColumn
        >
        <ElTableColumn label="执行状态" width="130"
          ><template #default="scope"
            ><ElTag :type="tagType(scope.row.executionStatus)">{{
              statusText(scope.row.executionStatus)
            }}</ElTag></template
          ></ElTableColumn
        >
        <ElTableColumn label="申请时间" min-width="170"
          ><template #default="scope">{{
            dateTime(scope.row.requestedTime)
          }}</template></ElTableColumn
        >
        <ElTableColumn label="操作" width="220" fixed="right"
          ><template #default="scope">
            <div class="governance-table-actions">
              <ElButton link :icon="View" @click="openDetail(scope.row)"
                >查看</ElButton
              >
              <ElButton
                v-if="scope.row.decisionStatus === 'PENDING_REVIEW'"
                link
                type="primary"
                :icon="Check"
                @click="decide('approve', scope.row)"
                >通过</ElButton
              >
              <ElButton
                v-if="scope.row.decisionStatus === 'PENDING_REVIEW'"
                link
                type="danger"
                :icon="Close"
                @click="openReject(scope.row)"
                >拒绝</ElButton
              >
              <ElButton
                v-if="
                  ['FAILED', 'MANUAL_REQUIRED'].includes(
                    scope.row.executionStatus || '',
                  )
                "
                link
                type="warning"
                :icon="Refresh"
                @click="decide('retry', scope.row)"
                >重试</ElButton
              >
            </div>
          </template></ElTableColumn
        >
      </ElTable>
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
    <ElDrawer
      v-model="drawer"
      size="720px"
      class="governance-drawer"
      destroy-on-close
    >
      <template #header
        ><div class="governance-drawer__title">
          <strong>{{
            detail?.refundNo || "退款 #" + (detail?.id || "")
          }}</strong>
          <span>审核与渠道执行分离 · Mock 渠道</span>
        </div></template
      >
      <div v-loading="detailLoading">
        <section class="governance-detail-section">
          <h2>退款摘要</h2>
          <div class="governance-detail-grid">
            <div class="governance-detail-field">
              <label>订单</label
              ><strong>{{ detail?.merchantOrderNo || detail?.orderId }}</strong>
            </div>
            <div class="governance-detail-field">
              <label>申请金额</label
              ><strong>{{ money(detail?.amount) }}</strong>
            </div>
            <div class="governance-detail-field">
              <label>审核状态</label
              ><span>{{ statusText(detail?.decisionStatus) }}</span>
            </div>
            <div class="governance-detail-field">
              <label>执行状态</label
              ><span>{{ statusText(detail?.executionStatus) }}</span>
            </div>
            <div class="governance-detail-field">
              <label>当前处理人</label
              ><span>{{ detail?.currentHandlerId || "--" }}</span>
            </div>
            <div class="governance-detail-field">
              <label>Mock 渠道流水</label
              ><span>{{ detail?.providerRefundNo || "--" }}</span>
            </div>
            <div class="governance-detail-field governance-detail-field--wide">
              <label>申请原因</label
              ><span>{{ detail?.reason || detail?.description || "--" }}</span>
            </div>
            <div
              v-if="detail?.rejectReason || detail?.failureMessage"
              class="governance-detail-field governance-detail-field--wide"
            >
              <label>拒绝或失败原因</label
              ><span class="governance-reason">{{
                detail.rejectReason || detail.failureMessage
              }}</span>
            </div>
          </div>
        </section>
        <section class="governance-detail-section">
          <h2>逐券明细</h2>
          <ElTable
            :data="detail?.items || []"
            size="small"
            empty-text="暂无逐券数据"
          >
            <ElTableColumn prop="voucherId" label="券 ID" min-width="150" />
            <ElTableColumn label="是否核销" width="90"
              ><template #default="scope">{{
                scope.row.redeemed ? "已核销" : "未核销"
              }}</template></ElTableColumn
            >
            <ElTableColumn label="顾客实付" width="110"
              ><template #default="scope">{{
                money(scope.row.customerPaidAmount)
              }}</template></ElTableColumn
            >
            <ElTableColumn label="平台补贴" width="110"
              ><template #default="scope">{{
                money(scope.row.platformSubsidyAmount)
              }}</template></ElTableColumn
            >
            <ElTableColumn label="服务费返还" width="120"
              ><template #default="scope">{{
                money(scope.row.refundedServiceFeeAmount)
              }}</template></ElTableColumn
            >
            <ElTableColumn label="退款金额" width="110"
              ><template #default="scope">{{
                money(scope.row.refundAmount)
              }}</template></ElTableColumn
            >
          </ElTable>
        </section>
        <section class="governance-detail-section">
          <h2>退款时间线</h2>
          <div class="refund-timeline">
            <div
              v-for="item in timeline"
              :key="item.type + '-' + item.occurredAt"
              class="refund-timeline__item"
            >
              <i></i>
              <div>
                <strong>{{ item.title }}</strong
                ><span
                  >{{ statusText(item.status) }} ·
                  {{ dateTime(item.occurredAt) }}</span
                >
                <p v-if="item.description">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ElDrawer>
    <ElDialog
      v-model="rejectDialog"
      title="拒绝退款"
      width="min(470px, calc(100vw - 28px))"
    >
      <ElForm label-position="top"
        ><ElFormItem label="拒绝原因" required
          ><ElInput
            v-model="reason"
            type="textarea"
            maxlength="500"
            show-word-limit
            :rows="4" /></ElFormItem
      ></ElForm>
      <template #footer
        ><ElButton @click="rejectDialog = false">取消</ElButton
        ><ElButton type="danger" :loading="submitting" @click="decide('reject')"
          >确认拒绝</ElButton
        ></template
      >
    </ElDialog>
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
        <ElFormItem label="退款原因码" required
          ><ElInput v-model="createReason"
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

<style scoped>
.refund-queues {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  background: var(--roamly-surface);
  border: 1px solid var(--roamly-border);
  border-radius: var(--roamly-content-radius);
}
.refund-queues :deep(.el-tabs__header) {
  margin: 0;
}
.refund-timeline {
  display: grid;
  gap: 18px;
}
.refund-timeline__item {
  display: grid;
  grid-template-columns: 14px 1fr;
  gap: 10px;
}
.refund-timeline__item i {
  width: 9px;
  height: 9px;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--roamly-primary);
  box-shadow: 0 0 0 4px #fff0ef;
}
.refund-timeline__item div {
  display: grid;
  gap: 3px;
}
.refund-timeline__item span,
.refund-timeline__item p {
  margin: 0;
  color: var(--roamly-muted);
  font-size: 12px;
  line-height: 1.5;
}
@media (max-width: 760px) {
  .refund-queues {
    align-items: flex-start;
    overflow-x: auto;
  }
  .refund-queues .el-button {
    margin-top: 8px;
  }
}
</style>
