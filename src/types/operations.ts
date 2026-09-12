import type { PageResult } from "./http";

export type OrderStatus = "PENDING_PAYMENT" | "PAID" | "CANCELED" | "COMPLETED";

export interface AdminOrder {
  id: string;
  orderNo: string;
  userId: string;
  shopId: string;
  productId: string;
  productTitle: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  payAmount: number;
  status: OrderStatus;
  createdTime: string;
  paidTime?: string;
  cancelledTime?: string;
  expireTime?: string;
}

export interface AdminOrderDetail {
  order: AdminOrder;
  product?: { title?: string; productType?: string; validityText?: string };
  shop?: { id: string; name: string; address?: string };
  paymentStatus?: string;
  paymentExpireTime?: string;
}

export interface AdminRefund {
  id: string;
  voucherId: string;
  orderId: string;
  amount: number;
  status: string;
  reason?: string;
  requestedTime?: string;
  processedTime?: string;
  source?: "CONSUMER" | "MERCHANT" | "ADMIN";
  rejectReason?: string;
  failureCode?: string;
  failureMessage?: string;
  providerRefundNo?: string;
  decisionStatus?: string;
  executionStatus?: string;
  ticketId?: string;
  executionStartedTime?: string;
  lastFailureTime?: string;
  retryCount?: number;
  currentHandlerId?: string;
  reviewerAdminId?: string;
  reviewNote?: string;
  version?: number;
  productTitle?: string;
  paymentChannel?: string;
  refundNo?: string;
  merchantOrderNo?: string;
  items?: RefundItem[];
}

export interface RefundItem {
  id: string;
  voucherId: string;
  redeemed: boolean;
  saleAmount: number;
  customerPaidAmount: number;
  platformSubsidyAmount: number;
  merchantSubsidyAmount: number;
  serviceFeeAmount: number;
  refundableAmount: number;
  refundAmount: number;
  status: string;
  reversedIncomeAmount: number;
  refundedServiceFeeAmount: number;
}

export interface RefundTimelineEvent {
  type: string;
  title: string;
  status: string;
  description?: string;
  occurredAt?: string;
}

export interface AdminRedemption {
  id: string;
  voucherId: string;
  shopId: string;
  operatorId: string;
  status: string;
  useCount: number;
  remainingUseCount?: number;
  redeemedTime?: string;
  reversedTime?: string;
  reversalReason?: string;
}

export interface AdminSettlement {
  id: string;
  shopId: string;
  settlementDate: string;
  status: string;
  totalAmount: number;
  failureReason?: string;
  processedTime?: string;
}

export interface AdminAuditLog {
  id: string;
  actorType: string;
  actorId?: string;
  action: string;
  objectType: string;
  objectId?: string;
  result: string;
  reason?: string;
  traceId?: string;
  createTime: string;
}

export interface CustomerServiceMessage {
  id: string;
  ticketId: string;
  senderType: string;
  senderId?: string;
  visibility: string;
  messageType: string;
  content?: string;
  createTime?: string;
  attachments: CustomerServiceAttachment[];
}

export interface CustomerServiceTicket {
  id: string;
  ticketNo: string;
  type: string;
  status: string;
  priority: string;
  applicantType: "CONSUMER" | "MERCHANT";
  applicantId: string;
  relatedUserId?: string;
  relatedShopId?: string;
  orderId?: string;
  voucherId?: string;
  refundId?: string;
  redemptionId?: string;
  subject: string;
  description?: string;
  assigneeAdminId?: string;
  firstResponseTime?: string;
  lastResponseTime?: string;
  waitingCustomerSince?: string;
  waitingMerchantSince?: string;
  resolvedTime?: string;
  closedTime?: string;
  slaDeadline?: string;
  slaBreached: boolean;
  hasInternalNote: boolean;
  unreadCount: number;
  lastMessageTime?: string;
  createTime?: string;
  updateTime?: string;
  tags: CustomerServiceTag[];
  messages?: CustomerServiceMessage[];
}

export interface CustomerServiceAttachment {
  id: string;
  ticketId: string;
  messageId?: string;
  status: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  contentPath: string;
}

export interface CustomerServiceMessagePage {
  items: CustomerServiceMessage[];
  oldestMessageId?: string;
  newestMessageId?: string;
  hasMore: boolean;
}

export interface CustomerServiceTag {
  id: string;
  code: string;
  name: string;
  color: string;
}

export interface CustomerServiceQuickReply {
  id: string;
  title: string;
  content: string;
  scope: "PERSONAL" | "TEAM";
  ownerAdminId?: string;
  sortOrder: number;
}

export interface CustomerServiceTransfer {
  id: string;
  ticketId: string;
  fromAdminId?: string;
  toAdminId: string;
  operatorAdminId: string;
  reason: string;
  createTime?: string;
}

export type CustomerServiceQueue =
  | "UNCLAIMED"
  | "MINE"
  | "SLA_BREACHED"
  | "HIGH_PRIORITY"
  | "REFUND";

export type OperationPage<T> = PageResult<T>;
