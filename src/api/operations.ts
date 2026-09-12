import { getBinary, http, postBinary } from "./client";
import type { PageResult } from "@/types/http";
import type {
  AdminAuditLog,
  AdminOrder,
  AdminOrderDetail,
  AdminRedemption,
  AdminRefund,
  AdminSettlement,
  OrderStatus,
  CustomerServiceTicket,
  CustomerServiceMessagePage,
  CustomerServiceQueue,
  CustomerServiceQuickReply,
  CustomerServiceTag,
  CustomerServiceTransfer,
  CustomerServiceAttachment,
  RefundTimelineEvent,
} from "@/types/operations";

const commandHeaders = () => ({
  headers: { "Idempotency-Key": crypto.randomUUID() },
});

export function listAdminOrders(
  status?: OrderStatus,
  page = 1,
  size = 20,
): Promise<PageResult<AdminOrder>> {
  return http.get("/v1/admin/orders", { params: { status, page, size } });
}

export function getAdminOrder(id: string): Promise<AdminOrderDetail> {
  return http.get(`/v1/admin/orders/${id}`);
}

export function listAdminRefunds(
  queue?: string,
  page = 1,
  size = 20,
): Promise<PageResult<AdminRefund>> {
  return http.get("/v1/admin/refunds", { params: { queue, page, size } });
}

export function getAdminRefund(id: string): Promise<AdminRefund> {
  return http.get(`/v1/admin/refunds/${id}`);
}

export function getAdminRefundTimeline(
  id: string,
): Promise<RefundTimelineEvent[]> {
  return http.get(`/v1/admin/refunds/${id}/timeline`);
}

export function approveAdminRefund(id: string): Promise<AdminRefund> {
  return http.post(
    `/v1/admin/refunds/${id}/approval`,
    undefined,
    commandHeaders(),
  );
}

export function rejectAdminRefund(
  id: string,
  reason: string,
): Promise<AdminRefund> {
  return http.post(`/v1/admin/refunds/${id}/rejection`, undefined, {
    ...commandHeaders(),
    params: { reason },
  });
}

export function retryAdminRefund(id: string): Promise<AdminRefund> {
  return http.post(
    `/v1/admin/refunds/${id}/retry`,
    undefined,
    commandHeaders(),
  );
}

export function createAdminRefund(data: {
  orderId: string;
  voucherIds: string[];
  reasonCode: string;
  description?: string;
}): Promise<AdminRefund> {
  return http.post("/v1/admin/refunds", data, commandHeaders());
}

export function listAdminRedemptions(
  page = 1,
  size = 20,
): Promise<PageResult<AdminRedemption>> {
  return http.get("/v1/admin/redemptions", { params: { page, size } });
}

export function listAdminSettlements(
  page = 1,
  size = 20,
): Promise<PageResult<AdminSettlement>> {
  return http.get("/v1/admin/settlements", { params: { page, size } });
}

export function retryAdminSettlement(id: string): Promise<AdminSettlement> {
  return http.post(
    `/v1/admin/settlements/${id}/retry`,
    undefined,
    commandHeaders(),
  );
}

export function listAdminAuditLogs(
  page = 1,
  size = 20,
): Promise<PageResult<AdminAuditLog>> {
  return http.get("/v1/admin/audit-logs", { params: { page, size } });
}

export function exportAdminResource(resource: string): Promise<Blob> {
  return postBinary(`/v1/admin/${resource}/export`);
}

export function listCustomerServiceTickets(
  query: {
    queue?: CustomerServiceQueue;
    status?: string;
    applicantType?: string;
    tagId?: string;
  } = {},
  page = 1,
  size = 20,
): Promise<PageResult<CustomerServiceTicket>> {
  return http.get("/v1/admin/customer-service/tickets", {
    params: { ...query, page, size },
  });
}
export function getCustomerServiceTicket(
  id: string,
): Promise<CustomerServiceTicket> {
  return http.get(`/v1/admin/customer-service/tickets/${id}`);
}
export function listCustomerServiceMessages(
  id: string,
  cursor: { before_message_id?: string; after_message_id?: string } = {},
  limit = 30,
): Promise<CustomerServiceMessagePage> {
  return http.get(`/v1/admin/customer-service/tickets/${id}/messages`, {
    params: { ...cursor, limit },
  });
}
export function claimCustomerServiceTicket(
  id: string,
): Promise<CustomerServiceTicket> {
  return http.post(`/v1/admin/customer-service/tickets/${id}/claim`);
}
export function replyCustomerServiceTicket(
  id: string,
  content: string,
  attachmentIds: string[] = [],
): Promise<CustomerServiceTicket> {
  return http.post(`/v1/admin/customer-service/tickets/${id}/messages`, {
    content,
    messageType: attachmentIds.length ? "IMAGE" : "TEXT",
    attachmentIds,
  });
}
export function addCustomerServiceNote(
  id: string,
  content: string,
  attachmentIds: string[] = [],
): Promise<CustomerServiceTicket> {
  return http.post(`/v1/admin/customer-service/tickets/${id}/internal-notes`, {
    content,
    messageType: attachmentIds.length ? "IMAGE" : "TEXT",
    attachmentIds,
  });
}

export function updateCustomerServiceStatus(
  id: string,
  status: string,
): Promise<CustomerServiceTicket> {
  return http.put(`/v1/admin/customer-service/tickets/${id}/status`, {
    status,
  });
}

export function transferCustomerServiceTicket(
  id: string,
  assigneeAdminId: string,
  reason: string,
): Promise<CustomerServiceTicket> {
  return http.post(`/v1/admin/customer-service/tickets/${id}/transfer`, {
    assigneeAdminId,
    reason,
  });
}

export function listCustomerServiceTransfers(
  id: string,
): Promise<CustomerServiceTransfer[]> {
  return http.get(`/v1/admin/customer-service/tickets/${id}/transfers`);
}

export function listCustomerServiceTags(): Promise<CustomerServiceTag[]> {
  return http.get("/v1/admin/customer-service/tags");
}

export function replaceCustomerServiceTags(
  id: string,
  tagIds: string[],
): Promise<CustomerServiceTicket> {
  return http.put(`/v1/admin/customer-service/tickets/${id}/tags`, { tagIds });
}

export function listCustomerServiceQuickReplies(): Promise<
  CustomerServiceQuickReply[]
> {
  return http.get("/v1/admin/customer-service/quick-replies");
}

export function uploadCustomerServiceAttachment(
  ticketId: string,
  file: File,
): Promise<CustomerServiceAttachment> {
  const data = new FormData();
  data.append("file", file);
  return http.post(
    `/v1/admin/customer-service/tickets/${ticketId}/attachments`,
    data,
  );
}

export function getCustomerServiceAttachment(
  ticketId: string,
  attachmentId: string,
): Promise<Blob> {
  return getBinary(
    `/v1/admin/customer-service/tickets/${ticketId}/attachments/${attachmentId}/content`,
  );
}
