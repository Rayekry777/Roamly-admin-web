import type { PageResult } from "./http";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CANCELED"
  | "REFUNDING"
  | "REFUNDED";

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
  product?: { title?: string; saleType?: string; validityText?: string };
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

export type OperationPage<T> = PageResult<T>;
