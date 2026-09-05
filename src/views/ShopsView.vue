<script setup lang="ts">
import {
  CircleCheck,
  Lock,
  Refresh,
  Search,
  View,
} from "@element-plus/icons-vue";
import {
  ElButton,
  ElDialog,
  ElDrawer,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
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
  activateShop,
  getShop,
  listShops,
  suspendShop,
} from "@/api/governance";
import { ApiError, errorMessage } from "@/api/client";
import BusinessHoursList from "@/components/BusinessHoursList.vue";
import PageHeader from "@/components/admin/PageHeader.vue";
import type {
  AdminShopDetail,
  AdminShopListItem,
  ShopGovernanceCommandType,
  ShopStatus,
} from "@/types/governance";
import {
  type CommandKeyState,
  formatDateTime,
  nextCommandKey,
  shopStatusOptions,
} from "@/utils/governance";

const loading = ref(false);
const rows = ref<AdminShopListItem[]>([]);
const total = ref(0);
const query = reactive<{
  status?: ShopStatus;
  cityCode: string;
  shopTypeId: string;
  keyword: string;
  page: number;
  size: number;
}>({
  cityCode: "",
  shopTypeId: "",
  keyword: "",
  page: 1,
  size: 20,
});

const drawerVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<AdminShopDetail | null>(null);
const commandSubmitting = ref(false);
const governanceVisible = ref(false);
const governanceCommand = ref<ShopGovernanceCommandType>("SUSPENSION");
const governanceReason = ref("");
const governanceKey = ref<CommandKeyState | null>(null);
const governanceTitle = computed(() =>
  governanceCommand.value === "SUSPENSION" ? "停用门店" : "恢复门店",
);
const governanceButton = computed(() =>
  governanceCommand.value === "SUSPENSION" ? "确认停用" : "确认恢复",
);

async function load(): Promise<void> {
  loading.value = true;
  try {
    const result = await listShops({
      status: query.status,
      cityCode: query.cityCode,
      shopTypeId: query.shopTypeId,
      keyword: query.keyword,
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
  query.keyword = "";
  query.page = 1;
  void load();
}

async function loadDetail(shopId: string): Promise<void> {
  detailLoading.value = true;
  try {
    detail.value = await getShop(shopId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      drawerVisible.value = false;
      ElMessage.warning("门店已不存在，列表已刷新");
      await load();
      return;
    }
    ElMessage.error(errorMessage(error));
  } finally {
    detailLoading.value = false;
  }
}

async function openDetail(row: AdminShopListItem): Promise<void> {
  detail.value = null;
  governanceKey.value = null;
  governanceReason.value = "";
  drawerVisible.value = true;
  await loadDetail(row.id);
}

function beforeDrawerClose(done: () => void): void {
  if (commandSubmitting.value) {
    ElMessage.warning("治理命令正在提交，请稍候");
    return;
  }
  done();
}

function openGovernance(command: ShopGovernanceCommandType): void {
  governanceCommand.value = command;
  governanceReason.value = "";
  governanceKey.value = null;
  governanceVisible.value = true;
}

async function refreshAfterConflict(): Promise<void> {
  if (detail.value) await loadDetail(detail.value.id);
  await load();
  ElMessage.warning("服务端状态已变化，请按最新版本重新核对后提交");
}

async function govern(): Promise<void> {
  const current = detail.value;
  const reason = governanceReason.value.trim();
  if (!current) return;
  if (reason.length < 1 || reason.length > 500) {
    ElMessage.warning("治理原因需为 1 至 500 字");
    return;
  }
  const signature = `${governanceCommand.value}|${current.id}|${current.version}|${reason}`;
  governanceKey.value = nextCommandKey(
    governanceKey.value,
    signature,
    governanceCommand.value === "SUSPENSION"
      ? "admin-shop-suspension"
      : "admin-shop-activation",
  );
  commandSubmitting.value = true;
  try {
    if (governanceCommand.value === "SUSPENSION") {
      await suspendShop(
        current.id,
        current.version,
        reason,
        governanceKey.value.key,
      );
    } else {
      await activateShop(
        current.id,
        current.version,
        reason,
        governanceKey.value.key,
      );
    }
    governanceKey.value = null;
    governanceVisible.value = false;
    ElMessage.success(
      governanceCommand.value === "SUSPENSION"
        ? "门店已停用，活动商户会话已失效"
        : "门店已恢复营业",
    );
    await loadDetail(current.id);
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

function statusTagType(status: ShopStatus) {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED" || status === "CLOSED") return "danger";
  return "warning";
}

onMounted(load);
</script>

<template>
  <section class="governance-page shops-page">
    <PageHeader
      eyebrow="经营秩序"
      title="门店治理"
      :meta="`共 ${total} 家门店`"
    />

    <section
      class="governance-filter governance-filter--shops"
      aria-label="门店筛选"
    >
      <ElSelect v-model="query.status" clearable placeholder="全部状态">
        <ElOption
          v-for="option in shopStatusOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </ElSelect>
      <ElInput v-model="query.cityCode" clearable placeholder="城市编码" />
      <ElInput v-model="query.shopTypeId" clearable placeholder="类目 ID" />
      <ElInput
        v-model="query.keyword"
        clearable
        placeholder="门店、店主或手机号"
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
        empty-text="暂无门店"
      >
        <ElTableColumn label="门店" min-width="190">
          <template #default="scope">
            <div class="governance-row-main">
              <strong>{{ scope.row.name }}</strong>
              <small>#{{ scope.row.id }}</small>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="店主" min-width="145">
          <template #default="scope">
            <div class="governance-row-main">
              <strong>{{ scope.row.ownerName || "未绑定" }}</strong>
              <small>{{ scope.row.ownerPhoneMasked || "-" }}</small>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="类目 / 城市" min-width="150">
          <template #default="scope">
            <div class="governance-row-main">
              <strong>{{
                scope.row.shopTypeName || scope.row.shopTypeId
              }}</strong>
              <small>{{ scope.row.cityName || scope.row.cityCode }}</small>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="账号" min-width="145">
          <template #default="scope">
            <div class="governance-row-main">
              <strong>{{ scope.row.accountTotal }} 个账号</strong>
              <small
                >活动 {{ scope.row.activeAccountCount }} · 停用
                {{ scope.row.disabledAccountCount }}</small
              >
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="经营状态" width="110">
          <template #default="scope">
            <ElTag :type="statusTagType(scope.row.status)" effect="light">{{
              scope.row.statusLabel
            }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="最近变更" min-width="170">
          <template #default="scope">{{
            formatDateTime(scope.row.updateTime)
          }}</template>
        </ElTableColumn>
        <ElTableColumn label="停用原因" min-width="180" show-overflow-tooltip>
          <template #default="scope">{{
            scope.row.suspensionReason || "-"
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
      :before-close="beforeDrawerClose"
    >
      <template #header>
        <div class="governance-drawer__title">
          <strong>{{ detail?.name || "门店详情" }}</strong>
          <span v-if="detail"
            >门店编号 #{{ detail.id }} · {{ detail.statusLabel }}</span
          >
        </div>
      </template>

      <div v-if="detailLoading && !detail" class="governance-detail-loading">
        <ElSkeleton :rows="8" animated />
      </div>
      <template v-else-if="detail">
        <section class="governance-detail-section">
          <h2>经营摘要</h2>
          <div class="governance-detail-grid">
            <div class="governance-detail-field">
              <label>经营状态</label>
              <ElTag :type="statusTagType(detail.status)" effect="light">{{
                detail.statusLabel
              }}</ElTag>
            </div>
            <div class="governance-detail-field">
              <label>来源申请</label>
              <span>#{{ detail.sourceApplicationId }}</span>
            </div>
            <div class="governance-detail-field">
              <label>经营类目</label>
              <span>{{ detail.shopTypeName || detail.shopTypeId }}</span>
            </div>
            <div class="governance-detail-field">
              <label>激活时间</label>
              <span>{{ formatDateTime(detail.activatedAt) }}</span>
            </div>
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
          <h2>店主与账号</h2>
          <div class="governance-detail-grid">
            <div class="governance-detail-field">
              <label>店主</label>
              <strong>{{ detail.ownerName || "未绑定" }}</strong>
            </div>
            <div class="governance-detail-field">
              <label>店主手机</label>
              <span>{{ detail.ownerPhoneMasked || "-" }}</span>
            </div>
            <div class="governance-detail-field">
              <label>店主状态</label>
              <span>{{ detail.ownerStatusLabel || "-" }}</span>
            </div>
            <div class="governance-detail-field">
              <label>账号总数</label>
              <span>{{ detail.accountTotal }}</span>
            </div>
            <div class="governance-detail-field">
              <label>活动账号</label>
              <strong>{{ detail.activeAccountCount }}</strong>
            </div>
            <div class="governance-detail-field">
              <label>停用账号</label>
              <strong>{{ detail.disabledAccountCount }}</strong>
            </div>
          </div>
        </section>

        <section class="governance-detail-section">
          <h2>最近治理</h2>
          <div v-if="detail.statusCommandType" class="governance-detail-grid">
            <div class="governance-detail-field">
              <label>治理动作</label>
              <span>{{ detail.statusCommandTypeLabel }}</span>
            </div>
            <div class="governance-detail-field">
              <label>操作人</label>
              <span>{{
                detail.statusChangedByAdminName || detail.statusChangedByAdminId
              }}</span>
            </div>
            <div class="governance-detail-field">
              <label>更新时间</label>
              <span>{{ formatDateTime(detail.updateTime) }}</span>
            </div>
            <div
              v-if="detail.suspensionReason"
              class="governance-detail-field governance-detail-field--wide"
            >
              <label>停用原因</label>
              <strong class="governance-reason">{{
                detail.suspensionReason
              }}</strong>
            </div>
          </div>
          <ElEmpty v-else description="暂无治理记录" :image-size="54" />
        </section>
      </template>

      <template #footer>
        <div class="governance-drawer__actions">
          <ElButton :disabled="commandSubmitting" @click="drawerVisible = false"
            >关闭</ElButton
          >
          <ElButton
            v-if="detail?.status === 'ACTIVE'"
            v-permission="'admin:shop:govern'"
            :icon="Lock"
            :disabled="commandSubmitting"
            @click="openGovernance('SUSPENSION')"
            >停用门店</ElButton
          >
          <ElButton
            v-if="detail?.status === 'SUSPENDED'"
            v-permission="'admin:shop:govern'"
            type="primary"
            :icon="CircleCheck"
            :disabled="commandSubmitting"
            @click="openGovernance('ACTIVATION')"
            >恢复营业</ElButton
          >
        </div>
      </template>
    </ElDrawer>

    <ElDialog
      v-model="governanceVisible"
      :title="governanceTitle"
      width="min(470px, calc(100vw - 28px))"
      :close-on-click-modal="false"
      :close-on-press-escape="!commandSubmitting"
      :show-close="!commandSubmitting"
    >
      <p
        v-if="governanceCommand === 'SUSPENSION'"
        class="governance-dialog-note"
      >
        停用后，当前活动商户账号会被联动停用，已有商户会话立即失效。
      </p>
      <p v-else class="governance-dialog-note">
        恢复只会重新启用因门店停用联动而停用的账号，不会恢复其他治理来源的账号，也不会自动恢复已下架的团购券。
      </p>
      <ElForm label-position="top">
        <ElFormItem
          :label="governanceCommand === 'SUSPENSION' ? '停用原因' : '恢复原因'"
          required
        >
          <ElInput
            v-model="governanceReason"
            type="textarea"
            :rows="5"
            maxlength="500"
            show-word-limit
            placeholder="请填写具体原因"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton
          :disabled="commandSubmitting"
          @click="governanceVisible = false"
          >取消</ElButton
        >
        <ElButton
          :type="governanceCommand === 'SUSPENSION' ? 'danger' : 'primary'"
          :loading="commandSubmitting"
          @click="govern"
          >{{ governanceButton }}</ElButton
        >
      </template>
    </ElDialog>
  </section>
</template>
