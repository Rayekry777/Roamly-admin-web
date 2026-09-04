<script setup lang="ts">
import { View, Refresh } from "@element-plus/icons-vue";
import {
  ElButton,
  ElDrawer,
  ElEmpty,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElSkeleton,
  ElTable,
  ElTableColumn,
  ElTag,
} from "element-plus";
import { onMounted, ref } from "vue";

import { getAdminOrder, listAdminOrders } from "@/api/operations";
import { errorMessage } from "@/api/client";
import type {
  AdminOrder,
  AdminOrderDetail,
  OrderStatus,
} from "@/types/operations";

const rows = ref<AdminOrder[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const status = ref<OrderStatus>();
const loading = ref(false);
const detail = ref<AdminOrderDetail>();
const drawer = ref(false);
const detailLoading = ref(false);
const statuses: { value: OrderStatus; label: string }[] = [
  { value: "PENDING_PAYMENT", label: "待支付" },
  { value: "PAID", label: "已支付" },
  { value: "CANCELED", label: "已取消" },
  { value: "REFUNDING", label: "退款中" },
  { value: "REFUNDED", label: "已退款" },
];

async function load(): Promise<void> {
  loading.value = true;
  try {
    const result = await listAdminOrders(status.value, page.value, size.value);
    rows.value = result.items;
    total.value = result.total;
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    loading.value = false;
  }
}

async function openDetail(row: AdminOrder): Promise<void> {
  drawer.value = true;
  detailLoading.value = true;
  try {
    detail.value = await getAdminOrder(row.id);
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    detailLoading.value = false;
  }
}

function reset(): void {
  status.value = undefined;
  page.value = 1;
  void load();
}

function statusType(value: OrderStatus) {
  return value === "PAID"
    ? "success"
    : value === "CANCELED" || value === "REFUNDED"
      ? "info"
      : "warning";
}

function statusLabel(value: OrderStatus): string {
  return statuses.find((item) => item.value === value)?.label ?? value;
}

onMounted(load);
</script>

<template>
  <section class="governance-page">
    <header class="governance-heading">
      <div>
        <p>交易监管</p>
        <h1>订单查询</h1>
      </div>
      <span class="governance-heading__meta">共 {{ total }} 笔</span>
    </header>
    <section class="governance-filter">
      <ElSelect
        v-model="status"
        clearable
        placeholder="全部订单状态"
        @change="
          page = 1;
          load();
        "
        ><ElOption
          v-for="item in statuses"
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
        empty-text="暂无订单"
      >
        <ElTableColumn label="订单" min-width="180"
          ><template #default="scope"
            ><div class="governance-row-main">
              <strong>#{{ scope.row.orderNo }}</strong
              ><small>用户 {{ scope.row.userId }}</small>
            </div></template
          ></ElTableColumn
        >
        <ElTableColumn label="商品 / 门店" min-width="220"
          ><template #default="scope"
            ><div class="governance-row-main">
              <strong>{{ scope.row.productTitle }}</strong
              ><small>门店 #{{ scope.row.shopId }}</small>
            </div></template
          ></ElTableColumn
        >
        <ElTableColumn prop="quantity" label="数量" width="80" />
        <ElTableColumn label="实付（分）" width="120"
          ><template #default="scope">{{
            scope.row.payAmount
          }}</template></ElTableColumn
        >
        <ElTableColumn label="状态" width="110"
          ><template #default="scope"
            ><ElTag :type="statusType(scope.row.status)">{{
              statusLabel(scope.row.status)
            }}</ElTag></template
          ></ElTableColumn
        >
        <ElTableColumn prop="createdTime" label="下单时间" min-width="180" />
        <ElTableColumn label="操作" width="84" fixed="right"
          ><template #default="scope"
            ><ElButton
              link
              type="primary"
              :icon="View"
              class="governance-link-button"
              @click="openDetail(scope.row)"
              >查看</ElButton
            ></template
          ></ElTableColumn
        >
      </ElTable>
      <div class="governance-table__pagination">
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="load"
          @size-change="load"
        />
      </div>
    </section>
    <ElDrawer v-model="drawer" class="governance-drawer" size="560px"
      ><template #header
        ><div class="governance-drawer__title">
          <strong>订单详情</strong
          ><span v-if="detail">#{{ detail.order.orderNo }}</span>
        </div></template
      ><ElSkeleton v-if="detailLoading" :rows="7" animated /><ElEmpty
        v-else-if="!detail"
        description="暂无详情"
        :image-size="54"
      /><template v-else
        ><section class="governance-detail-section">
          <h2>订单快照</h2>
          <div class="governance-detail-grid">
            <div class="governance-detail-field">
              <label>商品</label
              ><strong>{{ detail.order.productTitle }}</strong>
            </div>
            <div class="governance-detail-field">
              <label>数量</label><span>{{ detail.order.quantity }}</span>
            </div>
            <div class="governance-detail-field">
              <label>用户 ID</label><span>{{ detail.order.userId }}</span>
            </div>
            <div class="governance-detail-field">
              <label>实付金额（分）</label
              ><strong>{{ detail.order.payAmount }}</strong>
            </div>
            <div class="governance-detail-field">
              <label>支付状态</label
              ><span>{{
                detail.paymentStatus || statusLabel(detail.order.status)
              }}</span>
            </div>
            <div class="governance-detail-field">
              <label>门店</label
              ><span>{{ detail.shop?.name || `#${detail.order.shopId}` }}</span>
            </div>
          </div>
        </section></template
      ></ElDrawer
    >
  </section>
</template>
