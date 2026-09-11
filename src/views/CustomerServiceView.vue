<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  ElButton,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
  ElTag,
} from "element-plus";
import PageHeader from "@/components/admin/PageHeader.vue";
import DataTableFrame from "@/components/admin/DataTableFrame.vue";
import {
  addCustomerServiceNote,
  claimCustomerServiceTicket,
  listCustomerServiceTickets,
  replyCustomerServiceTicket,
} from "@/api/operations";
import { errorMessage } from "@/api/client";
import type { CustomerServiceTicket } from "@/types/operations";
const rows = ref<CustomerServiceTicket[]>([]);
const loading = ref(false);
const selected = ref<CustomerServiceTicket>();
const message = ref("");
async function load() {
  loading.value = true;
  try {
    const result = await listCustomerServiceTickets();
    rows.value = result.items;
  } catch (e) {
    ElMessage.error(errorMessage(e));
  } finally {
    loading.value = false;
  }
}
async function run(action: () => Promise<CustomerServiceTicket>) {
  try {
    selected.value = await action();
    await load();
  } catch (e) {
    ElMessage.error(errorMessage(e));
  }
}
async function reply(internal = false) {
  if (!selected.value || !message.value.trim()) return;
  const text = message.value.trim();
  message.value = "";
  await run(() =>
    internal
      ? addCustomerServiceNote(selected.value!.id, text)
      : replyCustomerServiceTicket(selected.value!.id, text),
  );
}
onMounted(load);
</script>
<template>
  <section class="governance-page">
    <PageHeader
      eyebrow="服务运营"
      title="客服工单"
      meta="公开回复与内部备注分离"
    />
    <DataTableFrame :loading="loading"
      ><ElTable
        v-loading="loading"
        :data="rows"
        row-key="id"
        @row-click="(row) => (selected = row)"
      >
        <ElTableColumn
          prop="ticketNo"
          label="工单号"
          width="180"
        /><ElTableColumn
          prop="subject"
          label="主题"
          min-width="240"
        /><ElTableColumn prop="type" label="类型" width="120" />
        <ElTableColumn label="状态" width="140"
          ><template #default="scope"
            ><ElTag>{{ scope.row.status }}</ElTag></template
          ></ElTableColumn
        >
        <ElTableColumn label="处理" width="180"
          ><template #default="scope"
            ><ElButton
              size="small"
              @click.stop="run(() => claimCustomerServiceTicket(scope.row.id))"
              >认领</ElButton
            ></template
          ></ElTableColumn
        >
      </ElTable></DataTableFrame
    >
    <div v-if="selected" class="governance-card">
      <h3>{{ selected.ticketNo }} · {{ selected.subject }}</h3>
      <p>{{ selected.description || "暂无描述" }}</p>
      <div v-for="item in selected.messages || []" :key="item.id">
        <small>{{ item.senderType }} · {{ item.visibility }}</small>
        <p>{{ item.content }}</p>
      </div>
      <ElInput
        v-model="message"
        type="textarea"
        placeholder="输入回复或内部备注"
      /><ElButton type="primary" @click="reply(false)">公开回复</ElButton
      ><ElButton @click="reply(true)">内部备注</ElButton>
    </div>
  </section>
</template>
