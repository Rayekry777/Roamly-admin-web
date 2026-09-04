<script setup lang="ts">
import {
  CircleCheck,
  CloseBold,
  Refresh,
  Search,
  View,
} from "@element-plus/icons-vue";
import {
  ElButton,
  ElDialog,
  ElDrawer,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElPagination,
  ElSelect,
  ElSkeleton,
  ElTable,
  ElTableColumn,
  ElTag,
} from "element-plus";
import { computed, onMounted, reactive, ref } from "vue";

import {
  approveVoucherReview,
  getVoucherReview,
  listVoucherReviews,
  rejectVoucherReview,
} from "@/api/voucher-review";
import { ApiError, errorMessage } from "@/api/client";
import type {
  AdminVoucherReviewDetail,
  AdminVoucherReviewListItem,
  VoucherProductType,
  VoucherReviewStatus,
} from "@/types/voucher-review";
import {
  formatFen,
  formatReviewTime,
  newReviewKey,
  reviewTagType,
  saleTagType,
  voucherProductTypeOptions,
  voucherReviewStatusOptions,
  voucherSaleStatusLabels,
} from "@/utils/voucher-review";

const loading = ref(false);
const rows = ref<AdminVoucherReviewListItem[]>([]);
const total = ref(0);
const query = reactive<{
  status?: VoucherReviewStatus;
  productType?: VoucherProductType;
  shopId: string;
  keyword: string;
  page: number;
  size: number;
}>({ shopId: "", keyword: "", page: 1, size: 20 });

const drawerVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<AdminVoucherReviewDetail | null>(null);
const commandSubmitting = ref(false);
const rejectionVisible = ref(false);
const rejectionReason = ref("");

const canDecide = computed(
  () => detail.value?.product.reviewStatus === "PENDING",
);

async function load(): Promise<void> {
  loading.value = true;
  try {
    const result = await listVoucherReviews({
      status: query.status,
      productType: query.productType,
      shopId: query.shopId.trim() || undefined,
      keyword: query.keyword.trim() || undefined,
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
  query.status = undefined;
  query.productType = undefined;
  query.shopId = "";
  query.keyword = "";
  query.page = 1;
  void load();
}

async function openDetail(row: AdminVoucherReviewListItem): Promise<void> {
  detail.value = null;
  drawerVisible.value = true;
  detailLoading.value = true;
  try {
    detail.value = await getVoucherReview(row.id);
  } catch (error) {
    drawerVisible.value = false;
    ElMessage.error(errorMessage(error));
  } finally {
    detailLoading.value = false;
  }
}

async function reloadDetail(): Promise<void> {
  const current = detail.value;
  if (!current) return;
  detailLoading.value = true;
  try {
    detail.value = await getVoucherReview(current.product.id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      drawerVisible.value = false;
      ElMessage.warning("团购券已不存在，列表已刷新");
    } else {
      ElMessage.error(errorMessage(error));
    }
  } finally {
    detailLoading.value = false;
  }
}

async function approve(): Promise<void> {
  const current = detail.value;
  if (!current || !canDecide.value || commandSubmitting.value) return;
  await ElMessageBox.confirm(
    `确认通过“${current.product.title || "未命名团购券"}”？通过后将按销售时间公开展示。`,
    "通过团购券审核",
    {
      type: "warning",
      confirmButtonText: "确认通过",
      cancelButtonText: "取消",
    },
  );
  commandSubmitting.value = true;
  try {
    await approveVoucherReview(
      current.product.id,
      current.product.version,
      newReviewKey(
        "admin-voucher-approval",
        current.product.id,
        current.product.version,
      ),
    );
    ElMessage.success("团购券审核已通过");
    await reloadDetail();
    await load();
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      await reloadDetail();
      await load();
      ElMessage.warning("团购券状态已变化，请按最新版本重新审核");
    } else {
      ElMessage.error(errorMessage(error));
    }
  } finally {
    commandSubmitting.value = false;
  }
}

function openRejection(): void {
  rejectionReason.value = "";
  rejectionVisible.value = true;
}

async function reject(): Promise<void> {
  const current = detail.value;
  const reason = rejectionReason.value.trim();
  if (!current || !canDecide.value || commandSubmitting.value) return;
  if (!reason || reason.length > 500) {
    ElMessage.warning("驳回原因需为 1 至 500 字");
    return;
  }
  commandSubmitting.value = true;
  try {
    await rejectVoucherReview(
      current.product.id,
      current.product.version,
      reason,
      newReviewKey(
        "admin-voucher-rejection",
        current.product.id,
        current.product.version,
        reason,
      ),
    );
    rejectionVisible.value = false;
    ElMessage.success("团购券已驳回");
    await reloadDetail();
    await load();
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      await reloadDetail();
      await load();
      ElMessage.warning("团购券状态已变化，请按最新版本重新审核");
    } else {
      ElMessage.error(errorMessage(error));
    }
  } finally {
    commandSubmitting.value = false;
  }
}

function ruleText(
  rule: AdminVoucherReviewDetail["product"]["usageRules"][number],
): string {
  if (rule.closed) return `${rule.dayOfWeek} 休息`;
  return `${rule.dayOfWeek} ${rule.periods.map((period) => `${period.open}-${period.close}`).join("、") || "全天"}`;
}

onMounted(load);
</script>

<template>
  <section class="governance-page voucher-reviews-page">
    <header class="governance-heading">
      <div>
        <p>券审核与销售治理</p>
        <h1>团购券审核</h1>
      </div>
      <span class="governance-heading__meta">共 {{ total }} 条券</span>
    </header>

    <section class="governance-filter" aria-label="团购券审核筛选">
      <ElSelect v-model="query.status" clearable placeholder="全部审核状态">
        <ElOption
          v-for="option in voucherReviewStatusOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>
      <ElSelect v-model="query.productType" clearable placeholder="全部券型">
        <ElOption
          v-for="option in voucherProductTypeOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>
      <ElInput v-model="query.shopId" clearable placeholder="门店 ID" />
      <ElInput
        v-model="query.keyword"
        clearable
        placeholder="券标题关键词"
        @keyup.enter="search"
      />
      <div class="governance-filter__actions">
        <ElButton :icon="Refresh" @click="resetQuery">重置</ElButton>
        <ElButton type="primary" :icon="Search" @click="search">查询</ElButton>
      </div>
    </section>

    <section class="governance-table">
      <ElTable
        v-loading="loading"
        :data="rows"
        row-key="id"
        empty-text="暂无待审核团购券"
      >
        <ElTableColumn label="团购券 / 门店" min-width="220">
          <template #default="scope">
            <div class="governance-row-main">
              <strong>{{ scope.row.title || "未命名团购券" }}</strong>
              <small
                >{{ scope.row.shopName || "未知门店" }} · #{{
                  scope.row.id
                }}</small
              >
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="券型" width="110">
          <template #default="scope">{{ scope.row.productTypeLabel }}</template>
        </ElTableColumn>
        <ElTableColumn label="售价 / 原价" width="150">
          <template #default="scope">
            <div class="governance-row-main">
              <strong>{{ formatFen(scope.row.priceAmount) }}</strong>
              <small>原价 {{ formatFen(scope.row.marketAmount) }}</small>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="审核状态" width="112">
          <template #default="scope">
            <ElTag
              :type="reviewTagType(scope.row.reviewStatus)"
              effect="light"
              >{{ scope.row.reviewStatusLabel }}</ElTag
            >
          </template>
        </ElTableColumn>
        <ElTableColumn label="销售状态" width="112">
          <template #default="scope">
            <ElTag
              v-if="scope.row.saleStatus"
              :type="saleTagType(scope.row.saleStatus)"
              effect="light"
              >{{
                scope.row.saleStatusLabel ||
                voucherSaleStatusLabels[scope.row.saleStatus]
              }}</ElTag
            >
            <span v-else class="text-muted">未上架</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="提交时间" min-width="160">
          <template #default="scope">{{
            formatReviewTime(scope.row.submittedAt)
          }}</template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="84" fixed="right">
          <template #default="scope">
            <ElButton
              class="governance-link-button"
              type="primary"
              link
              :icon="View"
              @click="openDetail(scope.row)"
              >查看</ElButton
            >
          </template>
        </ElTableColumn>
      </ElTable>
      <div class="governance-table__pagination">
        <ElPagination
          v-model:current-page="query.page"
          v-model:page-size="query.size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @current-change="load"
          @size-change="search"
        />
      </div>
    </section>

    <ElDrawer
      v-model="drawerVisible"
      class="governance-drawer"
      size="760px"
      :close-on-click-modal="false"
    >
      <template #header>
        <div class="governance-drawer__title">
          <strong>{{ detail?.product.title || "团购券审核详情" }}</strong>
          <span v-if="detail"
            >{{ detail.product.productTypeLabel }} ·
            {{ detail.product.reviewStatusLabel }}</span
          >
        </div>
      </template>
      <div v-if="detailLoading && !detail" class="governance-detail-loading">
        <ElSkeleton :rows="8" animated />
      </div>
      <template v-else-if="detail">
        <section class="governance-detail-section">
          <h2>审核摘要</h2>
          <div class="governance-detail-grid">
            <div class="governance-detail-field">
              <label>门店</label><strong>{{ detail.shop?.name || "-" }}</strong
              ><span>{{ detail.shop?.address || "地址暂缺" }}</span>
            </div>
            <div class="governance-detail-field">
              <label>商户账号</label
              ><span>{{
                detail.merchantName || detail.merchantAccountId || "-"
              }}</span>
            </div>
            <div class="governance-detail-field">
              <label>审核状态</label
              ><ElTag
                :type="reviewTagType(detail.product.reviewStatus)"
                effect="light"
                >{{ detail.product.reviewStatusLabel }}</ElTag
              >
            </div>
            <div class="governance-detail-field">
              <label>销售状态</label
              ><ElTag
                v-if="detail.product.saleStatus"
                :type="saleTagType(detail.product.saleStatus)"
                effect="light"
                >{{
                  detail.product.saleStatusLabel ||
                  voucherSaleStatusLabels[detail.product.saleStatus]
                }}</ElTag
              ><span v-else>未上架</span>
            </div>
          </div>
        </section>
        <section class="governance-detail-section">
          <h2>价格与库存</h2>
          <div class="governance-detail-grid">
            <div class="governance-detail-field">
              <label>售价</label
              ><strong>{{ formatFen(detail.product.priceAmount) }}</strong>
            </div>
            <div class="governance-detail-field">
              <label>市场价</label
              ><span>{{ formatFen(detail.product.marketAmount) }}</span>
            </div>
            <div class="governance-detail-field">
              <label>库存</label
              ><span
                >{{ detail.product.availableStock }} /
                {{ detail.product.totalStock }}</span
              >
            </div>
            <div class="governance-detail-field">
              <label>限购</label
              ><span>{{ detail.product.purchaseLimit || "不限" }}</span>
            </div>
            <div class="governance-detail-field">
              <label>销售时间</label
              ><span
                >{{ formatReviewTime(detail.product.saleBeginTime) }} 至
                {{ formatReviewTime(detail.product.saleEndTime) }}</span
              >
            </div>
            <div class="governance-detail-field">
              <label>有效期</label
              ><span
                >{{ detail.product.validityTypeLabel || "-" }} ·
                {{
                  detail.product.validDays
                    ? `${detail.product.validDays} 天`
                    : `${formatReviewTime(detail.product.validBeginTime)} 至 ${formatReviewTime(detail.product.validEndTime)}`
                }}</span
              >
            </div>
          </div>
        </section>
        <section class="governance-detail-section">
          <h2>权益与使用规则</h2>
          <div v-if="detail.product.packageItems.length" class="review-items">
            <div
              v-for="item in detail.product.packageItems"
              :key="item.id"
              class="review-item"
            >
              <strong>{{ item.name }}</strong
              ><span
                >{{ item.quantity }} {{ item.unit }} ·
                {{ formatFen(item.unitPriceAmount) }}</span
              >
            </div>
          </div>
          <div class="review-rules">
            <span
              v-for="rule in detail.product.usageRules"
              :key="rule.dayOfWeek"
              >{{ ruleText(rule) }}</span
            >
          </div>
          <p
            v-if="detail.product.reservationRequired"
            class="governance-dialog-note"
          >
            需要预约：{{
              detail.product.reservationNotice || "请按门店规则提前预约"
            }}
          </p>
          <p v-if="detail.product.rejectionReason" class="governance-reason">
            驳回原因：{{ detail.product.rejectionReason }}
          </p>
        </section>
        <section class="governance-detail-section">
          <h2>媒体与时间</h2>
          <div class="review-media-list">
            <span
              v-for="media in [
                detail.product.coverMedia,
                ...detail.product.detailMedia,
              ].filter(Boolean)"
              :key="media!.id"
              >{{ media!.purposeLabel }} · {{ media!.originalFilename }}</span
            >
          </div>
          <div class="governance-detail-grid review-timestamps">
            <div class="governance-detail-field">
              <label>提交时间</label
              ><span>{{ formatReviewTime(detail.product.submittedAt) }}</span>
            </div>
            <div class="governance-detail-field">
              <label>当前版本</label><span>{{ detail.product.version }}</span>
            </div>
          </div>
        </section>
      </template>
      <template #footer>
        <div
          class="governance-drawer__actions governance-drawer__actions--review"
        >
          <ElButton :disabled="commandSubmitting" @click="drawerVisible = false"
            >关闭</ElButton
          >
          <template v-if="canDecide">
            <ElButton
              :icon="CloseBold"
              :disabled="commandSubmitting"
              @click="openRejection"
              >驳回</ElButton
            >
            <ElButton
              type="primary"
              :icon="CircleCheck"
              :loading="commandSubmitting"
              @click="approve"
              >通过</ElButton
            >
          </template>
        </div>
      </template>
    </ElDrawer>

    <ElDialog
      v-model="rejectionVisible"
      title="驳回团购券"
      width="min(520px, calc(100vw - 28px))"
      destroy-on-close
    >
      <ElForm label-position="top"
        ><ElFormItem label="驳回原因"
          ><ElInput
            v-model="rejectionReason"
            type="textarea"
            :rows="5"
            maxlength="500"
            show-word-limit
            placeholder="请说明需要修改的内容" /></ElFormItem
      ></ElForm>
      <template #footer
        ><ElButton @click="rejectionVisible = false">取消</ElButton
        ><ElButton type="primary" :loading="commandSubmitting" @click="reject"
          >确认驳回</ElButton
        ></template
      >
    </ElDialog>
  </section>
</template>

<style scoped>
.text-muted {
  color: var(--roamly-muted);
}
.review-items,
.review-rules,
.review-media-list {
  display: grid;
  gap: 8px;
}
.review-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--roamly-bg);
  border: 1px solid var(--roamly-border);
  border-radius: 6px;
  font-size: 13px;
}
.review-item span,
.review-rules span,
.review-media-list span {
  color: var(--roamly-muted);
  font-size: 12px;
}
.review-rules {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 12px;
}
.review-media-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.review-timestamps {
  margin-top: 16px;
}
@media (max-width: 560px) {
  .review-rules,
  .review-media-list {
    grid-template-columns: 1fr;
  }
}
</style>
