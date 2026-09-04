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
  ElDatePicker,
  ElDialog,
  ElDrawer,
  ElEmpty,
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
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";

import {
  approveMerchantApplication,
  getMerchantApplication,
  getMerchantApplicationMedia,
  listMerchantApplications,
  rejectMerchantApplication,
} from "@/api/governance";
import { ApiError, errorMessage } from "@/api/client";
import BusinessHoursList from "@/components/BusinessHoursList.vue";
import type {
  AdminBusinessMedia,
  MerchantApplicationDetail,
  MerchantApplicationListItem,
  MerchantApplicationStatus,
} from "@/types/governance";
import {
  type CommandKeyState,
  formatBytes,
  formatDateTime,
  merchantApplicationStatusOptions,
  nextCommandKey,
} from "@/utils/governance";
import { ObjectUrlRegistry } from "@/utils/object-urls";

const loading = ref(false);
const rows = ref<MerchantApplicationListItem[]>([]);
const total = ref(0);
const query = reactive<{
  status?: MerchantApplicationStatus;
  cityCode: string;
  shopTypeId: string;
  phone: string;
  submittedRange: string[];
  page: number;
  size: number;
}>({
  cityCode: "",
  shopTypeId: "",
  phone: "",
  submittedRange: [],
  page: 1,
  size: 20,
});

const drawerVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<MerchantApplicationDetail | null>(null);
const mediaLoading = ref(false);
const mediaUrls = ref<Record<string, string>>({});
const commandSubmitting = ref(false);
const approvalKey = ref<CommandKeyState | null>(null);
const rejectionKey = ref<CommandKeyState | null>(null);
const rejectionVisible = ref(false);
const rejectionReason = ref("");
const objectUrls = new ObjectUrlRegistry();

async function load(): Promise<void> {
  loading.value = true;
  try {
    const result = await listMerchantApplications({
      status: query.status,
      cityCode: query.cityCode,
      shopTypeId: query.shopTypeId,
      phone: query.phone,
      submittedFrom: query.submittedRange[0],
      submittedTo: query.submittedRange[1],
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
  query.cityCode = "";
  query.shopTypeId = "";
  query.phone = "";
  query.submittedRange = [];
  query.page = 1;
  void load();
}

function releaseMediaUrls(): void {
  objectUrls.clear();
  mediaUrls.value = {};
  mediaLoading.value = false;
}

async function loadMedia(
  application: MerchantApplicationDetail,
): Promise<void> {
  const generation = objectUrls.begin();
  mediaUrls.value = {};
  const media = [
    ...(application.licenseMedia ? [application.licenseMedia] : []),
    ...application.galleryMedia,
  ];
  if (media.length === 0) return;
  mediaLoading.value = true;
  const next: Record<string, string> = {};
  try {
    for (const item of media) {
      const blob = await getMerchantApplicationMedia(item.contentPath);
      const url = objectUrls.add(generation, item.id, blob);
      if (!url) return;
      next[item.id] = url;
    }
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    if (objectUrls.isCurrent(generation)) {
      mediaUrls.value = next;
      mediaLoading.value = false;
    }
  }
}

async function loadDetail(
  applicationId: string,
  refreshMedia = true,
): Promise<void> {
  detailLoading.value = true;
  try {
    const current = await getMerchantApplication(applicationId);
    detail.value = current;
    if (refreshMedia) await loadMedia(current);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      drawerVisible.value = false;
      ElMessage.warning("申请已不存在，列表已刷新");
      await load();
      return;
    }
    ElMessage.error(errorMessage(error));
  } finally {
    detailLoading.value = false;
  }
}

async function openDetail(row: MerchantApplicationListItem): Promise<void> {
  releaseMediaUrls();
  detail.value = null;
  approvalKey.value = null;
  rejectionKey.value = null;
  rejectionReason.value = "";
  drawerVisible.value = true;
  await loadDetail(row.id);
}

function beforeDrawerClose(done: () => void): void {
  if (commandSubmitting.value) {
    ElMessage.warning("审核命令正在提交，请稍候");
    return;
  }
  done();
}

function closeDrawer(): void {
  if (commandSubmitting.value) return;
  drawerVisible.value = false;
}

function onDrawerClosed(): void {
  releaseMediaUrls();
  detail.value = null;
  rejectionVisible.value = false;
}

async function refreshAfterConflict(): Promise<void> {
  if (detail.value) await loadDetail(detail.value.id, false);
  await load();
  ElMessage.warning("服务端状态已变化，请按最新版本重新核对后提交");
}

async function approve(): Promise<void> {
  const current = detail.value;
  if (!current || current.status !== "PENDING") return;
  await ElMessageBox.confirm(
    `确认通过“${current.shopName}”的入驻申请？通过后将立即创建并激活门店。`,
    "通过商户申请",
    {
      type: "warning",
      confirmButtonText: "确认通过",
      cancelButtonText: "取消",
      closeOnClickModal: false,
    },
  );
  const signature = `approval|${current.id}|${current.version}`;
  approvalKey.value = nextCommandKey(
    approvalKey.value,
    signature,
    "admin-merchant-approval",
  );
  commandSubmitting.value = true;
  try {
    await approveMerchantApplication(
      current.id,
      current.version,
      approvalKey.value.key,
    );
    approvalKey.value = null;
    ElMessage.success("申请已通过，门店已激活");
    await loadDetail(current.id, false);
    await load();
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      await refreshAfterConflict();
    } else {
      ElMessage.error(errorMessage(error));
    }
  } finally {
    commandSubmitting.value = false;
  }
}

function openRejection(): void {
  rejectionReason.value = "";
  rejectionKey.value = null;
  rejectionVisible.value = true;
}

async function reject(): Promise<void> {
  const current = detail.value;
  const reason = rejectionReason.value.trim();
  if (!current || current.status !== "PENDING") return;
  if (reason.length < 1 || reason.length > 500) {
    ElMessage.warning("驳回原因需为 1 至 500 字");
    return;
  }
  const signature = `rejection|${current.id}|${current.version}|${reason}`;
  rejectionKey.value = nextCommandKey(
    rejectionKey.value,
    signature,
    "admin-merchant-rejection",
  );
  commandSubmitting.value = true;
  try {
    await rejectMerchantApplication(
      current.id,
      current.version,
      reason,
      rejectionKey.value.key,
    );
    rejectionKey.value = null;
    rejectionVisible.value = false;
    ElMessage.success("申请已驳回");
    await loadDetail(current.id, false);
    await load();
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      await refreshAfterConflict();
    } else {
      ElMessage.error(errorMessage(error));
    }
  } finally {
    commandSubmitting.value = false;
  }
}

function statusTagType(status: MerchantApplicationStatus) {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  if (status === "PENDING") return "warning";
  return "info";
}

function mediaAlt(media: AdminBusinessMedia): string {
  return `${media.purposeLabel}：${media.originalFilename}`;
}

onMounted(load);
onBeforeUnmount(releaseMediaUrls);
</script>

<template>
  <section class="governance-page merchant-applications-page">
    <header class="governance-heading">
      <div>
        <p>入驻与资质</p>
        <h1>商户申请</h1>
      </div>
      <span class="governance-heading__meta">共 {{ total }} 条申请</span>
    </header>

    <section class="governance-filter" aria-label="商户申请筛选">
      <ElSelect v-model="query.status" clearable placeholder="全部状态">
        <ElOption
          v-for="option in merchantApplicationStatusOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>
      <ElInput v-model="query.cityCode" clearable placeholder="城市编码" />
      <ElInput v-model="query.shopTypeId" clearable placeholder="类目 ID" />
      <ElInput
        v-model="query.phone"
        clearable
        maxlength="11"
        placeholder="精确联系人手机号"
        @keyup.enter="search"
      />
      <ElDatePicker
        v-model="query.submittedRange"
        type="datetimerange"
        value-format="YYYY-MM-DDTHH:mm:ss"
        range-separator="至"
        start-placeholder="提交开始"
        end-placeholder="提交结束"
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
        empty-text="暂无商户申请"
      >
        <ElTableColumn label="申请 / 门店" min-width="190">
          <template #default="scope">
            <div class="governance-row-main">
              <strong>{{ scope.row.shopName }}</strong>
              <small>#{{ scope.row.id }}</small>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="类目" min-width="130">
          <template #default="scope">{{
            scope.row.shopTypeName || "-"
          }}</template>
        </ElTableColumn>
        <ElTableColumn label="城市" min-width="125">
          <template #default="scope">
            {{ scope.row.cityName || scope.row.cityCode }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="联系人" min-width="145">
          <template #default="scope">
            <div class="governance-row-main">
              <strong>{{ scope.row.contactName }}</strong>
              <small>{{ scope.row.contactPhoneMasked }}</small>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="提交时间" min-width="170">
          <template #default="scope">{{
            formatDateTime(scope.row.submittedAt)
          }}</template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="112">
          <template #default="scope">
            <ElTag :type="statusTagType(scope.row.status)" effect="light">
              {{ scope.row.statusLabel }}
            </ElTag>
          </template>
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
      :before-close="beforeDrawerClose"
      @closed="onDrawerClosed"
    >
      <template #header>
        <div class="governance-drawer__title">
          <strong>{{ detail?.shopName || "商户申请详情" }}</strong>
          <span v-if="detail"
            >申请编号 #{{ detail.id }} · {{ detail.statusLabel }}</span
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
              <label>当前状态</label>
              <ElTag :type="statusTagType(detail.status)" effect="light">{{
                detail.statusLabel
              }}</ElTag>
            </div>
            <div class="governance-detail-field">
              <label>提交时间</label>
              <span>{{ formatDateTime(detail.submittedAt) }}</span>
            </div>
            <div class="governance-detail-field">
              <label>门店名称</label>
              <strong>{{ detail.shopName }}</strong>
            </div>
            <div class="governance-detail-field">
              <label>经营类目</label>
              <span>{{ detail.shopTypeName || detail.shopTypeId }}</span>
            </div>
          </div>
        </section>

        <section class="governance-detail-section">
          <h2>主体证照</h2>
          <div class="governance-detail-grid">
            <div class="governance-detail-field">
              <label>营业执照号</label>
              <span>{{ detail.licenseNumber }}</span>
            </div>
            <div class="governance-detail-field">
              <label>法定代表人</label>
              <span>{{ detail.legalRepresentative }}</span>
            </div>
            <div class="governance-detail-field">
              <label>联系人</label>
              <span>{{ detail.contactName }}</span>
            </div>
            <div class="governance-detail-field">
              <label>联系电话</label>
              <span>{{ detail.contactPhone }}</span>
            </div>
          </div>
          <div
            v-if="detail.licenseMedia"
            class="governance-media-grid license-media-grid"
          >
            <article class="governance-media">
              <div v-loading="mediaLoading" class="governance-media__preview">
                <img
                  v-if="mediaUrls[detail.licenseMedia.id]"
                  :src="mediaUrls[detail.licenseMedia.id]"
                  :alt="mediaAlt(detail.licenseMedia)"
                />
                <span v-else>图片暂不可用</span>
              </div>
              <div class="governance-media__meta">
                <strong>{{ detail.licenseMedia.originalFilename }}</strong>
                <span
                  >{{ detail.licenseMedia.width }}×{{
                    detail.licenseMedia.height
                  }}
                  · {{ formatBytes(detail.licenseMedia.byteSize) }}</span
                >
              </div>
            </article>
          </div>
        </section>

        <section class="governance-detail-section">
          <h2>门店地址</h2>
          <div class="governance-detail-grid">
            <div class="governance-detail-field">
              <label>城市 / 区域</label>
              <span
                >{{ detail.cityName || detail.cityCode }} ·
                {{ detail.district }}</span
              >
            </div>
            <div class="governance-detail-field">
              <label>坐标</label>
              <span>{{ detail.longitude }}, {{ detail.latitude }}</span>
            </div>
            <div class="governance-detail-field governance-detail-field--wide">
              <label>详细地址</label>
              <strong>{{ detail.address }}</strong>
            </div>
          </div>
        </section>

        <section class="governance-detail-section">
          <h2>七日营业时间</h2>
          <BusinessHoursList :hours="detail.businessHours" />
        </section>

        <section class="governance-detail-section">
          <h2>经营图片</h2>
          <ElEmpty
            v-if="detail.galleryMedia.length === 0"
            description="未提交经营图片"
            :image-size="54"
          />
          <div v-else class="governance-media-grid">
            <article
              v-for="media in detail.galleryMedia"
              :key="media.id"
              class="governance-media"
            >
              <div v-loading="mediaLoading" class="governance-media__preview">
                <img
                  v-if="mediaUrls[media.id]"
                  :src="mediaUrls[media.id]"
                  :alt="mediaAlt(media)"
                />
                <span v-else>图片暂不可用</span>
              </div>
              <div class="governance-media__meta">
                <strong>{{ media.originalFilename }}</strong>
                <span
                  >{{ media.width }}×{{ media.height }} ·
                  {{ formatBytes(media.byteSize) }}</span
                >
              </div>
            </article>
          </div>
        </section>

        <section class="governance-detail-section">
          <h2>Mock 结算</h2>
          <div class="governance-detail-grid">
            <div class="governance-detail-field">
              <label>账户名称</label>
              <span>{{ detail.settlementAccountName }}</span>
            </div>
            <div class="governance-detail-field">
              <label>开户机构</label>
              <span>{{ detail.settlementBankName }}</span>
            </div>
            <div class="governance-detail-field">
              <label>账户尾号</label>
              <strong>•••• {{ detail.settlementAccountSuffix }}</strong>
            </div>
          </div>
        </section>

        <section class="governance-detail-section">
          <h2>审核记录</h2>
          <div v-if="detail.review" class="governance-detail-grid">
            <div class="governance-detail-field">
              <label>审核决定</label>
              <span>{{ detail.review.decisionLabel }}</span>
            </div>
            <div class="governance-detail-field">
              <label>审核人</label>
              <span>{{
                detail.review.reviewerDisplayName ||
                detail.review.reviewerAdminId
              }}</span>
            </div>
            <div class="governance-detail-field">
              <label>审核时间</label>
              <span>{{ formatDateTime(detail.review.reviewedAt) }}</span>
            </div>
            <div
              v-if="detail.review.reason"
              class="governance-detail-field governance-detail-field--wide"
            >
              <label>驳回原因</label>
              <strong class="governance-reason">{{
                detail.review.reason
              }}</strong>
            </div>
          </div>
          <ElEmpty v-else description="尚未审核" :image-size="54" />
        </section>
      </template>

      <template #footer>
        <div
          class="governance-drawer__actions governance-drawer__actions--review"
        >
          <ElButton :disabled="commandSubmitting" @click="closeDrawer"
            >关闭</ElButton
          >
          <template v-if="detail?.status === 'PENDING'">
            <ElButton
              v-permission="'admin:merchant-application:review'"
              :icon="CloseBold"
              :disabled="commandSubmitting"
              @click="openRejection"
              >驳回</ElButton
            >
            <ElButton
              v-permission="'admin:merchant-application:review'"
              type="primary"
              :icon="CircleCheck"
              :loading="commandSubmitting"
              @click="approve"
              >通过并激活</ElButton
            >
          </template>
        </div>
      </template>
    </ElDrawer>

    <ElDialog
      v-model="rejectionVisible"
      title="驳回商户申请"
      width="min(460px, calc(100vw - 28px))"
      :close-on-click-modal="false"
      :close-on-press-escape="!commandSubmitting"
      :show-close="!commandSubmitting"
    >
      <ElForm label-position="top">
        <ElFormItem label="驳回原因" required>
          <ElInput
            v-model="rejectionReason"
            type="textarea"
            :rows="5"
            maxlength="500"
            show-word-limit
            placeholder="请填写需要商户修改的具体内容"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton
          :disabled="commandSubmitting"
          @click="rejectionVisible = false"
          >取消</ElButton
        >
        <ElButton type="primary" :loading="commandSubmitting" @click="reject"
          >确认驳回</ElButton
        >
      </template>
    </ElDialog>
  </section>
</template>

<style scoped>
.license-media-grid {
  grid-template-columns: minmax(200px, 280px);
  margin-top: 14px;
}

:deep(.el-date-editor) {
  width: 100%;
}

@media (max-width: 760px) {
  .license-media-grid {
    grid-template-columns: 1fr;
  }
}
</style>
