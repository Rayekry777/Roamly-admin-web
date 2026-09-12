<script setup lang="ts">
import {
  ElButton,
  ElDialog,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTag,
} from "element-plus";
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  addCustomerServiceNote,
  claimCustomerServiceTicket,
  getCustomerServiceAttachment,
  getCustomerServiceTicket,
  listCustomerServiceMessages,
  listCustomerServiceQuickReplies,
  listCustomerServiceTags,
  listCustomerServiceTickets,
  replaceCustomerServiceTags,
  replyCustomerServiceTicket,
  transferCustomerServiceTicket,
  updateCustomerServiceStatus,
  uploadCustomerServiceAttachment,
} from "@/api/operations";
import { errorMessage } from "@/api/client";
import PageHeader from "@/components/admin/PageHeader.vue";
import { useAuthStore } from "@/stores/auth";
import type {
  CustomerServiceMessage,
  CustomerServiceQueue,
  CustomerServiceQuickReply,
  CustomerServiceTag,
  CustomerServiceTicket,
} from "@/types/operations";

const queueItems = [
  { value: "UNCLAIMED", label: "待认领" },
  { value: "MINE", label: "我的工单" },
  { value: "SLA_BREACHED", label: "超时工单" },
  { value: "NEW_MESSAGES", label: "新消息" },
  { value: "HIGH_PRIORITY", label: "高优先级" },
  { value: "CONSUMER", label: "消费者工单" },
  { value: "MERCHANT", label: "商户工单" },
  { value: "REFUND", label: "退款工单" },
] as const;
const statusLabels: Record<string, string> = {
  OPEN: "待认领",
  CLAIMED: "处理中",
  WAITING_CUSTOMER: "等待消费者",
  WAITING_MERCHANT: "等待商户",
  WAITING_INTERNAL: "等待内部",
  RESOLVED: "已解决",
  CLOSED: "已关闭",
};
const typeLabels: Record<string, string> = {
  REFUND: "退款",
  REDEMPTION: "核销",
  ORDER: "订单",
  SETTLEMENT: "结算",
  GENERAL: "一般咨询",
};
const rows = ref<CustomerServiceTicket[]>([]);
const auth = useAuthStore();
const selected = ref<CustomerServiceTicket>();
const messages = ref<CustomerServiceMessage[]>([]);
const loading = ref(false);
const detailLoading = ref(false);
const queue = ref<(typeof queueItems)[number]["value"]>("UNCLAIMED");
const message = ref("");
const internal = ref(false);
const sending = ref(false);
const hasMore = ref(false);
const oldestMessageId = ref<string>();
const tags = ref<CustomerServiceTag[]>([]);
const quickReplies = ref<CustomerServiceQuickReply[]>([]);
const selectedTags = ref<string[]>([]);
const transferDialog = ref(false);
const transferAdminId = ref("");
const transferReason = ref("");
const attachmentIds = ref<string[]>([]);
const attachmentNames = ref<string[]>([]);
const uploading = ref(false);
const objectUrls = new Set<string>();

const canManageAssigned = computed(
  () =>
    Boolean(selected.value?.assigneeAdminId) &&
    (selected.value?.assigneeAdminId === auth.current?.id ||
      auth.current?.role === "PLATFORM_ADMIN"),
);
const availableStatuses = computed(() => {
  const transitions: Record<string, string[]> = {
    OPEN: ["CLOSED"],
    CLAIMED: [
      "WAITING_CUSTOMER",
      "WAITING_MERCHANT",
      "WAITING_INTERNAL",
      "RESOLVED",
    ],
    WAITING_CUSTOMER: ["CLAIMED", "CLOSED"],
    WAITING_MERCHANT: ["CLAIMED", "CLOSED"],
    WAITING_INTERNAL: ["CLAIMED", "CLOSED"],
    RESOLVED: ["CLOSED", "CLAIMED"],
    CLOSED: [],
  };
  if (selected.value?.status !== "OPEN" && !canManageAssigned.value) return [];
  return transitions[selected.value?.status || ""] || [];
});
const canCollaborate = computed(
  () =>
    canManageAssigned.value &&
    selected.value?.status !== "RESOLVED" &&
    selected.value?.status !== "CLOSED",
);

function ticketQuery() {
  if (queue.value === "CONSUMER" || queue.value === "MERCHANT")
    return { applicantType: queue.value };
  if (queue.value === "NEW_MESSAGES") return {};
  return { queue: queue.value as CustomerServiceQueue };
}
const time = (value?: string) =>
  value ? value.replace("T", " ").slice(5, 16) : "--";
async function load(selectFirst = false): Promise<void> {
  loading.value = true;
  try {
    const result = await listCustomerServiceTickets(ticketQuery(), 1, 50);
    rows.value =
      queue.value === "NEW_MESSAGES"
        ? result.items.filter((item) => item.unreadCount > 0)
        : result.items;
    if (selectFirst) {
      if (rows.value.length) await openTicket(rows.value[0]);
      else {
        selected.value = undefined;
        messages.value = [];
      }
    } else if (selected.value) {
      const fresh = rows.value.find((item) => item.id === selected.value?.id);
      if (fresh) selected.value = fresh;
    }
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    loading.value = false;
  }
}
async function openTicket(row: CustomerServiceTicket): Promise<void> {
  selected.value = row;
  detailLoading.value = true;
  try {
    const [ticket, page] = await Promise.all([
      getCustomerServiceTicket(row.id),
      listCustomerServiceMessages(row.id),
    ]);
    selected.value = ticket;
    messages.value = page.items;
    oldestMessageId.value = page.oldestMessageId;
    hasMore.value = page.hasMore;
    selectedTags.value = ticket.tags.map((item) => item.id);
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    detailLoading.value = false;
  }
}
async function loadEarlier(): Promise<void> {
  if (!selected.value || !oldestMessageId.value || !hasMore.value) return;
  const page = await listCustomerServiceMessages(selected.value.id, {
    before_message_id: oldestMessageId.value,
  });
  messages.value = [...page.items, ...messages.value];
  oldestMessageId.value = page.oldestMessageId;
  hasMore.value = page.hasMore;
}
async function claim(): Promise<void> {
  if (selected.value)
    await run(
      () => claimCustomerServiceTicket(selected.value!.id),
      "工单已认领",
    );
}
async function send(): Promise<void> {
  if (!selected.value || !message.value.trim() || sending.value) return;
  sending.value = true;
  try {
    const action = internal.value
      ? addCustomerServiceNote
      : replyCustomerServiceTicket;
    await action(selected.value.id, message.value.trim(), attachmentIds.value);
    message.value = "";
    attachmentIds.value = [];
    attachmentNames.value = [];
    await openTicket(selected.value);
    await load();
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    sending.value = false;
  }
}
async function changeStatus(status: string): Promise<void> {
  if (selected.value)
    await run(
      () => updateCustomerServiceStatus(selected.value!.id, status),
      "工单状态已更新",
    );
}
async function saveTags(): Promise<void> {
  if (selected.value)
    await run(
      () => replaceCustomerServiceTags(selected.value!.id, selectedTags.value),
      "工单标签已更新",
    );
}
async function transfer(): Promise<void> {
  if (
    !selected.value ||
    !transferAdminId.value.trim() ||
    !transferReason.value.trim()
  ) {
    ElMessage.warning("请填写目标客服 ID 和转交原因");
    return;
  }
  await run(
    () =>
      transferCustomerServiceTicket(
        selected.value!.id,
        transferAdminId.value.trim(),
        transferReason.value.trim(),
      ),
    "工单已转交",
  );
  transferDialog.value = false;
}
async function run(
  action: () => Promise<CustomerServiceTicket>,
  success: string,
): Promise<void> {
  try {
    const ticket = await action();
    ElMessage.success(success);
    await load();
    await openTicket(ticket);
  } catch (error) {
    ElMessage.error(errorMessage(error));
  }
}
function applyQuickReply(id: string): void {
  const item = quickReplies.value.find((reply) => reply.id === id);
  if (item) message.value = item.content;
}
async function selectFiles(event: Event): Promise<void> {
  if (!selected.value) return;
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files || []).slice(
    0,
    9 - attachmentIds.value.length,
  );
  if (!files.length) return;
  uploading.value = true;
  try {
    for (const file of files) {
      const uploaded = await uploadCustomerServiceAttachment(
        selected.value.id,
        file,
      );
      attachmentIds.value.push(uploaded.id);
      attachmentNames.value.push(uploaded.originalFilename);
    }
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    uploading.value = false;
    input.value = "";
  }
}
async function previewAttachment(
  ticketId: string,
  attachmentId: string,
): Promise<void> {
  try {
    const blob = await getCustomerServiceAttachment(ticketId, attachmentId);
    const url = URL.createObjectURL(blob);
    objectUrls.add(url);
    window.open(url, "_blank", "noopener,noreferrer");
  } catch (error) {
    ElMessage.error(errorMessage(error));
  }
}
function onRealtime(event: Event): void {
  const payload = (event as CustomEvent<{ type?: string }>).detail;
  if (payload?.type === "CUSTOMER_SERVICE_UPDATED") void load();
}
onMounted(async () => {
  window.addEventListener("roamly-admin-realtime", onRealtime);
  try {
    [tags.value, quickReplies.value] = await Promise.all([
      listCustomerServiceTags(),
      listCustomerServiceQuickReplies(),
    ]);
  } catch (error) {
    ElMessage.error(errorMessage(error));
  }
  await load(true);
});
onUnmounted(() => {
  window.removeEventListener("roamly-admin-realtime", onRealtime);
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
});
</script>

<template>
  <section class="governance-page">
    <PageHeader
      eyebrow="服务运营"
      title="客服工作台"
      meta="队列、公开会话、内部协作与业务上下文"
    />
    <div class="service-workspace">
      <aside class="service-queue">
        <button
          v-for="item in queueItems"
          :key="item.value"
          :class="{ active: queue === item.value }"
          @click="
            queue = item.value;
            load(true);
          "
        >
          <span>{{ item.label }}</span
          ><small v-if="item.value === queue">{{ rows.length }}</small>
        </button>
        <div v-loading="loading" class="service-ticket-list">
          <button
            v-for="ticket in rows"
            :key="ticket.id"
            :class="{ active: selected?.id === ticket.id }"
            @click="openTicket(ticket)"
          >
            <div>
              <strong>{{ ticket.subject }}</strong
              ><ElTag v-if="ticket.slaBreached" size="small" type="danger"
                >超时</ElTag
              >
            </div>
            <span
              >{{ ticket.ticketNo }} ·
              {{ statusLabels[ticket.status] || ticket.status }}</span
            >
            <p>{{ ticket.description || "暂无问题描述" }}</p>
            <small
              >{{ time(ticket.lastMessageTime)
              }}<b v-if="ticket.unreadCount">{{ ticket.unreadCount }}</b></small
            >
          </button>
          <div v-if="!loading && !rows.length" class="service-empty">
            当前队列暂无工单
          </div>
        </div>
      </aside>
      <main
        v-if="selected"
        v-loading="detailLoading"
        class="service-conversation"
      >
        <header>
          <div>
            <strong>{{ selected.subject }}</strong
            ><span
              >{{ selected.ticketNo }} ·
              {{ statusLabels[selected.status] || selected.status }}</span
            >
          </div>
          <div>
            <ElButton
              v-if="selected.status === 'OPEN'"
              type="primary"
              size="small"
              @click="claim"
              >认领</ElButton
            ><ElButton
              v-else-if="canCollaborate"
              size="small"
              @click="transferDialog = true"
              >转交</ElButton
            >
          </div>
        </header>
        <div class="service-messages">
          <ElButton v-if="hasMore" link @click="loadEarlier"
            >加载更早消息</ElButton
          >
          <article
            v-for="item in messages"
            :key="item.id"
            :class="[
              'message',
              'message--' + item.senderType.toLowerCase(),
              { 'message--internal': item.visibility === 'INTERNAL' },
            ]"
          >
            <small
              >{{
                item.visibility === "INTERNAL" ? "内部备注" : item.senderType
              }}
              · {{ time(item.createTime) }}</small
            >
            <p>{{ item.content }}</p>
            <button
              v-for="file in item.attachments"
              :key="file.id"
              class="message-file"
              @click="previewAttachment(item.ticketId, file.id)"
            >
              {{ file.originalFilename }}
            </button>
          </article>
        </div>
        <footer v-if="canCollaborate">
          <div class="composer-tools">
            <ElSelect placeholder="快捷回复" clearable @change="applyQuickReply"
              ><ElOption
                v-for="item in quickReplies"
                :key="item.id"
                :label="item.title"
                :value="item.id"
            /></ElSelect>
            <label class="upload-button"
              ><input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                @change="selectFiles"
              />{{ uploading ? "上传中" : "添加图片" }}</label
            >
            <ElButton
              :type="internal ? 'warning' : 'default'"
              @click="internal = !internal"
              >{{ internal ? "内部备注" : "公开回复" }}</ElButton
            >
          </div>
          <div v-if="attachmentNames.length" class="pending-files">
            {{ attachmentNames.join("、") }}
          </div>
          <ElInput
            v-model="message"
            type="textarea"
            :rows="3"
            :placeholder="
              internal
                ? '仅平台客服可见，不改变工单状态'
                : '回复申请人，发送后进入等待对方状态'
            "
          />
          <div class="composer-submit">
            <ElButton type="primary" :loading="sending" @click="send">{{
              internal ? "保存备注" : "发送回复"
            }}</ElButton>
          </div>
        </footer>
      </main>
      <main v-else class="service-conversation service-empty">
        从左侧选择一张工单
      </main>
      <aside v-if="selected" class="service-context">
        <section>
          <h3>申请人</h3>
          <dl>
            <dt>类型</dt>
            <dd>
              {{ selected.applicantType === "CONSUMER" ? "消费者" : "商户" }}
            </dd>
            <dt>账号 ID</dt>
            <dd>{{ selected.applicantId }}</dd>
            <dt>优先级</dt>
            <dd>{{ selected.priority }}</dd>
            <dt>SLA 截止</dt>
            <dd>{{ time(selected.slaDeadline) }}</dd>
          </dl>
        </section>
        <section>
          <h3>业务上下文</h3>
          <dl>
            <dt>工单类型</dt>
            <dd>{{ typeLabels[selected.type] || selected.type }}</dd>
            <dt>订单</dt>
            <dd>{{ selected.orderId || "--" }}</dd>
            <dt>团购券</dt>
            <dd>{{ selected.voucherId || "--" }}</dd>
            <dt>退款</dt>
            <dd>{{ selected.refundId || "--" }}</dd>
            <dt>核销</dt>
            <dd>{{ selected.redemptionId || "--" }}</dd>
          </dl>
        </section>
        <section>
          <h3>标签</h3>
          <ElSelect
            v-model="selectedTags"
            multiple
            collapse-tags
            placeholder="选择标签"
            ><ElOption
              v-for="tag in tags"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id" /></ElSelect
          ><ElButton size="small" @click="saveTags">保存标签</ElButton>
        </section>
        <section>
          <h3>状态处理</h3>
          <div class="status-actions">
            <ElButton
              v-for="state in availableStatuses"
              :key="state"
              size="small"
              @click="changeStatus(state)"
              >{{ statusLabels[state] }}</ElButton
            >
          </div>
        </section>
      </aside>
    </div>
    <ElDialog
      v-model="transferDialog"
      title="转交工单"
      width="min(460px, calc(100vw - 28px))"
    >
      <ElInput
        v-model="transferAdminId"
        placeholder="目标客服账号 ID"
      /><ElInput
        v-model="transferReason"
        type="textarea"
        :rows="3"
        maxlength="500"
        placeholder="转交原因"
      />
      <template #footer
        ><ElButton @click="transferDialog = false">取消</ElButton
        ><ElButton type="primary" @click="transfer"
          >确认转交</ElButton
        ></template
      >
    </ElDialog>
  </section>
</template>

<style scoped>
.service-workspace {
  display: grid;
  grid-template-columns: 280px minmax(360px, 1fr) 280px;
  height: calc(100vh - 190px);
  min-height: 620px;
  overflow: hidden;
  background: var(--roamly-surface);
  border: 1px solid var(--roamly-border);
  border-radius: 8px;
}
.service-queue,
.service-context {
  min-width: 0;
  overflow-y: auto;
  background: #fafaff;
}
.service-queue {
  border-right: 1px solid var(--roamly-border);
}
.service-queue > button {
  width: 50%;
  padding: 11px 12px;
  color: var(--roamly-muted);
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--roamly-border);
  cursor: pointer;
  text-align: left;
}
.service-queue > button.active {
  color: var(--roamly-primary);
  background: #fff;
  font-weight: 700;
}
.service-queue > button small {
  float: right;
}
.service-ticket-list > button {
  display: block;
  width: 100%;
  padding: 14px;
  background: transparent;
  border: 0;
  border-bottom: 1px solid var(--roamly-border);
  cursor: pointer;
  text-align: left;
}
.service-ticket-list > button.active {
  background: #fff4f3;
  box-shadow: inset 3px 0 var(--roamly-primary);
}
.service-ticket-list button div,
.service-ticket-list button small {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.service-ticket-list button span,
.service-ticket-list button p,
.service-ticket-list button small {
  color: var(--roamly-muted);
  font-size: 11px;
}
.service-ticket-list button p {
  overflow: hidden;
  margin: 7px 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.service-ticket-list button b {
  min-width: 18px;
  padding: 2px 5px;
  color: #fff;
  background: var(--roamly-primary);
  border-radius: 9px;
  text-align: center;
}
.service-conversation {
  display: grid;
  min-width: 0;
  grid-template-rows: auto 1fr auto;
}
.service-conversation > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--roamly-border);
}
.service-conversation > header div:first-child {
  display: grid;
  gap: 3px;
}
.service-conversation > header span {
  color: var(--roamly-muted);
  font-size: 12px;
}
.service-messages {
  overflow-y: auto;
  padding: 18px;
  background: #f8f8fc;
}
.message {
  width: fit-content;
  max-width: 72%;
  padding: 10px 13px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid var(--roamly-border);
  border-radius: 4px 12px 12px;
}
.message--admin {
  margin-left: auto;
  background: #fff2f1;
  border-color: #ffd5d2;
  border-radius: 12px 4px 12px 12px;
}
.message--internal {
  max-width: 90%;
  margin-right: auto;
  margin-left: auto;
  background: #fff8df;
  border-color: #f3e2a8;
}
.message small {
  color: var(--roamly-muted);
}
.message p {
  margin: 6px 0 0;
  line-height: 1.6;
  white-space: pre-wrap;
}
.message-file {
  display: block;
  padding: 5px 0;
  color: var(--roamly-primary);
  background: none;
  border: 0;
  cursor: pointer;
}
.service-conversation > footer {
  padding: 12px 16px;
  border-top: 1px solid var(--roamly-border);
}
.composer-tools {
  display: flex;
  margin-bottom: 8px;
  gap: 8px;
}
.composer-tools .el-select {
  width: 150px;
}
.upload-button {
  padding: 7px 12px;
  border: 1px solid var(--roamly-border);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.upload-button input {
  display: none;
}
.composer-submit {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
.pending-files {
  margin-bottom: 7px;
  color: var(--roamly-muted);
  font-size: 11px;
}
.service-context {
  padding: 0 16px;
  border-left: 1px solid var(--roamly-border);
}
.service-context section {
  padding: 16px 0;
  border-bottom: 1px solid var(--roamly-border);
}
.service-context h3 {
  margin: 0 0 12px;
  font-size: 14px;
}
.service-context dl {
  display: grid;
  grid-template-columns: 72px 1fr;
  margin: 0;
  gap: 8px;
  font-size: 12px;
}
.service-context dt {
  color: var(--roamly-muted);
}
.service-context dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.service-context .el-select {
  width: 100%;
  margin-bottom: 8px;
}
.status-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.status-actions .el-button {
  margin: 0;
}
.service-empty {
  display: grid;
  min-height: 120px;
  color: var(--roamly-muted);
  place-items: center;
}
@media (max-width: 1180px) {
  .service-workspace {
    grid-template-columns: 250px 1fr;
  }
  .service-context {
    display: none;
  }
}
@media (max-width: 760px) {
  .service-workspace {
    display: block;
    height: auto;
    min-height: 0;
  }
  .service-queue {
    max-height: 360px;
    border-right: 0;
  }
  .service-conversation {
    min-height: 620px;
  }
  .message {
    max-width: 88%;
  }
}
</style>
